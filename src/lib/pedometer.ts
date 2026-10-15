/**
 * FitPulse Pro • Device Motion Step Counter (Pedometer)
 * =====================================================
 * Mendeteksi langkah kaki REAL-TIME menggunakan sensor gerak HP.
 *
 * Cara kerja:
 * 1. Menggunakan DeviceMotion API / Accelerometer API
 * 2. Mendeteksi pola ayunan langkah dari data akselerometer
 * 3. Algoritma menghitung langkah berdasarkan peak detection pada sinyal akselerasi
 *
 * Akurasi: ±5-10% (cukup baik jika HP di saku celana)
 */

export interface StepReading {
  totalSteps: number;
  cadence: number;          // langkah per menit
  distanceMeters: number;   // estimasi jarak tempuh
  caloriesBurned: number;   // estimasi kalori
  isWalking: boolean;
  isRunning: boolean;
  timestamp: number;
  status: 'idle' | 'tracking' | 'error' | 'not_supported';
  message: string;
}

export interface PedometerConfig {
  stepThreshold: number;     // Threshold magnitude untuk deteksi langkah
  minStepInterval: number;   // Minimum interval antar langkah (ms)
  maxStepInterval: number;   // Maximum interval antar langkah (ms)
  strideLength: number;      // Panjang langkah (meter) - default berdasarkan tinggi badan
  weightKg: number;          // Berat badan untuk estimasi kalori
  heightCm: number;          // Tinggi badan untuk estimasi langkah
}

const DEFAULT_CONFIG: PedometerConfig = {
  stepThreshold: 1.2,
  minStepInterval: 250,   // Max ~240 steps/min (running)
  maxStepInterval: 2000,  // Min ~30 steps/min (very slow walk)
  strideLength: 0.7,      // 70 cm default stride
  weightKg: 69,
  heightCm: 160,
};

export class Pedometer {
  private config: PedometerConfig;
  private isRunning = false;
  private totalSteps = 0;
  private stepTimestamps: number[] = [];
  private lastStepTime = 0;
  private accelBuffer: number[] = [];

  // Activity detection
  private recentCadences: number[] = [];

  // Callbacks
  private onStep: ((reading: StepReading) => void) | null = null;

  // Sensor reference
  private sensorCleanup: (() => void) | null = null;

  constructor(config: Partial<PedometerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Calculate stride length from height if not explicitly set
    if (!config.strideLength) {
      // Average stride ≈ height * 0.415 (walking) / 0.45 (running)
      this.config.strideLength = (this.config.heightCm / 100) * 0.415;
    }
  }

  /**
   * Check if device motion sensors are available
   */
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      (window.DeviceMotionEvent || ('Accelerometer' in window))
    );
  }

  /**
   * Request permission (needed for iOS 13+)
   */
  static async requestPermission(): Promise<boolean> {
    // iOS 13+ requires explicit permission
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      // @ts-expect-error - iOS specific API
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        // @ts-expect-error - iOS specific API
        const permission = await DeviceMotionEvent.requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    return true; // Android and desktop don't need permission
  }

  /**
   * Start step counting
   */
  async start(onStep: (reading: StepReading) => void): Promise<void> {
    if (this.isRunning) return;

    this.onStep = onStep;
    this.totalSteps = 0;
    this.stepTimestamps = [];
    this.lastStepTime = 0;
    this.accelBuffer = [];
    this.recentCadences = [];

    // Check support
    if (!Pedometer.isSupported()) {
      this.onStep?.({
        totalSteps: 0,
        cadence: 0,
        distanceMeters: 0,
        caloriesBurned: 0,
        isWalking: false,
        isRunning: false,
        timestamp: Date.now(),
        status: 'not_supported',
        message: 'Sensor gerak tidak tersedia di perangkat ini',
      });
      return;
    }

    // Request permission (iOS)
    const granted = await Pedometer.requestPermission();
    if (!granted) {
      this.onStep?.({
        totalSteps: 0,
        cadence: 0,
        distanceMeters: 0,
        caloriesBurned: 0,
        isWalking: false,
        isRunning: false,
        timestamp: Date.now(),
        status: 'error',
        message: 'Izin sensor gerak ditolak. Buka Pengaturan untuk mengaktifkan.',
      });
      return;
    }

    this.isRunning = true;

    // Try Generic Sensor API first (Chrome 67+), fallback to DeviceMotion
    if ('Accelerometer' in window) {
      try {
        // @ts-expect-error - Generic Sensor API
        const accel = new Accelerometer({ frequency: 50 });
        accel.addEventListener('reading', () => {
          this.processAcceleration(accel.x, accel.y, accel.z);
        });
        accel.addEventListener('error', () => {
          // Fallback to DeviceMotion
          this.startDeviceMotion();
        });
        accel.start();

        this.sensorCleanup = () => {
          accel.stop();
        };
      } catch {
        this.startDeviceMotion();
      }
    } else {
      this.startDeviceMotion();
    }

    this.emitReading('tracking', 'Pedometer aktif. Letakkan HP di saku atau genggam saat berjalan.');
  }

  /**
   * Fallback: use DeviceMotion event
   */
  private startDeviceMotion(): void {
    const handler = (event: DeviceMotionEvent) => {
      const accel = event.accelerationIncludingGravity;
      if (accel && accel.x !== null && accel.y !== null && accel.z !== null) {
        this.processAcceleration(accel.x!, accel.y!, accel.z!);
      }
    };

    window.addEventListener('devicemotion', handler, true);

    this.sensorCleanup = () => {
      window.removeEventListener('devicemotion', handler, true);
    };
  }

  /**
   * Process raw acceleration data to detect steps
   */
  private processAcceleration(x: number, y: number, z: number): void {
    if (!this.isRunning) return;

    // Calculate acceleration magnitude
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    // Add to buffer (keep last 50 readings)
    this.accelBuffer.push(magnitude);
    if (this.accelBuffer.length > 50) {
      this.accelBuffer.shift();
    }

    // Need at least 10 readings for baseline
    if (this.accelBuffer.length < 10) return;

    // Calculate moving average (baseline gravity ≈ 9.81)
    const recentWindow = this.accelBuffer.slice(-10);
    const avg = recentWindow.reduce((s, v) => s + v, 0) / recentWindow.length;

    // Step detection: magnitude crosses threshold above average
    const deviation = Math.abs(magnitude - avg);
    const now = Date.now();
    const timeSinceLastStep = now - this.lastStepTime;

    if (
      deviation > this.config.stepThreshold &&
      timeSinceLastStep > this.config.minStepInterval &&
      timeSinceLastStep < this.config.maxStepInterval
    ) {
      // STEP DETECTED!
      this.totalSteps++;
      this.lastStepTime = now;
      this.stepTimestamps.push(now);

      // Keep only last 120 step timestamps (for cadence calculation)
      if (this.stepTimestamps.length > 120) {
        this.stepTimestamps.shift();
      }

      this.emitReading('tracking', `Langkah terdeteksi: ${this.totalSteps}`);
    } else if (this.lastStepTime === 0 && deviation > this.config.stepThreshold) {
      // First step
      this.totalSteps++;
      this.lastStepTime = now;
      this.stepTimestamps.push(now);
      this.emitReading('tracking', 'Langkah pertama terdeteksi!');
    }
  }

  /**
   * Calculate current cadence (steps per minute)
   */
  private getCadence(): number {
    const now = Date.now();
    // Count steps in the last 30 seconds
    const recentSteps = this.stepTimestamps.filter((t) => now - t < 30000);
    if (recentSteps.length < 2) return 0;

    const timeSpanMs = recentSteps[recentSteps.length - 1] - recentSteps[0];
    if (timeSpanMs < 2000) return 0; // Need at least 2 seconds of data

    const cadence = Math.round((recentSteps.length / (timeSpanMs / 1000)) * 60);

    this.recentCadences.push(cadence);
    if (this.recentCadences.length > 10) this.recentCadences.shift();

    return cadence;
  }

  /**
   * Estimate distance traveled
   */
  private getDistance(): number {
    return Math.round(this.totalSteps * this.config.strideLength);
  }

  /**
   * Estimate calories burned from walking/running
   * Uses MET values: Walking ≈ 3.5 MET, Running ≈ 8.0 MET
   */
  private getCalories(): number {
    const cadence = this.getCadence();
    const durationMinutes = this.stepTimestamps.length > 1
      ? (this.stepTimestamps[this.stepTimestamps.length - 1] - this.stepTimestamps[0]) / 60000
      : 0;

    if (durationMinutes < 0.1) return 0;

    const met = cadence > 150 ? 8.0 : cadence > 100 ? 5.0 : 3.5;
    // Calories/min = (MET × 3.5 × body_weight_kg) / 200
    const calPerMin = (met * 3.5 * this.config.weightKg) / 200;
    return Math.round(calPerMin * durationMinutes);
  }

  /**
   * Detect activity type from cadence
   */
  private detectActivity(): { isWalking: boolean; isRunning: boolean } {
    const cadence = this.getCadence();
    return {
      isWalking: cadence >= 60 && cadence < 150,
      isRunning: cadence >= 150,
    };
  }

  /**
   * Emit a step reading to the callback
   */
  private emitReading(status: StepReading['status'], message: string): void {
    const cadence = this.getCadence();
    const activity = this.detectActivity();

    this.onStep?.({
      totalSteps: this.totalSteps,
      cadence,
      distanceMeters: this.getDistance(),
      caloriesBurned: this.getCalories(),
      isWalking: activity.isWalking,
      isRunning: activity.isRunning,
      timestamp: Date.now(),
      status,
      message,
    });
  }

  /**
   * Stop pedometer
   */
  stop(): void {
    this.isRunning = false;
    this.sensorCleanup?.();
    this.sensorCleanup = null;
    this.onStep = null;
  }

  /**
   * Get current total steps
   */
  getTotalSteps(): number {
    return this.totalSteps;
  }

  /**
   * Reset step counter
   */
  reset(): void {
    this.totalSteps = 0;
    this.stepTimestamps = [];
    this.lastStepTime = 0;
    this.accelBuffer = [];
    this.recentCadences = [];
  }

  /**
   * Update user parameters (e.g., after profile update)
   */
  updateConfig(config: Partial<PedometerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.heightCm && !config.strideLength) {
      this.config.strideLength = (this.config.heightCm / 100) * 0.415;
    }
  }
}
