"use client";

import React from 'react';
import { Flame, Droplet, Utensils, TrendingUp } from 'lucide-react';
import { DailySummary, FitnessGoals } from '../types/fitness';

interface MetricCardsProps {
  dailySummary: DailySummary;
  fitnessGoals: FitnessGoals;
  onOpenHydrationModal: () => void;
  onOpenNutritionModal: () => void;
  onOpenActivityModal: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  dailySummary,
  fitnessGoals,
  onOpenHydrationModal,
  onOpenNutritionModal,
  onOpenActivityModal
}) => {
  const calPercent = Math.min(100, Math.round((dailySummary.calories_consumed / fitnessGoals.daily_calorie_target) * 100));
  const waterPercent = Math.min(100, Math.round((dailySummary.water_intake_ml / fitnessGoals.daily_water_target_ml) * 100));
  const burnTarget = 500;
  const burnPercent = Math.min(100, Math.round((dailySummary.calories_burned / burnTarget) * 100));

  return (
    <div className="metrics-grid">
      {/* Burned Calories */}
      <div className="metric-card metric-burn" onClick={onOpenActivityModal} role="button" tabIndex={0}>
        <div className="card-top">
          <div className="icon-badge fire">
            <Flame size={18} />
          </div>
          <span className="metric-percent">{burnPercent}%</span>
        </div>
        <div className="metric-value-row">
          <span className="big-num">{dailySummary.calories_burned}</span>
          <span className="unit-label">kkal</span>
        </div>
        <div className="metric-title">Kalori Terbakar</div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill fire" style={{ width: `${burnPercent}%` }}></div>
        </div>
        <div className="metric-footer-note">Target: {burnTarget} kkal</div>
      </div>

      {/* Water Intake */}
      <div className="metric-card metric-water" onClick={onOpenHydrationModal} role="button" tabIndex={0}>
        <div className="card-top">
          <div className="icon-badge water">
            <Droplet size={18} />
          </div>
          <span className="metric-percent">{waterPercent}%</span>
        </div>
        <div className="metric-value-row">
          <span className="big-num">{dailySummary.water_intake_ml}</span>
          <span className="unit-label">ml</span>
        </div>
        <div className="metric-title">Air Minum</div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill water" style={{ width: `${waterPercent}%` }}></div>
        </div>
        <div className="metric-footer-note">Target: {fitnessGoals.daily_water_target_ml} ml</div>
      </div>

      {/* Calories Consumed */}
      <div className="metric-card metric-food" onClick={onOpenNutritionModal} role="button" tabIndex={0}>
        <div className="card-top">
          <div className="icon-badge food">
            <Utensils size={18} />
          </div>
          <span className="metric-percent">{calPercent}%</span>
        </div>
        <div className="metric-value-row">
          <span className="big-num">{dailySummary.calories_consumed}</span>
          <span className="unit-label">kkal</span>
        </div>
        <div className="metric-title">Nutrisi Masuk</div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill food" style={{ width: `${calPercent}%` }}></div>
        </div>
        <div className="metric-footer-note">Target: {fitnessGoals.daily_calorie_target} kkal</div>
      </div>
    </div>
  );
};
