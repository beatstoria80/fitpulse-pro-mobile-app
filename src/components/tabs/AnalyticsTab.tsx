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

      {/* Waist Circumference & Visceral Fat Roadmap */}
      <div className="glass-card roadmap-card" style={{ marginTop: '16px' }}>
        <div className="card-header-clean">
          <div className="card-title-group">
            <span className="badge-mini badge-orange">
              <i className="fa-solid fa-ruler-horizontal"></i> Lingkar Perut & Rasio WHtR
            </span>
            <h3>Pencegahan Obesitas Sentral</h3>
          </div>
          <span className="badge-pill highlight">Target -{Math.max(0, (data.user_profile.biometrics.waist_circumference_cm || 88) - (data.user_profile.biometrics.target_waist_cm || 78)).toFixed(1)} cm</span>
        </div>

        <div className="roadmap-stats-grid">
          <div className="r-box">
            <span className="r-label">Lingkar Saat Ini</span>
            <strong className="r-val">{data.user_profile.biometrics.waist_circumference_cm || 88} cm</strong>
          </div>
          <div className="r-box">
            <span className="r-label">Target Ideal</span>
            <strong className="r-val text-cyan">{data.user_profile.biometrics.target_waist_cm || 78} cm</strong>
          </div>
          <div className="r-box">
            <span className="r-label">Rasio WHtR</span>
            <strong className="r-val text-fire">
              {(Number(data.user_profile.biometrics.waist_circumference_cm || 88) / data.user_profile.biometrics.height_cm).toFixed(2)}
            </strong>
          </div>
          <div className="r-box">
            <span className="r-label">Batas Aman WHO</span>
            <strong className="r-val text-green">{data.user_profile.demographics.gender === 'male' ? '< 90 cm' : '< 80 cm'}</strong>
          </div>
        </div>

        <div className="roadmap-visual">
          <div className="roadmap-checkpoint reached">
            <div className="point-circle"><i className="fa-solid fa-check"></i></div>
            <span className="point-lbl">{data.user_profile.biometrics.waist_circumference_cm || 88} cm (Start)</span>
          </div>
          <div className="roadmap-line">
            <div className="roadmap-fill" style={{ width: '30%', background: 'linear-gradient(90deg, #FF8008, #FFC837)' }}></div>
          </div>
          <div className="roadmap-checkpoint">
            <div className="point-circle">84 cm</div>
            <span className="point-lbl">Milestone 1</span>
          </div>
          <div className="roadmap-line"></div>
          <div className="roadmap-checkpoint">
            <div className="point-circle">80 cm</div>
            <span className="point-lbl">Milestone 2</span>
          </div>
          <div className="roadmap-line"></div>
          <div className="roadmap-checkpoint target">
            <div className="point-circle" style={{ borderColor: '#FF8008', color: '#FF8008' }}>
              <i className="fa-solid fa-ribbon"></i>
            </div>
            <span className="point-lbl">{data.user_profile.biometrics.target_waist_cm || 78} cm (Ideal)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
