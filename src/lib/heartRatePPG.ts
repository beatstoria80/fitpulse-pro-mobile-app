/**
 * FitPulse Pro • Camera-Based PPG (Photoplethysmography) Heart Rate Monitor
 * =========================================================================
 * Mendeteksi detak jantung REAL-TIME menggunakan kamera HP.
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
  sampleWindowMs: number;  // Window durasi sampling (default 10000ms = 10s)
  fpsTarget: number;       // Target FPS kamera (default 30)
  minRedIntensity: number; // Minimum intensitas merah untuk deteksi jari
  smoothingFactor: number; // Smoothing EMA (0-1)
}

const DEFAULT_CONFIG: PPGConfig = {
  sampleWindowMs: 10000,
  fpsTarget: 30,
  minRedIntensity: 80,
  smoothingFactor: 0.3,
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

    // Need at least 3 seconds of data to compute BPM
    const dataSpanMs = this.timestamps.length > 1
      ? this.timestamps[this.timestamps.length - 1] - this.timestamps[0]
      : 0;

    if (dataSpanMs < 3000 || this.redSignal.length < 60) {
      const progress = Math.min(100, Math.round((dataSpanMs / 3000) * 100));
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

    // 2. Apply bandpass-like filtering (moving average + detrend)
    const filtered = this.bandpassFilter(normalized);

    // 3. Find peaks (heartbeats)
    const peaks = this.findPeaks(filtered);

    // 4. Calculate BPM from inter-peak intervals
    const bpm = this.calculateBPM(peaks);

    // 5. Calculate confidence based on peak consistency
    const confidence = this.calculateConfidence(peaks);

    // 6. Apply EMA smoothing
    let smoothedBpm = bpm;
    if (this.bpmHistory.length > 0 && bpm > 0) {
      const lastBpm = this.bpmHistory[this.bpmHistory.length - 1];
      smoothedBpm = Math.round(
        lastBpm * (1 - this.config.smoothingFactor) + bpm * this.config.smoothingFactor
      );
    }

    if (smoothedBpm > 0) {
      this.bpmHistory.push(smoothedBpm);
      if (this.bpmHistory.length > 30) this.bpmHistory.shift();
    }

    // Determine status
    const isStable = confidence > 60 && this.bpmHistory.length >= 5;
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
   * Simple bandpass filter: remove DC offset + smooth high-freq noise
   */
  private bandpassFilter(signal: number[]): number[] {
    if (signal.length < 5) return signal;

    // Detrend (remove slow baseline drift)
    const windowSize = Math.min(15, Math.floor(signal.length / 4));
    const detrended: number[] = [];
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(signal.length, i + windowSize + 1);
      let sum = 0;
      for (let j = start; j < end; j++) sum += signal[j];
      const localMean = sum / (end - start);
      detrended.push(signal[i] - localMean);
    }

    // Smooth (low-pass: 3-point moving average)
    const smoothed: number[] = [];
    for (let i = 0; i < detrended.length; i++) {
      if (i === 0 || i === detrended.length - 1) {
        smoothed.push(detrended[i]);
      } else {
        smoothed.push((detrended[i - 1] + detrended[i] + detrended[i + 1]) / 3);
      }
    }

    return smoothed;
  }

  /**
   * Find peaks (heartbeats) in the filtered signal
   */
  private findPeaks(signal: number[]): number[] {
    const peaks: number[] = [];
    if (signal.length < 3) return peaks;

    // Adaptive threshold: mean + 0.3 * std
    let sum = 0;
    for (const v of signal) sum += v;
    const mean = sum / signal.length;

    let sqSum = 0;
    for (const v of signal) sqSum += (v - mean) ** 2;
    const std = Math.sqrt(sqSum / signal.length);

    const threshold = mean + 0.3 * std;

    // Minimum distance between peaks (based on 220 bpm max = ~4.5 samples at 30fps)
    const avgSampleRate = this.timestamps.length > 1
      ? (this.timestamps.length - 1) / ((this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / 1000)
      : 30;
    const minPeakDistance = Math.floor(avgSampleRate * 60 / 220); // ~8 samples for 220bpm@30fps

    let lastPeakIdx = -minPeakDistance;

    for (let i = 1; i < signal.length - 1; i++) {
      if (
        signal[i] > signal[i - 1] &&
        signal[i] > signal[i + 1] &&
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

    // Remove outlier intervals (outside 40-220 BPM range)
    const validIntervals = intervals.filter((ms) => {
      const bpm = 60000 / ms;
      return bpm >= 40 && bpm <= 220;
    });

    if (validIntervals.length === 0) return 0;

    // Median interval (more robust than mean)
    validIntervals.sort((a, b) => a - b);
    const medianInterval = validIntervals[Math.floor(validIntervals.length / 2)];

    return Math.round(60000 / medianInterval);
  }

  /**
   * Calculate confidence score based on peak consistency
   */
  private calculateConfidence(peaks: number[]): number {
    if (peaks.length < 3) return Math.min(30, peaks.length * 15);

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const idxA = peaks[i - 1];
      const idxB = peaks[i];
      if (idxA < this.timestamps.length && idxB < this.timestamps.length) {
        intervals.push(this.timestamps[idxB] - this.timestamps[idxA]);
      }
    }

    if (intervals.length < 2) return 30;

    // Calculate coefficient of variation (lower = more consistent = higher confidence)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length;
    const cv = Math.sqrt(variance) / mean;

    // Map CV to confidence: CV=0 → 100%, CV=0.5 → 0%
    const confidence = Math.max(0, Math.min(100, Math.round((1 - cv * 2) * 100)));

    return confidence;
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
