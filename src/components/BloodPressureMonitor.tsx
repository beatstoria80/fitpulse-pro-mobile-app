"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Camera,
  CheckCircle2,
  Loader2,
  Play,
  Square,
  Info,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Award,
} from 'lucide-react';
import { SlidersIcon, BluetoothIcon, FileTextIcon } from './icons/FeatureIcons';
import { HeartRatePPG, PPGReading } from '../lib/heartRatePPG';
import {
  BloodPressureEngine,
  BPCalibrationData,
  BPCategoryMeta,
} from '../lib/bloodPressurePPG';
import {
  BloodPressureLog,
  BloodPressureMethod,
  BloodPressureCategory,
} from '../types/fitness';

interface BloodPressureMonitorProps {
  userAge: number;
  userBmi?: number;
  historyLogs?: BloodPressureLog[];
  onSaveBloodPressure: (log: BloodPressureLog) => void;
  onDeleteBloodPressure: (id: string) => void;
}

type Mode = 'camera' | 'bluetooth' | 'manual' | 'calibration';

export default function BloodPressureMonitor({
  userAge,
  userBmi = 23,
  historyLogs = [],
  onSaveBloodPressure,
  onDeleteBloodPressure,
}: BloodPressureMonitorProps) {
  const [activeMode, setActiveMode] = useState<Mode>('camera');

  // Camera PPG Measurement states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraReading, setCameraReading] = useState<PPGReading | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [liveEstimatedSys, setLiveEstimatedSys] = useState<number | null>(null);
  const [liveEstimatedDia, setLiveEstimatedDia] = useState<number | null>(null);
  const [cameraProgress, setCameraProgress] = useState(0);

  // Bluetooth BLE states
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [bleConnecting, setBleConnecting] = useState(false);
  const [bleError, setBleError] = useState<string | null>(null);

  // Manual Input states
  const [manualSys, setManualSys] = useState<string>('120');
  const [manualDia, setManualDia] = useState<string>('80');
  const [manualPulse, setManualPulse] = useState<string>('72');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualValidationErr, setManualValidationErr] = useState<string | null>(null);

  // Calibration states - lazy initializers (avoids cascading render warning)
  const [calibrationData, setCalibrationData] = useState<BPCalibrationData | null>(() => {
    if (typeof window === 'undefined') return null;
    return BloodPressureEngine.getCalibration();
  });
  const [calibSysInput, setCalibSysInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '120';
    const saved = BloodPressureEngine.getCalibration();
    return saved ? String(saved.cuffSystolic) : '120';
  });
  const [calibDiaInput, setCalibDiaInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '80';
    const saved = BloodPressureEngine.getCalibration();
    return saved ? String(saved.cuffDiastolic) : '80';
  });
  const [calibSuccessMsg, setCalibSuccessMsg] = useState<string | null>(null);

  // Completed Measurement Result
  const [result, setResult] = useState<{
    systolic: number;
    diastolic: number;
    pulseBpm?: number;
    category: BloodPressureCategory;
    method: BloodPressureMethod;
    confidence: number;
    isCalibrated: boolean;
    notes?: string;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Refs for camera engine & canvas
  const ppgRef = useRef<HeartRatePPG | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const readingRef = useRef<PPGReading | null>(null);
  const waveformRef = useRef<number[]>([]);

  // Draw Live Arterial Pulse Wave on Oscilloscope Canvas
  useEffect(() => {
    if (!canvasRef.current || waveform.length < 2) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Arterial grid lines
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const x = (w / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Arterial Waveform gradient (Crimson to Amber)
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#EF4444');
    gradient.addColorStop(0.6, '#F97316');
    gradient.addColorStop(1, '#DC2626');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    const step = w / (waveform.length - 1);
    waveform.forEach((val, i) => {
      // Invert & scale signal to canvas height
      const y = h * 0.85 - val * (h * 0.7);
      const clampedY = Math.max(6, Math.min(h - 6, y));
      if (i === 0) ctx.moveTo(0, clampedY);
      else ctx.lineTo(i * step, clampedY);
    });
    ctx.stroke();

    // Pulse peak glow dot at leading wave
    const lastY = h * 0.85 - (waveform[waveform.length - 1] || 0.5) * (h * 0.7);
    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(w - 4, Math.max(6, Math.min(h - 6, lastY)), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [waveform]);

  // Clean up Camera PPG on unmount
  useEffect(() => {
    return () => {
      if (ppgRef.current) {
        ppgRef.current.stop();
        ppgRef.current = null;
      }
    };
  }, []);

  // Handle Camera PPG Measurement Cycle
  const handleToggleCamera = useCallback(async () => {
    if (isCameraActive) {
      if (ppgRef.current) {
        ppgRef.current.stop();
        ppgRef.current = null;
      }
      setIsCameraActive(false);
      setCameraReading(null);
      setWaveform([]);
      setCameraProgress(0);
      return;
    }

    setResult(null);
    setSavedSuccess(false);
    setIsCameraActive(true);
    setCameraProgress(0);

    const ppg = new HeartRatePPG({
      sampleWindowMs: 14000, // 14 seconds for clinical PWA morphology sampling
      minRedIntensity: 75,
      smoothingFactor: 0.16,
    });
    ppgRef.current = ppg;

    let sampleCount = 0;
    const sysReadings: number[] = [];
    const diaReadings: number[] = [];

    try {
      await ppg.start(
        (reading: PPGReading) => {
          readingRef.current = reading;
          setCameraReading(reading);
          setCameraProgress(reading.progressPercent);

          // Estimate live BP if signal quality is good
          if (reading.bpm > 40 && reading.confidence >= 55) {
            const est = BloodPressureEngine.estimateFromPPG(
              reading,
              waveformRef.current,
              userAge,
              userBmi
            );
            setLiveEstimatedSys(est.systolic);
            setLiveEstimatedDia(est.diastolic);

            if (reading.progressPercent >= 45) {
              sysReadings.push(est.systolic);
              diaReadings.push(est.diastolic);
            }
          }

          // Check if measurement is complete (100% progress or stable high confidence)
          if (reading.progressPercent >= 100 || (reading.status === 'stable' && reading.progressPercent >= 85)) {
            sampleCount++;
            if (sampleCount >= 2) {
              ppg.stop();
              setIsCameraActive(false);

              // Trimmed mean: remove top/bottom 15% outliers for robust averaging
              const trimmedMean = (arr: number[]): number => {
                if (arr.length === 0) return NaN;
                if (arr.length <= 4) return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
                const sorted = [...arr].sort((a, b) => a - b);
                const trimCount = Math.max(1, Math.floor(sorted.length * 0.15));
                const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
                return Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
              };

              const avgSys = sysReadings.length > 0 ? trimmedMean(sysReadings) : NaN;
              const avgDia = diaReadings.length > 0 ? trimmedMean(diaReadings) : NaN;

              // No valid readings → show error instead of fake 120/80 fallback
              if (isNaN(avgSys) || isNaN(avgDia)) {
                ppgRef.current = null;
                setCameraProgress(0);
                alert('Pengukuran gagal: sinyal PPG tidak cukup stabil untuk estimasi tekanan darah. Pastikan ujung jari menutupi lensa kamera sepenuhnya, lalu coba lagi.');
                return;
              }

              const finalCat = BloodPressureEngine.evaluateCategory(avgSys, avgDia);
              const hasCalib = Boolean(BloodPressureEngine.getCalibration());

              setResult({
                systolic: avgSys,
                diastolic: avgDia,
                pulseBpm: reading.bpm > 0 ? reading.bpm : undefined,
                category: finalCat,
                method: 'camera_ppg',
                confidence: Math.round(Math.min(95, Math.max(68, reading.confidence))),
                isCalibrated: hasCalib,
                notes: hasCalib ? 'Estimasi PPG Optik (Terkalibrasi)' : 'Estimasi PPG Optik (Standar)',
              });
            }
          }
        },
        (signal: number[]) => {
          waveformRef.current = signal;
          setWaveform([...signal]);
        }
      );
    } catch (err) {
      console.error('Camera PPG start error:', err);
      setIsCameraActive(false);
      alert('Gagal mengakses kamera. Pastikan izin kamera telah diberikan dan gunakan browser Chrome/Safari.');
    }
  }, [isCameraActive, liveEstimatedSys, liveEstimatedDia, userAge, userBmi]);

  // Connect BLE Sphygmomanometer
  const handleConnectBLE = useCallback(async () => {
    setBleConnecting(true);
    setBleError(null);
    setResult(null);
    setSavedSuccess(false);

    try {
      const data = await BloodPressureEngine.connectBLEBloodPressure();
      setBleDeviceName(data.deviceName);
      const cat = BloodPressureEngine.evaluateCategory(data.systolic, data.diastolic);

      setResult({
        systolic: data.systolic,
        diastolic: data.diastolic,
        pulseBpm: data.pulseBpm,
        category: cat,
        method: 'ble_sphygmomanometer',
        confidence: 99,
        isCalibrated: true,
        notes: `Tensimeter BLE: ${data.deviceName}`,
      });
    } catch (err: unknown) {
      console.error('BLE BP Error:', err);
      setBleError(err instanceof Error ? err.message : 'Koneksi bluetooth gagal.');
    } finally {
      setBleConnecting(false);
    }
  }, []);

  // Save Manual Input
  const handleManualSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const s = parseInt(manualSys, 10);
      const d = parseInt(manualDia, 10);
      const p = manualPulse ? parseInt(manualPulse, 10) : undefined;

      const val = BloodPressureEngine.validateInput(s, d);
      if (!val.isValid) {
        setManualValidationErr(val.error || 'Nilai tidak valid');
        return;
      }
      setManualValidationErr(null);

      const cat = BloodPressureEngine.evaluateCategory(s, d);
      setResult({
        systolic: s,
        diastolic: d,
        pulseBpm: p,
        category: cat,
        method: 'manual',
        confidence: 100,
        isCalibrated: true,
        notes: manualNotes.trim() || 'Pengukuran Tensimeter Manual',
      });
    },
    [manualSys, manualDia, manualPulse, manualNotes]
  );

  // Live Category for Manual Preview
  const manualCategoryMeta: BPCategoryMeta = useMemo(() => {
    const s = parseInt(manualSys, 10) || 120;
    const d = parseInt(manualDia, 10) || 80;
    const cat = BloodPressureEngine.evaluateCategory(s, d);
    return BloodPressureEngine.getCategoryMeta(cat);
  }, [manualSys, manualDia]);

  // Save Calibration
  const handleSaveCalibration = useCallback(() => {
    const s = parseInt(calibSysInput, 10);
    const d = parseInt(calibDiaInput, 10);
    const val = BloodPressureEngine.validateInput(s, d);
    if (!val.isValid) {
      alert(val.error);
      return;
    }

    const data: BPCalibrationData = {
      cuffSystolic: s,
      cuffDiastolic: d,
      calibratedAt: new Date().toISOString(),
    };
    BloodPressureEngine.saveCalibration(data);
    setCalibrationData(data);
    setCalibSuccessMsg('Kalibrasi tersimpan! Estimasi PPG kamera kini disesuaikan dengan profil vaskular Anda.');
    setTimeout(() => setCalibSuccessMsg(null), 4000);
  }, [calibSysInput, calibDiaInput]);

  // Reset Calibration
  const handleClearCalibration = useCallback(() => {
    BloodPressureEngine.clearCalibration();
    setCalibrationData(null);
    setCalibSysInput('120');
    setCalibDiaInput('80');
    setCalibSuccessMsg('Data kalibrasi dihapus. Estimasi kembali ke standar usia.');
    setTimeout(() => setCalibSuccessMsg(null), 3000);
  }, []);

  // Save Result to App & Supabase
  const handleSaveToVitals = useCallback(() => {
    if (!result) return;
    const log = BloodPressureEngine.createLogEntry({
      systolic: result.systolic,
      diastolic: result.diastolic,
      pulseBpm: result.pulseBpm,
      method: result.method,
      confidence: result.confidence,
      isCalibrated: result.isCalibrated,
      notes: result.notes,
    });
    onSaveBloodPressure(log);
    setSavedSuccess(true);
  }, [result, onSaveBloodPressure]);

  // Vitals History Computations
  const historyStats = useMemo(() => {
    if (!historyLogs || historyLogs.length === 0) {
      return { avgSys: 0, avgDia: 0, avgMap: 0, avgPp: 0, latest: null };
    }
    const count = historyLogs.length;
    const sumSys = historyLogs.reduce((s, l) => s + l.systolic, 0);
    const sumDia = historyLogs.reduce((s, l) => s + l.diastolic, 0);
    const avgSys = Math.round(sumSys / count);
    const avgDia = Math.round(sumDia / count);
    // Mean Arterial Pressure (MAP) = Diastolic + 1/3 * (Systolic - Diastolic)
    const avgMap = Math.round(avgDia + (avgSys - avgDia) / 3);
    const avgPp = avgSys - avgDia;
    return {
      avgSys,
      avgDia,
      avgMap,
      avgPp,
      latest: historyLogs[0],
    };
  }, [historyLogs]);

  const activeMeta = result ? BloodPressureEngine.getCategoryMeta(result.category) : null;

  return (
    <div className="glass-card bp-monitor-card">
      {/* Header */}
      <div className="card-header-clean">
        <div className="card-title-group">
          <span className="badge-mini badge-rose">
            <HeartPulse size={13} /> Kardiovaskular
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Monitor Tekanan Darah</h2>
            {calibrationData ? (
              <span className="bp-calib-pill" title="Terkalibrasi dengan tensimeter manset klinis">
                <ShieldCheck size={11} /> Terkalibrasi
              </span>
            ) : (
              <span className="bp-uncalib-pill" title="Belum dikalibrasi, menggunakan baseline usia">
                Standar
              </span>
            )}
          </div>
        </div>
        <span className="badge-pill highlight">AHA/ACC 2017</span>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="bp-mode-nav">
        <button
          className={`bp-tab-btn ${activeMode === 'camera' ? 'active' : ''}`}
          onClick={() => {
            setActiveMode('camera');
            setResult(null);
          }}
        >
          <Camera size={13} />
          <span>Kamera AI</span>
        </button>
        <button
          className={`bp-tab-btn ${activeMode === 'bluetooth' ? 'active' : ''}`}
          onClick={() => {
            setActiveMode('bluetooth');
            setResult(null);
          }}
        >
          <BluetoothIcon size={13} />
          <span>Tensimeter BLE</span>
        </button>
        <button
          className={`bp-tab-btn ${activeMode === 'manual' ? 'active' : ''}`}
          onClick={() => {
            setActiveMode('manual');
            setResult(null);
          }}
        >
          <FileTextIcon size={13} />
          <span>Catat Manual</span>
        </button>
        <button
          className={`bp-tab-btn ${activeMode === 'calibration' ? 'active' : ''}`}
          onClick={() => {
            setActiveMode('calibration');
            setResult(null);
          }}
          title="Kalibrasi Mandiri dengan Tensimeter Lengan"
        >
          <SlidersIcon size={13} />
          <span>Kalibrasi</span>
        </button>
      </div>

      {/* MODE 1: CAMERA AI (PPG & PWA) */}
      {activeMode === 'camera' && !result && (
        <div className="bp-camera-pane">
          {/* Waveform & Feedback Canvas */}
          <div className="bp-canvas-wrapper">
            <canvas ref={canvasRef} width={380} height={120} className="bp-waveform-canvas" />
            <div className="bp-canvas-overlay">
              <span className="bp-live-tag">
                <span className="live-dot" /> ARTERIAL PULSE WAVE
              </span>
              {isCameraActive && liveEstimatedSys && (
                <div className="bp-live-estimation">
                  <span className="bp-est-numbers">
                    {liveEstimatedSys} / {liveEstimatedDia}{' '}
                    <small>mmHg</small>
                  </span>
                  <span className="bp-est-pulse">
                    <HeartPulse size={12} className="pulse-anim" />{' '}
                    {cameraReading?.bpm || 72} BPM
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar & Status */}
          {isCameraActive && (
            <div className="bp-progress-section">
              <div className="bp-progress-header">
                <span className="bp-progress-msg">
                  {cameraReading?.message || 'Posisikan ujung jari Anda menutupi lensa kamera & lampu kilat...'}
                </span>
                <span className="bp-progress-val">{Math.round(cameraProgress)}%</span>
              </div>
              <div className="bp-progress-bar">
                <div
                  className="bp-progress-fill"
                  style={{ width: `${Math.max(5, cameraProgress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button & Instructions */}
          <div className="bp-action-center">
            <button
              className={`bp-btn-measure ${isCameraActive ? 'measuring' : ''}`}
              onClick={handleToggleCamera}
            >
              {isCameraActive ? (
                <>
                  <Square size={16} /> Berhenti Mengukur
                </>
              ) : (
                <>
                  <Play size={16} /> Mulai Pengukuran Optik (PPG)
                </>
              )}
            </button>
            <p className="bp-instruction-note">
              <Info size={13} /> Tempelkan ujung jari telunjuk menutupi kamera belakang secara lembut tanpa menekan terlalu kuat.
            </p>
          </div>
        </div>
      )}

      {/* MODE 2: BLUETOOTH BLE SPHYGMOMANOMETER */}
      {activeMode === 'bluetooth' && !result && (
        <div className="bp-ble-pane">
          <div className="bp-ble-hero">
            <div className="bp-ble-icon-ring">
              <BluetoothIcon size={28} className={bleConnecting ? 'spin-anim text-blue' : 'text-blue'} />
            </div>
            <h4>Sambungkan Tensimeter Nirkabel</h4>
            <p>
              Mendukung tensimeter digital berkoneksi Bluetooth dengan standar Bluetooth SIG Blood Pressure Service (Omron, Beurer, Yuwell, dsb).
            </p>
            {bleDeviceName && (
              <span className="bp-calib-pill" style={{ marginTop: '4px' }}>
                <ShieldCheck size={12} /> {bleDeviceName}
              </span>
            )}
          </div>

          {bleError && (
            <div className="bp-alert-error">
              <AlertTriangle size={15} />
              <span>{bleError}</span>
            </div>
          )}

          <div className="bp-action-center">
            <button
              className="bp-btn-measure btn-ble"
              onClick={handleConnectBLE}
              disabled={bleConnecting}
            >
              {bleConnecting ? (
                <>
                  <Loader2 size={16} className="spin-anim" /> Mencari Perangkat BLE...
                </>
              ) : (
                <>
                  <BluetoothIcon size={16} /> Hubungkan Tensimeter Digital
                </>
              )}
            </button>
            <span className="bp-ble-subhint">
              Pastikan Bluetooth ponsel/laptop aktif dan tensimeter dalam mode pairing.
            </span>
          </div>
        </div>
      )}

      {/* MODE 3: MANUAL INPUT */}
      {activeMode === 'manual' && !result && (
        <form onSubmit={handleManualSubmit} className="bp-manual-form">
          <div className="bp-inputs-grid">
            <div className="bp-input-group">
              <label>Sistolik (mmHg)</label>
              <div className="bp-input-wrapper">
                <input
                  type="number"
                  min="50"
                  max="260"
                  value={manualSys}
                  onChange={(e) => setManualSys(e.target.value)}
                  placeholder="120"
                  required
                />
                <span className="unit">SYS</span>
              </div>
            </div>

            <div className="bp-input-group">
              <label>Diastolik (mmHg)</label>
              <div className="bp-input-wrapper">
                <input
                  type="number"
                  min="30"
                  max="160"
                  value={manualDia}
                  onChange={(e) => setManualDia(e.target.value)}
                  placeholder="80"
                  required
                />
                <span className="unit">DIA</span>
              </div>
            </div>

            <div className="bp-input-group">
              <label>Denyut Nadi (BPM)</label>
              <div className="bp-input-wrapper">
                <input
                  type="number"
                  min="35"
                  max="220"
                  value={manualPulse}
                  onChange={(e) => setManualPulse(e.target.value)}
                  placeholder="72"
                />
                <span className="unit">PUL</span>
              </div>
            </div>
          </div>

          {/* Live Category Indicator Preview */}
          <div
            className="bp-live-category-preview"
            style={{
              backgroundColor: manualCategoryMeta.bgHex,
              borderLeft: `4px solid ${manualCategoryMeta.colorHex}`,
            }}
          >
            <div className="preview-top">
              <span className="preview-lbl">Prediksi Kategori AHA:</span>
              <strong style={{ color: manualCategoryMeta.textColor }}>
                {manualCategoryMeta.label}
              </strong>
            </div>
            <p className="preview-desc">{manualCategoryMeta.description}</p>
          </div>

          <div className="bp-input-group" style={{ marginTop: '10px' }}>
            <label>Catatan Opsional</label>
            <input
              type="text"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Contoh: Istirahat pagi, setelah jogging, tensimeter Omron"
              className="bp-text-input"
            />
          </div>

          {manualValidationErr && (
            <div className="bp-alert-error">
              <AlertTriangle size={14} />
              <span>{manualValidationErr}</span>
            </div>
          )}

          <div className="bp-action-center" style={{ marginTop: '14px' }}>
            <button type="submit" className="bp-btn-measure">
              <CheckCircle2 size={16} /> Pratinjau & Simpan Catatan
            </button>
          </div>
        </form>
      )}

      {/* MODE 4: CALIBRATION DRAWER */}
      {activeMode === 'calibration' && (
        <div className="bp-calib-pane">
          <div className="bp-calib-info-box">
            <div className="calib-icon">
              <Sparkles size={20} className="text-amber" />
            </div>
            <div>
              <h4>Kalibrasi Personal untuk Kamera PPG</h4>
              <p>
                Algoritma Pulse Wave Analysis (PWA) memperkirakan kekakuan pembuluh darah. Kalibrasi sekali dengan tensimeter manset klinik membuat pengukuran kamera HP akurat dan presisi untuk tubuh Anda.
              </p>
            </div>
          </div>

          {calibrationData && (
            <div className="bp-current-calib-banner">
              <div>
                <span className="calib-badge-active">
                  <ShieldCheck size={12} /> Terkalibrasi Aktif
                </span>
                <p>
                  Referensi:{' '}
                  <strong>
                    {calibrationData.cuffSystolic} / {calibrationData.cuffDiastolic} mmHg
                  </strong>{' '}
                  pada{' '}
                  <small>
                    {new Date(calibrationData.calibratedAt).toLocaleDateString('id-ID')}
                  </small>
                </p>
              </div>
              <button
                className="btn-calib-clear"
                onClick={handleClearCalibration}
                title="Hapus kalibrasi"
              >
                <Trash2 size={13} /> Reset
              </button>
            </div>
          )}

          {calibSuccessMsg && (
            <div className="bp-alert-success">
              <CheckCircle2 size={14} />
              <span>{calibSuccessMsg}</span>
            </div>
          )}

          <div className="bp-calib-form">
            <span className="calib-form-title">Masukkan Hasil Manset Lengan Terbaru:</span>
            <div className="bp-inputs-grid">
              <div className="bp-input-group">
                <label>Sistolik Manset</label>
                <input
                  type="number"
                  value={calibSysInput}
                  onChange={(e) => setCalibSysInput(e.target.value)}
                  placeholder="120"
                />
              </div>
              <div className="bp-input-group">
                <label>Diastolik Manset</label>
                <input
                  type="number"
                  value={calibDiaInput}
                  onChange={(e) => setCalibDiaInput(e.target.value)}
                  placeholder="80"
                />
              </div>
            </div>
            <button className="bp-btn-measure" onClick={handleSaveCalibration}>
              <Award size={15} /> Simpan Profil Kalibrasi
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED RESULT CARD */}
      {result && activeMeta && (
        <div className="bp-result-card animate-scale-up">
          <div className="bp-result-header">
            <span className="bp-result-badge" style={{ backgroundColor: activeMeta.bgHex, color: activeMeta.textColor }}>
              {activeMeta.shortBadge}
            </span>
            <span className="bp-result-method">
              {result.method === 'camera_ppg' && <><Camera size={12} /> Kamera PPG AI</>}
              {result.method === 'ble_sphygmomanometer' && <><BluetoothIcon size={12} /> Smart Tensimeter BLE</>}
              {result.method === 'manual' && <><FileTextIcon size={12} /> Catatan Manual</>}
              {' • '}Akurasi {result.confidence}%
            </span>
          </div>

          <div className="bp-result-big-display">
            <div className="bp-sys-dia">
              <span className="num-sys">{result.systolic}</span>
              <span className="slash">/</span>
              <span className="num-dia">{result.diastolic}</span>
              <small className="unit">mmHg</small>
            </div>
            {result.pulseBpm && (
              <div className="bp-pulse-tag">
                <HeartPulse size={14} className="pulse-anim color-rose" />
                <span>{result.pulseBpm} BPM</span>
              </div>
            )}
          </div>

          {/* Clinical Indices: MAP & Pulse Pressure */}
          <div className="bp-indices-row">
            <div className="bp-idx-cell">
              <span className="idx-lbl">MAP (Tekanan Arteri Rata-rata)</span>
              <strong>{Math.round(result.diastolic + (result.systolic - result.diastolic) / 3)} mmHg</strong>
            </div>
            <div className="bp-idx-cell">
              <span className="idx-lbl">Pulse Pressure (Tekanan Nadi)</span>
              <strong>{result.systolic - result.diastolic} mmHg</strong>
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="bp-advice-box" style={{ borderLeftColor: activeMeta.colorHex }}>
            <div className="advice-title" style={{ color: activeMeta.textColor }}>
              <strong>{activeMeta.label}</strong>
            </div>
            <p className="advice-desc">{activeMeta.description}</p>
            <p className="advice-action">
              💡 <strong>Saran:</strong> {activeMeta.recommendation}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="bp-result-actions">
            {!savedSuccess ? (
              <button className="btn-primary-add" onClick={handleSaveToVitals} style={{ flex: 2 }}>
                <CheckCircle2 size={16} /> Simpan ke Buku Vitals
              </button>
            ) : (
              <button className="btn-primary-add saved" disabled style={{ flex: 2, background: '#10B981' }}>
                <CheckCircle2 size={16} /> Tersimpan di Buku Vitals!
              </button>
            )}
            <button
              className="btn-water-sub"
              onClick={() => {
                setResult(null);
                setSavedSuccess(false);
              }}
              title="Ukur Ulang"
              style={{ width: '42px', height: '42px' }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}

      {/* VITALS HISTORY HUB (Buku Riwayat Tekanan Darah) */}
      <div className="bp-history-section">
        <div className="bp-history-header">
          <div className="title-pair">
            <span className="badge-mini badge-rose">
              <TrendingUp size={12} /> Log Vitals
            </span>
            <h3>Buku Riwayat Tekanan Darah</h3>
          </div>
          <span className="badge-pill highlight">{historyLogs.length} Catatan</span>
        </div>

        {/* Aggregate Stats Tiles */}
        <div className="bp-stats-grid">
          <div className="bp-stat-cell">
            <span className="lbl">Rata-Rata</span>
            <strong className="val text-rose">
              {historyStats.avgSys > 0 ? `${historyStats.avgSys}/${historyStats.avgDia}` : '—'}
              <small>mmHg</small>
            </strong>
          </div>
          <div className="bp-stat-cell">
            <span className="lbl">MAP Arteri</span>
            <strong className="val text-blue">
              {historyStats.avgMap > 0 ? `${historyStats.avgMap}` : '—'}
              <small>mmHg</small>
            </strong>
          </div>
          <div className="bp-stat-cell">
            <span className="lbl">Tekanan Nadi (PP)</span>
            <strong className="val text-orange">
              {historyStats.avgPp > 0 ? `${historyStats.avgPp}` : '—'}
              <small>mmHg</small>
            </strong>
          </div>
        </div>

        {/* History List */}
        <div className="bp-history-list">
          {historyLogs.length > 0 ? (
            historyLogs.map((log) => {
              const meta = BloodPressureEngine.getCategoryMeta(log.category);
              return (
                <div key={log.id} className="bp-history-item">
                  <div className="bp-item-left">
                    <div
                      className="bp-dot-indicator"
                      style={{ backgroundColor: meta.bgHex, color: meta.textColor }}
                    >
                      <HeartPulse size={16} />
                    </div>
                    <div>
                      <div className="bp-item-top">
                        <strong className="bp-item-bp">
                          {log.systolic}/{log.diastolic} <small>mmHg</small>
                        </strong>
                        <span
                          className="bp-badge-category"
                          style={{ backgroundColor: meta.bgHex, color: meta.textColor }}
                        >
                          {meta.shortBadge}
                        </span>
                        {log.is_calibrated && (
                          <span className="calib-check-badge" title="Terkalibrasi">
                            <ShieldCheck size={11} />
                          </span>
                        )}
                      </div>
                      <div className="bp-item-meta">
                        <span>{log.timestamp}</span>
                        {log.pulse_bpm && (
                          <>
                            <span className="dot-sep">•</span>
                            <span>{log.pulse_bpm} BPM</span>
                          </>
                        )}
                        <span className="dot-sep">•</span>
                        <span>
                          {log.method === 'camera_ppg' ? 'Kamera AI' : log.method === 'ble_sphygmomanometer' ? 'Tensimeter BLE' : 'Manual'}
                        </span>
                        {log.notes && (
                          <>
                            <span className="dot-sep">•</span>
                            <span className="bp-item-notes">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn-delete-mini"
                    onClick={() => onDeleteBloodPressure(log.id)}
                    title="Hapus riwayat pengukuran"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="hr-empty-state">
              <HeartPulse size={24} className="text-tertiary" />
              <p>Belum ada riwayat tekanan darah tersimpan.</p>
              <span>Ukur tekanan darah Anda dengan kamera PPG, tensimeter BLE, atau catat manual di atas.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
