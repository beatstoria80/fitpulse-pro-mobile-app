"use client";

import React from 'react';
import { AppFitnessData } from '../../types/fitness';

interface AnalyticsTabProps {
  data: AppFitnessData;
  remainingWeightKg: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ data, remainingWeightKg }) => {
  return (
    <section className="tab-pane active" id="tabAnalytics">
      <div className="pane-header">
        <div>
          <span className="badge-mini badge-purple">Proyeksi Target</span>
          <h1 className="pane-title">Analisis & Roadmap</h1>
        </div>
      </div>

      {/* Roadmap to 58.5 kg */}
      <div className="glass-card roadmap-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <span className="badge-mini badge-blue">Roadmap Defisit Sehat</span>
            <h3>Menuju Berat 58.5 kg</h3>
          </div>
          <span className="badge-pill highlight">~21 - 24 Minggu</span>
        </div>

        <div className="roadmap-stats-grid">
          <div className="r-box">
            <span className="r-label">Berat Awal</span>
            <strong className="r-val">{data.user_profile.biometrics.weight_kg} kg</strong>
          </div>
          <div className="r-box">
            <span className="r-label">Target Berat</span>
            <strong className="r-val text-cyan">{data.user_profile.fitness_goals.target_weight_kg} kg</strong>
          </div>
          <div className="r-box">
            <span className="r-label">Selisih Penurunan</span>
            <strong className="r-val text-rose">-{remainingWeightKg} kg</strong>
          </div>
          <div className="r-box">
            <span className="r-label">Laju Aman</span>
            <strong className="r-val text-green">0.4 - 0.5 kg/mgg</strong>
          </div>
        </div>

        <div className="roadmap-visual">
          <div className="roadmap-checkpoint reached">
            <div className="point-circle"><i className="fa-solid fa-check"></i></div>
            <span className="point-lbl">{data.user_profile.biometrics.weight_kg} kg (Start)</span>
          </div>
          <div className="roadmap-line">
            <div className="roadmap-fill" style={{ width: '25%' }}></div>
          </div>
          <div className="roadmap-checkpoint">
            <div className="point-circle">65k</div>
            <span className="point-lbl">Milestone 1</span>
          </div>
          <div className="roadmap-line"></div>
          <div className="roadmap-checkpoint">
            <div className="point-circle">62k</div>
            <span className="point-lbl">Milestone 2</span>
          </div>
          <div className="roadmap-line"></div>
          <div className="roadmap-checkpoint target">
            <div className="point-circle"><i className="fa-solid fa-trophy"></i></div>
            <span className="point-lbl">58.5 kg (Ideal)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
