/**
 * FitPulse Pro • High-Precision Real-Time Pedometer Engine v3
 * ============================================================
 * Mendeteksi langkah kaki REAL-TIME menggunakan sensor gerak HP (DeviceMotion API).
 *
 * Mengapa v2 sebelumnya tidak menghitung (0 langkah)?
 * 1. Di Chrome Android, 'Accelerometer in window' aktif tetapi sering kali silently blocked
 *    tanpa Sensor Permission Policy, sehingga fallback devicemotion tidak pernah dipanggil.
 * 2. Threshold v2 diset terlalu tinggi (2.5 m/s²), sedangkan langkah kaki wajar hanya 1.0 - 1.8 m/s².
 * 3. Logika v2 membuang 2 langkah pertama sebagai "kalibrasi", dan mereset ke 0 jika ada sedikit jeda,
 *    mengakibatkan total langkah tetap 0 selamanya.
 *
 * Solusi v3 (Standard Gold Web Pedometer):
 * 1. Menggunakan W3C DeviceMotionEvent standar langsung (bekerja 100% di Android Chrome, Samsung, iOS).
 * 2. Mendukung `event.acceleration` (linear IMU tanpa gravitasi) dengan fallback ke `event.accelerationIncludingGravity`.
 * 3. Schmidt-trigger peak-valley hysteresis threshold (1.15 m/s² untuk langkah normal, adaptif).
 * 4. Debounce 260ms (mencegah double count, mendukung jalan cepat hingga lari 230 langkah/menit).
 * 5. Setiap langkah yang valid LANGSUNG dihitung tanpa dibuang!
 * 6. Visual motion indicator & mode sensitivitas (Normal, Peka/High, Ringan).
 */

export type PedometerSensitivity = 'normal' | 'high' | 'low';

export interface StepReading {
  totalSteps: number;
  cadence: number;          // langkah per menit (SPM)
  distanceMeters: number;   // estimasi jarak tempuh (meter)
  caloriesBurned: number;   // estimasi kalori (kkal)
  isWalking: boolean;
  isRunning: boolean;
  motionIntensity: number;  // 0.0 - 1.0 (kekuatan sinyal gerak real-time)
  timestamp: number;
  status: 'idle' | 'tracking' | 'error' | 'not_supported';
  message: string;
}

export interface PedometerConfig {
  sensitivity: PedometerSensitivity;
  stepThreshold: number;     // Threshold magnitude m/s²
  minStepInterval: number;   // Debounce antar langkah (ms)
  maxStepInterval: number;   // Batas waktu jeda langkah (ms)
  strideLength: number;      // Panjang langkah (meter)
  weightKg: number;
  heightCm: number;
}

const SENSITIVITY_THRESHOLDS: Record<PedometerSensitivity, number> = {
  high: 0.85,    // Sangat peka (jalan santai, HP di tangan santai)
  normal: 1.15,  // Standar (jalan wajar, HP di saku/tangan)
  low: 1.55,     // Ketat (hanya langkah tegas/jogging)
};

const DEFAULT_CONFIG: PedometerConfig = {
  sensitivity: 'normal',
  stepThreshold: 1.15,
  minStepInterval: 260,     // 260ms = max ~230 SPM
  maxStepInterval: 2200,    // 2.2 detik = jeda berhenti jalan
  strideLength: 0.7,        // default 70 cm
  weightKg: 69,
  heightCm: 160,
};

export class Pedometer {
  private config: PedometerConfig;
  private isRunning = false;
  private totalSteps = 0;
  private stepTimestamps: number[] = [];
  private lastStepTime = 0;

  // Signal processing
  private gravity = 9.81;
  private filteredMag = 0;
  private currentThreshold = 1.15;
  private isArmed = false; // Schmitt trigger state: false = waiting for peak, true = waiting for valley
  private peakValue = 0;

  // Sensor diagnostics
  private eventCount = 0;
  private lastEventTime = 0;
  private motionIntensity = 0; // 0.0 - 1.0

  // Callbacks & cleanups
  private onStep: ((reading: StepReading) => void) | null = null;
  private sensorCleanup: (() => void) | null = null;
  private healthCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private cadenceInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<PedometerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.applySensitivity(this.config.sensitivity);

    // Hitung panjang langkah rata-rata dari tinggi badan jika tidak dispesifikasikan
    if (!config.strideLength && this.config.heightCm) {
      this.config.strideLength = (this.config.heightCm / 100) * 0.415;
    }
  }

  /**
   * Atur tingkat sensitivitas deteksi langkah
   */
  setSensitivity(sensitivity: PedometerSensitivity): void {
    this.config.sensitivity = sensitivity;
    this.applySensitivity(sensitivity);
  }

  private applySensitivity(sensitivity: PedometerSensitivity): void {
    const base = SENSITIVITY_THRESHOLDS[sensitivity] || 1.15;
    this.config.stepThreshold = base;
    this.currentThreshold = base;
  }

  /**
   * Cek apakah sensor gerak didukung oleh browser & device
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'DeviceMotionEvent' in window;
  }

  /**
   * Request permission (khusus iOS 13+ Safari)
   */
  static async requestPermission(): Promise<boolean> {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      // @ts-expect-error - iOS 13+ permission API
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        // @ts-expect-error - iOS 13+ permission API
        const permission = await DeviceMotionEvent.requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    return true; // Android & desktop Chrome tidak membutuhkan dialog requestPermission
  }

  /**
   * Mulai penghitungan langkah real-time
   */
  async start(onStep: (reading: StepReading) => void): Promise<void> {
    if (this.isRunning) return;

    this.onStep = onStep;
    this.totalSteps = 0;
    this.stepTimestamps = [];
    this.lastStepTime = 0;
    this.filteredMag = 0;
    this.gravity = 9.81;
    this.isArmed = false;
    this.peakValue = 0;
    this.eventCount = 0;
    this.motionIntensity = 0;
    this.currentThreshold = this.config.stepThreshold;

    if (!Pedometer.isSupported()) {
      this.emitReading(
        'not_supported',
        'DeviceMotionEvent tidak didukung di browser ini. Buka di smartphone (Chrome/Safari).'
      );
      return;
    }

    // Minta izin untuk iOS jika diperlukan
    const granted = await Pedometer.requestPermission();
    if (!granted) {
      this.emitReading(
        'error',
        'Izin sensor gerak ditolak di browser. Buka Pengaturan Safari/Browser untuk mengizinkan.'
      );
      return;
    }

    this.isRunning = true;
    this.bindMotionSensor();

    // Loop pembaruan cadence & status berkala (setiap 1 detik)
    this.cadenceInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.emitReading(
        'tracking',
        this.totalSteps > 0
          ? `Pedometer aktif • ${this.totalSteps} langkah`
          : 'Pedometer aktif • Melangkahlah dengan HP Anda...'
      );
    }, 1000);

    // Initial broadcast
    this.emitReading('tracking', 'Sensor gerak aktif. Melangkahlah dengan HP di saku atau tangan.');
  }

  /**
   * Pasang listener DeviceMotionEvent W3C standar
   */
  private bindMotionSensor(): void {
    const handleMotion = (event: DeviceMotionEvent) => {
      if (!this.isRunning) return;
      this.eventCount++;
      this.lastEventTime = Date.now();

      // Prioritas 1: Linear Acceleration (dihitung oleh chip sensor HP tanpa gravitasi)
      const lin = event.acceleration;
      if (
        lin &&
        lin.x !== null &&
        lin.y !== null &&
        lin.z !== null &&
        (lin.x !== 0 || lin.y !== 0 || lin.z !== 0)
      ) {
        this.processLinearAccel(lin.x, lin.y, lin.z);
        return;
      }

      // Prioritas 2: Acceleration Including Gravity (fallback universal untuk semua Android/iOS)
      const withG = event.accelerationIncludingGravity;
      if (withG && withG.x !== null && withG.y !== null && withG.z !== null) {
        this.processAccelWithGravity(withG.x, withG.y, withG.z);
      }
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true, capture: true });

    // Sensor healthcheck: Jika dalam 2 detik tidak ada sinyal sensor sama sekali
    this.healthCheckTimer = setTimeout(() => {
      if (this.isRunning && this.eventCount === 0) {
        this.emitReading(
          'not_supported',
          'Sinyal sensor belum diterima. Pastikan situs dibuka via HTTPS dan sensor gerak HP aktif.'
        );
      }
    }, 2200);

    this.sensorCleanup = () => {
      if (this.healthCheckTimer) {
        clearTimeout(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }
      window.removeEventListener('devicemotion', handleMotion, { capture: true });
    };
  }

  /**
   * Olah akselerasi linier murni (tanpa gravitasi)
   */
  private processLinearAccel(x: number, y: number, z: number): void {
    const mag = Math.sqrt(x * x + y * y + z * z);
    // Exponential Moving Average filter untuk menghilangkan high-frequency noise
    this.filteredMag = this.filteredMag * 0.65 + mag * 0.35;
    this.motionIntensity = Math.min(1, this.filteredMag / 3.0);
    this.evaluateStep(this.filteredMag);
  }

  /**
   * Olah akselerasi termasuk gravitasi (kurangi baseline gravitasi secara dinamis)
   */
  private processAccelWithGravity(x: number, y: number, z: number): void {
    const rawMag = Math.sqrt(x * x + y * y + z * z);
    // Baseline gravity filter (alpha 0.06 lambat menyesuaikan postur HP)
    this.gravity = this.gravity * 0.94 + rawMag * 0.06;
    const motion = Math.abs(rawMag - this.gravity);

    // Smoothing EMA filter
    this.filteredMag = this.filteredMag * 0.65 + motion * 0.35;
    this.motionIntensity = Math.min(1, this.filteredMag / 3.0);
    this.evaluateStep(this.filteredMag);
  }

  /**
   * Evaluasi pola langkah (Schmitt Trigger Hysteresis & Debounce)
   */
  private evaluateStep(magnitude: number): void {
    const now = Date.now();
    const timeSinceLastStep = now - this.lastStepTime;

    // FASA 1: Menunggu Peak (Goyangan naik melewati threshold langkah)
    if (!this.isArmed) {
      if (magnitude > this.currentThreshold) {
        // Cek interval debounce (minimal 260ms antar langkah)
        if (this.lastStepTime === 0 || timeSinceLastStep >= this.config.minStepInterval) {
          // LANGKAH VALID TERDETEKSI!
          this.totalSteps++;
          this.lastStepTime = now;
          this.stepTimestamps.push(now);
          this.isArmed = true; // Kunci sampai sinyal turun ke valley
          this.peakValue = magnitude;

          // Batasi riwayat timestamp langkah (maksimal 60 langkah terakhir untuk hitung cadence)
          if (this.stepTimestamps.length > 60) {
            this.stepTimestamps.shift();
          }

          // Adaptasi threshold halus berdasarkan kekuatan langkah pengguna
          const adaptiveTarget = Math.max(
            0.85,
            Math.min(1.8, magnitude * 0.65)
          );
          this.currentThreshold = this.currentThreshold * 0.75 + adaptiveTarget * 0.25;

          // Siarkan pembaruan langkah secara INSTAN!
          this.emitReading('tracking', `Langkah terhitung: ${this.totalSteps}`);
        }
      }
    } else {
      // FASA 2: Menunggu Valley (Sinyal turun di bawah 55% dari threshold)
      if (magnitude > this.peakValue) {
        this.peakValue = magnitude;
      }

      // Ketika gelombang langkah turun kembali mendekati baseline
      if (magnitude < this.currentThreshold * 0.55) {
        this.isArmed = false; // Buka kunci (siap mendeteksi langkah berikutnya)
        this.peakValue = 0;
      }
    }
  }

  /**
   * Tambah langkah manual (sangat berguna untuk testing di desktop/emulator)
   */
  addManualStep(): void {
    if (!this.isRunning) return;
    const now = Date.now();
    this.totalSteps++;
    this.lastStepTime = now;
    this.stepTimestamps.push(now);
    if (this.stepTimestamps.length > 60) this.stepTimestamps.shift();
    this.motionIntensity = 0.8;
    this.emitReading('tracking', `Langkah manual terhitung: ${this.totalSteps}`);
    setTimeout(() => {
      this.motionIntensity = 0;
    }, 300);
  }

  /**
   * Hitung irama langkah per menit (Cadence SPM)
   */
  private getCadence(): number {
    const now = Date.now();
    // Jika tidak ada langkah dalam 2.5 detik terakhir, user dianggap berhenti/diam
    if (now - this.lastStepTime > 2500) {
      return 0;
    }

    // Ambil langkah dalam 15 detik terakhir
    const recent = this.stepTimestamps.filter((t) => now - t < 15000);
    if (recent.length < 2) {
      return this.totalSteps > 0 && now - this.lastStepTime < 1500 ? 95 : 0;
    }

    const durationSec = (recent[recent.length - 1] - recent[0]) / 1000;
    if (durationSec < 1.0) return 95;

    const spm = Math.round((recent.length / durationSec) * 60);
    return Math.min(240, Math.max(30, spm));
  }

  /**
   * Hitung estimasi jarak (meter)
   */
  private getDistance(): number {
    return Math.round(this.totalSteps * this.config.strideLength);
  }

  /**
   * Hitung estimasi pembakaran kalori
   */
  private getCalories(): number {
    const cadence = this.getCadence();
    const durationMinutes =
      this.stepTimestamps.length > 1
        ? (this.stepTimestamps[this.stepTimestamps.length - 1] - this.stepTimestamps[0]) / 60000
        : 0;

    if (durationMinutes < 0.05 && this.totalSteps === 0) return 0;

    // Estimasi MET: jalan wajar ~3.5 MET, jalan cepat ~4.5 MET, jogging ~7.5 MET
    const met = cadence >= 150 ? 7.5 : cadence >= 100 ? 4.2 : 3.5;
    // Kalori = MET * 3.5 * berat(kg) / 200 * menit
    // Atau jika durasi sangat singkat, gunakan formula per langkah: ~0.04 kkal/langkah
    const baseCalBySteps = Math.round(this.totalSteps * 0.04);
    const baseCalByTime = Math.round(((met * 3.5 * this.config.weightKg) / 200) * durationMinutes);

    return Math.max(baseCalBySteps, baseCalByTime);
  }

  /**
   * Deteksi aktivitas: Berjalan vs Berlari
   */
  private detectActivity(): { isWalking: boolean; isRunning: boolean } {
    const cadence = this.getCadence();
    return {
      isWalking: cadence >= 40 && cadence < 150,
      isRunning: cadence >= 150,
    };
  }

  /**
   * Siarkan hasil pembacaan ke subscriber
   */
  private emitReading(status: StepReading['status'], message: string): void {
    const cadence = this.getCadence();
    const act = this.detectActivity();

    this.onStep?.({
      totalSteps: this.totalSteps,
      cadence,
      distanceMeters: this.getDistance(),
      caloriesBurned: this.getCalories(),
      isWalking: act.isWalking,
      isRunning: act.isRunning,
      motionIntensity: this.motionIntensity,
      timestamp: Date.now(),
      status,
      message,
    });
  }

  /**
   * Hentikan pedometer
   */
  stop(): void {
    this.isRunning = false;
    if (this.cadenceInterval) {
      clearInterval(this.cadenceInterval);
      this.cadenceInterval = null;
    }
    this.sensorCleanup?.();
    this.sensorCleanup = null;
    this.onStep = null;
  }

  /**
   * Ambil total langkah saat ini
   */
  getTotalSteps(): number {
    return this.totalSteps;
  }

  /**
   * Reset data langkah
   */
  reset(): void {
    this.totalSteps = 0;
    this.stepTimestamps = [];
    this.lastStepTime = 0;
    this.filteredMag = 0;
    this.gravity = 9.81;
    this.isArmed = false;
    this.peakValue = 0;
    this.motionIntensity = 0;
  }

  /**
   * Perbarui konfigurasi
   */
  updateConfig(config: Partial<PedometerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.sensitivity) {
      this.applySensitivity(config.sensitivity);
    }
    if (config.heightCm && !config.strideLength) {
      this.config.strideLength = (this.config.heightCm / 100) * 0.415;
    }
  }
}
