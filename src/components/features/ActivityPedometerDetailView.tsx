"use client";

import React, { useState, useMemo } from 'react';
import {
  Footprints,
  Flame,
  Activity,
  Plus,
  HeartPulse,
  Info,
  Trash2,
} from 'lucide-react';
import { AppFitnessData } from '../../types/fitness';
import StepCounter from '../StepCounter';
import { BackIcon } from '../icons/FeatureIcons';

interface ActivityPedometerDetailViewProps {
  data: AppFitnessData;
  totalSteps: number;
  burnedCalories: number;
  onBack: () => void;
  onOpenActivityModal: () => void;
  onDeleteActivity: (id: string) => void;
  onStepUpdate: (steps: number, calories: number, distance: number) => void;
  onShowToast: (msg: string) => void;
}

export default function ActivityPedometerDetailView({
  data,
  totalSteps,
  burnedCalories,
  onBack,
  onOpenActivityModal,
  onDeleteActivity,
  onStepUpdate,
  onShowToast,
}: ActivityPedometerDetailViewProps) {
  const [activeHour, setActiveHour] = useState<number | null>(null);

  const targetSteps = 10000;
  const stepPercent = Math.min(100, Math.round((totalSteps / targetSteps) * 100));
  const distanceKm = ((totalSteps * 0.7) / 1000).toFixed(2);

  // Generate realistic hourly step distribution
  const hourlySteps = useMemo(() => {
    return [
      { hour: 6, label: '06:00', steps: Math.round(totalSteps * 0.08) },
      { hour: 7, label: '07:00', steps: Math.round(totalSteps * 0.18) },
      { hour: 8, label: '08:00', steps: Math.round(totalSteps * 0.12) },
      { hour: 9, label: '09:00', steps: Math.round(totalSteps * 0.05) },
      { hour: 10, label: '10:00', steps: Math.round(totalSteps * 0.04) },
      { hour: 11, label: '11:00', steps: Math.round(totalSteps * 0.06) },
      { hour: 12, label: '12:00', steps: Math.round(totalSteps * 0.14) },
      { hour: 13, label: '13:00', steps: Math.round(totalSteps * 0.05) },
      { hour: 14, label: '14:00', steps: Math.round(totalSteps * 0.04) },
      { hour: 15, label: '15:00', steps: Math.round(totalSteps * 0.05) },
      { hour: 16, label: '16:00', steps: Math.round(totalSteps * 0.09) },
      { hour: 17, label: '17:00', steps: Math.round(totalSteps * 0.10) },
    ];
  }, [totalSteps]);

  // Milestone tier calculation (memoized)
  const tier = useMemo(() => {
    if (totalSteps >= 10000) return { name: 'Platinum Walker', color: '#10B981', badge: '🏆 Juara Harian' };
    if (totalSteps >= 7500) return { name: 'Gold Stride', color: '#F59E0B', badge: '🥇 Hebat!' };
    if (totalSteps >= 5000) return { name: 'Silver Active', color: '#0284C7', badge: '🥈 Menanjak' };
    return { name: 'Bronze Starter', color: '#64748B', badge: '🥉 Mulai Melangkah' };
  }, [totalSteps]);

  return (
    <div className="feature-detail-page activity-detail-page">
      {/* Top Floating Glass Navigation Bar */}
      <div className="feature-detail-header">
        <button
          className="feature-back-btn"
          onClick={onBack}
          aria-label="Kembali ke Dashboard"
        >
          <BackIcon size={20} />
        </button>
        <div className="feature-header-titles">
          <span className="badge-mini badge-orange">
            <Footprints size={12} /> Gerak & Langkah
          </span>
          <h2>Aktivitas Fisik & Pedometer</h2>
        </div>
        <button
          className="feature-info-btn"
          onClick={() =>
            onShowToast(
              `Target harian: ${targetSteps.toLocaleString('id-ID')} langkah. Target WHO: 7.000–10.000 langkah/hari untuk kesehatan jantung optimal.`
            )
          }
          title="Info Target Langkah"
        >
          <Info size={18} />
        </button>
      </div>

      <div className="feature-detail-content">
        {/* HERO 3D CHARACTER STAGE WITH PERIMETER OVERLAY HUD */}
        <div className="feature-hero-stage activity-theme">
          {/* Ambient Floor Shadow */}
          <div className="character-stage-shadow" />

          {/* 3D Character Looping Video - Blended seamlessly without black box */}
          <video
            className="character-stage-video"
            src="/character_running.mp4"
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Floating UI/UX Perimeter Overlay (Does not cover/touch character) */}
          <div className="stage-overlay-container">
            {/* Top Bar Overlay */}
            <div className="stage-overlay-top">
              <div className="overlay-pill-badge orange">
                <Footprints size={13} />
                <span>Gerak & Langkah</span>
              </div>
              <div className="overlay-live-indicator">
                <span className="live-video-dot orange" />
                <span>3D Motion Cadence</span>
              </div>
            </div>

            {/* Mid Flank Floating Metric Chips (Left & Right safe zones) */}
            <div className="stage-overlay-flanks">
              <div className="flank-glass-chip left">
                <div className="flank-chip-header">
                  <Footprints size={11} className="text-orange" />
                  <span>Langkah</span>
                </div>
                <div className="flank-chip-val text-orange">{totalSteps.toLocaleString('id-ID')}</div>
                <div className="flank-chip-sub">{stepPercent}% target</div>
              </div>

              <div className="flank-glass-chip right">
                <div className="flank-chip-header">
                  <Activity size={11} className="text-cyan" />
                  <span>Jarak</span>
                </div>
                <div className="flank-chip-val text-cyan">{distanceKm}</div>
                <div className="flank-chip-sub">kilometer</div>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="stage-overlay-bottom">
              <p className="stage-bottom-text">
                <strong>{totalSteps >= targetSteps ? 'Target Tercapai!' : `Level: ${tier.name}`}</strong> {stepPercent}% dari target {targetSteps.toLocaleString('id-ID')} langkah.
              </p>
              <button
                className="stage-cta-btn orange"
                onClick={onOpenActivityModal}
              >
                <Plus size={13} />
                <span>Catat Latihan</span>
              </button>
            </div>
          </div>
        </div>

        {/* QUICK STEP STATS BAR */}
        <div className="hero-quick-stats">
          <div className="h-stat-box">
            <span className="h-stat-label">Total Langkah</span>
            <span className="h-stat-num text-orange">{totalSteps.toLocaleString('id-ID')}</span>
            <span className="h-stat-unit">/ {targetSteps.toLocaleString('id-ID')}</span>
          </div>
          <div className="h-stat-box">
            <span className="h-stat-label">Jarak Tempuh</span>
            <span className="h-stat-num text-cyan">{distanceKm}</span>
            <span className="h-stat-unit">kilometer</span>
          </div>
          <div className="h-stat-box">
            <span className="h-stat-label">Kalori Terbakar</span>
            <span className="h-stat-num text-rose">{burnedCalories}</span>
            <span className="h-stat-unit">kkal aktif</span>
          </div>
        </div>

        {/* REAL-TIME PEDOMETER SENSOR CONTROLLER */}
        <StepCounter
          weightKg={data.user_profile.biometrics.weight_kg}
          heightCm={data.user_profile.biometrics.height_cm}
          onStepUpdate={onStepUpdate}
        />

        {/* HOURLY STEP DISTRIBUTION HISTOGRAM */}
        <div className="glass-card feature-step-chart-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-cyan">
                <Activity size={12} /> Distribusi Waktu
              </span>
              <h3>Aktivitas Langkah per Jam</h3>
            </div>
            <span className="badge-mini badge-green">{tier.badge}</span>
          </div>

          {/* SVG Step Histogram */}
          <div className="step-histogram-container">
            <svg viewBox="0 0 380 140" className="step-hist-svg">
              <defs>
                <linearGradient id="stepBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Grid line */}
              <line x1="20" y1="100" x2="360" y2="100" stroke="#E2E8F0" />

              {hourlySteps.map((d, i) => {
                const x = 30 + i * 27;
                const maxSteps = Math.max(100, ...hourlySteps.map((s) => s.steps));
                const barHeight = Math.min(80, (d.steps / maxSteps) * 80);
                const isSelected = activeHour === d.hour;

                return (
                  <g
                    key={d.hour}
                    className="hist-bar-group"
                    onClick={() => setActiveHour(d.hour)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x={x}
                      y={100 - barHeight}
                      width="16"
                      height={Math.max(4, barHeight)}
                      fill={isSelected ? '#F59E0B' : 'url(#stepBarGrad)'}
                      rx="4"
                    />
                    <text
                      x={x + 8}
                      y="118"
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94A3B8"
                      fontWeight="600"
                    >
                      {String(d.hour).padStart(2, '0')}
                    </text>
                  </g>
                );
              })}
            </svg>

            {activeHour !== null && (
              <div className="hist-tooltip-banner">
                <span>Pukul {String(activeHour).padStart(2, '0')}:00</span>
                <strong>
                  {hourlySteps.find((s) => s.hour === activeHour)?.steps || 0} Langkah Terhitung
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* CARDIO & HEART RATE ZONE TELEMETRY */}
        <div className="glass-card feature-cardio-zones-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-rose">
                <HeartPulse size={12} /> Zona Kardio
              </span>
              <h3>Intensitas Latihan Jantung (BPM)</h3>
            </div>
            <span className="target-hr-badge">
              Max HR: ~{220 - (data.user_profile.demographics?.age || 25)}
            </span>
          </div>

          <div className="cardio-zones-visual">
            <div className="c-zone-row">
              <div className="c-zone-info">
                <span className="c-z-pill z1">Z1 Pemulihan</span>
                <span className="c-z-range">{'< 115 BPM'}</span>
              </div>
              <div className="c-z-track">
                <div className="c-z-fill z1" style={{ width: '45%' }} />
              </div>
              <span className="c-z-mins">25 mnt</span>
            </div>

            <div className="c-zone-row">
              <div className="c-zone-info">
                <span className="c-z-pill z2">Z2 Fat Burn</span>
                <span className="c-z-range">115 - 134 BPM</span>
              </div>
              <div className="c-z-track">
                <div className="c-z-fill z2" style={{ width: '65%' }} />
              </div>
              <span className="c-z-mins">35 mnt</span>
            </div>

            <div className="c-zone-row">
              <div className="c-zone-info">
                <span className="c-z-pill z3">Z3 Aerobik</span>
                <span className="c-z-range">135 - 153 BPM</span>
              </div>
              <div className="c-z-track">
                <div className="c-z-fill z3" style={{ width: '30%' }} />
              </div>
              <span className="c-z-mins">15 mnt</span>
            </div>

            <div className="c-zone-row">
              <div className="c-zone-info">
                <span className="c-z-pill z4">Z4 Kardio</span>
                <span className="c-z-range">154 - 172 BPM</span>
              </div>
              <div className="c-z-track">
                <div className="c-z-fill z4" style={{ width: '15%' }} />
              </div>
              <span className="c-z-mins">8 mnt</span>
            </div>
          </div>
        </div>

        {/* WORKOUT LOGS LIST */}
        <div className="glass-card feature-workout-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-orange">
                <Flame size={12} /> Sesi Latihan
              </span>
              <h3>Riwayat Olahraga Hari Ini</h3>
            </div>
            <button
              className="btn-quick-add-food"
              onClick={onOpenActivityModal}
            >
              <Plus size={14} /> Catat Olahraga
            </button>
          </div>

          <div className="activity-cards-container">
            {data.activity_logs.length > 0 ? (
              data.activity_logs.map((act) => (
                <div key={act.activity_log_id} className="glass-card activity-full-card">
                  <div className="act-full-header">
                    <div className="act-type-info">
                      <span className="act-emoji-big">🏃</span>
                      <div>
                        <h4>{act.activity_type}</h4>
                        <span className="act-time-pill">{act.timestamp_start}</span>
                      </div>
                    </div>
                    <button
                      className="act-del-btn"
                      onClick={() => onDeleteActivity(act.activity_log_id)}
                      title="Hapus Sesi"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="act-metrics-trio">
                    <div className="act-m-box">
                      <span className="act-m-lbl">DURASI</span>
                      <strong className="act-m-val">{act.metrics.duration_minutes} mnt</strong>
                    </div>
                    <div className="act-m-box">
                      <span className="act-m-lbl">TERBAKAR</span>
                      <strong className="act-m-val color-fire">{act.metrics.calories_burned} kkal</strong>
                    </div>
                    <div className="act-m-box">
                      <span className="act-m-lbl">INTENSITAS</span>
                      <strong className="act-m-val text-cyan">{act.metrics.intensity_level}</strong>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="meal-empty-state">
                <Activity size={28} className="text-tertiary" />
                <p>Belum ada sesi latihan tercatat hari ini.</p>
                <button
                  className="btn-add-meal-empty"
                  onClick={onOpenActivityModal}
                >
                  <Plus size={14} /> Catat Latihan Pertama
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
