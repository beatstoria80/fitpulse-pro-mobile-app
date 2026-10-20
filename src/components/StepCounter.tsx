"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Footprints, MapPin, Flame, Activity, Timer, AlertTriangle, Info, Play, Square } from 'lucide-react';
import { Pedometer, StepReading } from '../lib/pedometer';

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

  const pedometerRef = useRef<Pedometer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const pedometer = new Pedometer({ weightKg, heightCm });
    pedometerRef.current = pedometer;
    setIsActive(true);

    await pedometer.start((newReading) => {
      setReading(newReading);
    });
  }, [isActive, weightKg, heightCm, reading, onStepUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pedometerRef.current?.stop();
    };
  }, []);

  const isSupported = typeof window !== 'undefined' ? Pedometer.isSupported() : true;

  const getActivityLabel = () => {
    if (!reading) return 'Idle';
    if (reading.isRunning) return '🏃 Berlari';
    if (reading.isWalking) return '🚶 Berjalan';
    if (reading.totalSteps > 0) return '🚶 Bergerak';
    return '⏸ Diam';
  };

  const getActivityColor = () => {
    if (!reading) return 'var(--text-tertiary)';
    if (reading.isRunning) return '#FF512F';
    if (reading.isWalking) return '#38EF7D';
    return 'var(--text-secondary)';
  };

  return (
    <div className="glass-card pedometer-card">
      <div className="card-header-clean">
        <div className="card-title-group">
          <span className="badge-mini badge-green">
            <Footprints size={14} /> Sensor Real-Time
          </span>
          <h3>Penghitung Langkah</h3>
        </div>
        <span className={`ped-activity-tag ${isActive ? 'active' : ''}`} style={{ color: getActivityColor() }}>
          {getActivityLabel()}
        </span>
      </div>

      {/* Main Stats Grid */}
      <div className="ped-stats-grid">
        {/* Steps */}
        <div className="ped-stat-main">
          <div className="ped-stat-icon-circle steps">
            <Footprints size={24} />
          </div>
          <div className="ped-stat-data">
            <span className="ped-stat-value">{reading?.totalSteps || 0}</span>
            <span className="ped-stat-label">Langkah</span>
          </div>
        </div>

        {/* Distance */}
        <div className="ped-stat-box">
          <MapPin size={16} className="ped-stat-ico" />
          <span className="ped-val">{reading ? (reading.distanceMeters / 1000).toFixed(2) : '0.00'}</span>
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

      {/* Status Message */}
      {reading?.status === 'not_supported' && (
        <div className="ped-warning">
          <AlertTriangle size={16} />
          <span>Sensor gerak tidak tersedia. Fitur ini bekerja di HP, bukan desktop.</span>
        </div>
      )}

      {!isSupported && !isActive && (
        <div className="ped-info-tip">
          <Info size={16} />
          <span>Buka halaman ini di <strong>HP Anda</strong> untuk mengaktifkan sensor langkah real-time.</span>
        </div>
      )}

      {/* Action Button */}
      <button
        className={`ped-action-btn ${isActive ? 'active' : ''}`}
        onClick={handleToggle}
      >
        {isActive ? <Square size={16} /> : <Play size={16} />}
        {isActive ? 'Hentikan Pedometer' : 'Mulai Hitung Langkah'}
      </button>
    </div>
  );
}
