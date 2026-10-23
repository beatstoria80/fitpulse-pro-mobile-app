"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  HeartPulse,
  Camera,
  CheckCircle2,
  Loader2,
  Hourglass,
  Play,
  Square,
  Info,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { HeartRatePPG, PPGReading, PPGPressureState } from '../lib/heartRatePPG';
import { HeartRateLog, HeartRateMethod } from '../types/fitness';

const WatchIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="7" />
    <polyline points="12 9 12 12 13.5 13.5" />
    <path d="M16.51 17.35l-.85 3.22a2 2 0 0 1-1.93 1.43H10.27a2 2 0 0 1-1.93-1.43l-.85-3.22" />
    <path d="M7.49 6.65l.85-3.22A2 2 0 0 1 10.27 2h3.46a2 2 0 0 1 1.93 1.43l.85 3.22" />
  </svg>
);

interface HeartRateMonitorProps {
  userAge: number;
  onMeasurementComplete?: (bpm: number, confidence: number) => void;
  onSaveHeartRate?: (log: HeartRateLog) => void;
}

type MeasurementMode = 'camera' | 'bluetooth';

export default function HeartRateMonitor({
  userAge,
  onMeasurementComplete,
  onSaveHeartRate,
}: HeartRateMonitorProps) {
  const [activeMode, setActiveMode] = useState<MeasurementMode>('camera');

  // Camera PPG states
  const [isActive, setIsActive] = useState(false);
  const [reading, setReading] = useState<PPGReading | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [sessionBpm, setSessionBpm] = useState<number[]>([]);



  // Bluetooth states
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [bleConnecting, setBleConnecting] = useState(false);
  const [bleBpm, setBleBpm] = useState<number | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bleServerRef = useRef<any>(null);

  // Common final result
  const [finalResult, setFinalResult] = useState<{
    bpm: number;
    confidence: number;
    method: HeartRateMethod;
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const ppgRef = useRef<HeartRatePPG | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const maxHR = 220 - userAge;

  // Draw real-time waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveform.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background medical grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
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

    // Waveform line
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#E11D48');
    gradient.addColorStop(0.5, '#F43F5E');
    gradient.addColorStop(1, '#0284C7');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();

    const step = w / (waveform.length - 1);
    const padding = 10;
    const range = h - padding * 2;

    for (let i = 0; i < waveform.length; i++) {
      const x = i * step;
      // Signal is normalized 0-1, flip so peaks go up
      const y = padding + range * (1 - (waveform[i] + 0.5));
      if (i === 0) ctx.moveTo(x, Math.max(padding, Math.min(h - padding, y)));
      else ctx.lineTo(x, Math.max(padding, Math.min(h - padding, y)));
    }
    ctx.stroke();

    // Pulse Glow effect
    ctx.shadowColor = '#F43F5E';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [waveform]);

  // Handle Camera PPG start/stop
  const handleToggleCamera = useCallback(async () => {
    if (isActive) {
      ppgRef.current?.stop();
      ppgRef.current = null;
      setIsActive(false);

      if (sessionBpm.length > 0) {
        const avgBpm = Math.round(sessionBpm.reduce((a, b) => a + b, 0) / sessionBpm.length);
        const conf = reading?.confidence || 80;
        setFinalResult({ bpm: avgBpm, confidence: conf, method: 'camera_ppg' });
        setSavedSuccess(false);
        onMeasurementComplete?.(avgBpm, conf);
      }
      return;
    }

    setFinalResult(null);
    setSavedSuccess(false);
    setSessionBpm([]);
    setWaveform([]);
    setReading(null);

    const ppg = new HeartRatePPG();
    ppgRef.current = ppg;
    setIsActive(true);

    try {
      await ppg.start(
        (newReading) => {
          setReading(newReading);
          if (newReading.bpm > 0) {
            setSessionBpm((prev) => [...prev, newReading.bpm]);
          }

          // Auto-finalize if ultra-stable after reaching 100% progress
          if (newReading.status === 'stable' && newReading.progressPercent >= 95 && newReading.bpm > 45) {
            ppg.stop();
            ppgRef.current = null;
            setIsActive(false);
            setFinalResult({ bpm: newReading.bpm, confidence: newReading.confidence, method: 'camera_ppg' });
            setSavedSuccess(false);
            onMeasurementComplete?.(newReading.bpm, newReading.confidence);
          }
        },
        (signal) => {
          setWaveform(signal);
        }
      );
    } catch {
      setIsActive(false);
    }
  }, [isActive, sessionBpm, reading, onMeasurementComplete]);



  // Handle Web Bluetooth BLE Smartwatch
  const handleConnectBluetooth = async () => {
    setBleError(null);
    setBleConnecting(true);
    setSavedSuccess(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window === 'undefined' || !(navigator as any).bluetooth) {
      setBleError('Web Bluetooth tidak didukung pada browser ini. Buka Chrome di Android/macOS/Windows.');
      setBleConnecting(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
      });

      setBleDeviceName(device.name || 'Sensor Nadi Bluetooth');

      const server = await device.gatt.connect();
      bleServerRef.current = server;

      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        let hr = 0;
        // Check flag bit 0: 0 = 8-bit, 1 = 16-bit
        if ((flags & 0x01) === 0) {
          hr = value.getUint8(1);
        } else {
          hr = value.getUint16(1, /* littleEndian = */ true);
        }

        if (hr > 30 && hr < 240) {
          setBleBpm(hr);
          setFinalResult({ bpm: hr, confidence: 99, method: 'ble_watch' });
          onMeasurementComplete?.(hr, 99);
        }
      });

      setBleConnecting(false);
    } catch (err: unknown) {
      setBleConnecting(false);
      const errorObj = err as Error;
      if (errorObj?.name !== 'NotFoundError') {
        setBleError(errorObj?.message || 'Gagal menyambung ke perangkat Bluetooth');
      }
    }
  };

  const handleDisconnectBluetooth = () => {
    if (bleServerRef.current?.connected) {
      bleServerRef.current.disconnect();
    }
    bleServerRef.current = null;
    setBleDeviceName(null);
    setBleBpm(null);
    setBleConnecting(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ppgRef.current?.stop();
      if (bleServerRef.current?.connected) {
        bleServerRef.current.disconnect();
      }
    };
  }, []);

  // Save Heart Rate Log handler
  const handleSaveToVitals = () => {
    if (!finalResult) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    const dateStr = now.toISOString().slice(0, 10);
    const categoryInfo = HeartRatePPG.getHRCategory(finalResult.bpm);

    const log: HeartRateLog = {
      id: `HR-${Date.now()}`,
      timestamp: timeStr,
      date: dateStr,
      bpm: finalResult.bpm,
      confidence: finalResult.confidence,
      method: finalResult.method,
      category: categoryInfo.category,
      notes: `Pengukuran via ${
        finalResult.method === 'camera_ppg'
          ? 'Kamera AI PPG'
          : 'Smartwatch BLE'
      }`,
    };

    onSaveHeartRate?.(log);
    setSavedSuccess(true);
  };

  const getZoneInfo = (bpm: number) => HeartRatePPG.getHRZone(bpm, userAge);
  const getCatInfo = (bpm: number) => HeartRatePPG.getHRCategory(bpm);

  const isCameraSupported = typeof window !== 'undefined' ? HeartRatePPG.isSupported() : true;

  // Pressure styling helper
  const getPressureBadge = (state?: PPGPressureState) => {
    switch (state) {
      case 'optimal':
        return { color: '#059669', bg: '#ECFDF5', text: 'Tekanan Sempurna', border: '#A7F3D0' };
      case 'too_hard':
        return { color: '#DC2626', bg: '#FEF2F2', text: 'Tekanan Terlalu Kencang', border: '#FECACA' };
      case 'too_light':
        return { color: '#D97706', bg: '#FFFBEB', text: 'Tutup Lensa Lebih Rapat', border: '#FDE68A' };
      case 'moving':
        return { color: '#EA580C', bg: '#FFF7ED', text: 'Tangan Bergerak! Tahan Stabil', border: '#FED7AA' };
      default:
        return { color: '#64748B', bg: '#F1F5F9', text: 'Menunggu Jari...', border: '#E2E8F0' };
    }
  };

  return (
    <div className="glass-card ppg-monitor-card">
      {/* Header */}
      <div className="card-header-clean">
        <div className="card-title-group">
          <span className="badge-mini badge-rose">
            <HeartPulse size={14} /> Multi-Modal Vitals
          </span>
          <h3>Pusat Deteksi Detak Jantung</h3>
        </div>
        <span className="hr-max-tag">Max HR: ~{maxHR} bpm</span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="ppg-mode-tabs">
        <button
          className={`ppg-tab-btn ${activeMode === 'camera' ? 'active' : ''}`}
          onClick={() => {
            if (isActive) ppgRef.current?.stop();
            setIsActive(false);
            setActiveMode('camera');
          }}
        >
          <Camera size={14} /> Kamera Jari (PPG)
        </button>
        <button
          className={`ppg-tab-btn ${activeMode === 'bluetooth' ? 'active' : ''}`}
          onClick={() => {
            if (isActive) ppgRef.current?.stop();
            setIsActive(false);
            setActiveMode('bluetooth');
          }}
        >
          <WatchIcon size={14} /> Smartwatch BLE
        </button>
      </div>

      {/* MODE 1: CAMERA PPG */}
      {activeMode === 'camera' && (
        <div className="ppg-content-box">
          {!isCameraSupported ? (
            <div className="ppg-not-supported">
              <Camera size={32} />
              <p>Kamera tidak didukung di browser ini. Gunakan Chrome/Safari di smartphone.</p>
            </div>
          ) : !isActive ? (
            <div className="ppg-idle-prompt">
              <div className="ppg-heart-icon">
                <HeartPulse size={36} />
              </div>
              <p className="ppg-instruction">
                Tekan tombol di bawah, lalu <strong>tempelkan ujung jari Anda di atas kamera belakang</strong> HP.
                Sensor AI akan menganalisis fluktuasi mikroskopis aliran darah secara real-time.
              </p>
              <button className="ppg-action-btn" onClick={handleToggleCamera}>
                <Play size={16} /> Mulai Pengukuran Kamera
              </button>
            </div>
          ) : (
            <div className="ppg-active-display">
              {/* Waveform Canvas */}
              <div className="ppg-waveform-container">
                <canvas ref={canvasRef} className="ppg-waveform-canvas" width={320} height={80} />
              </div>

              {/* Progress Bar */}
              <div className="ppg-progress-wrapper">
                <div className="ppg-progress-info">
                  <span>Progres Analisis Aliran Darah</span>
                  <strong>{reading?.progressPercent || 0}%</strong>
                </div>
                <div className="ppg-progress-track">
                  <div
                    className="ppg-progress-bar"
                    style={{ width: `${reading?.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              {/* Pressure & Motion Guidance Badge */}
              <div
                className="ppg-pressure-badge"
                style={{
                  color: getPressureBadge(reading?.pressureState).color,
                  backgroundColor: getPressureBadge(reading?.pressureState).bg,
                  borderColor: getPressureBadge(reading?.pressureState).border,
                }}
              >
                {reading?.pressureState === 'moving' ? (
                  <AlertTriangle size={14} />
                ) : reading?.pressureState === 'optimal' ? (
                  <ShieldCheck size={14} />
                ) : (
                  <Info size={14} />
                )}
                <span>{reading?.pressureMessage || 'Letakkan jari di kamera belakang'}</span>
              </div>

              {/* Live BPM Stats */}
              <div className="ppg-live-stats">
                <div className="ppg-bpm-display">
                  <HeartPulse
                    size={28}
                    className={`ppg-bpm-icon ${reading?.bpm ? 'beating' : ''}`}
                  />
                  <span className="ppg-bpm-value">{reading?.bpm || '--'}</span>
                  <span className="ppg-bpm-label">BPM</span>
                </div>

                <div className="ppg-meta-row">
                  <span className={`ppg-status-badge ${reading?.status || 'initializing'}`}>
                    {reading?.status === 'stable' && <CheckCircle2 size={13} />}
                    {reading?.status === 'measuring' && <Loader2 size={13} className="spin-animate" />}
                    {reading?.status === 'finger_missing' && <AlertTriangle size={13} />}
                    {reading?.status === 'initializing' && <Hourglass size={13} />}
                    {' '}{reading?.message || 'Memulai sensor...'}
                  </span>
                  {reading?.confidence ? (
                    <span className="ppg-confidence">Akurasi: {reading.confidence}%</span>
                  ) : null}
                </div>
              </div>

              <button className="ppg-action-btn active" onClick={handleToggleCamera}>
                <Square size={16} /> Hentikan Sensor
              </button>
            </div>
          )}
        </div>
      )}



      {/* MODE 3: BLUETOOTH SMARTWATCH */}
      {activeMode === 'bluetooth' && (
        <div className="ppg-content-box ble-box">
          <div className="ble-info-banner">
            <WatchIcon size={24} className="text-cyan" />
            <div>
              <h4>Sinkronisasi Sensor Smartwatch (BLE)</h4>
              <p>Mendukung Apple Watch, Garmin, Polar, Mi Band, & monitor dada standar Bluetooth SIG.</p>
            </div>
          </div>

          {bleError && (
            <div className="ble-error-banner">
              <AlertTriangle size={16} />
              <span>{bleError}</span>
            </div>
          )}

          {bleDeviceName ? (
            <div className="ble-connected-card">
              <div className="ble-dev-header">
                <span className="live-dot" />
                <strong>{bleDeviceName}</strong> (Tersambung)
              </div>
              <div className="ble-hr-live">
                <span className="ble-hr-val">{bleBpm || '--'}</span>
                <span className="ble-hr-unit">BPM</span>
              </div>
              <button className="btn-secondary-reset" onClick={handleDisconnectBluetooth}>
                Putuskan Koneksi
              </button>
            </div>
          ) : (
            <button
              className="ppg-action-btn"
              onClick={handleConnectBluetooth}
              disabled={bleConnecting}
            >
              {bleConnecting ? <Loader2 size={16} className="spin-animate" /> : <WatchIcon size={16} />}
              {bleConnecting ? 'Mencari Perangkat Bluetooth...' : 'Hubungkan Smartwatch'}
            </button>
          )}
        </div>
      )}

      {/* RESULT CONFIRMATION CARD (APPEARS ON COMPLETION) */}
      {finalResult && (
        <div className="ppg-final-card">
          <div className="final-card-glow" />
          <div className="final-header">
            <div className="final-badge-group">
              <span className="badge-mini badge-green">
                <CheckCircle2 size={13} /> Pengukuran Berhasil
              </span>
              <span className="final-method-tag">
                {finalResult.method === 'camera_ppg' && '📷 Kamera AI'}
                {finalResult.method === 'ble_watch' && '⌚ Smartwatch BLE'}
              </span>
            </div>
            <span className="final-conf-tag">Akurasi: {finalResult.confidence}%</span>
          </div>

          <div className="final-body">
            <div className="final-bpm-display">
              <span className="final-bpm-number">{finalResult.bpm}</span>
              <span className="final-bpm-unit">BPM</span>
            </div>

            <div className="final-classification">
              <span
                className="final-category-pill"
                style={{
                  backgroundColor: getCatInfo(finalResult.bpm).color + '15',
                  color: getCatInfo(finalResult.bpm).color,
                  borderColor: getCatInfo(finalResult.bpm).color + '40',
                }}
              >
                {getCatInfo(finalResult.bpm).label}
              </span>
              <span
                className="final-zone-pill"
                style={{ color: getZoneInfo(finalResult.bpm).color }}
              >
                Zona {getZoneInfo(finalResult.bpm).zone}: {getZoneInfo(finalResult.bpm).name}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="final-actions-row">
            <button
              className={`btn-save-vitals ${savedSuccess ? 'saved' : ''}`}
              onClick={handleSaveToVitals}
              disabled={savedSuccess}
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 size={16} /> Tersimpan di Buku Vitals!
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Simpan ke Riwayat Vitals
                </>
              )}
            </button>
            <button
              className="btn-measure-again"
              onClick={() => {
                setFinalResult(null);
                setSavedSuccess(false);
              }}
            >
              <RotateCcw size={14} /> Ukur Ulang
            </button>
          </div>
        </div>
      )}

      {/* Heart Rate Zone Legend */}
      <div className="ppg-zone-legend">
        <span className="zone-legend-title">Panduan Zona Latihan Anda (Max {maxHR} BPM):</span>
        <div className="zone-legend-items">
          <span className="zone-leg-item">
            <span className="zd z1-d" /> Z1: {'<'}{Math.round(maxHR * 0.6)} (Pemulihan)
          </span>
          <span className="zone-leg-item">
            <span className="zd z2-d" /> Z2: {Math.round(maxHR * 0.6)}-{Math.round(maxHR * 0.7)} (Fat Burn)
          </span>
          <span className="zone-leg-item">
            <span className="zd z3-d" /> Z3: {Math.round(maxHR * 0.7)}-{Math.round(maxHR * 0.8)} (Aerobik)
          </span>
          <span className="zone-leg-item">
            <span className="zd z4-d" /> Z4: {Math.round(maxHR * 0.8)}-{Math.round(maxHR * 0.9)} (Kardio)
          </span>
          <span className="zone-leg-item">
            <span className="zd z5-d" /> Z5: {'>'}{Math.round(maxHR * 0.9)} (Maksimal)
          </span>
        </div>
      </div>
    </div>
  );
}
