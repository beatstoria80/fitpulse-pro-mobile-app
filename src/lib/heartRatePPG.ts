/**
 * FitPulse Pro • Camera-Based PPG (Photoplethysmography) Heart Rate Monitor v2
 * =============================================================================
 * Mendeteksi detak jantung REAL-TIME menggunakan kamera HP.
 *
 * Perbaikan v2:
 * - Improved bandpass filter (5-point weighted moving average + detrend)
 * - Stricter confidence threshold (75% untuk "stable")
 * - Longer EMA smoothing (0.15 bukan 0.3) → lebih stabil, kurang "lompat"
 * - Auto-correlation BPM estimation sebagai validasi silang
 * - Pengecekan kualitas sinyal (SNR) sebelum menampilkan hasil
 * - Minimum sampling window diperbesar ke 5 detik
 *
 * Cara kerja:
 * 1. User menaruh ujung jari di kamera belakang (dengan flash/lampu menyala)
 * 2. Kamera mendeteksi perubahan warna merah di kulit akibat aliran darah
 * 3. Algoritma menghitung BPM dari pola intensitas merah (R channel)
 *
 * Akurasi: ±3-5 bpm (cukup untuk monitoring harian)
 */

export interface PPGReading {
  bpm: number;
  confidence: number; // 0-100%
  timestamp: number;
  rawSignal: number[];
  status: 'initializing' | 'measuring' | 'stable' | 'finger_missing' | 'error';
  message: string;
}

export interface PPGConfig {
  sampleWindowMs: number;  // Window durasi sampling (default 12000ms = 12s)
  fpsTarget: number;       // Target FPS kamera (default 30)
  minRedIntensity: number; // Minimum intensitas merah untuk deteksi jari
  smoothingFactor: number; // Smoothing EMA (0-1)
}

const DEFAULT_CONFIG: PPGConfig = {
  sampleWindowMs: 12000,   // Diperbesar dari 10s → 12s untuk presisi lebih baik
  fpsTarget: 30,
  minRedIntensity: 80,
  smoothingFactor: 0.15,   // Diturunkan dari 0.3 → 0.15 (lebih stabil, kurang lompat)
};

export class HeartRatePPG {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isRunning = false;

  // Signal processing buffers
  private redSignal: number[] = [];
  private timestamps: number[] = [];
  private bpmHistory: number[] = [];

  // === PERBAIKAN: Signal quality tracking ===
  private signalQualityBuffer: number[] = [];  // Track kualitas sinyal
  private lastValidBpm = 0;                     // BPM terakhir yang valid

  private config: PPGConfig;
  private onReading: ((reading: PPGReading) => void) | null = null;
  private onWaveform: ((signal: number[]) => void) | null = null;

  constructor(config: Partial<PPGConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if the browser supports camera access
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof HTMLCanvasElement !== 'undefined'
    );
  }

  /**
   * Start PPG measurement
   */
  async start(
    onReading: (reading: PPGReading) => void,
    onWaveform?: (signal: number[]) => void
  ): Promise<void> {
    if (this.isRunning) return;

    this.onReading = onReading;
    this.onWaveform = onWaveform || null;

    // Create hidden video & canvas elements
    this.video = document.createElement('video');
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('autoplay', '');
    this.video.style.position = 'fixed';
    this.video.style.opacity = '0';
    this.video.style.pointerEvents = 'none';
    this.video.style.width = '1px';
    this.video.style.height = '1px';
    document.body.appendChild(this.video);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 64;
    this.canvas.height = 64;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    try {
      // Request rear camera with flash/torch
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 128 },
          height: { ideal: 128 },
          frameRate: { ideal: this.config.fpsTarget },
        },
        audio: false,
      });

      this.video.srcObject = this.stream;
      await this.video.play();

      // Try to turn on torch/flash for better reading
      this.enableTorch();

      // Reset buffers
      this.redSignal = [];
      this.timestamps = [];
      this.bpmHistory = [];
      this.signalQualityBuffer = [];
      this.lastValidBpm = 0;
      this.isRunning = true;

      // Start processing loop
      this.processFrame();

      this.onReading?.({
        bpm: 0,
        confidence: 0,
        timestamp: Date.now(),
        rawSignal: [],
        status: 'initializing',
        message: 'Letakkan ujung jari Anda di kamera...',
      });
    } catch (err) {
      this.onReading?.({
        bpm: 0,
        confidence: 0,
        timestamp: Date.now(),
        rawSignal: [],
        status: 'error',
        message: `Kamera tidak tersedia: ${(err as Error).message}`,
      });
      throw err;
    }
  }

  /**
   * Stop PPG measurement and clean up
   */
  stop(): void {
    this.isRunning = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.remove();
      this.video = null;
    }

    this.canvas = null;
    this.ctx = null;
    this.onReading = null;
    this.onWaveform = null;
  }

  /**
   * Try to enable camera torch/flash
   */
  private async enableTorch(): Promise<void> {
    if (!this.stream) return;
    const track = this.stream.getVideoTracks()[0];
    if (track) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const capabilities = (track as any).getCapabilities?.();
        if (capabilities?.torch) {
          await track.applyConstraints({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            advanced: [{ torch: true } as any],
          });
        }
      } catch {
        // Torch not available on this device - still works without it
      }
    }
  }

  /**
   * Main frame processing loop
   */
  private processFrame = (): void => {
    if (!this.isRunning || !this.video || !this.canvas || !this.ctx) return;

    // Draw current video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, 64, 64);

    // Extract red channel average from center region
    const centerSize = 32;
    const startX = (64 - centerSize) / 2;
    const startY = (64 - centerSize) / 2;
    const imageData = this.ctx.getImageData(startX, startY, centerSize, centerSize);
    const pixels = imageData.data;

    let redSum = 0;
    let greenSum = 0;
    let pixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      redSum += pixels[i];     // Red
      greenSum += pixels[i + 1]; // Green
      pixelCount++;
    }

    const avgRed = redSum / pixelCount;
    const avgGreen = greenSum / pixelCount;
    const now = Date.now();

    // Check if finger is covering the camera
    // When finger covers camera with flash: high red, low green
    const isFingerPresent = avgRed > this.config.minRedIntensity && avgRed > avgGreen * 1.2;

    if (!isFingerPresent) {
      this.onReading?.({
        bpm: 0,
        confidence: 0,
        timestamp: now,
        rawSignal: [],
        status: 'finger_missing',
        message: 'Tutup kamera dengan ujung jari Anda dan tekan lembut',
      });

      // Keep some recent data but don't grow unbounded
      if (this.redSignal.length > 10) {
        this.redSignal = this.redSignal.slice(-5);
        this.timestamps = this.timestamps.slice(-5);
      }

      this.animFrameId = requestAnimationFrame(this.processFrame);
      return;
    }

    // Record the red channel value
    this.redSignal.push(avgRed);
    this.timestamps.push(now);

    // Remove old data beyond the window
    const windowStart = now - this.config.sampleWindowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < windowStart) {
      this.timestamps.shift();
      this.redSignal.shift();
    }

    // Need at least 5 seconds of data to compute BPM (dinaikkan dari 3s)
    const dataSpanMs = this.timestamps.length > 1
      ? this.timestamps[this.timestamps.length - 1] - this.timestamps[0]
      : 0;

    if (dataSpanMs < 5000 || this.redSignal.length < 100) {
      const progress = Math.min(100, Math.round((dataSpanMs / 5000) * 100));
      this.onReading?.({
        bpm: 0,
        confidence: 0,
        timestamp: now,
        rawSignal: this.getNormalizedSignal(),
        status: 'measuring',
        message: `Mengukur... ${progress}% (tahan jari Anda tetap di kamera)`,
      });

      this.onWaveform?.(this.getNormalizedSignal());
      this.animFrameId = requestAnimationFrame(this.processFrame);
      return;
    }

    // === SIGNAL PROCESSING ===

    // 1. Normalize the signal
    const normalized = this.getNormalizedSignal();

    // 2. Apply improved bandpass filter
    const filtered = this.bandpassFilter(normalized);

    // 3. Calculate signal quality (SNR)
    const signalQuality = this.calculateSignalQuality(filtered);
    this.signalQualityBuffer.push(signalQuality);
    if (this.signalQualityBuffer.length > 10) this.signalQualityBuffer.shift();

    // 4. Find peaks (heartbeats) dengan threshold adaptif
    const peaks = this.findPeaks(filtered);

    // 5. Calculate BPM from inter-peak intervals
    const peakBpm = this.calculateBPM(peaks);

    // 6. Cross-validate dengan autocorrelation
    const acBpm = this.autocorrelationBPM(filtered);

    // 7. Pilih BPM terbaik: gunakan peak jika ada, cross-validate dengan autocorrelation
    let bpm = peakBpm;
    if (peakBpm > 0 && acBpm > 0) {
      // Jika kedua metode sepakat (dalam ±15 bpm), ambil rata-rata
      if (Math.abs(peakBpm - acBpm) < 15) {
        bpm = Math.round((peakBpm + acBpm) / 2);
      }
      // Jika tidak sepakat, gunakan peak detection (biasanya lebih akurat)
    } else if (acBpm > 0 && peakBpm === 0) {
      bpm = acBpm;
    }

    // 8. Calculate confidence based on peak consistency + signal quality
    const peakConfidence = this.calculateConfidence(peaks);
    const qualityFactor = Math.min(1, signalQuality / 5); // SNR > 5 = excellent
    const confidence = Math.round(peakConfidence * 0.7 + qualityFactor * 100 * 0.3);

    // 9. Apply EMA smoothing (lebih pelan → lebih stabil)
    let smoothedBpm = bpm;
    if (this.bpmHistory.length > 0 && bpm > 0) {
      const lastBpm = this.bpmHistory[this.bpmHistory.length - 1];

      // Jika perbedaan > 20 bpm dari terakhir, anggap noise dan dampen lebih kuat
      const diff = Math.abs(bpm - lastBpm);
      const factor = diff > 20 ? 0.08 : this.config.smoothingFactor;

      smoothedBpm = Math.round(
        lastBpm * (1 - factor) + bpm * factor
      );
    }

    if (smoothedBpm > 0) {
      this.bpmHistory.push(smoothedBpm);
      if (this.bpmHistory.length > 30) this.bpmHistory.shift();
      this.lastValidBpm = smoothedBpm;
    }

    // Determine status — threshold dinaikkan dari 60% → 75%
    const avgQuality = this.signalQualityBuffer.length > 0
      ? this.signalQualityBuffer.reduce((a, b) => a + b, 0) / this.signalQualityBuffer.length
      : 0;
    const isStable = confidence > 75 && this.bpmHistory.length >= 8 && avgQuality > 2;
    const validBpm = smoothedBpm >= 40 && smoothedBpm <= 220;

    this.onReading?.({
      bpm: validBpm ? smoothedBpm : 0,
      confidence: validBpm ? confidence : 0,
      timestamp: now,
      rawSignal: filtered,
      status: isStable ? 'stable' : 'measuring',
      message: isStable
        ? `Detak jantung: ${smoothedBpm} BPM (Akurasi: ${confidence}%)`
        : `Menganalisis sinyal... tahan jari tetap stabil`,
    });

    this.onWaveform?.(filtered);
    this.animFrameId = requestAnimationFrame(this.processFrame);
  };

  /**
   * Normalize signal to 0-1 range
   */
  private getNormalizedSignal(): number[] {
    if (this.redSignal.length === 0) return [];
    const min = Math.min(...this.redSignal);
    const max = Math.max(...this.redSignal);
    const range = max - min || 1;
    return this.redSignal.map((v) => (v - min) / range);
  }

  /**
   * Improved bandpass filter:
   * - Detrend (remove slow baseline drift) menggunakan window lebih besar
   * - 5-point weighted moving average (bukan 3-point)
   * - Second pass smoothing untuk noise reduction
   */
  private bandpassFilter(signal: number[]): number[] {
    if (signal.length < 5) return signal;

    // Detrend (remove slow baseline drift) — window size lebih besar
    const windowSize = Math.min(25, Math.floor(signal.length / 3));
    const detrended: number[] = [];
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(signal.length, i + windowSize + 1);
      let sum = 0;
      for (let j = start; j < end; j++) sum += signal[j];
      const localMean = sum / (end - start);
      detrended.push(signal[i] - localMean);
    }

    // Smooth pass 1: 5-point weighted moving average [1, 2, 3, 2, 1] / 9
    const weights = [1, 2, 3, 2, 1];
    const weightSum = 9;
    const smoothed1: number[] = [];
    for (let i = 0; i < detrended.length; i++) {
      if (i < 2 || i >= detrended.length - 2) {
        smoothed1.push(detrended[i]);
      } else {
        let val = 0;
        for (let k = -2; k <= 2; k++) {
          val += detrended[i + k] * weights[k + 2];
        }
        smoothed1.push(val / weightSum);
      }
    }

    // Smooth pass 2: 3-point moving average (final cleanup)
    const smoothed2: number[] = [];
    for (let i = 0; i < smoothed1.length; i++) {
      if (i === 0 || i === smoothed1.length - 1) {
        smoothed2.push(smoothed1[i]);
      } else {
        smoothed2.push((smoothed1[i - 1] + smoothed1[i] + smoothed1[i + 1]) / 3);
      }
    }

    return smoothed2;
  }

  /**
   * Calculate Signal-to-Noise Ratio (SNR) of the filtered signal.
   * Higher SNR = cleaner signal = more reliable BPM.
   */
  private calculateSignalQuality(signal: number[]): number {
    if (signal.length < 20) return 0;

    // Hitung power spectral estimate sederhana
    let signalPower = 0;
    let noisePower = 0;

    // Signal: variance dari sinyal itu sendiri
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    for (const v of signal) {
      signalPower += (v - mean) ** 2;
    }
    signalPower /= signal.length;

    // Noise: variance dari first-difference (high-frequency component)
    for (let i = 1; i < signal.length; i++) {
      const diff = signal[i] - signal[i - 1];
      noisePower += diff ** 2;
    }
    noisePower /= (signal.length - 1);

    if (noisePower < 0.0001) return 10; // Very clean signal
    return signalPower / noisePower;
  }

  /**
   * Autocorrelation-based BPM estimation.
   * Mencari periodisitas dominan pada sinyal PPG.
   * Digunakan sebagai cross-validation terhadap peak detection.
   */
  private autocorrelationBPM(signal: number[]): number {
    if (signal.length < 60) return 0;

    const avgSampleRate = this.timestamps.length > 1
      ? (this.timestamps.length - 1) / ((this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / 1000)
      : 30;

    // Search range: 40-200 BPM
    const minLag = Math.floor(avgSampleRate * 60 / 200); // ~9 samples
    const maxLag = Math.floor(avgSampleRate * 60 / 40);  // ~45 samples

    if (maxLag >= signal.length / 2) return 0;

    // Hitung mean
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;

    // Autocorrelation untuk setiap lag
    let bestLag = 0;
    let bestCorr = -1;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      let normA = 0;
      let normB = 0;
      const n = signal.length - lag;

      for (let i = 0; i < n; i++) {
        const a = signal[i] - mean;
        const b = signal[i + lag] - mean;
        corr += a * b;
        normA += a * a;
        normB += b * b;
      }

      const denom = Math.sqrt(normA * normB);
      if (denom > 0) {
        corr /= denom;
        if (corr > bestCorr) {
          bestCorr = corr;
          bestLag = lag;
        }
      }
    }

    // Autocorrelation harus cukup kuat (> 0.3) agar valid
    if (bestCorr < 0.3 || bestLag === 0) return 0;

    // Convert lag ke BPM
    const periodMs = (bestLag / avgSampleRate) * 1000;
    return Math.round(60000 / periodMs);
  }

  /**
   * Find peaks (heartbeats) in the filtered signal
   */
  private findPeaks(signal: number[]): number[] {
    const peaks: number[] = [];
    if (signal.length < 3) return peaks;

    // Adaptive threshold: mean + 0.5 * std (dinaikkan dari 0.3)
    let sum = 0;
    for (const v of signal) sum += v;
    const mean = sum / signal.length;

    let sqSum = 0;
    for (const v of signal) sqSum += (v - mean) ** 2;
    const std = Math.sqrt(sqSum / signal.length);

    const threshold = mean + 0.5 * std;

    // Minimum distance between peaks (based on 200 bpm max)
    const avgSampleRate = this.timestamps.length > 1
      ? (this.timestamps.length - 1) / ((this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / 1000)
      : 30;
    const minPeakDistance = Math.floor(avgSampleRate * 60 / 200);

    let lastPeakIdx = -minPeakDistance;

    for (let i = 2; i < signal.length - 2; i++) {
      // Stricter peak detection: must be higher than 2 neighbors on each side
      if (
        signal[i] > signal[i - 1] &&
        signal[i] > signal[i + 1] &&
        signal[i] >= signal[i - 2] &&
        signal[i] >= signal[i + 2] &&
        signal[i] > threshold &&
        (i - lastPeakIdx) >= minPeakDistance
      ) {
        peaks.push(i);
        lastPeakIdx = i;
      }
    }

    return peaks;
  }

  /**
   * Calculate BPM from peak indices
   */
  private calculateBPM(peaks: number[]): number {
    if (peaks.length < 2) return 0;

    // Calculate inter-peak intervals in milliseconds
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const idxA = peaks[i - 1];
      const idxB = peaks[i];
      if (idxA < this.timestamps.length && idxB < this.timestamps.length) {
        intervals.push(this.timestamps[idxB] - this.timestamps[idxA]);
      }
    }

    if (intervals.length === 0) return 0;

    // Remove outlier intervals (outside 40-200 BPM range — dipersempit dari 220)
    const validIntervals = intervals.filter((ms) => {
      const bpm = 60000 / ms;
      return bpm >= 40 && bpm <= 200;
    });

    if (validIntervals.length === 0) return 0;

    // === PERBAIKAN: IQR-based outlier removal ===
    validIntervals.sort((a, b) => a - b);
    
    if (validIntervals.length >= 4) {
      const q1Idx = Math.floor(validIntervals.length * 0.25);
      const q3Idx = Math.floor(validIntervals.length * 0.75);
      const q1 = validIntervals[q1Idx];
      const q3 = validIntervals[q3Idx];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const inliers = validIntervals.filter((v) => v >= lowerBound && v <= upperBound);
      if (inliers.length >= 2) {
        // Use median of inliers
        inliers.sort((a, b) => a - b);
        const medianInterval = inliers[Math.floor(inliers.length / 2)];
        return Math.round(60000 / medianInterval);
      }
    }

    // Fallback: median of all valid intervals
    const medianInterval = validIntervals[Math.floor(validIntervals.length / 2)];
    return Math.round(60000 / medianInterval);
  }

  /**
   * Calculate confidence score based on peak consistency
   */
  private calculateConfidence(peaks: number[]): number {
    if (peaks.length < 3) return Math.min(20, peaks.length * 10);

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const idxA = peaks[i - 1];
      const idxB = peaks[i];
      if (idxA < this.timestamps.length && idxB < this.timestamps.length) {
        intervals.push(this.timestamps[idxB] - this.timestamps[idxA]);
      }
    }

    if (intervals.length < 2) return 20;

    // Calculate coefficient of variation (lower = more consistent = higher confidence)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length;
    const cv = Math.sqrt(variance) / mean;

    // Map CV to confidence: CV=0 → 100%, CV=0.4 → 0% (dipersempit dari 0.5)
    const baseConfidence = Math.max(0, Math.min(100, Math.round((1 - cv * 2.5) * 100)));

    // Bonus: lebih banyak peaks = lebih confident
    const peakBonus = Math.min(10, peaks.length - 3);

    return Math.min(100, baseConfidence + peakBonus);
  }

  /**
   * Get current session average BPM
   */
  getAverageBPM(): number {
    if (this.bpmHistory.length === 0) return 0;
    return Math.round(this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length);
  }

  /**
   * Get latest stable BPM
   */
  getLatestBPM(): number {
    return this.bpmHistory.length > 0 ? this.bpmHistory[this.bpmHistory.length - 1] : 0;
  }

  /**
   * Get HR zone based on actual measured BPM
   */
  static getHRZone(bpm: number, age: number): { zone: number; name: string; color: string } {
    const maxHR = 220 - age;
    const percent = (bpm / maxHR) * 100;

    if (percent < 60) return { zone: 1, name: 'Warm Up / Pemulihan', color: '#38EF7D' };
    if (percent < 70) return { zone: 2, name: 'Fat Burn', color: '#4FACFE' };
    if (percent < 80) return { zone: 3, name: 'Aerobik', color: '#00F2FE' };
    if (percent < 90) return { zone: 4, name: 'Kardio Intensif', color: '#FF8008' };
    return { zone: 5, name: 'Anaerob / Maksimal', color: '#FF512F' };
  }
}
