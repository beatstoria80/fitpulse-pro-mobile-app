"use client";

import React, { useMemo } from 'react';
import {
  Droplet,
  Plus,
  RotateCcw,
  Info,
  CheckCircle2,
  Sparkles,
  Clock,
  HeartPulse,
  Flame,
  Award,
} from 'lucide-react';
import { BackIcon } from '../icons/FeatureIcons';

interface HydrationDetailViewProps {
  waterIntake: number;
  targetWater: number;
  onAddWater: (ml: number) => void;
  onUndoWater: () => void;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export default function HydrationDetailView({
  waterIntake,
  targetWater,
  onAddWater,
  onUndoWater,
  onBack,
  onShowToast,
}: HydrationDetailViewProps) {
  const waterPercent = Math.min(100, Math.round((waterIntake / (targetWater || 2000)) * 100));
  const remainingWater = Math.max(0, targetWater - waterIntake);

  // Status calculation
  const statusInfo = useMemo(() => {
    if (waterPercent >= 100) {
      return { label: 'Target Tercapai!', color: 'text-green-500', note: 'Hidrasi sempurna' };
    } else if (waterPercent >= 75) {
      return { label: 'Hidrasi Prima', color: 'text-cyan-500', note: 'Hampir selesai' };
    } else if (waterPercent >= 40) {
      return { label: 'Cukup Baik', color: 'text-blue-500', note: 'Lanjutkan asupan' };
    }
    return { label: 'Perlu Minum', color: 'text-amber-500', note: 'Tingkatkan asupan' };
  }, [waterPercent]);

  // Daily 8-glass smart timeline schedule
  const scheduleSlots = useMemo(() => [
    { time: '07:00', label: 'Bangun Tidur', amount: 250, desc: 'Aktifkan metabolisme pagi' },
    { time: '09:00', label: 'Mulai Bekerja', amount: 250, desc: 'Fokus & konsentrasi otak' },
    { time: '11:30', label: 'Sebelum Makan Siang', amount: 250, desc: 'Optimalkan sistem cerna' },
    { time: '14:00', label: 'Fokus Siang', amount: 250, desc: 'Cegah lelah & kantuk' },
    { time: '16:30', label: 'Sore / Pra-Workout', amount: 250, desc: 'Dukung daya tahan otot' },
    { time: '18:30', label: 'Sebelum Makan Malam', amount: 250, desc: 'Bantu rasa kenyang terkontrol' },
    { time: '20:30', label: 'Santai Malam', amount: 250, desc: 'Relaksasi tubuh & sirkulasi' },
    { time: '22:00', label: 'Sebelum Tidur', amount: 250, desc: 'Cegah kram & dehidrasi malam' },
  ], []);

  // Compute how many glasses are completed based on total waterIntake
  const completedGlassesCount = Math.floor(waterIntake / 250);

  return (
    <div className="feature-detail-page hydration-detail-page">
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
          <span className="badge-mini badge-blue">
            <Droplet size={12} /> Analitik Hidrasi
          </span>
          <h2>Keseimbangan Cairan & Elektrolit</h2>
        </div>
        <button
          className="feature-info-btn"
          onClick={() =>
            onShowToast(
              `Target harian Anda: ${targetWater.toLocaleString('id-ID')} ml. Kebutuhan air ideal rata-rata: 35 ml per kg berat badan.`
            )
          }
          title="Info Sains Hidrasi"
        >
          <Info size={18} />
        </button>
      </div>

      <div className="feature-detail-content">
        {/* HERO 3D CHARACTER STAGE WITH PERIMETER OVERLAY HUD */}
        <div className="feature-hero-stage hydration-theme">
          {/* Ambient Floor Shadow */}
          <div className="character-stage-shadow" />

          {/* 3D Character Looping Video - Drinking Animation */}
          <video
            className="character-stage-video"
            src="/character_drinking_water.mp4"
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Floating UI/UX Perimeter Overlay */}
          <div className="stage-overlay-container">
            {/* Top Bar Overlay */}
            <div className="stage-overlay-top">
              <div className="overlay-pill-badge blue">
                <Droplet size={13} />
                <span>Asupan Air Minum</span>
              </div>
              <div className="overlay-live-indicator blue">
                <span className="live-video-dot blue" />
                <span>3D Hydration Coach</span>
              </div>
            </div>

            {/* Mid Flank Floating Metric Chips */}
            <div className="stage-overlay-flanks">
              <div className="flank-glass-chip left">
                <div className="flank-chip-header">
                  <Droplet size={11} className="text-blue" />
                  <span>Asupan</span>
                </div>
                <div className="flank-chip-val text-blue">{waterIntake.toLocaleString('id-ID')} ml</div>
                <div className="flank-chip-sub">{waterPercent}% tercapai</div>
              </div>

              <div className="flank-glass-chip right">
                <div className="flank-chip-header">
                  <CheckCircle2 size={11} className="text-blue" />
                  <span>Status</span>
                </div>
                <div className="flank-chip-val text-blue">{statusInfo.label}</div>
                <div className="flank-chip-sub">
                  {remainingWater > 0 ? `-${remainingWater.toLocaleString('id-ID')} ml lagi` : 'Sempurna'}
                </div>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="stage-overlay-bottom">
              <p className="stage-bottom-text">
                <strong>{remainingWater <= 0 ? 'Target Tercapai!' : `Sisa ${remainingWater.toLocaleString('id-ID')} ml`}</strong> {waterPercent}% dari target {targetWater.toLocaleString('id-ID')} ml.
              </p>
              <button
                className="stage-cta-btn cyan"
                onClick={() => onAddWater(250)}
              >
                <Plus size={13} />
                <span>+250 ml</span>
              </button>
            </div>
          </div>
        </div>

        {/* INTERACTIVE HYDRATION TANK CARD */}
        <div className="glass-card stat-tile hydration-tank-card">
          <div className="stat-tile-head">
            <div className="stat-icon-circle blue">
              <Droplet size={20} />
            </div>
            <span className="badge-pill">
              {waterPercent >= 100 ? 'Target Tercapai!' : `${waterPercent}% Terpenuhi`}
            </span>
          </div>

          <div className="hydration-tank-body">
            <div className="water-tank-visual">
              <div className="tank-glass-container">
                <div
                  className="tank-water-fluid"
                  style={{ height: `${Math.max(8, waterPercent)}%` }}
                >
                  <div className="water-wave-anim" />
                  <div className="water-bubble b1" />
                  <div className="water-bubble b2" />
                  <div className="water-bubble b3" />
                </div>
                <div className="tank-graduations">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                </div>
              </div>
            </div>

            <div className="tank-info-col">
              <div className="tank-big-number">
                <span>{waterIntake.toLocaleString('id-ID')}</span>
                <small>/ {targetWater.toLocaleString('id-ID')} ml</small>
              </div>
              <p className="tank-description">
                {remainingWater > 0
                  ? `Dibutuhkan sekitar ${Math.ceil(remainingWater / 250)} gelas lagi untuk mencapai hidrasi optimal hari ini.`
                  : 'Luar biasa! Target hidrasi tubuh Anda hari ini telah terpenuhi secara penuh.'}
              </p>

              {/* Quick Log Buttons Row */}
              <div className="tank-log-actions">
                <button
                  className="btn-water-quick primary"
                  onClick={() => onAddWater(250)}
                >
                  <Plus size={14} /> +250 ml (Gelas)
                </button>
                <button
                  className="btn-water-quick"
                  onClick={() => onAddWater(500)}
                >
                  <Plus size={14} /> +500 ml (Botol)
                </button>
                <button
                  className="btn-water-sub"
                  onClick={onUndoWater}
                  title="Batalkan / Kurangi 250 ml"
                  disabled={waterIntake <= 0}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SCHEDULE: 8 GELAS SEHARI (SMART TIMELINE) */}
        <div className="glass-card hydration-schedule-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-blue">
                <Clock size={12} /> Rutinitas Ideal
              </span>
              <h3>Jadwal 8 Gelas Air Sehari</h3>
            </div>
            <span className="text-xs text-secondary">
              {Math.min(8, completedGlassesCount)} / 8 Gelas
            </span>
          </div>

          <div className="schedule-timeline-grid">
            {scheduleSlots.map((slot, index) => {
              const isDone = index < completedGlassesCount;
              return (
                <div
                  key={index}
                  className={`schedule-slot-item ${isDone ? 'done' : ''}`}
                  onClick={() => {
                    if (!isDone) {
                      onAddWater(slot.amount);
                      onShowToast(`Ditambahkan +${slot.amount} ml (${slot.label})`);
                    }
                  }}
                  style={{ cursor: isDone ? 'default' : 'pointer' }}
                >
                  <div className="slot-check-icon">
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-blue" />
                    ) : (
                      <span className="slot-circle-empty">{index + 1}</span>
                    )}
                  </div>
                  <div className="slot-info">
                    <div className="slot-head">
                      <span className="slot-time">{slot.time}</span>
                      <span className="slot-label">{slot.label}</span>
                    </div>
                    <span className="slot-desc">{slot.desc}</span>
                  </div>
                  <span className="slot-amount">{slot.amount} ml</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SCIENTIFIC BENEFITS & HYDRATION IMPACT */}
        <div className="glass-card hydration-science-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-blue">
                <Sparkles size={12} /> Sains Kebugaran
              </span>
              <h3>Mengapa Hidrasi Sangat Krusial?</h3>
            </div>
          </div>

          <div className="science-benefits-list">
            <div className="benefit-item">
              <div className="benefit-icon-box orange">
                <Flame size={16} />
              </div>
              <div className="benefit-text">
                <strong>Dongkrak Metabolisme Kalori</strong>
                <p>
                  Minum 500 ml air dapat meningkatkan laju metabolisme basal hingga 30% selama 30–40 menit berikutnya.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box rose">
                <HeartPulse size={16} />
              </div>
              <div className="benefit-text">
                <strong>Dukungan Sirkulasi & Tekanan Darah</strong>
                <p>
                  Volume darah yang cukup meringankan kerja jantung saat memompa oksigen ke seluruh sel tubuh.
                </p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-box blue">
                <Award size={16} />
              </div>
              <div className="benefit-text">
                <strong>Ketahanan Otot & Cegah Kram</strong>
                <p>
                  Dehidrasi ringan (2% cairan tubuh) dapat menurunkan performa fisik dan daya fokus hingga 15%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
