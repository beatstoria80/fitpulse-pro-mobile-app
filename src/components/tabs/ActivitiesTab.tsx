"use client";

import React, { useState } from 'react';
import { AppFitnessData } from '../../types/fitness';
import HeartRateMonitor from '../HeartRateMonitor';
import StepCounter from '../StepCounter';
import { StravaRunTracker, StravaRunSession } from '../StravaRunTracker';

interface ActivitiesTabProps {
  data: AppFitnessData;
  burnedCalories: number;
  onOpenActivityModal: () => void;
  onSaveStravaRun: (session: StravaRunSession) => void;
  onStepUpdate: (steps: number, calories: number, distance: number) => void;
  onShowToast: (msg: string) => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  data,
  burnedCalories,
  onOpenActivityModal,
  onSaveStravaRun,
  onStepUpdate,
  onShowToast
}) => {
  const [activitySubView, setActivitySubView] = useState<'strava' | 'sensors'>('strava');

  return (
    <section className="tab-pane active" id="tabActivities">
      <div className="pane-header">
        <div>
          <span className="badge-mini badge-green">Latihan & Kardio</span>
          <h1 className="pane-title">Aktivitas Fisik</h1>
        </div>
        <button className="btn-primary-add" onClick={onOpenActivityModal}>
          <i className="fa-solid fa-plus"></i> Catat Manual
        </button>
      </div>

      {/* Sub-view Segmented Switcher */}
      <div className="activity-view-toggle">
        <button
          className={`view-toggle-btn ${activitySubView === 'strava' ? 'active' : ''}`}
          onClick={() => setActivitySubView('strava')}
        >
          <i className="fa-solid fa-person-running"></i>
          <span>Strava GPS Track</span>
        </button>
        <button
          className={`view-toggle-btn ${activitySubView === 'sensors' ? 'active' : ''}`}
          onClick={() => setActivitySubView('sensors')}
        >
          <i className="fa-solid fa-chart-line"></i>
          <span>Sensor & Riwayat</span>
        </button>
      </div>

      {activitySubView === 'strava' ? (
        /* Strava Interactive GPS Route Tracker */
        <StravaRunTracker
          userWeightKg={data.user_profile.biometrics.weight_kg}
          onSaveRun={onSaveStravaRun}
        />
      ) : (
        <>
          {/* Summary Banner */}
          <div className="glass-card workout-summary-banner">
            <div className="summary-stat-box">
              <span className="summary-val">{data.activity_logs.reduce((s, a) => s + a.metrics.duration_minutes, 0)}</span>
              <span className="summary-lbl">Menit Total</span>
            </div>
            <div className="stat-divider"></div>
            <div className="summary-stat-box">
              <span className="summary-val color-fire">{burnedCalories}</span>
              <span className="summary-lbl">Kkal Terbakar</span>
            </div>
            <div className="stat-divider"></div>
            <div className="summary-stat-box">
              <span className="summary-val">{data.activity_logs.reduce((s, a) => s + (a.metrics.steps_counted || 0), 0) || '3.500'}</span>
              <span className="summary-lbl">Langkah Kaki</span>
            </div>
          </div>

          {/* Real-Time Sensor Section Header */}
          <div className="sensor-section-header">
            <h3>
              <i className="fa-solid fa-satellite-dish"></i> Sensor Real-Time
            </h3>
            <span className="sensor-live-badge">
              <span className="live-dot"></span> LIVE
            </span>
          </div>

          {/* Camera PPG Heart Rate Monitor (REAL-TIME) */}
          <HeartRateMonitor
            userAge={data.user_profile.demographics.age}
            onMeasurementComplete={(bpm, confidence) => {
              onShowToast(`Detak jantung terukur: ${bpm} BPM (Akurasi: ${confidence}%)`);
            }}
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
            {data.activity_logs.map((act) => (
              <div key={act.activity_log_id} className="glass-card activity-full-card">
                <div className="act-full-header">
                  <div className="act-type-info">
                    <span className="act-emoji-big">
                      {act.activity_type.toLowerCase().includes('skate') ? '🛹' : '🏃'}
                    </span>
                    <div>
                      <h4>{act.activity_type}</h4>
                      <span className="act-source"><i className="fa-solid fa-mobile"></i> {act.device_source}</span>
                    </div>
                  </div>
                  <span className="act-cal-pill">+{act.metrics.calories_burned} kkal</span>
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
                    <strong className="val color-rose">{act.metrics.average_heart_rate || 120} bpm</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
};
