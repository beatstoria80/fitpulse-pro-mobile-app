"use client";

import React from 'react';
import { Trophy, Check, RotateCcw, Download } from 'lucide-react';
import { AppFitnessData } from '../../types/fitness';

interface AnalyticsTabProps {
  data: AppFitnessData;
  currentWeight: number;
  targetWeight: number;
  weightDiff: number;
  remainingWeightKg: string;
  estimatedWeeks: number;
  milestone1: number;
  milestone2: number;
  roadmapProgressPercent: number;
  onResetTodayData: () => void;
  onExportJson: () => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  data,
  currentWeight,
  targetWeight,
  weightDiff,
  remainingWeightKg,
  estimatedWeeks,
  milestone1,
  milestone2,
  roadmapProgressPercent,
  onResetTodayData,
  onExportJson,
}) => {
  return (
    <section className="tab-pane active" id="tabAnalytics">
      <div className="pane-header">
        <div>
          <span className="badge-mini badge-purple">Proyeksi Target</span>
          <h1 className="pane-title">Analisis & Roadmap</h1>
        </div>
      </div>

      {/* Roadmap — computed from actual profile data */}
      <div className="glass-card roadmap-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <span className="badge-mini badge-blue">Roadmap Defisit Sehat</span>
            <h3>Menuju Berat {targetWeight > 0 ? `${targetWeight} kg` : '— kg'}</h3>
          </div>
          <span className="badge-pill highlight">
            {estimatedWeeks > 0 ? `~${estimatedWeeks} Minggu` : 'Target tercapai! 🎉'}
          </span>
        </div>

        <div className="roadmap-stats-grid">
          <div className="r-box">
            <span className="r-label">Berat Saat Ini</span>
            <strong className="r-val">{currentWeight > 0 ? `${currentWeight} kg` : '— kg'}</strong>
          </div>
          <div className="r-box">
            <span className="r-label">Target Berat</span>
            <strong className="r-val text-cyan">{targetWeight > 0 ? `${targetWeight} kg` : '— kg'}</strong>
          </div>
          <div className="r-box">
            <span className="r-label">Selisih Penurunan</span>
            <strong className="r-val text-rose">{weightDiff > 0 ? `-${remainingWeightKg} kg` : '0 kg'}</strong>
          </div>
          <div className="r-box">
            <span className="r-label">Laju Aman</span>
            <strong className="r-val text-green">0.4 - 0.5 kg/mgg</strong>
          </div>
        </div>

        <div className="roadmap-visual">
          <div className="roadmap-checkpoint reached">
            <div className="point-circle">
              <Check size={14} />
            </div>
            <span className="point-lbl">{currentWeight > 0 ? `${currentWeight} kg` : '—'} (Saat Ini)</span>
          </div>
          <div className="roadmap-line">
            <div className="roadmap-fill" style={{ width: `${roadmapProgressPercent}%` }} />
          </div>
          <div className="roadmap-checkpoint">
            <div className="point-circle">{weightDiff > 0 ? `${milestone1}` : '✓'}</div>
            <span className="point-lbl">{weightDiff > 0 ? `${milestone1} kg` : 'Tercapai'}</span>
          </div>
          <div className="roadmap-line" />
          <div className="roadmap-checkpoint">
            <div className="point-circle">{weightDiff > 0 ? `${milestone2}` : '✓'}</div>
            <span className="point-lbl">{weightDiff > 0 ? `${milestone2} kg` : 'Tercapai'}</span>
          </div>
          <div className="roadmap-line" />
          <div className="roadmap-checkpoint target">
            <div className="point-circle">
              <Trophy size={14} />
            </div>
            <span className="point-lbl">{targetWeight > 0 ? `${targetWeight} kg` : '—'} (Ideal)</span>
          </div>
        </div>
      </div>

      {/* JSON Data Inspector */}
      <div className="glass-card json-card">
        <div className="card-header-clean">
          <div className="card-title-group">
            <span className="badge-mini badge-cyan">Sistem Log Real-time</span>
            <h3>Data Profil & Log Pengguna</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn-copy-json"
              onClick={onResetTodayData}
              title="Kosongkan data hari ini untuk menguji status Tanpa Data (Null)"
            >
              <RotateCcw size={14} /> Reset Data Nol
            </button>
            <button className="btn-copy-json" onClick={onExportJson}>
              <Download size={14} /> Unduh JSON
            </button>
          </div>
        </div>
        <pre className="json-code-box">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </div>
    </section>
  );
};

export default React.memo(AnalyticsTab);
