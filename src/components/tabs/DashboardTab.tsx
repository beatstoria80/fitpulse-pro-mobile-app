"use client";

import React from 'react';
import { AppFitnessData } from '../../types/fitness';
import { TabId } from '../layout/MobileBottomNav';

interface DashboardTabProps {
  data: AppFitnessData;
  remainingCalories: number;
  consumedCalories: number;
  burnedCalories: number;
  targetCalories: number;
  ringOffset: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  remainingWeightKg: string;
  waterIntake: number;
  targetWater: number;
  waterPercent: number;
  isCloudSync: boolean;
  onOpenProfileModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenFoodModal: () => void;
  onOpenActivityModal: () => void;
  onAddWater: (ml: number) => void;
  onUndoWater: () => void;
  onShowToast: (msg: string) => void;
  onNavigateTab: (tab: TabId) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  data,
  remainingCalories,
  consumedCalories,
  burnedCalories,
  targetCalories,
  ringOffset,
  totalProtein,
  totalCarbs,
  totalFat,
  remainingWeightKg,
  waterIntake,
  targetWater,
  waterPercent,
  isCloudSync,
  onOpenProfileModal,
  onOpenSupabaseModal,
  onOpenFoodModal,
  onOpenActivityModal,
  onAddWater,
  onUndoWater,
  onShowToast,
  onNavigateTab
}) => {
  return (
    <section className="tab-pane active" id="tabDashboard">
      {/* Header User Greeting */}
      <div className="user-greeting-card">
        <div className="greeting-info">
          <span className="greeting-sub">Kamis, 15 Oktober 2026</span>
          <h1 className="greeting-name">Halo, Pak {data.user_profile.name || 'Nandang'} 👋</h1>
          <div className="header-tags-row">
            <div className="bmi-pill-tag">
              <span className="status-dot warning"></span>
              <span>BMI {data.user_profile.biometrics.bmi} ({data.user_profile.biometrics.bmi_status})</span>
            </div>
            <button
              className="cloud-status-chip"
              onClick={onOpenSupabaseModal}
              title="Konfigurasi Supabase Cloud"
            >
              <i className={`fa-solid fa-cloud ${isCloudSync ? 'color-cyan' : ''}`}></i>
              <span>{isCloudSync ? 'Cloud Aktif' : 'Lokal'}</span>
            </button>
          </div>
        </div>
        <button
          className="avatar-btn"
          onClick={onOpenProfileModal}
          aria-label="Buka Profil"
        >
          <div className="avatar-circle">
            <span>ND</span>
          </div>
          <span className="avatar-edit-badge"><i className="fa-solid fa-pen"></i></span>
        </button>
      </div>

      {/* Hero: Calorie & Energy Balance Glass Card */}
      <div className="glass-card hero-energy-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <span className="badge-mini badge-cyan">Keseimbangan Energi</span>
            <h2>Target Kalori Harian</h2>
          </div>
          <button
            className="icon-action-btn"
            onClick={() => onShowToast('Target harian: 1.800 kkal untuk defisit penurunan berat badan sehat')}
            title="Penjelasan TDEE & BMR"
          >
            <i className="fa-solid fa-circle-info"></i>
          </button>
        </div>

        <div className="energy-visual-container">
          {/* Circular Animated Gauge */}
          <div className="circle-gauge-wrap">
            <svg className="progress-ring" width="180" height="180" viewBox="0 0 180 180">
              <defs>
                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F2FE" />
                  <stop offset="100%" stopColor="#4FACFE" />
                </linearGradient>
                <linearGradient id="burnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF512F" />
                  <stop offset="100%" stopColor="#DD2476" />
                </linearGradient>
              </defs>
              <circle className="ring-bg" cx="90" cy="90" r="76" strokeWidth="12" />
              <circle
                className="ring-progress"
                id="ringCalories"
                cx="90"
                cy="90"
                r="76"
                strokeWidth="12"
                strokeDasharray="477.5"
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="gauge-center-content">
              <span className="gauge-label">SISA HARI INI</span>
              <span className="gauge-value" id="valRemainingCalories">{remainingCalories.toLocaleString('id-ID')}</span>
              <span className="gauge-unit">kkal tersisa</span>
            </div>
          </div>

          {/* Side Metric Column */}
          <div className="energy-metrics-col">
            <div className="metric-mini-box intake" onClick={onOpenFoodModal} style={{ cursor: 'pointer' }}>
              <div className="metric-icon-wrap intake-icon">
                <i className="fa-solid fa-utensils"></i>
              </div>
              <div className="metric-data">
                <span className="metric-title">Makanan Masuk</span>
                <div className="metric-num"><strong>{consumedCalories}</strong> <small>/ {targetCalories} kkal</small></div>
              </div>
            </div>

            <div className="metric-mini-box burn" onClick={onOpenActivityModal} style={{ cursor: 'pointer' }}>
              <div className="metric-icon-wrap burn-icon">
                <i className="fa-solid fa-fire"></i>
              </div>
              <div className="metric-data">
                <span className="metric-title">Kalori Terbakar</span>
                <div className="metric-num"><strong>{burnedCalories}</strong> <small>kkal aktif</small></div>
              </div>
            </div>

            <div className="metric-mini-box net">
              <div className="metric-icon-wrap net-icon">
                <i className="fa-solid fa-shield-heart"></i>
              </div>
              <div className="metric-data">
                <span className="metric-title">BMR Alami</span>
                <div className="metric-num"><strong>~1.465</strong> <small>kkal / hari</small></div>
              </div>
            </div>
          </div>
        </div>

        {/* Macro Distribution Mini Bars */}
        <div className="macro-breakdown-row">
          <div className="macro-item">
            <div className="macro-labels">
              <span className="macro-name"><i className="fa-solid fa-drumstick-bite color-protein"></i> Protein</span>
              <span className="macro-qty">{totalProtein}g / 135g</span>
            </div>
            <div className="macro-bar-track">
              <div className="macro-bar-fill fill-protein" style={{ width: `${Math.min(100, Math.round((totalProtein / 135) * 100))}%` }}></div>
            </div>
          </div>

          <div className="macro-item">
            <div className="macro-labels">
              <span className="macro-name"><i className="fa-solid fa-bowl-rice color-carbs"></i> Karbohidrat</span>
              <span className="macro-qty">{totalCarbs}g / 180g</span>
            </div>
            <div className="macro-bar-track">
              <div className="macro-bar-fill fill-carbs" style={{ width: `${Math.min(100, Math.round((totalCarbs / 180) * 100))}%` }}></div>
            </div>
          </div>

          <div className="macro-item">
            <div className="macro-labels">
              <span className="macro-name"><i className="fa-solid fa-droplet color-fat"></i> Lemak</span>
              <span className="macro-qty">{totalFat}g / 50g</span>
            </div>
            <div className="macro-bar-track">
              <div className="macro-bar-fill fill-fat" style={{ width: `${Math.min(100, Math.round((totalFat / 50) * 100))}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress Duo: Weight & Waist Circumference Target Cards */}
      <div className="two-col-grid">
        {/* Weight Card */}
        <div className="glass-card stat-tile" onClick={onOpenProfileModal} style={{ cursor: 'pointer' }}>
          <div className="stat-tile-head">
            <div className="stat-icon-circle blue">
              <i className="fa-solid fa-weight-scale"></i>
            </div>
            <span className="badge-pill">Target -{remainingWeightKg} kg</span>
          </div>
          <div className="stat-tile-body">
            <div className="stat-big-num">
              <span>{data.user_profile.biometrics.weight_kg}</span>
              <small>kg</small>
            </div>
            <p className="stat-subtext">Target: <strong>{data.user_profile.fitness_goals.target_weight_kg} kg</strong></p>
            <div className="mini-progress-bar">
              <div className="progress-fill fill-blue" style={{ width: '25%' }}></div>
            </div>
            <span className="stat-footnote">Tinggi: {data.user_profile.biometrics.height_cm} cm • BMI {data.user_profile.biometrics.bmi}</span>
          </div>
        </div>

        {/* Waist Circumference Card (Lingkar Perut) */}
        <div className="glass-card stat-tile" onClick={onOpenProfileModal} style={{ cursor: 'pointer' }}>
          <div className="stat-tile-head">
            <div className="stat-icon-circle orange">
              <i className="fa-solid fa-ruler-horizontal"></i>
            </div>
            <span className="badge-pill">
              Target -{Math.max(0, (data.user_profile.biometrics.waist_circumference_cm || 88) - (data.user_profile.biometrics.target_waist_cm || 78)).toFixed(1)} cm
            </span>
          </div>
          <div className="stat-tile-body">
            <div className="stat-big-num">
              <span>{data.user_profile.biometrics.waist_circumference_cm || 88}</span>
              <small>cm</small>
            </div>
            <p className="stat-subtext">Target: <strong>{data.user_profile.biometrics.target_waist_cm || 78} cm</strong></p>
            <div className="mini-progress-bar">
              <div className="progress-fill fill-carbs" style={{ width: '35%' }}></div>
            </div>
            <span className="stat-footnote">
              Rasio WHtR: {(Number(data.user_profile.biometrics.waist_circumference_cm || 88) / data.user_profile.biometrics.height_cm).toFixed(2)} • Standar {data.user_profile.demographics.gender === 'male' ? '<90 cm' : '<80 cm'}
            </span>
          </div>
        </div>
      </div>

      {/* Body Fat & Health Status Strip */}
      <div className="glass-card stat-strip-tile" onClick={onOpenProfileModal} style={{ cursor: 'pointer', marginBottom: '16px' }}>
        <div className="stat-strip-content">
          <div className="stat-icon-circle purple">
            <i className="fa-solid fa-chart-pie"></i>
          </div>
          <div className="stat-strip-info">
            <div className="stat-strip-title-row">
              <span className="title">Est. Lemak Tubuh: <strong>{data.user_profile.biometrics.estimated_body_fat_percentage}%</strong></span>
              <span className="badge-pill">Target {data.user_profile.biometrics.target_body_fat_percentage}% (-{(data.user_profile.biometrics.estimated_body_fat_percentage - data.user_profile.biometrics.target_body_fat_percentage).toFixed(1)}%)</span>
            </div>
            <div className="mini-progress-bar">
              <div className="progress-fill fill-purple" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hydration Water Tracker Card */}
      <div className="glass-card water-tracker-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <span className="badge-mini badge-blue"><i className="fa-solid fa-glass-water"></i> Target Hidrasi</span>
            <h2>Asupan Air Minum</h2>
          </div>
          <span className="water-target-label">
            <strong>{waterIntake.toLocaleString('id-ID')}</strong> / {targetWater.toLocaleString('id-ID')} ml
          </span>
        </div>

        <div className="water-bar-container">
          <div className="water-level-track">
            <div className="water-level-fill" style={{ width: `${waterPercent}%` }}>
              <div className="water-bubble b1"></div>
              <div className="water-bubble b2"></div>
            </div>
          </div>
        </div>

        <div className="water-action-row">
          <button className="btn-water-quick" onClick={() => onAddWater(250)}>
            <i className="fa-solid fa-plus"></i> 250 ml (Gelas)
          </button>
          <button className="btn-water-quick" onClick={() => onAddWater(500)}>
            <i className="fa-solid fa-plus"></i> 500 ml (Botol)
          </button>
          <button className="btn-water-sub" onClick={onUndoWater} title="Kurangi 250 ml">
            <i className="fa-solid fa-rotate-left"></i>
          </button>
        </div>
      </div>

      {/* Today's Activities Preview */}
      <div className="section-title-row">
        <h3>Aktivitas Hari Ini ({data.activity_logs.reduce((s, a) => s + a.metrics.duration_minutes, 0)} mnt)</h3>
        <button className="text-link-btn" onClick={() => onNavigateTab('tabActivities')}>
          Lihat Semua <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <div className="recent-activities-stack">
        {data.activity_logs.slice(0, 2).map((act) => (
          <div key={act.activity_log_id} className="activity-item-card">
            <div className="act-icon-box">
              {act.activity_type.toLowerCase().includes('skate') ? '🛹' : '🏃'}
            </div>
            <div className="act-details">
              <div className="act-title-row">
                <h4>{act.activity_type}</h4>
                <span className="act-burn-tag">+{act.metrics.calories_burned} kkal</span>
              </div>
              <div className="act-sub-row">
                <span><i className="fa-regular fa-clock"></i> {act.metrics.duration_minutes} Menit</span>
                <span>•</span>
                <span>{act.metrics.intensity_level}</span>
                {act.metrics.average_heart_rate ? (
                  <>
                    <span>•</span>
                    <span className="color-rose"><i className="fa-solid fa-heart-pulse"></i> {act.metrics.average_heart_rate} bpm</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Health Insights for Nandang */}
      <div className="glass-card ai-insight-card">
        <div className="ai-header">
          <div className="ai-sparkle">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h4 className="ai-title">FitPulse AI • Rekomendasi Hari Ini</h4>
            <span className="ai-sub">Dipersonalisasi untuk Usia 46 Tahun</span>
          </div>
        </div>
        <div className="ai-content-box">
          <p>✅ <strong>Skateboard (45 mnt)</strong> melatih otot keseimbangan (<em>core</em>) secara impresif! Karena intensitasnya medium (HR 125 bpm), pastikan lakukan <em>stretching</em> pada pergelangan kaki dan lutut.</p>
          <p>🥩 Sarapan tinggi protein sudah sangat tepat untuk mempertahankan massa otot. Anda masih punya sisa <strong>{remainingCalories.toLocaleString('id-ID')} kkal</strong> untuk makan siang dan malam.</p>
        </div>
      </div>
    </section>
  );
};
