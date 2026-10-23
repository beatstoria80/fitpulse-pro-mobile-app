"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Footprints,
  MapPin,
  Flame,
  Activity,
  Timer,
  AlertTriangle,
  Info,
  Play,
  Square,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Pedometer, StepReading, PedometerSensitivity } from '../lib/pedometer';

interface StepCounterProps {
  weightKg: number;
  heightCm: number;
  onStepUpdate?: (steps: number, calories: number, distance: number) => void;
}

export default function StepCounter({ weightKg, heightCm, onStepUpdate }: StepCounterProps) {
  const [isActive, setIsActive] = useState(false);
  const [reading, setReading] = useState<StepReading | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState('00:00');
  const [sensitivity, setSensitivity] = useState<PedometerSensitivity>('normal');
  const [stepBump, setStepBump] = useState(false);

  const pedometerRef = useRef<Pedometer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReportedStepsRef = useRef<number>(0);

  // Update elapsed timer
  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = setInterval(() => {
        const diff = Date.now() - startTime;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, startTime]);

  // Handle sensitivity change
  const handleSensitivityChange = (newSens: PedometerSensitivity) => {
    setSensitivity(newSens);
    if (pedometerRef.current) {
      pedometerRef.current.setSensitivity(newSens);
    }
  };

  const handleToggle = useCallback(async () => {
    if (isActive) {
      // Stop
      pedometerRef.current?.stop();
      pedometerRef.current = null;
      setIsActive(false);

      if (reading) {
        onStepUpdate?.(reading.totalSteps, reading.caloriesBurned, reading.distanceMeters);
      }
      return;
    }

    // Start
    setReading(null);
    setElapsed('00:00');
    setStartTime(Date.now());
    lastReportedStepsRef.current = 0;

    const pedometer = new Pedometer({
      weightKg,
      heightCm,
      sensitivity,
    });
    pedometerRef.current = pedometer;
    setIsActive(true);

    await pedometer.start((newReading) => {
      setReading(newReading);

      // Trigger visual bump on new step
      if (newReading.totalSteps > lastReportedStepsRef.current) {
        lastReportedStepsRef.current = newReading.totalSteps;
        setStepBump(true);
        setTimeout(() => setStepBump(false), 280);

        // Notify parent in real-time so home dashboard updates immediately!
        onStepUpdate?.(newReading.totalSteps, newReading.caloriesBurned, newReading.distanceMeters);
      }
    });
  }, [isActive, weightKg, heightCm, sensitivity, reading, onStepUpdate]);

  // Manual test step (+1) for debugging
  const handleManualTestStep = () => {
    if (pedometerRef.current && isActive) {
      pedometerRef.current.addManualStep();
    }
  };

  // Reset steps
  const handleReset = () => {
    if (pedometerRef.current) {
      pedometerRef.current.reset();
    }
    setReading((prev) =>
      prev
        ? {
            ...prev,
            totalSteps: 0,
            distanceMeters: 0,
            caloriesBurned: 0,
            cadence: 0,
            message: 'Pedometer direset ke 0',
          }
        : null
    );
    lastReportedStepsRef.current = 0;
    setElapsed('00:00');
    setStartTime(Date.now());
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pedometerRef.current?.stop();
    };
  }, []);

  const isSupported = typeof window !== 'undefined' ? Pedometer.isSupported() : true;

  const getActivityLabel = () => {
    if (!isActive) return 'Tidak Aktif';
    if (!reading) return 'Menghubungkan Sensor...';
    if (reading.isRunning) return '🏃 Berlari';
    if (reading.isWalking) return '🚶 Berjalan';
    if (reading.totalSteps > 0) return '🚶 Bergerak';
    return '⏸ Menunggu Langkah';
  };

  const getActivityColor = () => {
    if (!isActive) return 'var(--text-tertiary)';
    if (!reading) return '#F59E0B';
    if (reading.isRunning) return '#FF512F';
    if (reading.isWalking) return '#059669';
    return 'var(--text-secondary)';
  };

  return (
    <div className="glass-card pedometer-card">
      <div className="card-header-clean">
        <div className="card-title-group">
          <span className="badge-mini badge-green">
            <Footprints size={14} /> Pedometer Real-Time
          </span>
          <h3>Penghitung Langkah Otomatis</h3>
        </div>
        <span
          className={`ped-activity-tag ${isActive ? 'active' : ''}`}
          style={{ color: getActivityColor() }}
        >
          {getActivityLabel()}
        </span>
      </div>

      {/* Main Stats Grid */}
      <div className="ped-stats-grid">
        {/* Steps Display */}
        <div className={`ped-stat-main ${stepBump ? 'step-bump-active' : ''}`}>
          <div className="ped-stat-icon-circle steps">
            <Footprints size={26} className={stepBump ? 'icon-bounce' : ''} />
          </div>
          <div className="ped-stat-data">
            <span className={`ped-stat-value ${stepBump ? 'highlight' : ''}`}>
              {reading?.totalSteps || 0}
            </span>
            <span className="ped-stat-label">Langkah Kaki</span>
          </div>
          {isActive && (
            <div className="ped-pulse-status">
              <span className="ped-live-dot" />
              <span className="ped-live-txt">Aktif</span>
            </div>
          )}
        </div>

        {/* Distance */}
        <div className="ped-stat-box">
          <MapPin size={16} className="ped-stat-ico" />
          <span className="ped-val">
            {reading ? (reading.distanceMeters / 1000).toFixed(2) : '0.00'}
          </span>
          <span className="ped-unit">km</span>
        </div>

        {/* Calories */}
        <div className="ped-stat-box">
          <Flame size={16} className="ped-stat-ico color-fire" />
          <span className="ped-val">{reading?.caloriesBurned || 0}</span>
          <span className="ped-unit">kkal</span>
        </div>

        {/* Cadence */}
        <div className="ped-stat-box">
          <Activity size={16} className="ped-stat-ico" />
          <span className="ped-val">{reading?.cadence || 0}</span>
          <span className="ped-unit">langkah/mnt</span>
        </div>

        {/* Timer */}
        <div className="ped-stat-box">
          <Timer size={16} className="ped-stat-ico" />
          <span className="ped-val">{elapsed}</span>
          <span className="ped-unit">durasi</span>
        </div>
      </div>

      {/* Real-Time Motion Signal Bar (shows hardware IMU response) */}
      {isActive && (
        <div className="ped-motion-monitor">
          <div className="ped-motion-header">
            <span className="ped-motion-label">
              <Activity size={12} className="spin-animate" /> Respons Sensor Gerak HP:
            </span>
            <span className="ped-motion-val">
              {reading?.motionIntensity && reading.motionIntensity > 0.15
                ? 'Gerakan Terdeteksi ✓'
                : 'Menunggu Gerakan...'}
            </span>
          </div>
          <div className="ped-motion-track">
            <div
              className="ped-motion-bar"
              style={{
                width: `${Math.min(100, Math.round((reading?.motionIntensity || 0) * 100))}%`,
                backgroundColor:
                  (reading?.motionIntensity || 0) > 0.4
                    ? '#059669'
                    : (reading?.motionIntensity || 0) > 0.15
                    ? '#10B981'
                    : '#CBD5E1',
              }}
            />
          </div>
        </div>
      )}

      {/* Sensitivity Level Controller */}
      <div className="ped-sens-row">
        <span className="ped-sens-title">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          {' '}Sensitivitas:
        </span>
        <div className="ped-sens-buttons">
          <button
            type="button"
            className={`ped-sens-btn ${sensitivity === 'high' ? 'active' : ''}`}
            onClick={() => handleSensitivityChange('high')}
          >
            Peka
          </button>
          <button
            type="button"
            className={`ped-sens-btn ${sensitivity === 'normal' ? 'active' : ''}`}
            onClick={() => handleSensitivityChange('normal')}
          >
            Normal
          </button>
          <button
            type="button"
            className={`ped-sens-btn ${sensitivity === 'low' ? 'active' : ''}`}
            onClick={() => handleSensitivityChange('low')}
          >
            Ketat
          </button>
        </div>
      </div>

      {/* Status Warning or Error */}
      {reading?.status === 'not_supported' && (
        <div className="ped-warning">
          <AlertTriangle size={16} />
          <span>{reading.message}</span>
        </div>
      )}

      {reading?.status === 'error' && (
        <div className="ped-warning">
          <AlertTriangle size={16} />
          <span>{reading.message}</span>
        </div>
      )}

      {!isSupported && !isActive && (
        <div className="ped-info-tip">
          <Info size={16} />
          <span>
            Buka halaman ini di <strong>HP Anda</strong> via browser (Chrome/Safari) untuk mengaktifkan sensor gerak real-time.
          </span>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="ped-action-row">
        <button
          className={`ped-action-btn ${isActive ? 'active' : ''}`}
          onClick={handleToggle}
        >
          {isActive ? <Square size={16} /> : <Play size={16} />}
          {isActive ? 'Hentikan Pedometer' : 'Mulai Hitung Langkah'}
        </button>

        {isActive && (
          <>
            <button
              type="button"
              className="ped-test-btn"
              onClick={handleManualTestStep}
              title="Uji coba hitung langkah manual (+1)"
            >
              <Plus size={15} /> +1 Tes
            </button>
            <button
              type="button"
              className="ped-reset-btn"
              onClick={handleReset}
              title="Reset hitungan langkah"
            >
              <RotateCcw size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
