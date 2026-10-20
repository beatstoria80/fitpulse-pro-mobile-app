"use client";

import React from 'react';
import { Droplet, Plus } from 'lucide-react';
import { HydrationLog, FitnessGoals } from '../types/fitness';

interface HydrationTabProps {
  hydrationLogs: HydrationLog[];
  waterTotal: number;
  fitnessGoals: FitnessGoals;
  onQuickAddWater: (ml: number) => void;
  onOpenAddModal: () => void;
}

export const HydrationTab: React.FC<HydrationTabProps> = ({
  hydrationLogs,
  waterTotal,
  fitnessGoals,
  onQuickAddWater,
  onOpenAddModal
}) => {
  const target = fitnessGoals.daily_water_target_ml;
  const percent = Math.min(100, Math.round((waterTotal / target) * 100));
  const glasses = Math.round(waterTotal / 250);
  const targetGlasses = Math.round(target / 250);

  return (
    <div className="tab-pane active">
      <div className="section-head-row">
        <div>
          <h2 className="section-title">Pelacak Hidrasi Tubuh</h2>
          <span className="section-sub">Kebutuhan cairan harian untuk metabolisme optimal</span>
        </div>
        <button onClick={onOpenAddModal} className="btn-primary-sm">
          <Plus size={14} />
          <span>Kustom</span>
        </button>
      </div>

      {/* Water Big Meter */}
      <div className="water-meter-card glass-panel">
        <div className="water-meter-top">
          <div className="water-bubble-ring">
            <Droplet size={32} className="water-ring-icon" />
            <div className="water-ring-wave" style={{ height: `${percent}%` }}></div>
          </div>
          <div className="water-meter-info">
            <div className="big-water-text">
              <span className="num">{waterTotal}</span>
              <span className="sub">/ {target} ml</span>
            </div>
            <p className="water-status-text">
              {percent >= 100 ? '🎉 Target hidrasi hari ini terpenuhi!' : `Tercapai ${glasses} dari ${targetGlasses} gelas (${percent}%)`}
            </p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="quick-water-buttons">
          <button onClick={() => onQuickAddWater(250)} className="btn-quick-water">
            <span>+250 ml</span>
            <span className="sub-tag">1 Gelas</span>
          </button>
          <button onClick={() => onQuickAddWater(500)} className="btn-quick-water">
            <span>+500 ml</span>
            <span className="sub-tag">1 Botol</span>
          </button>
          <button onClick={() => onQuickAddWater(750)} className="btn-quick-water">
            <span>+750 ml</span>
            <span className="sub-tag">Tumbler</span>
          </button>
        </div>
      </div>

      {/* Hydration History */}
      <div className="hydration-history-card glass-panel">
        <h4 className="card-sub-heading">Riwayat Minum Hari Ini</h4>
        <div className="water-history-list">
          {hydrationLogs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">💧</span>
              <p>Belum ada catatan air minum.</p>
            </div>
          ) : (
            hydrationLogs.map((log, idx) => (
              <div key={idx} className="water-log-item">
                <div className="water-log-left">
                  <div className="drop-dot">
                    <Droplet size={14} />
                  </div>
                  <div>
                    <span className="log-time">{log.time} WIB</span>
                    <span className="log-beverage">Air Mineral</span>
                  </div>
                </div>
                <div className="water-log-right">
                  <span className="amount-tag">+{log.amount_ml} ml</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
