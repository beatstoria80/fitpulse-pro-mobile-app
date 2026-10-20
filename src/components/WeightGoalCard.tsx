"use client";

import React from 'react';
import { Target, ArrowDownRight } from 'lucide-react';
import { Biometrics, FitnessGoals } from '../types/fitness';

interface WeightGoalCardProps {
  biometrics: Biometrics;
  fitnessGoals: FitnessGoals;
  onEditGoal?: () => void;
}

export const WeightGoalCard: React.FC<WeightGoalCardProps> = ({
  biometrics,
  fitnessGoals
}) => {
  const currentWeight = biometrics.weight_kg;
  const targetWeight = fitnessGoals.target_weight_kg;
  const initialWeight = 72.0; // Starting baseline weight
  const totalToLose = Math.max(0.1, initialWeight - targetWeight);
  const lostSoFar = Math.max(0, initialWeight - currentWeight);
  const progressPercent = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));
  const remainingKg = Math.max(0, currentWeight - targetWeight).toFixed(1);

  return (
    <div className="weight-goal-card glass-panel">
      <div className="card-header-line">
        <div className="title-with-icon">
          <div className="icon-badge target">
            <Target size={16} />
          </div>
          <div>
            <h2 className="section-title">Target Penurunan Berat Badan</h2>
            <span className="section-sub">Program Pemulihan Komposisi Tubuh</span>
          </div>
        </div>
        <div className="bmi-pill-badge">
          <span className="bmi-num">BMI {biometrics.bmi}</span>
          <span className="bmi-status">{biometrics.bmi_status.split('/')[0].trim()}</span>
        </div>
      </div>

      <div className="weight-display-grid">
        <div className="weight-col">
          <span className="col-sub">Saat Ini</span>
          <div className="weight-big-val">
            <span className="val">{currentWeight}</span>
            <span className="unit">kg</span>
          </div>
          <span className="meta-sub">TB: {biometrics.height_cm} cm</span>
        </div>

        <div className="weight-arrow-col">
          <div className="arrow-circle">
            <ArrowDownRight size={20} />
          </div>
          <span className="diff-tag">-{remainingKg} kg lagi</span>
        </div>

        <div className="weight-col text-right">
          <span className="col-sub">Target Ideal</span>
          <div className="weight-big-val target-val">
            <span className="val">{targetWeight}</span>
            <span className="unit">kg</span>
          </div>
          <span className="meta-sub">Target Lemak: {biometrics.target_body_fat_percentage}%</span>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-label-row">
          <span>Progres Menuju Target</span>
          <span className="percent-bold">{progressPercent}% Tercapai</span>
        </div>
        <div className="goal-bar-bg">
          <div className="goal-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="body-fat-pills">
        <div className="fat-item">
          <span className="label">Lemak Tubuh Saat Ini:</span>
          <span className="value warning">{biometrics.estimated_body_fat_percentage}%</span>
        </div>
        <div className="fat-divider">•</div>
        <div className="fat-item">
          <span className="label">Target:</span>
          <span className="value success">{biometrics.target_body_fat_percentage}%</span>
        </div>
      </div>
    </div>
  );
};
