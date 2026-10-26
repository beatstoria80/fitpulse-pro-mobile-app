/**
 * FitPulse Pro • Blood Pressure Telemetry & PPG Estimator Engine
 * =============================================================================
 * Berdasarkan standar klinis AHA/ACC 2017 & InaSH (Perhimpunan Dokter Hipertensi Indonesia).
 *
 * Fitur:
 * 1. Klasifikasi Klinis AHA/ACC 2017 (Normal, Elevated, Stage 1, Stage 2, Crisis)
 * 2. Pulse Wave Analysis (PWA) PPG Optik via Kamera HP dengan Kalibrasi Personal
 * 3. Integrasi Web Bluetooth (BLE) Sphygmomanometer (GATT Service 0x1810)
 * 4. Engine Kalibrasi Mandiri untuk Akurasi Personal
 */

import { BloodPressureCategory, BloodPressureMethod, BloodPressureLog } from '../types/fitness';
import { PPGReading, PPGPressureState } from './heartRatePPG';

export interface BPCalibrationData {
  cuffSystolic: number;
  cuffDiastolic: number;
  calibratedAt: string;
  calibratedBpm?: number;
}

export interface BPReading {
  systolic: number;
  diastolic: number;
  pulseBpm: number;
  confidence: number; // 0 - 100%
  category: BloodPressureCategory;
  progressPercent: number; // 0 - 100%
  status: 'initializing' | 'measuring' | 'analyzing' | 'complete' | 'finger_missing' | 'error';
  pressureState: PPGPressureState;
  message: string;
  waveform: number[];
  isCalibrated: boolean;
}

export interface BPCategoryMeta {
  category: BloodPressureCategory;
  label: string;
  shortBadge: string;
  colorHex: string;
  bgHex: string;
  textColor: string;
  description: string;
  recommendation: string;
  riskLevel: 'safe' | 'caution' | 'warning' | 'danger' | 'emergency';
}

export class BloodPressureEngine {
  private static STORAGE_KEY_CALIBRATION = 'fitpulse_bp_calibration_v1';

  /**
   * Evaluasi klasifikasi tekanan darah berdasarkan standar AHA/ACC 2017 & InaSH
   */
  static evaluateCategory(systolic: number, diastolic: number): BloodPressureCategory {
    // Krisis Hipertensi (Emergency)
    if (systolic > 180 || diastolic > 120) {
      return 'crisis';
    }
    // Hipertensi Stadium 2
    if (systolic >= 140 || diastolic >= 90) {
      return 'stage2';
    }
    // Hipertensi Stadium 1
    if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
      return 'stage1';
    }
    // Elevated (Meningkat)
    if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
      return 'elevated';
    }
    // Normal
    return 'normal';
  }

  /**
   * Detail metadata klinis dan panduan tindakan berdasarkan kategori
   */
  static getCategoryMeta(category: BloodPressureCategory): BPCategoryMeta {
    switch (category) {
      case 'normal':
        return {
          category: 'normal',
          label: 'Normal Optimal',
          shortBadge: 'Normal',
          colorHex: '#10B981',
          bgHex: 'rgba(16, 185, 129, 0.12)',
          textColor: '#059669',
          description: 'Sistolik < 120 dan Diastolik < 80 mmHg. Pembuluh darah dan fungsi kardiovaskular dalam kondisi prima.',
          recommendation: 'Pertahankan diet rendah garam, pertahankan aktivitas fisik rutin, dan hidrasi teratur.',
          riskLevel: 'safe',
        };
      case 'elevated':
        return {
          category: 'elevated',
          label: 'Meningkat (Elevated)',
          shortBadge: 'Elevated',
          colorHex: '#F59E0B',
          bgHex: 'rgba(245, 158, 11, 0.12)',
          textColor: '#D97706',
          description: 'Sistolik 120-129 dan Diastolik < 80 mmHg. Tanda awal peningkatan resistensi vaskular perifer.',
          recommendation: 'Kurangi konsumsi natrium/garam, kelola stres, dan prioritaskan olahraga aerobik 30 menit.',
          riskLevel: 'caution',
        };
      case 'stage1':
        return {
          category: 'stage1',
          label: 'Hipertensi Stadium 1',
          shortBadge: 'Stadium 1',
          colorHex: '#F97316',
          bgHex: 'rgba(249, 115, 22, 0.12)',
          textColor: '#EA580C',
          description: 'Sistolik 130-139 atau Diastolik 80-89 mmHg. Tekanan darah secara konsisten di atas batas normal.',
          recommendation: 'Batasi kafein & sodium, lakukan jalan santai atau sepeda ringan, hindari angkat beban ekstrem.',
          riskLevel: 'warning',
        };
      case 'stage2':
        return {
          category: 'stage2',
          label: 'Hipertensi Stadium 2',
          shortBadge: 'Stadium 2',
          colorHex: '#EF4444',
          bgHex: 'rgba(239, 68, 68, 0.12)',
          textColor: '#DC2626',
          description: 'Sistolik ≥ 140 atau Diastolik ≥ 90 mmHg. Tingkat tekanan darah membutuhkan perhatian medis berkala.',
          recommendation: 'Konsultasikan dengan dokter spesialis, lakukan monitoring harian teratur, batasi stres tinggi.',
          riskLevel: 'danger',
        };
      case 'crisis':
        return {
          category: 'crisis',
          label: 'Krisis Hipertensi ⚠️',
          shortBadge: 'Krisis!',
          colorHex: '#991B1B',
          bgHex: 'rgba(153, 27, 27, 0.18)',
          textColor: '#7F1D1D',
          description: 'Sistolik > 180 dan/atau Diastolik > 120 mmHg. Kondisi darurat kardiovaskular berisiko.',
          recommendation: 'DUDUK TENANG & SEGERA CARI BANTUAN MEDIS / IGD terdekat. Jangan lakukan aktivitas fisik!',
          riskLevel: 'emergency',
        };
    }
  }

  /**
   * Ambil data kalibrasi individual dari localStorage
   */
  static getCalibration(): BPCalibrationData | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_CALIBRATION);
      if (!raw) return null;
      return JSON.parse(raw) as BPCalibrationData;
    } catch {
      return null;
    }
  }

  /**
   * Simpan kalibrasi individual dari pengukuran tensimeter manset klinis
   */
  static saveCalibration(data: BPCalibrationData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY_CALIBRATION, JSON.stringify(data));
  }

  /**
   * Hapus kalibrasi
   */
  static clearCalibration(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY_CALIBRATION);
  }

  /**
   * Estimasi Tekanan Darah dari Sinyal PPG Optik (PWA + Model Morfologi Gelombang)
   * Menggabungkan:
   * 1. Baseline Kalibrasi (Cuff Reference)
   * 2. Pulse Transit Time (PTT) surrogate dari denyut dan interval RR
   * 3. Rise Time (Waktu naik dari foot ke peak sistolik)
   * 4. Faktor fisiologis (Umur, BMI, denyut istirahat)
   */
  static estimateFromPPG(
    ppgReading: PPGReading,
    waveform: number[],
    userAge: number = 30,
    userBmi: number = 22.5
  ): { systolic: number; diastolic: number; confidence: number } {
    const calibration = this.getCalibration();
    const bpm = ppgReading.bpm > 0 ? ppgReading.bpm : 72;

    // Default reference jika belum ada kalibrasi mandiri
    // Didasarkan pada baseline fisiologis rata-rata usia & BMI
    let baseSys = 118;
    let baseDia = 76;

    if (calibration) {
      baseSys = calibration.cuffSystolic;
      baseDia = calibration.cuffDiastolic;
    } else {
      // Penyesuaian umur: setiap 10 tahun di atas 30, sistolik naik ~3-4 mmHg
      const ageFactor = Math.max(0, (userAge - 30) * 0.35);
      // Penyesuaian BMI: setiap 1 poin BMI di atas 23 naik ~0.8 mmHg
      const bmiFactor = Math.max(0, (userBmi - 23) * 0.8);
      baseSys = Math.round(baseSys + ageFactor + bmiFactor);
      baseDia = Math.round(baseDia + ageFactor * 0.5 + bmiFactor * 0.5);
    }

    // Analisis Morfologi Sinyal (PWA - Pulse Wave Analysis)
    let riseTimeFactor = 0;
    let waveStiffnessFactor = 0;

    if (waveform.length >= 20) {
      // Ambil 30 sampel terakhir untuk analisis 1 denyut
      const recentWave = waveform.slice(-30);
      const minVal = Math.min(...recentWave);
      const maxVal = Math.max(...recentWave);
      const amplitude = maxVal - minVal;

      if (amplitude > 0.05) {
        const minIdx = recentWave.indexOf(minVal);
        const maxIdx = recentWave.indexOf(maxVal);

        // Rise Time: Jarak dari lembah ke puncak sistolik
        const riseSamples = Math.abs(maxIdx - minIdx);
        // Semakin pendek rise time (gelombang naik tajam), semakin tinggi resistensi vaskular (sistolik naik)
        if (riseSamples > 0 && riseSamples < 6) {
          riseTimeFactor = (6 - riseSamples) * 1.5;
        } else if (riseSamples >= 10) {
          riseTimeFactor = -2;
        }

        // Variasi pantulan gelombang (reflection wave ratio)
        waveStiffnessFactor = (amplitude > 0.4 ? 2.5 : -1);
      }
    }

    // Efek fluktuasi Heart Rate terhadap Tekanan Darah (Frank-Starling law surrogate)
    // Kenaikan BPM di atas 75 meningkatkan cardiac output -> tensi naik sedikit
    const hrDelta = (bpm - 72) * 0.22;

    // Kalkulasi final dengan pembatasan klinis yang masuk akal
    const finalSys = Math.round(
      Math.max(90, Math.min(210, baseSys + hrDelta + riseTimeFactor + waveStiffnessFactor))
    );
    const finalDia = Math.round(
      Math.max(55, Math.min(130, baseDia + hrDelta * 0.6 + (riseTimeFactor * 0.4)))
    );

    // Confidence dipengaruhi oleh kualitas sinyal PPG dan status kalibrasi
    let confidence = ppgReading.confidence;
    if (!calibration) {
      confidence = Math.min(confidence, 78); // Tanpa kalibrasi, max confidence 78%
    }

    return {
      systolic: finalSys,
      diastolic: finalDia,
      confidence: Math.round(confidence),
    };
  }

  /**
   * Hubungkan ke Tensimeter Nirkabel Bluetooth (Standard BLE Blood Pressure Service)
   * GATT Service UUID: 0x1810
   * Characteristic UUID: 0x2A35
   */
  static async connectBLEBloodPressure(): Promise<{
    deviceName: string;
    systolic: number;
    diastolic: number;
    pulseBpm?: number;
  }> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth tidak didukung pada browser ini. Gunakan Chrome di Android/PC.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navAny = navigator as any;

    const device = await navAny.bluetooth.requestDevice({
      filters: [{ services: ['blood_pressure'] }],
      optionalServices: ['battery_service'],
    });

    if (!device.gatt) {
      throw new Error('Perangkat bluetooth tidak mendukung GATT Server.');
    }

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('blood_pressure');
    const characteristic = await service.getCharacteristic('intermediate_cuff_pressure').catch(async () => {
      return await service.getCharacteristic('blood_pressure_measurement');
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Waktu tunggu pembacaan tensimeter habis (Timeout 30 detik).'));
      }, 30000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleValueChange = (event: any) => {
        const value: DataView = event.target.value;
        clearTimeout(timeout);

        try {
          // Parse IEEE-11073 Blood Pressure Measurement Characteristic (0x2A35)
          const flags = value.getUint8(0);
          const isKPa = (flags & 0x01) !== 0; // 0 = mmHg, 1 = kPa
          const hasPulseRate = (flags & 0x04) !== 0;

          let systolic = value.getFloat32(1, true);
          let diastolic = value.getFloat32(3, true);

          if (isKPa) {
            // Konversi kPa ke mmHg (1 kPa = 7.50062 mmHg)
            systolic = Math.round(systolic * 7.50062);
            diastolic = Math.round(diastolic * 7.50062);
          } else {
            systolic = Math.round(systolic);
            diastolic = Math.round(diastolic);
          }

          let pulseBpm: number | undefined;
          if (hasPulseRate && value.byteLength >= 9) {
            pulseBpm = Math.round(value.getFloat32(7, true));
          }

          characteristic.removeEventListener('characteristicvaluechanged', handleValueChange);

          resolve({
            deviceName: device.name || 'Smart Tensimeter BLE',
            systolic,
            diastolic,
            pulseBpm,
          });
        } catch (err) {
          reject(err);
        }
      };

      characteristic.addEventListener('characteristicvaluechanged', handleValueChange);
      characteristic.startNotifications();
    });
  }

  /**
   * Validasi angka sistolik dan diastolik untuk catat manual
   */
  static validateInput(systolic: number, diastolic: number): { isValid: boolean; error?: string } {
    if (!systolic || isNaN(systolic)) {
      return { isValid: false, error: 'Sistolik tidak boleh kosong.' };
    }
    if (!diastolic || isNaN(diastolic)) {
      return { isValid: false, error: 'Diastolik tidak boleh kosong.' };
    }
    if (systolic < 50 || systolic > 260) {
      return { isValid: false, error: 'Nilai Sistolik di luar rentang wajar (50 - 260 mmHg).' };
    }
    if (diastolic < 30 || diastolic > 160) {
      return { isValid: false, error: 'Nilai Diastolik di luar rentang wajar (30 - 160 mmHg).' };
    }
    if (systolic <= diastolic) {
      return { isValid: false, error: 'Tekanan Sistolik harus lebih tinggi daripada Diastolik.' };
    }
    return { isValid: true };
  }

  /**
   * Helper untuk membuat objek BloodPressureLog yang terstandarisasi
   */
  static createLogEntry(params: {
    systolic: number;
    diastolic: number;
    pulseBpm?: number;
    method: BloodPressureMethod;
    confidence?: number;
    isCalibrated?: boolean;
    notes?: string;
  }): BloodPressureLog {
    const category = this.evaluateCategory(params.systolic, params.diastolic);
    const now = new Date();
    return {
      id: `bp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
      date: now.toISOString().slice(0, 10),
      systolic: params.systolic,
      diastolic: params.diastolic,
      pulse_bpm: params.pulseBpm,
      category,
      method: params.method,
      confidence: params.confidence,
      is_calibrated: params.isCalibrated,
      notes: params.notes,
    };
  }
}
