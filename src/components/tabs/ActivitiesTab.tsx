"use client";

import React, { useState } from 'react';
import {
  Plus,
  Activity,
  Smartphone,
  Trash2,
  FolderOpen,
  HeartPulse,
  Camera,
  TrendingUp,
} from 'lucide-react';
import { AppFitnessData, HeartRateLog, BloodPressureLog } from '../../types/fitness';
import HeartRateMonitor from '../HeartRateMonitor';
import BloodPressureMonitor from '../BloodPressureMonitor';
import StepCounter from '../StepCounter';
import { HeartRatePPG } from '../../lib/heartRatePPG';

import { WatchIcon } from '../icons/FeatureIcons';

interface ActivitiesTabProps {
  data: AppFitnessData;
  burnedCalories: number;
  totalSteps: number;
  onOpenActivityModal: () => void;
  onDeleteActivity: (id: string) => void;
  onStepUpdate: (steps: number, calories: number, distance: number) => void;
  onHeartRateComplete: (bpm: number, confidence: number) => void;
  onSaveHeartRate: (log: HeartRateLog) => void;
  onDeleteHeartRate: (id: string) => void;
  onSaveBloodPressure: (log: BloodPressureLog) => void;
  onDeleteBloodPressure: (id: string) => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  data,
  burnedCalories,
  totalSteps,
  onOpenActivityModal,
  onDeleteActivity,
  onStepUpdate,
  onHeartRateComplete,
  onSaveHeartRate,
  onDeleteHeartRate,
  onSaveBloodPressure,
  onDeleteBloodPressure,
}) => {
  const [activeVitalsTab, setActiveVitalsTab] = useState<'blood_pressure' | 'heart_rate'>('blood_pressure');
  const hrLogs = data.heart_rate_logs || [];
  const bpLogs = data.blood_pressure_logs || [];
  const avgHeartRate =
    hrLogs.length > 0 ? Math.round(hrLogs.reduce((s, h) => s + h.bpm, 0) / hrLogs.length) : 0;
  const minHeartRate = hrLogs.length > 0 ? Math.min(...hrLogs.map((h) => h.bpm)) : 0;
  const maxHeartRate = hrLogs.length > 0 ? Math.max(...hrLogs.map((h) => h.bpm)) : 0;

  const getMethodBadge = (method: HeartRateLog['method']) => {
    switch (method) {
      case 'camera_ppg':
        return { icon: <Camera size={12} />, label: 'Kamera AI' };
      case 'tactile_tap':
        return { icon: <HeartPulse size={12} />, label: 'Ketuk Nadi' };
      case 'ble_watch':
        return { icon: <WatchIcon size={12} />, label: 'Smartwatch' };
      default:
        return { icon: <Activity size={12} />, label: 'Manual' };
    }
  };

  return (
    <section className="tab-pane active" id="tabActivities">
      <div className="pane-header">
        <div>
          <span className="badge-mini badge-green">Latihan & Kardio</span>
          <h1 className="pane-title">Aktivitas Fisik</h1>
        </div>
        <button className="btn-primary-add" onClick={onOpenActivityModal}>
          <Plus size={14} /> Catat Latihan
        </button>
      </div>

      {/* Summary Banner */}
      <div className="glass-card workout-summary-banner">
        <div className="summary-stat-box">
          <span className="summary-val">
            {data.activity_logs.reduce((s, a) => s + a.metrics.duration_minutes, 0)}
          </span>
          <span className="summary-lbl">Menit Total</span>
        </div>
        <div className="stat-divider" />
        <div className="summary-stat-box">
          <span className="summary-val color-fire">{burnedCalories}</span>
          <span className="summary-lbl">Kkal Terbakar</span>
        </div>
        <div className="stat-divider" />
        <div className="summary-stat-box">
          <span className="summary-val">{totalSteps > 0 ? totalSteps.toLocaleString('id-ID') : '0'}</span>
          <span className="summary-lbl">Langkah Kaki</span>
        </div>
      </div>

      {/* Real-Time Sensor Section Header */}
      <div className="sensor-section-header">
        <h3>
          <Activity size={16} /> Sensor & Vitals Real-Time
        </h3>
        <span className="sensor-live-badge">
          <span className="live-dot" /> LIVE
        </span>
      </div>

      {/* Vitals Segment Switcher */}
      <div className="vitals-segment-control">
        <button
          className={`vitals-segment-btn ${activeVitalsTab === 'blood_pressure' ? 'active' : ''}`}
          onClick={() => setActiveVitalsTab('blood_pressure')}
        >
          <Activity size={14} /> Tekanan Darah ({bpLogs.length})
        </button>
        <button
          className={`vitals-segment-btn hr-mode ${activeVitalsTab === 'heart_rate' ? 'active' : ''}`}
          onClick={() => setActiveVitalsTab('heart_rate')}
        >
          <HeartPulse size={14} /> Detak Jantung ({hrLogs.length})
        </button>
      </div>

      {/* Active Vitals Monitor */}
      {activeVitalsTab === 'blood_pressure' ? (
        <BloodPressureMonitor
          userAge={data.user_profile.demographics.age}
          userBmi={data.user_profile.biometrics.bmi}
          historyLogs={bpLogs}
          onSaveBloodPressure={onSaveBloodPressure}
          onDeleteBloodPressure={onDeleteBloodPressure}
        />
      ) : (
        <>
          {/* Multi-Modal Heart Rate Monitor */}
          <HeartRateMonitor
            userAge={data.user_profile.demographics.age}
            onMeasurementComplete={onHeartRateComplete}
            onSaveHeartRate={onSaveHeartRate}
          />

          {/* Vitals Hub: Heart Rate History & Trend */}
          <div className="glass-card hr-history-hub-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <span className="badge-mini badge-rose">
              <HeartPulse size={14} /> Log Vitals Harian
            </span>
            <h3>Buku Riwayat Detak Jantung</h3>
          </div>
          <span className="badge-pill highlight">{hrLogs.length} Pengukuran</span>
        </div>

        {/* Vitals Stats Grid */}
        <div className="hr-vitals-grid">
          <div className="hr-vital-cell">
            <span className="v-lbl">Rata-Rata</span>
            <strong className="v-num text-rose">
              {avgHeartRate > 0 ? `${avgHeartRate}` : '—'}{' '}
              <small>BPM</small>
            </strong>
          </div>
          <div className="hr-vital-cell">
            <span className="v-lbl">Resting HR (Min)</span>
            <strong className="v-num text-blue">
              {minHeartRate > 0 ? `${minHeartRate}` : '—'}{' '}
              <small>BPM</small>
            </strong>
          </div>
          <div className="hr-vital-cell">
            <span className="v-lbl">Puncak Hari Ini</span>
            <strong className="v-num text-orange">
              {maxHeartRate > 0 ? `${maxHeartRate}` : '—'}{' '}
              <small>BPM</small>
            </strong>
          </div>
        </div>

        {/* Visual Trend Chart */}
        {hrLogs.length > 0 && (
          <div className="hr-timeline-chart">
            <div className="hr-chart-header">
              <span className="hr-chart-title">
                <TrendingUp size={13} /> Tren Fluktuasi Detak Jantung
              </span>
              <span className="hr-chart-date">{data.daily_summary.date}</span>
            </div>
            <div className="hr-bars-track">
              {hrLogs.map((log) => {
                const heightPercent = Math.min(100, Math.max(25, ((log.bpm - 40) / (180 - 40)) * 100));
                const cat = HeartRatePPG.getHRCategory(log.bpm);
                return (
                  <div key={log.id} className="hr-bar-col" title={`${log.timestamp}: ${log.bpm} BPM`}>
                    <div className="hr-bar-value">{log.bpm}</div>
                    <div className="hr-bar-pillar-wrap">
                      <div
                        className="hr-bar-fill"
                        style={{ height: `${heightPercent}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <span className="hr-bar-time">{log.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List of Recorded Heart Rate Logs */}
        <div className="hr-logs-list">
          {hrLogs.length > 0 ? (
            hrLogs.map((log) => {
              const cat = HeartRatePPG.getHRCategory(log.bpm);
              const m = getMethodBadge(log.method);
              return (
                <div key={log.id} className="hr-log-item">
                  <div className="hr-log-left">
                    <div
                      className="hr-pulse-dot"
                      style={{ backgroundColor: cat.color + '25', color: cat.color }}
                    >
                      <HeartPulse size={16} />
                    </div>
                    <div>
                      <div className="hr-log-header">
                        <strong className="hr-log-bpm">{log.bpm} BPM</strong>
                        <span className={`hr-cat-tag ${cat.badgeClass}`}>{cat.label}</span>
                      </div>
                      <div className="hr-log-meta">
                        <span>{log.timestamp}</span>
                        <span className="dot-sep">•</span>
                        <span className="hr-method-badge">
                          {m.icon} {m.label}
                        </span>
                        <span className="dot-sep">•</span>
                        <span>Akurasi {log.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn-delete-mini"
                    onClick={() => onDeleteHeartRate(log.id)}
                    title="Hapus rekaman vitals"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="hr-empty-state">
              <HeartPulse size={24} className="text-tertiary" />
              <p>Belum ada riwayat detak jantung tersimpan hari ini.</p>
              <span>Ukur nadi Anda dengan kamera atau smartwatch BLE di atas, lalu simpan ke buku vitals.</span>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Step Counter / Pedometer (REAL-TIME) */}
      <StepCounter
        weightKg={data.user_profile.biometrics.weight_kg}
        heightCm={data.user_profile.biometrics.height_cm}
        onStepUpdate={onStepUpdate}
      />

      {/* Full List of Activities */}
      <h3 className="subheading-list">Riwayat Sesi Latihan</h3>
      <div className="activity-cards-container">
        {data.activity_logs.length > 0 ? (
          data.activity_logs.map((act) => (
            <div key={act.activity_log_id} className="glass-card activity-full-card">
              <div className="act-full-header">
                <div className="act-type-info">
                  <span className="act-emoji-big">
                    {act.activity_type.toLowerCase().includes('skate')
                      ? '🛹'
                      : act.activity_type.toLowerCase().includes('sepeda') ||
                        act.activity_type.toLowerCase().includes('cycling')
                      ? '🚴'
                      : act.activity_type.toLowerCase().includes('renang') ||
                        act.activity_type.toLowerCase().includes('swim')
                      ? '🏊'
                      : act.activity_type.toLowerCase().includes('beban') ||
                        act.activity_type.toLowerCase().includes('gym')
                      ? '🏋️'
                      : act.activity_type.toLowerCase().includes('walk')
                      ? '🚶'
                      : '🏃'}
                  </span>
                  <div>
                    <h4>{act.activity_type}</h4>
                    <span className="act-source">
                      <Smartphone size={12} /> {act.device_source}
                    </span>
                  </div>
                </div>
                <div className="act-header-right">
                  <span className="act-cal-pill">+{act.metrics.calories_burned} kkal</span>
                  <button
                    className="btn-delete-mini"
                    onClick={() => onDeleteActivity(act.activity_log_id)}
                    title="Hapus sesi latihan"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="act-metrics-trio">
                <div className="m-box">
                  <span className="lbl">Durasi</span>
                  <strong className="val">{act.metrics.duration_minutes} mnt</strong>
                </div>
                <div className="m-box">
                  <span className="lbl">Intensitas</span>
                  <strong className="val capitalize">{act.metrics.intensity_level}</strong>
                </div>
                <div className="m-box">
                  <span className="lbl">Heart Rate</span>
                  <strong className="val color-rose">
                    {act.metrics.average_heart_rate ? `${act.metrics.average_heart_rate} bpm` : '— bpm'}
                  </strong>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-card">
            <FolderOpen size={24} />
            <p>Belum ada riwayat aktivitas fisik yang dicatat hari ini</p>
            <button className="btn-primary-add" onClick={onOpenActivityModal}>
              <Plus size={14} /> Catat Latihan Pertama
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default React.memo(ActivitiesTab);
