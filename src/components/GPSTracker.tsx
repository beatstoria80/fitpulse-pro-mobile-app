"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Flame,
  Activity,
  Timer,
  AlertTriangle,
  Info,
  Play,
  Square,
  RotateCcw,
  Plus,
  Gauge,
  Footprints,
  Signal,
} from 'lucide-react';
import { GPSTracker, GPSReading } from '../lib/gps-tracker';

interface GPSTrackerViewProps {
  weightKg: number;
  heightCm: number;
  onStepUpdate?: (steps: number, calories: number, distance: number) => void;
}

export default function GPSTrackerView({ weightKg, heightCm, onStepUpdate }: GPSTrackerViewProps) {
  const [isActive, setIsActive] = useState(false);
  const [reading, setReading] = useState<GPSReading | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState('00:00');

  const trackerRef = useRef<GPSTracker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReportedDistRef = useRef<number>(0);

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
      trackerRef.current?.stop();
      trackerRef.current = null;
      setIsActive(false);

      if (reading) {
        onStepUpdate?.(reading.estimatedSteps, reading.caloriesBurned, reading.totalDistanceMeters);
      }
      return;
    }

    // Start
    setReading(null);
    setElapsed('00:00');
    setStartTime(Date.now());
    lastReportedDistRef.current = 0;

    const tracker = new GPSTracker({
      weightKg,
      heightCm,
    });
    trackerRef.current = tracker;
    setIsActive(true);

    await tracker.start((newReading) => {
      setReading(newReading);

      // Notify parent on meaningful distance change (every 10m)
      if (newReading.totalDistanceMeters - lastReportedDistRef.current >= 10) {
        lastReportedDistRef.current = newReading.totalDistanceMeters;
        onStepUpdate?.(newReading.estimatedSteps, newReading.caloriesBurned, newReading.totalDistanceMeters);
      }
    });
  }, [isActive, weightKg, heightCm, reading, onStepUpdate]);

  // Manual test distance (+50m) for debugging
  const handleManualTestDistance = () => {
    if (trackerRef.current && isActive) {
      trackerRef.current.addManualDistance(50);
    }
  };

  // Reset tracking
  const handleReset = () => {
    if (trackerRef.current) {
      trackerRef.current.reset();
    }
    setReading((prev) =>
      prev
        ? {
            ...prev,
            totalDistanceMeters: 0,
            estimatedSteps: 0,
            caloriesBurned: 0,
            currentSpeedKmh: 0,
            averageSpeedKmh: 0,
            currentPace: '--:--',
            isMoving: false,
            isWalking: false,
            isRunning: false,
            gpsSignalStrength: 0,
            message: 'GPS tracking direset ke 0',
          }
        : null
    );
    lastReportedDistRef.current = 0;
    setElapsed('00:00');
    setStartTime(Date.now());
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      trackerRef.current?.stop();
    };
  }, []);

  const isSupported = typeof window !== 'undefined' ? GPSTracker.isSupported() : true;

  const getActivityLabel = () => {
    if (!isActive) return 'Tidak Aktif';
    if (!reading) return 'Menghubungkan GPS...';
    if (reading.status === 'permission_denied') return '🚫 Izin Ditolak';
    if (reading.isRunning) return '🏃 Berlari';
    if (reading.isWalking) return '🚶 Berjalan';
    if (reading.isMoving) return '🚶 Bergerak';
    if (reading.totalDistanceMeters > 0) return '⏸ Berhenti';
    return '📍 Menunggu Gerakan';
  };

  const getActivityColor = () => {
    if (!isActive) return 'var(--text-tertiary)';
    if (!reading) return '#F59E0B';
    if (reading.status === 'permission_denied' || reading.status === 'error') return '#EF4444';
    if (reading.isRunning) return '#FF512F';
    if (reading.isWalking) return '#059669';
    if (reading.isMoving) return '#10B981';
    return 'var(--text-secondary)';
  };

  const getSignalLabel = () => {
    if (!reading) return 'Tidak ada sinyal';
    const s = reading.gpsSignalStrength;
    const accTxt = reading.accuracy > 0 ? ` (±${reading.accuracy}m)` : '';
    if (s >= 0.7) return `Sinyal GPS Kuat ✓${accTxt}`;
    if (s >= 0.4) return `Sinyal GPS Sedang${accTxt}`;
    if (s > 0) return `Sinyal GPS Lemah${accTxt}`;
    return 'Mencari sinyal GPS...';
  };

  const getSignalColor = () => {
    if (!reading) return '#CBD5E1';
    const s = reading.gpsSignalStrength;
    if (s >= 0.7) return '#059669';
    if (s >= 0.4) return '#F59E0B';
    if (s > 0) return '#EF4444';
    return '#CBD5E1';
  };

  return (
    <div className="glass-card pedometer-card">
      <div className="card-header-clean">
        <div className="card-title-group">
          <span className="badge-mini badge-green">
            <Navigation size={14} /> GPS Tracker
          </span>
          <h3>Pelacak Jarak GPS Real-Time</h3>
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
        {/* Distance Display (Primary) */}
        <div className={`ped-stat-main`}>
          <div className="ped-stat-icon-circle steps">
            <MapPin size={26} />
          </div>
          <div className="ped-stat-data">
            <span className={`ped-stat-value`}>
              {reading ? (reading.totalDistanceMeters / 1000).toFixed(2) : '0.00'}
            </span>
            <span className="ped-stat-label">Kilometer</span>
          </div>
          {isActive && (
            <div className="ped-pulse-status">
              <span className="ped-live-dot" />
              <span className="ped-live-txt">GPS Aktif</span>
            </div>
          )}
        </div>

        {/* Estimated Steps */}
        <div className="ped-stat-box">
          <Footprints size={16} className="ped-stat-ico" />
          <span className="ped-val">{reading?.estimatedSteps || 0}</span>
          <span className="ped-unit">langkah</span>
        </div>

        {/* Speed */}
        <div className="ped-stat-box">
          <Gauge size={16} className="ped-stat-ico" />
          <span className="ped-val">{reading?.currentSpeedKmh || 0}</span>
          <span className="ped-unit">km/jam</span>
        </div>

        {/* Calories */}
        <div className="ped-stat-box">
          <Flame size={16} className="ped-stat-ico color-fire" />
          <span className="ped-val">{reading?.caloriesBurned || 0}</span>
          <span className="ped-unit">kkal</span>
        </div>

        {/* Pace */}
        <div className="ped-stat-box">
          <Activity size={16} className="ped-stat-ico" />
          <span className="ped-val">{reading?.currentPace || '--:--'}</span>
          <span className="ped-unit">mnt/km</span>
        </div>

        {/* Timer */}
        <div className="ped-stat-box">
          <Timer size={16} className="ped-stat-ico" />
          <span className="ped-val">{elapsed}</span>
          <span className="ped-unit">durasi</span>
        </div>
      </div>

      {/* GPS Signal Strength Bar */}
      {isActive && (
        <div className="ped-motion-monitor">
          <div className="ped-motion-header">
            <span className="ped-motion-label">
              <Signal size={12} className="spin-animate" /> Sinyal GPS:
            </span>
            <span className="ped-motion-val">
              {getSignalLabel()}
            </span>
          </div>
          <div className="ped-motion-track">
            <div
              className="ped-motion-bar"
              style={{
                width: `${Math.min(100, Math.round((reading?.gpsSignalStrength || 0) * 100))}%`,
                backgroundColor: getSignalColor(),
              }}
            />
          </div>
        </div>
      )}

      {/* Average Speed Info */}
      {isActive && reading && reading.totalDistanceMeters > 0 && (
        <div className="ped-sens-row">
          <span className="ped-sens-title">
            <Gauge size={12} /> Kecepatan Rata-rata:
          </span>
          <div className="ped-sens-buttons">
            <span className="ped-sens-btn active" style={{ cursor: 'default' }}>
              {reading.averageSpeedKmh} km/jam
            </span>
            <span className="ped-sens-btn" style={{ cursor: 'default' }}>
              Pace: {reading.currentPace} /km
            </span>
          </div>
        </div>
      )}

      {/* Status Warning or Error */}
      {reading?.status === 'not_supported' && (
        <div className="ped-warning">
          <AlertTriangle size={16} />
          <span>{reading.message}</span>
        </div>
      )}

      {reading?.status === 'permission_denied' && (
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
            Buka halaman ini di <strong>HP Anda</strong> via browser (Chrome/Safari) untuk mengaktifkan GPS real-time.
          </span>
        </div>
      )}

      {isSupported && !isActive && (
        <div className="ped-info-tip">
          <Info size={16} />
          <span>
            GPS mengukur <strong>jarak tempuh</strong> secara presisi via satelit. Langkah dihitung otomatis dari jarak ÷ panjang langkah rata-rata. Untuk akurasi terbaik, gunakan di <strong>area terbuka (outdoor)</strong>.
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
          {isActive ? 'Hentikan GPS' : 'Mulai GPS Tracking'}
        </button>

        {isActive && (
          <>
            <button
              type="button"
              className="ped-test-btn"
              onClick={handleManualTestDistance}
              title="Uji coba tambah jarak manual (+50m)"
            >
              <Plus size={15} /> +50m Tes
            </button>
            <button
              type="button"
              className="ped-reset-btn"
              onClick={handleReset}
              title="Reset tracking GPS"
            >
              <RotateCcw size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
