"use client";

import React from 'react';
import { Activity, Plus, Heart, Clock, Footprints, Flame } from 'lucide-react';
import { ActivityLog } from '../types/fitness';

interface ActivitiesTabProps {
  activityLogs: ActivityLog[];
  onOpenAddModal: () => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  activityLogs,
  onOpenAddModal
}) => {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'skateboard':
        return '🛹';
      case 'lari':
      case 'running':
        return '🏃';
      case 'bersepeda':
      case 'cycling':
        return '🚴';
      case 'gym / angkat beban':
      case 'gym':
        return '🏋️';
      case 'jalan cepat':
      case 'walking':
        return '🚶';
      case 'renang':
      case 'swimming':
        return '🏊';
      default:
        return '⚡';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="tab-pane active">
      <div className="section-head-row">
        <div>
          <h2 className="section-title">Aktivitas Fisik & Olahraga</h2>
          <span className="section-sub">Pantau pembakaran kalori dan durasi harian</span>
        </div>
        <button onClick={onOpenAddModal} className="btn-primary-sm">
          <Plus size={14} />
          <span>Tambah</span>
        </button>
      </div>

      <div className="activities-list">
        {activityLogs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏃</span>
            <p>Belum ada aktivitas tercatat hari ini.</p>
            <button onClick={onOpenAddModal} className="btn-secondary-sm">
              Mulai Catat Aktivitas
            </button>
          </div>
        ) : (
          activityLogs.map((act) => (
            <div key={act.activity_log_id} className="activity-card glass-panel">
              <div className="act-top">
                <div className="act-type-badge">
                  <span className="act-emoji">{getActivityIcon(act.activity_type)}</span>
                  <div>
                    <h3 className="act-name">{act.activity_type}</h3>
                    <span className="act-time">{formatTime(act.timestamp_start)} WIB • {act.device_source}</span>
                  </div>
                </div>
                <div className="act-cal-badge">
                  <Flame size={14} className="fire-icon" />
                  <span>+{act.metrics.calories_burned} kkal</span>
                </div>
              </div>

              <div className="act-metrics-grid">
                <div className="act-metric-box">
                  <Clock size={13} className="text-secondary" />
                  <span className="val">{act.metrics.duration_minutes}</span>
                  <span className="unit">menit</span>
                </div>

                <div className="act-metric-box">
                  <span className="intensity-dot" data-intensity={act.metrics.intensity_level}></span>
                  <span className="val capitalize">{act.metrics.intensity_level}</span>
                  <span className="unit">intensitas</span>
                </div>

                {act.metrics.average_heart_rate ? (
                  <div className="act-metric-box">
                    <Heart size={13} className="text-danger" />
                    <span className="val">{act.metrics.average_heart_rate}</span>
                    <span className="unit">bpm</span>
                  </div>
                ) : null}

                {act.metrics.steps_counted ? (
                  <div className="act-metric-box">
                    <Footprints size={13} className="text-info" />
                    <span className="val">{act.metrics.steps_counted}</span>
                    <span className="unit">langkah</span>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
