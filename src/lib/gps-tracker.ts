/**
 * FitPulse Pro • GPS Distance Tracker Engine v1
 * ===============================================
 * Menghitung jarak tempuh REAL-TIME menggunakan GPS (Geolocation API).
 * Langkah dihitung dari estimasi jarak / panjang langkah rata-rata.
 *
 * Keunggulan GPS dibanding Pedometer (DeviceMotion):
 * 1. Jarak tempuh jauh lebih presisi (satelit GPS, bukan sensor gerak).
 * 2. Tidak terpengaruh oleh goyang tangan / getaran palsu.
 * 3. Bekerja di semua device tanpa perlu sensor IMU canggih.
 * 4. Bisa menampilkan rute dan kecepatan real-time.
 *
 * Catatan:
 * - Membutuhkan izin GPS dari browser (HTTPS required).
 * - Akurasi tergantung sinyal GPS (outdoor lebih baik dari indoor).
 * - Konsumsi baterai lebih tinggi dibanding pedometer.
 */

export interface GPSReading {
  totalDistanceMeters: number;
  estimatedSteps: number;
  caloriesBurned: number;
  currentSpeedKmh: number;
  averageSpeedKmh: number;
  currentPace: string;           // menit/km (e.g. "6:30")
  isMoving: boolean;
  isRunning: boolean;
  isWalking: boolean;
  accuracy: number;              // GPS accuracy dalam meter
  latitude: number;
  longitude: number;
  timestamp: number;
  status: 'idle' | 'tracking' | 'error' | 'not_supported' | 'permission_denied';
  message: string;
  gpsSignalStrength: number;     // 0.0 - 1.0
}

export interface GPSTrackerConfig {
  strideLength: number;          // Panjang langkah rata-rata (meter)
  weightKg: number;
  heightCm: number;
  minDistanceThreshold: number;  // Minimum jarak bergerak untuk dihitung (meter)
  highAccuracyMode: boolean;     // GPS high accuracy
}

const DEFAULT_CONFIG: GPSTrackerConfig = {
  strideLength: 0.7,
  weightKg: 69,
  heightCm: 160,
  minDistanceThreshold: 3,       // Minimal 3 meter perpindahan untuk dihitung
  highAccuracyMode: true,
};

/**
 * Haversine formula: Hitung jarak antara dua titik GPS (lat/lon) dalam meter
 */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class GPSTracker {
  private config: GPSTrackerConfig;
  private isRunning = false;
  private totalDistanceMeters = 0;
  private watchId: number | null = null;

  // Position history
  private lastPosition: { lat: number; lon: number; time: number } | null = null;
  private positions: { lat: number; lon: number; time: number; speed: number }[] = [];
  private lastAccuracy: number = 0;

  // Speed tracking
  private currentSpeedKmh = 0;
  private speedHistory: number[] = [];

  // Callbacks
  private onUpdate: ((reading: GPSReading) => void) | null = null;
  private statusInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<GPSTrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Hitung panjang langkah dari tinggi badan jika tidak disetel
    if (!config.strideLength && this.config.heightCm) {
      this.config.strideLength = (this.config.heightCm / 100) * 0.415;
    }
  }

  /**
   * Cek apakah Geolocation API didukung browser
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'geolocation' in navigator;
  }

  /**
   * Mulai tracking GPS real-time
   */
  async start(onUpdate: (reading: GPSReading) => void): Promise<void> {
    if (this.isRunning) return;

    this.onUpdate = onUpdate;
    this.totalDistanceMeters = 0;
    this.lastPosition = null;
    this.positions = [];
    this.currentSpeedKmh = 0;
    this.speedHistory = [];

    if (!GPSTracker.isSupported()) {
      this.emitReading(
        'not_supported',
        'Geolocation API tidak didukung di browser ini. Buka di smartphone (Chrome/Safari).'
      );
      return;
    }

    this.isRunning = true;

    // Emit initial status
    this.emitReading('tracking', 'Menghubungkan ke sinyal GPS... Pastikan Anda berada di luar ruangan.');

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handlePosition(position),
        (error) => this.handleError(error),
        {
          enableHighAccuracy: this.config.highAccuracyMode,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } catch {
      this.emitReading('error', 'Gagal memulai GPS tracking. Periksa pengaturan lokasi browser.');
      this.isRunning = false;
      return;
    }

    // Periodic status update (every 2 seconds)
    this.statusInterval = setInterval(() => {
      if (!this.isRunning) return;
      const msg = this.totalDistanceMeters > 0
        ? `GPS aktif • ${(this.totalDistanceMeters / 1000).toFixed(2)} km ditempuh`
        : 'GPS aktif • Menunggu perpindahan posisi...';
      this.emitReading('tracking', msg);
    }, 2000);
  }

  /**
   * Proses data posisi GPS baru
   */
  private handlePosition(position: GeolocationPosition): void {
    if (!this.isRunning) return;

    const { latitude, longitude, accuracy, speed } = position.coords;
    const now = position.timestamp;
    this.lastAccuracy = accuracy;

    // Filter posisi dengan akurasi sangat buruk (> 50 meter)
    if (accuracy > 50) {
      this.emitReading(
        'tracking',
        `Sinyal GPS lemah (±${Math.round(accuracy)}m). Coba keluar ruangan untuk akurasi lebih baik.`
      );
      return;
    }

    // Hitung kecepatan dari data GPS (jika tersedia) atau dari perpindahan
    if (speed !== null && speed >= 0) {
      this.currentSpeedKmh = speed * 3.6; // m/s → km/h
    }

    if (this.lastPosition) {
      const dist = haversineDistance(
        this.lastPosition.lat, this.lastPosition.lon,
        latitude, longitude
      );

      const timeDiffSec = (now - this.lastPosition.time) / 1000;

      // Filter noise GPS: hanya hitung jika jarak > threshold DAN waktu cukup
      // Dan kecepatan masuk akal (< 30 km/h untuk berjalan/berlari)
      if (dist >= this.config.minDistanceThreshold && timeDiffSec > 0.5) {
        const speedMps = dist / timeDiffSec;
        const speedKmh = speedMps * 3.6;

        // Filter kecepatan tidak realistis (> 30 km/h = bukan jalan/lari)
        if (speedKmh <= 30) {
          this.totalDistanceMeters += dist;
          this.currentSpeedKmh = speedKmh;
          this.speedHistory.push(speedKmh);
          if (this.speedHistory.length > 60) this.speedHistory.shift();
        }
      }
    }

    this.lastPosition = { lat: latitude, lon: longitude, time: now };
    this.positions.push({
      lat: latitude,
      lon: longitude,
      time: now,
      speed: this.currentSpeedKmh,
    });

    // Batasi history posisi (max 500 titik)
    if (this.positions.length > 500) {
      this.positions.shift();
    }

    this.emitReading(
      'tracking',
      this.totalDistanceMeters > 10
        ? `GPS aktif • ${(this.totalDistanceMeters / 1000).toFixed(2)} km ditempuh`
        : 'GPS terhubung • Mulai bergerak untuk mencatat jarak...'
    );
  }

  /**
   * Handle GPS error
   */
  private handleError(error: GeolocationPositionError): void {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        this.emitReading(
          'permission_denied',
          'Izin lokasi ditolak. Buka Pengaturan Browser → Izinkan Lokasi untuk situs ini.'
        );
        this.stop();
        break;
      case error.POSITION_UNAVAILABLE:
        this.emitReading(
          'error',
          'Posisi GPS tidak tersedia. Pastikan GPS diaktifkan di pengaturan perangkat.'
        );
        break;
      case error.TIMEOUT:
        this.emitReading(
          'tracking',
          'GPS timeout. Mencoba ulang... Pastikan berada di area terbuka.'
        );
        break;
    }
  }

  /**
   * Estimasi langkah dari jarak tempuh
   */
  private getEstimatedSteps(): number {
    if (this.totalDistanceMeters <= 0 || this.config.strideLength <= 0) return 0;
    return Math.round(this.totalDistanceMeters / this.config.strideLength);
  }

  /**
   * Hitung kecepatan rata-rata
   */
  private getAverageSpeed(): number {
    if (this.speedHistory.length === 0) return 0;
    const sum = this.speedHistory.reduce((a, b) => a + b, 0);
    return sum / this.speedHistory.length;
  }

  /**
   * Hitung pace (menit per km)
   */
  private getPace(): string {
    if (this.currentSpeedKmh <= 0.5) return '--:--';
    const paceMinPerKm = 60 / this.currentSpeedKmh;
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Hitung estimasi kalori terbakar
   */
  private getCalories(): number {
    const distKm = this.totalDistanceMeters / 1000;
    if (distKm <= 0) return 0;

    // Estimasi MET berdasarkan kecepatan
    const avgSpeed = this.getAverageSpeed();
    let met: number;
    if (avgSpeed >= 9.5) met = 9.0;       // Lari cepat
    else if (avgSpeed >= 7.5) met = 7.5;   // Jogging
    else if (avgSpeed >= 5.5) met = 4.5;   // Jalan cepat
    else met = 3.5;                         // Jalan santai

    // Durasi aktivitas (menit)
    if (this.positions.length < 2) return 0;
    const durationMin = (this.positions[this.positions.length - 1].time - this.positions[0].time) / 60000;
    if (durationMin < 0.1) return 0;

    // Kalori = MET × 3.5 × berat(kg) / 200 × menit
    return Math.round(((met * 3.5 * this.config.weightKg) / 200) * durationMin);
  }

  /**
   * Deteksi jenis aktivitas berdasarkan kecepatan
   */
  private detectActivity(): { isWalking: boolean; isRunning: boolean; isMoving: boolean } {
    return {
      isMoving: this.currentSpeedKmh > 0.5,
      isWalking: this.currentSpeedKmh >= 2.0 && this.currentSpeedKmh < 7.5,
      isRunning: this.currentSpeedKmh >= 7.5,
    };
  }

  /**
   * Hitung kekuatan sinyal GPS (0-1 dari akurasi dan umur data)
   */
  private getSignalStrength(): number {
    if (!this.lastPosition) return 0;
    const age = Date.now() - this.lastPosition.time;
    if (age > 10000) return 0.1; // Stale > 10 detik

    // Akurasi satelit (meter): <10m = 1.0 (sangat kuat), 10-25m = 0.75, 25-50m = 0.45
    let accuracyScore = 0.5;
    if (this.lastAccuracy > 0) {
      if (this.lastAccuracy <= 10) accuracyScore = 1.0;
      else if (this.lastAccuracy <= 20) accuracyScore = 0.8;
      else if (this.lastAccuracy <= 35) accuracyScore = 0.6;
      else accuracyScore = 0.35;
    }

    const freshnessScore = Math.max(0.2, 1 - age / 10000);
    return Math.min(1, Math.round(accuracyScore * freshnessScore * 100) / 100);
  }

  /**
   * Siarkan hasil pembacaan GPS
   */
  private emitReading(status: GPSReading['status'], message: string): void {
    const act = this.detectActivity();

    this.onUpdate?.({
      totalDistanceMeters: this.totalDistanceMeters,
      estimatedSteps: this.getEstimatedSteps(),
      caloriesBurned: this.getCalories(),
      currentSpeedKmh: Math.round(this.currentSpeedKmh * 10) / 10,
      averageSpeedKmh: Math.round(this.getAverageSpeed() * 10) / 10,
      currentPace: this.getPace(),
      isMoving: act.isMoving,
      isWalking: act.isWalking,
      isRunning: act.isRunning,
      accuracy: Math.round(this.lastAccuracy),
      latitude: this.lastPosition?.lat || 0,
      longitude: this.lastPosition?.lon || 0,
      gpsSignalStrength: this.getSignalStrength(),
      timestamp: Date.now(),
      status,
      message,
    });
  }

  /**
   * Hentikan GPS tracking
   */
  stop(): void {
    this.isRunning = false;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }

    this.onUpdate = null;
  }

  /**
   * Reset data tracking
   */
  reset(): void {
    this.totalDistanceMeters = 0;
    this.lastPosition = null;
    this.positions = [];
    this.currentSpeedKmh = 0;
    this.speedHistory = [];
  }

  /**
   * Ambil total jarak saat ini
   */
  getTotalDistance(): number {
    return this.totalDistanceMeters;
  }

  /**
   * Ambil total langkah estimasi
   */
  getSteps(): number {
    return this.getEstimatedSteps();
  }

  /**
   * Tambah jarak manual (untuk testing di desktop)
   */
  addManualDistance(meters: number = 50): void {
    if (!this.isRunning) return;
    this.totalDistanceMeters += meters;
    this.currentSpeedKmh = 5.0; // Simulasi jalan biasa
    this.speedHistory.push(5.0);
    this.emitReading('tracking', `Jarak manual ditambahkan: +${meters}m (Total: ${(this.totalDistanceMeters / 1000).toFixed(2)} km)`);
    setTimeout(() => {
      this.currentSpeedKmh = 0;
    }, 500);
  }

  /**
   * Perbarui konfigurasi
   */
  updateConfig(config: Partial<GPSTrackerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.heightCm && !config.strideLength) {
      this.config.strideLength = (this.config.heightCm / 100) * 0.415;
    }
  }
}
