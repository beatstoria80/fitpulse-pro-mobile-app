"use client";

import React from 'react';
import { Plus, Activity, Smartphone, Trash2, FolderOpen } from 'lucide-react';
import { AppFitnessData } from '../../types/fitness';
import HeartRateMonitor from '../HeartRateMonitor';
import StepCounter from '../StepCounter';

interface ActivitiesTabProps {
  data: AppFitnessData;
  burnedCalories: number;
  totalSteps: number;
  onOpenActivityModal: () => void;
  onDeleteActivity: (id: string) => void;
  onStepUpdate: (steps: number, calories: number, distance: number) => void;
  onHeartRateComplete: (bpm: number, confidence: number) => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  data,
  burnedCalories,
  totalSteps,
  onOpenActivityModal,
  onDeleteActivity,
  onStepUpdate,
  onHeartRateComplete,
}) => {
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
          <Activity size={16} /> Sensor Real-Time
        </h3>
        <span className="sensor-live-badge">
          <span className="live-dot" /> LIVE
        </span>
      </div>

      {/* Camera PPG Heart Rate Monitor (REAL-TIME) */}
      <HeartRateMonitor
        userAge={data.user_profile.demographics.age}
        onMeasurementComplete={onHeartRateComplete}
      />

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

export default ActivitiesTab;
