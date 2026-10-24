"use client";

import React from 'react';
import {
  Cloud,
  Edit3,
  Info,
  Utensils,
  Flame,
  Activity,
  Apple,
  Droplet,
  Scale,
  PieChart,
  Plus,
  RotateCcw,
  ChevronRight,
  FolderOpen,
  Sparkles,
  Clock,
  HeartPulse,
} from 'lucide-react';
import { AppFitnessData } from '../../types/fitness';

interface DashboardTabProps {
  data: AppFitnessData;
  dashboardVfxActive: boolean;
  todayFormatted: string;
  isCloudSync: boolean;
  ringAnimated: boolean;
  openingComplete: boolean;
  ringOffset: number;
  targetCalories: number;
  consumedCalories: number;
  burnedCalories: number;
  remainingCalories: number;
  bmrValue: number;
  totalProtein: number;
  proteinTarget: number;
  totalCarbs: number;
  carbsTarget: number;
  totalFat: number;
  fatTarget: number;
  remainingWeightKg: string;
  weightProgressPercent: number;
  bodyFatProgressPercent: number;
  waterIntake: number;
  targetWater: number;
  waterPercent: number;
  hasProfile: boolean;
  hasActivities: boolean;
  hasNutrition: boolean;
  onOpenProfile: () => void;
  onOpenSupabase: () => void;
  onOpenFood: () => void;
  onOpenActivity: () => void;
  onAddWater: (ml: number) => void;
  onUndoWater: () => void;
  onNavigateToActivities: () => void;
  onShowToast: (msg: string) => void;
  onOpenEnergyDetail?: () => void;
  onOpenNutritionDetail?: () => void;
  onOpenActivityDetail?: () => void;
  onOpenHydrationDetail?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  data,
  dashboardVfxActive,
  todayFormatted,
  isCloudSync,
  ringAnimated,
  openingComplete,
  ringOffset,
  targetCalories,
  consumedCalories,
  burnedCalories,
  remainingCalories,
  bmrValue,
  totalProtein,
  proteinTarget,
  totalCarbs,
  carbsTarget,
  totalFat,
  fatTarget,
  remainingWeightKg,
  weightProgressPercent,
  bodyFatProgressPercent,
  waterIntake,
  targetWater,
  waterPercent,
  hasProfile,
  hasActivities,
  hasNutrition,
  onOpenProfile,
  onOpenSupabase,
  onOpenFood,
  onOpenActivity,
  onAddWater,
  onUndoWater,
  onNavigateToActivities,
  onShowToast,
  onOpenEnergyDetail,
  onOpenNutritionDetail,
  onOpenActivityDetail,
  onOpenHydrationDetail,
}) => {
  const userInitials = (data.user_profile.name || 'ND')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'FP';

  return (
    <section className="tab-pane active" id="tabDashboard">
      {/* Header User Greeting */}
      <div className={`user-greeting-card${dashboardVfxActive ? ' stagger-reveal delay-1' : ''}`}>
        <div className="greeting-info">
          <span className="greeting-sub">{todayFormatted}</span>
          <h1 className="greeting-name">Halo, {data.user_profile.name || 'Pengguna'}</h1>
          <div className="header-tags-row">
            <div className="bmi-pill-tag">
              <span className="status-dot warning" />
              <span>
                BMI {data.user_profile.biometrics.bmi} ({data.user_profile.biometrics.bmi_status})
              </span>
            </div>
            <button
              className="cloud-status-chip"
              onClick={onOpenSupabase}
              title="Konfigurasi Supabase Cloud"
            >
              <Cloud size={13} className={isCloudSync ? 'color-cyan' : ''} />
              <span>{isCloudSync ? 'Cloud Aktif' : 'Lokal'}</span>
            </button>
          </div>
        </div>
        <button className="avatar-btn" onClick={onOpenProfile} aria-label="Buka Profil">
          <div className="avatar-circle">
            <span>{userInitials}</span>
          </div>
          <span className="avatar-edit-badge">
            <Edit3 size={11} />
          </span>
        </button>
      </div>

      {/* Hero: Calorie & Energy Balance Glass Card */}
      <div className={`glass-card hero-energy-card${dashboardVfxActive ? ' stagger-reveal delay-2' : ''}`}>
        <div className="card-header-clean">
          <div
            className="card-title-group clickable-header-title"
            onClick={onOpenEnergyDetail}
            title="Klik untuk membuka Halaman Analitik & Karakter 3D Kalori"
          >
            <span className="badge-mini badge-cyan">Keseimbangan Energi</span>
            <div className="title-with-arrow">
              <h2>Target Kalori Harian</h2>
              <ChevronRight size={17} className="text-secondary" />
            </div>
          </div>
          <button
            className="icon-action-btn"
            onClick={() =>
              onShowToast(
                `Target harian: ${targetCalories > 0 ? targetCalories.toLocaleString('id-ID') : '—'} kkal | BMR: ${bmrValue.toLocaleString('id-ID')} kkal`
              )
            }
            title="Penjelasan TDEE & BMR"
          >
            <Info size={16} />
          </button>
        </div>

        <div className="energy-visual-container">
          {/* Circular Animated Gauge (Clickable to Energy Detail) */}
          <div
            className="circle-gauge-wrap clickable-gauge-link"
            onClick={onOpenEnergyDetail}
            title="Klik untuk membuka Halaman Analitik Kalori"
          >
            <svg className="progress-ring" width="180" height="180" viewBox="0 0 180 180">
              <defs>
                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
                <linearGradient id="burnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EA580C" />
                  <stop offset="100%" stopColor="#F97316" />
                </linearGradient>
              </defs>
              <circle className="ring-bg" cx="90" cy="90" r="76" strokeWidth="12" />
              <circle
                className={`ring-progress${openingComplete && !ringAnimated ? ' ring-animate-in' : ''}`}
                id="ringCalories"
                cx="90"
                cy="90"
                r="76"
                strokeWidth="12"
                strokeDasharray="477.5"
                strokeDashoffset={ringAnimated ? ringOffset : 477.5}
              />
            </svg>
            <div className="gauge-center-content">
              <span className="gauge-label">SISA HARI INI</span>
              <span className="gauge-value" id="valRemainingCalories">
                {remainingCalories.toLocaleString('id-ID')}
              </span>
              <span className="gauge-unit">kkal tersisa</span>
            </div>
          </div>

          {/* Side Metric Column */}
          <div className="energy-metrics-col">
            <div
              className="metric-mini-box intake"
              onClick={onOpenNutritionDetail || onOpenFood}
              style={{ cursor: 'pointer' }}
              title="Klik untuk membuka Halaman Detail Nutrisi & Makanan"
            >
              <div className="metric-icon-wrap intake-icon">
                <Utensils size={18} />
              </div>
              <div className="metric-data">
                <span className="metric-title">Makanan Masuk</span>
                <div className="metric-num">
                  <strong>{consumedCalories}</strong> <small>/ {targetCalories} kkal</small>
                </div>
              </div>
            </div>

            <div
              className="metric-mini-box burn"
              onClick={onOpenActivityDetail || onOpenActivity}
              style={{ cursor: 'pointer' }}
              title="Klik untuk membuka Halaman Detail Aktivitas & Langkah"
            >
              <div className="metric-icon-wrap burn-icon">
                <Flame size={18} />
              </div>
              <div className="metric-data">
                <span className="metric-title">Kalori Terbakar</span>
                <div className="metric-num">
                  <strong>{burnedCalories}</strong> <small>kkal aktif</small>
                </div>
              </div>
            </div>

            <div
              className="metric-mini-box net"
              onClick={onOpenEnergyDetail}
              style={{ cursor: 'pointer' }}
              title="Klik untuk melihat rincian BMR & TDEE"
            >
              <div className="metric-icon-wrap net-icon">
                <Activity size={18} />
              </div>
              <div className="metric-data">
                <span className="metric-title">BMR Alami</span>
                <div className="metric-num">
                  <strong>{hasProfile ? `~${bmrValue.toLocaleString('id-ID')}` : '—'}</strong>{' '}
                  <small>kkal / hari</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Macro Distribution Mini Bars (Clickable to Nutrition Detail) */}
        <div
          className={`macro-breakdown-row clickable-macro-preview${dashboardVfxActive ? ' stagger-reveal delay-4' : ''}`}
          onClick={onOpenNutritionDetail}
          style={{ cursor: 'pointer' }}
          title="Klik untuk membuka Halaman Detail Nutrisi & Makronutrien"
        >
          <div className="macro-item">
            <div className="macro-labels">
              <span className="macro-name">
                <Utensils size={13} className="color-protein" /> Protein
              </span>
              <span className="macro-qty">
                {totalProtein}g / {proteinTarget}g
              </span>
            </div>
            <div className="macro-bar-track">
              <div
                className="macro-bar-fill fill-protein"
                style={{
                  width: `${proteinTarget > 0 ? Math.min(100, Math.round((totalProtein / proteinTarget) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="macro-item">
            <div className="macro-labels">
              <span className="macro-name">
                <Apple size={13} className="color-carbs" /> Karbohidrat
              </span>
              <span className="macro-qty">
                {totalCarbs}g / {carbsTarget}g
              </span>
            </div>
            <div className="macro-bar-track">
              <div
                className="macro-bar-fill fill-carbs"
                style={{
                  width: `${carbsTarget > 0 ? Math.min(100, Math.round((totalCarbs / carbsTarget) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="macro-item">
            <div className="macro-labels">
              <span className="macro-name">
                <Droplet size={13} className="color-fat" /> Lemak
              </span>
              <span className="macro-qty">
                {totalFat}g / {fatTarget}g
              </span>
            </div>
            <div className="macro-bar-track">
              <div
                className="macro-bar-fill fill-fat"
                style={{
                  width: `${fatTarget > 0 ? Math.min(100, Math.round((totalFat / fatTarget) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress Duo: Weight & Body Fat Target Cards */}
      <div className={`two-col-grid${dashboardVfxActive ? ' stagger-reveal delay-3' : ''}`}>
        {/* Weight Card */}
        <div className="glass-card stat-tile" onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
          <div className="stat-tile-head">
            <div className="stat-icon-circle blue">
              <Scale size={18} />
            </div>
            <span className="badge-pill">Target -{remainingWeightKg} kg</span>
          </div>
          <div className="stat-tile-body">
            <div className="stat-big-num">
              <span>{data.user_profile.biometrics.weight_kg}</span>
              <small>kg</small>
            </div>
            <p className="stat-subtext">
              Target: <strong>{data.user_profile.fitness_goals.target_weight_kg} kg</strong>
            </p>
            <div className="mini-progress-bar">
              <div className="progress-fill fill-blue" style={{ width: `${weightProgressPercent}%` }} />
            </div>
            <span className="stat-footnote">
              Tinggi: {data.user_profile.biometrics.height_cm} cm • BMI {data.user_profile.biometrics.bmi}
            </span>
          </div>
        </div>

        {/* Body Fat Card */}
        <div className="glass-card stat-tile" onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
          <div className="stat-tile-head">
            <div className="stat-icon-circle purple">
              <PieChart size={18} />
            </div>
            <span className="badge-pill">Target {data.user_profile.biometrics.target_body_fat_percentage}%</span>
          </div>
          <div className="stat-tile-body">
            <div className="stat-big-num">
              <span>{data.user_profile.biometrics.estimated_body_fat_percentage}</span>
              <small>%</small>
            </div>
            <p className="stat-subtext">Est. Lemak Tubuh</p>
            <div className="mini-progress-bar">
              <div className="progress-fill fill-purple" style={{ width: `${bodyFatProgressPercent}%` }} />
            </div>
            <span className="stat-footnote">
              Selisih:{' '}
              <strong>
                -
                {(
                  data.user_profile.biometrics.estimated_body_fat_percentage -
                  data.user_profile.biometrics.target_body_fat_percentage
                ).toFixed(1)}
                %
              </strong>{' '}
              lagi
            </span>
          </div>
        </div>
      </div>

      {/* Hydration Water Tracker Card (Clickable to 3D Hydration Detail) */}
      <div className={`glass-card water-tracker-card${dashboardVfxActive ? ' stagger-reveal delay-5' : ''}`}>
        <div
          className="card-header-clean"
          onClick={onOpenHydrationDetail}
          style={{ cursor: onOpenHydrationDetail ? 'pointer' : 'default' }}
          title="Klik untuk membuka Halaman Detail Hidrasi 3D"
        >
          <div className="card-title-group">
            <span className="badge-mini badge-blue">
              <Droplet size={13} /> Target Hidrasi
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h2>Asupan Air Minum</h2>
              {onOpenHydrationDetail && <ChevronRight size={15} className="text-secondary" />}
            </div>
          </div>
          <span className="water-target-label">
            <strong>{waterIntake.toLocaleString('id-ID')}</strong> / {targetWater.toLocaleString('id-ID')} ml
          </span>
        </div>

        <div className="water-bar-container">
          <div className="water-level-track">
            <div className="water-level-fill" style={{ width: `${waterPercent}%` }}>
              <div className="water-bubble b1" />
              <div className="water-bubble b2" />
            </div>
          </div>
        </div>

        <div className="water-action-row">
          <button className="btn-water-quick" onClick={() => onAddWater(250)}>
            <Plus size={14} /> 250 ml (Gelas)
          </button>
          <button className="btn-water-quick" onClick={() => onAddWater(500)}>
            <Plus size={14} /> 500 ml (Botol)
          </button>
          <button className="btn-water-sub" onClick={onUndoWater} title="Kurangi 250 ml">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Today's Activities Preview */}
      <div className="section-title-row">
        <h3
          onClick={onOpenActivityDetail}
          style={{ cursor: 'pointer' }}
          title="Klik untuk membuka Halaman Detail Aktivitas & Pedometer"
        >
          Aktivitas Hari Ini ({data.activity_logs.reduce((s, a) => s + a.metrics.duration_minutes, 0)} mnt)
        </h3>
        <button className="text-link-btn" onClick={onOpenActivityDetail || onNavigateToActivities}>
          Detail 3D <ChevronRight size={14} />
        </button>
      </div>

      <div className="recent-activities-stack">
        {hasActivities ? (
          data.activity_logs.slice(0, 2).map((act) => (
            <div key={act.activity_log_id} className="activity-item-card">
              <div className="act-icon-box">
                {act.activity_type.toLowerCase().includes('skate')
                  ? '🛹'
                  : act.activity_type.toLowerCase().includes('walk')
                  ? '🚶'
                  : act.activity_type.toLowerCase().includes('sepeda') ||
                    act.activity_type.toLowerCase().includes('cycling')
                  ? '🚴'
                  : act.activity_type.toLowerCase().includes('renang') ||
                    act.activity_type.toLowerCase().includes('swim')
                  ? '🏊'
                  : act.activity_type.toLowerCase().includes('beban') ||
                    act.activity_type.toLowerCase().includes('gym')
                  ? '🏋️'
                  : '🏃'}
              </div>
              <div className="act-details">
                <div className="act-title-row">
                  <h4>{act.activity_type}</h4>
                  <span className="act-burn-tag">+{act.metrics.calories_burned} kkal</span>
                </div>
                <div className="act-sub-row">
                  <span>
                    <Clock size={12} /> {act.metrics.duration_minutes} Menit
                  </span>
                  <span>•</span>
                  <span>{act.metrics.intensity_level}</span>
                  {act.metrics.average_heart_rate ? (
                    <>
                      <span>•</span>
                      <span className="color-rose">
                        <HeartPulse size={12} /> {act.metrics.average_heart_rate} bpm
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-card">
            <FolderOpen size={24} />
            <p>Belum ada aktivitas hari ini</p>
            <button
              className="btn-primary-add"
              onClick={onOpenActivity}
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              <Plus size={14} /> Catat Aktivitas Pertama
            </button>
          </div>
        )}
      </div>

      {/* AI Health Insights — Data-Driven */}
      <div className="glass-card ai-insight-card">
        <div className="ai-header">
          <div className="ai-sparkle">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="ai-title">FitPulse AI • Rekomendasi Hari Ini</h4>
            <span className="ai-sub">Dipersonalisasi untuk Usia {data.user_profile.demographics.age} Tahun</span>
          </div>
        </div>
        <div className="ai-content-box">
          {hasActivities ? (
            <p>
              ✅{' '}
              <strong>
                {data.activity_logs[0].activity_type} ({data.activity_logs[0].metrics.duration_minutes} mnt)
              </strong>{' '}
              membakar <strong>{data.activity_logs[0].metrics.calories_burned} kkal</strong> dengan intensitas{' '}
              {data.activity_logs[0].metrics.intensity_level}
              {data.activity_logs[0].metrics.average_heart_rate
                ? ` (HR ${data.activity_logs[0].metrics.average_heart_rate} bpm)`
                : ''}
              . Pastikan lakukan <em>stretching</em> setelah latihan.
            </p>
          ) : (
            <p>
              💪 Belum ada aktivitas hari ini. Mulai dengan olahraga ringan 30 menit untuk membakar kalori dan menjaga
              metabolisme Anda.
            </p>
          )}
          {hasNutrition ? (
            <p>
              🥩 Total asupan <strong>{consumedCalories.toLocaleString('id-ID')} kkal</strong> (Protein: {totalProtein}
              g). Anda masih punya sisa <strong>{remainingCalories.toLocaleString('id-ID')} kkal</strong> untuk sisa
              hari ini.
            </p>
          ) : (
            <p>
              🍽️ Belum ada catatan makanan hari ini. Catat asupan untuk memantau target kalori harian (
              {targetCalories > 0 ? `${targetCalories.toLocaleString('id-ID')} kkal` : 'belum diatur'}).
            </p>
          )}
          {hasProfile && bmrValue > 0 && (
            <p>
              📊 BMR Anda: <strong>{bmrValue.toLocaleString('id-ID')} kkal/hari</strong>. Target defisit sehat:{' '}
              {targetCalories > 0 ? `${(bmrValue - targetCalories).toLocaleString('id-ID')} kkal/hari` : 'belum dihitung'}
              .
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardTab;
