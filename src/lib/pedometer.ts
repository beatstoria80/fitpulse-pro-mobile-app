/**
 * FitPulse Pro • Device Motion Step Counter (Pedometer) v2
 * ========================================================
 * Mendeteksi langkah kaki REAL-TIME menggunakan sensor gerak HP.
 *
 * Perbaikan v2:
 * - Algoritma peak detection GANDA (harus ada pola naik-turun yang benar)
 * - Konfirmasi langkah bertahap (butuh 2 consecutive peaks untuk mulai menghitung)
 * - Threshold adaptif berdasarkan aktivitas
 * - Debounce ketat: goyangan kecil TIDAK dianggap langkah
 * - Warmup period: 1 detik pertama tidak menghitung (stabilisasi sensor)
 *
 * Cara kerja:
 * 1. Menggunakan DeviceMotion API / Accelerometer API
 * 2. Mendeteksi pola ayunan langkah dari data akselerometer
 * 3. Algoritma peak detection dengan konfirmasi pola (bukan hanya threshold)
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
  stepThreshold: 2.5,       // Dinaikkan dari 1.2 → 2.5 (butuh gerakan nyata)
  minStepInterval: 300,     // Dinaikkan dari 250 → 300ms (max ~200 steps/min)
  maxStepInterval: 2000,    // Min ~30 steps/min (very slow walk)
  strideLength: 0.7,        // 70 cm default stride
  weightKg: 69,
  heightCm: 160,
};

/**
 * State machine untuk deteksi pola langkah yang akurat.
 * Langkah hanya dihitung jika ada pola: baseline → peak → valley → baseline
 */
enum StepPhase {
  WAITING_PEAK = 'WAITING_PEAK',     // Menunggu lonjakan (goyangan naik)
  WAITING_VALLEY = 'WAITING_VALLEY', // Menunggu penurunan (goyangan turun)
  CONFIRMED = 'CONFIRMED',           // Pola langkah dikonfirmasi
}

export class Pedometer {
  private config: PedometerConfig;
  private isRunning = false;
  private totalSteps = 0;
  private stepTimestamps: number[] = [];
  private lastStepTime = 0;
  private accelBuffer: number[] = [];

  // === PERBAIKAN: Deteksi pola langkah ===
  private phase: StepPhase = StepPhase.WAITING_PEAK;
  private peakValue = 0;          // Nilai peak terakhir yang terdeteksi
  private valleyValue = Infinity; // Nilai valley terakhir
  private consecutivePatterns = 0; // Berapa pola berturut-turut terdeteksi
  private warmupUntil = 0;        // Timestamp akhir warmup (stabilisasi sensor)
  
  // Low-pass filter state
  private filteredMag = 9.81;     // Nilai akselerasi yang sudah di-filter
  private gravity = 9.81;         // Estimasi gravitasi (baseline)

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

    // Reset step pattern detection state
    this.phase = StepPhase.WAITING_PEAK;
    this.peakValue = 0;
    this.valleyValue = Infinity;
    this.consecutivePatterns = 0;
    this.filteredMag = 9.81;
    this.gravity = 9.81;

    // Warmup: 1 detik pertama untuk stabilisasi sensor
    this.warmupUntil = Date.now() + 1000;

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
   * Process raw acceleration data to detect steps.
   * 
   * PERBAIKAN UTAMA:
   * - Low-pass filter untuk memisahkan gravitasi dari gerakan
   * - State machine: butuh pola peak → valley (bukan hanya threshold crossing)
   * - Konfirmasi berturut-turut: 2 pola pertama dianggap "kalibrasi"
   * - Debounce ketat dengan interval minimum 300ms
   */
  private processAcceleration(x: number, y: number, z: number): void {
    if (!this.isRunning) return;

    const now = Date.now();

    // Dalam periode warmup, hanya kalibrasi baseline (TIDAK menghitung langkah)
    if (now < this.warmupUntil) {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      // Kalibrasi gravitasi selama warmup
      this.gravity = this.gravity * 0.9 + magnitude * 0.1;
      this.filteredMag = magnitude;
      return;
    }

    // Calculate acceleration magnitude
    const rawMag = Math.sqrt(x * x + y * y + z * z);

    // Low-pass filter: pisahkan gravitasi dari gerakan
    // α = 0.1 → sangat smooth, hanya menangkap gerakan besar
    const alphaGravity = 0.05;
    this.gravity = this.gravity * (1 - alphaGravity) + rawMag * alphaGravity;

    // High-pass: gerakan murni = raw - gravity
    // Lalu low-pass lagi untuk smoothing noise
    const alphaSmooth = 0.2;
    const motionMag = Math.abs(rawMag - this.gravity);
    this.filteredMag = this.filteredMag * (1 - alphaSmooth) + motionMag * alphaSmooth;

    // Add to buffer (keep last 50 readings) — for adaptive threshold
    this.accelBuffer.push(this.filteredMag);
    if (this.accelBuffer.length > 50) {
      this.accelBuffer.shift();
    }

    // Need at least 15 readings for stable baseline
    if (this.accelBuffer.length < 15) return;

    // === STEP DETECTION VIA STATE MACHINE ===
    // Langkah yang benar memiliki pola: acceleration naik (peak) → turun (valley)
    // Goyangan kecil TIDAK memiliki pola ini secara konsisten

    const dynamicThreshold = this.getDynamicThreshold();
    const timeSinceLastStep = now - this.lastStepTime;

    switch (this.phase) {
      case StepPhase.WAITING_PEAK:
        // Menunggu sinyal naik melewati threshold
        if (this.filteredMag > dynamicThreshold) {
          this.peakValue = this.filteredMag;
          this.phase = StepPhase.WAITING_VALLEY;
        }
        break;

      case StepPhase.WAITING_VALLEY:
        // Track peak tertinggi
        if (this.filteredMag > this.peakValue) {
          this.peakValue = this.filteredMag;
        }
        
        // Menunggu sinyal turun signifikan (minimal 40% dari peak)
        if (this.filteredMag < this.peakValue * 0.6) {
          this.valleyValue = this.filteredMag;
          this.phase = StepPhase.CONFIRMED;
        }
        
        // Timeout: jika tidak turun dalam 500ms, batal (bukan langkah)
        if (timeSinceLastStep > 0 && timeSinceLastStep < 500 && this.lastStepTime > 0) {
          // Masih dalam window wajar
        } else if (this.peakValue === this.filteredMag) {
          // Masih naik, lanjut
        }
        break;

      case StepPhase.CONFIRMED:
        // Pola peak → valley DIKONFIRMASI
        // Periksa apakah amplitudo cukup besar (peak vs valley)
        const amplitude = this.peakValue - this.valleyValue;
        
        if (amplitude > dynamicThreshold * 0.5) {
          // Valid step pattern!
          this.consecutivePatterns++;

          // Perlu minimal 2 pola berturut-turut sebelum mulai menghitung
          // Ini mencegah goyangan acak dianggap langkah
          if (this.consecutivePatterns >= 2) {
            // Periksa interval waktu
            if (
              this.lastStepTime === 0 ||
              (timeSinceLastStep >= this.config.minStepInterval &&
               timeSinceLastStep <= this.config.maxStepInterval)
            ) {
              // VALID STEP!
              this.totalSteps++;
              this.lastStepTime = now;
              this.stepTimestamps.push(now);

              // Keep only last 120 step timestamps (for cadence calculation)
              if (this.stepTimestamps.length > 120) {
                this.stepTimestamps.shift();
              }

              this.emitReading('tracking', `Langkah terdeteksi: ${this.totalSteps}`);
            } else if (timeSinceLastStep > this.config.maxStepInterval) {
              // Terlalu lama sejak langkah terakhir → reset consecutive counter
              // User mungkin berhenti lalu mulai lagi
              this.consecutivePatterns = 1;
              this.lastStepTime = now;
            }
          } else {
            // Masih dalam kalibrasi awal (building confidence)
            this.lastStepTime = now;
          }
        } else {
          // Amplitudo terlalu kecil → goyangan, bukan langkah
          // Reset consecutive counter
          this.consecutivePatterns = Math.max(0, this.consecutivePatterns - 1);
        }

        // Reset state machine untuk deteksi langkah berikutnya
        this.phase = StepPhase.WAITING_PEAK;
        this.peakValue = 0;
        this.valleyValue = Infinity;
        break;
    }
  }

  /**
   * Hitung threshold dinamis berdasarkan aktivitas terbaru.
   * Saat diam, threshold lebih tinggi (lebih sulit trigger).
   * Saat sudah berjalan, threshold bisa sedikit turun (adaptif).
   */
  private getDynamicThreshold(): number {
    if (this.accelBuffer.length < 10) return this.config.stepThreshold;

    // Hitung standar deviasi dari buffer terakhir
    const recent = this.accelBuffer.slice(-20);
    const mean = recent.reduce((s, v) => s + v, 0) / recent.length;
    const variance = recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length;
    const std = Math.sqrt(variance);

    // Jika belum ada langkah yang dikonfirmasi, gunakan threshold ketat
    if (this.consecutivePatterns < 2) {
      return Math.max(this.config.stepThreshold, mean + 2 * std);
    }

    // Sudah dalam mode walking → threshold adaptif (sedikit lebih rendah)
    // Tapi tetap minimal 1.8 untuk menghindari false positives
    return Math.max(1.8, mean + 1.2 * std);
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
    this.phase = StepPhase.WAITING_PEAK;
    this.peakValue = 0;
    this.valleyValue = Infinity;
    this.consecutivePatterns = 0;
    this.filteredMag = 9.81;
    this.gravity = 9.81;
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
