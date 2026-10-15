"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HeartRatePPG, PPGReading } from '../lib/heartRatePPG';

interface HeartRateMonitorProps {
  userAge: number;
  onMeasurementComplete?: (bpm: number, confidence: number) => void;
}

export default function HeartRateMonitor({ userAge, onMeasurementComplete }: HeartRateMonitorProps) {
  const [isActive, setIsActive] = useState(false);
  const [reading, setReading] = useState<PPGReading | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [sessionBpm, setSessionBpm] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const ppgRef = useRef<HeartRatePPG | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const maxHR = 220 - userAge;

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveform.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Waveform line
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#FF512F');
    gradient.addColorStop(0.5, '#DD2476');
    gradient.addColorStop(1, '#FF512F');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
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

    // Glow effect
    ctx.shadowColor = '#FF512F';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [waveform]);

  const handleStart = useCallback(async () => {
    if (isActive) {
      // Stop
      ppgRef.current?.stop();
      ppgRef.current = null;
      setIsActive(false);

      if (sessionBpm.length > 0) {
        const avgBpm = Math.round(sessionBpm.reduce((a, b) => a + b, 0) / sessionBpm.length);
        setShowResult(true);
        onMeasurementComplete?.(avgBpm, reading?.confidence || 0);
      }
      return;
    }

    // Start
    setShowResult(false);
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
        },
        (signal) => {
          setWaveform(signal);
        }
      );
    } catch {
      setIsActive(false);
    }
  }, [isActive, sessionBpm, reading, onMeasurementComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ppgRef.current?.stop();
    };
  }, []);

  const getZoneInfo = (bpm: number) => HeartRatePPG.getHRZone(bpm, userAge);
  const avgBpm = sessionBpm.length > 0
    ? Math.round(sessionBpm.reduce((a, b) => a + b, 0) / sessionBpm.length)
    : 0;

  const isSupported = typeof window !== 'undefined' ? HeartRatePPG.isSupported() : true;

  return (
    <div className="glass-card ppg-monitor-card">
      <div className="card-header-clean">
        <div className="card-title-group">
          <span className="badge-mini badge-rose">
            <i className="fa-solid fa-heart-pulse"></i> Sensor Real-Time
          </span>
          <h3>Monitor Detak Jantung</h3>
        </div>
        <span className="hr-max-tag">Max HR: ~{maxHR} bpm (Usia {userAge})</span>
      </div>

      {/* PPG Camera Indicator */}
      <div className="ppg-status-area">
        {!isSupported ? (
          <div className="ppg-not-supported">
            <i className="fa-solid fa-camera-rotate"></i>
            <p>Kamera tidak didukung di browser ini. Gunakan Chrome/Safari di HP.</p>
          </div>
        ) : !isActive ? (
          <div className="ppg-idle-prompt">
            <div className={`ppg-heart-icon ${showResult ? 'result' : ''}`}>
              <i className="fa-solid fa-heart-pulse"></i>
            </div>
            {showResult && avgBpm > 0 ? (
              <div className="ppg-result-display">
                <span className="ppg-result-bpm">{avgBpm}</span>
                <span className="ppg-result-unit">BPM</span>
                <span className="ppg-result-zone" style={{ color: getZoneInfo(avgBpm).color }}>
                  {getZoneInfo(avgBpm).name}
                </span>
              </div>
            ) : (
              <p className="ppg-instruction">
                Tekan tombol di bawah, lalu <strong>tutup kamera belakang dengan ujung jari</strong> Anda
              </p>
            )}
          </div>
        ) : (
          <div className="ppg-active-display">
            {/* Real-time waveform */}
            <div className="ppg-waveform-container">
              <canvas
                ref={canvasRef}
                className="ppg-waveform-canvas"
                width={280}
                height={80}
              />
            </div>

            {/* Live BPM */}
            <div className="ppg-live-stats">
              <div className="ppg-bpm-display">
                <i className={`fa-solid fa-heart-pulse ppg-bpm-icon ${reading?.bpm ? 'beating' : ''}`}></i>
                <span className="ppg-bpm-value">
                  {reading?.bpm || '--'}
                </span>
                <span className="ppg-bpm-label">BPM</span>
              </div>

              <div className="ppg-meta-row">
                <span className={`ppg-status-badge ${reading?.status || 'initializing'}`}>
                  {reading?.status === 'stable' && <i className="fa-solid fa-check-circle"></i>}
                  {reading?.status === 'measuring' && <i className="fa-solid fa-spinner fa-spin"></i>}
                  {reading?.status === 'finger_missing' && <i className="fa-solid fa-hand-pointer"></i>}
                  {reading?.status === 'initializing' && <i className="fa-solid fa-hourglass-half"></i>}
                  {' '}{reading?.message || 'Memulai...'}
                </span>
                {reading?.confidence ? (
                  <span className="ppg-confidence">
                    Akurasi: {reading.confidence}%
                  </span>
                ) : null}
              </div>

              {reading?.bpm ? (
                <div className="ppg-zone-indicator" style={{ borderColor: getZoneInfo(reading.bpm).color }}>
                  <span className="zone-dot" style={{ background: getZoneInfo(reading.bpm).color }}></span>
                  <span>Zona {getZoneInfo(reading.bpm).zone}: {getZoneInfo(reading.bpm).name}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      {isSupported && (
        <button
          className={`ppg-action-btn ${isActive ? 'active' : ''}`}
          onClick={handleStart}
        >
          <i className={`fa-solid ${isActive ? 'fa-stop' : 'fa-play'}`}></i>
          {isActive ? 'Hentikan Pengukuran' : 'Mulai Ukur Detak Jantung'}
        </button>
      )}

      {/* Heart Rate Zone Reference (now with real data context) */}
      <div className="ppg-zone-legend">
        <span className="zone-legend-title">Zona HR berdasarkan Max HR Anda ({maxHR} bpm):</span>
        <div className="zone-legend-items">
          <span className="zone-leg-item"><span className="zd z1-d"></span> Z1: {'<'}{Math.round(maxHR * 0.6)} bpm</span>
          <span className="zone-leg-item"><span className="zd z2-d"></span> Z2: {Math.round(maxHR * 0.6)}-{Math.round(maxHR * 0.7)}</span>
          <span className="zone-leg-item"><span className="zd z3-d"></span> Z3: {Math.round(maxHR * 0.7)}-{Math.round(maxHR * 0.8)}</span>
          <span className="zone-leg-item"><span className="zd z4-d"></span> Z4: {Math.round(maxHR * 0.8)}-{Math.round(maxHR * 0.9)}</span>
          <span className="zone-leg-item"><span className="zd z5-d"></span> Z5: {'>'}{Math.round(maxHR * 0.9)}</span>
        </div>
      </div>
    </div>
  );
}
