"use client";

import React, { useState, useMemo } from 'react';
import {
  Flame,
  Utensils,
  Info,
  CheckCircle2,
  Sparkles,
  Clock,
} from 'lucide-react';
import { AppFitnessData } from '../../types/fitness';
import { BackIcon, ZapIcon, SlidersIcon } from '../icons/FeatureIcons';

interface EnergyCalorieDetailViewProps {
  data: AppFitnessData;
  targetCalories: number;
  consumedCalories: number;
  burnedCalories: number;
  bmrValue: number;
  remainingCalories: number;
  onBack: () => void;
  onOpenFood: () => void;
  onOpenActivity: () => void;
  onShowToast: (msg: string) => void;
}

export default function EnergyCalorieDetailView({
  data,
  targetCalories,
  consumedCalories,
  burnedCalories,
  bmrValue,
  remainingCalories,
  onBack,
  onOpenFood,
  onOpenActivity,
  onShowToast,
}: EnergyCalorieDetailViewProps) {
  // Simulator state: add food / exercise simulation
  const [simFood, setSimFood] = useState(0);
  const [simBurn, setSimBurn] = useState(0);
  const [activeChartHour, setActiveChartHour] = useState<number | null>(14);

  // Total daily expenditure: BMR + Active Burn
  const totalTDEE = bmrValue + burnedCalories;
  const netCalories = consumedCalories - burnedCalories;
  const calorieDeficit = totalTDEE - consumedCalories;

  // Simulated metrics
  const simTotalConsumed = consumedCalories + simFood;
  const simTotalBurned = burnedCalories + simBurn;
  const simRemaining = Math.max(0, targetCalories - simTotalConsumed + simTotalBurned);
  const simDeficit = bmrValue + simTotalBurned - simTotalConsumed;

  // 24-Hour hourly energy fluctuation simulation based on user logs
  const hourlyData = useMemo(() => {
    // Generate realistic 24-hour curve
    return Array.from({ length: 24 }, (_, hour) => {
      // Base BMR burn per hour (~BMR / 24)
      const baseHourBMR = Math.round(bmrValue / 24);
      let intake = 0;
      let burn = baseHourBMR;

      // Breakfast around 7-8 AM
      if (hour === 7) intake += Math.round(consumedCalories * 0.28);
      // Lunch around 12-13 PM
      if (hour === 12) intake += Math.round(consumedCalories * 0.42);
      // Dinner around 19-20 PM
      if (hour === 19) intake += Math.round(consumedCalories * 0.25);
      // Snacks around 15 PM
      if (hour === 15) intake += Math.round(consumedCalories * 0.05);

      // Exercise spikes (afternoon 16-18)
      if (hour === 16 || hour === 17) {
        burn += Math.round(burnedCalories * 0.45);
      } else if (hour >= 8 && hour <= 21) {
        burn += Math.round(burnedCalories * 0.01);
      }

      return {
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        intake,
        burn,
        net: intake - burn,
      };
    });
  }, [bmrValue, consumedCalories, burnedCalories]);

  const selectedHourInfo = activeChartHour !== null ? hourlyData[activeChartHour] : null;

  return (
    <div className="feature-detail-page energy-detail-page">
      {/* Top Floating Glass Navigation Bar */}
      <div className="feature-detail-header">
        <button
          className="feature-back-btn"
          onClick={onBack}
          aria-label="Kembali ke Dashboard"
        >
          <BackIcon size={20} />
        </button>
        <div className="feature-header-titles">
          <span className="badge-mini badge-cyan">
            <ZapIcon size={12} /> Telemetri Energi
          </span>
          <h2>Keseimbangan Energi & Kalori</h2>
        </div>
        <button
          className="feature-info-btn"
          onClick={() =>
            onShowToast(
              `Defisit hari ini: ${calorieDeficit > 0 ? calorieDeficit : 0} kkal. Target aman penurunan berat badan: 300–500 kkal/hari.`
            )
          }
          title="Info Sains Energi"
        >
          <Info size={18} />
        </button>
      </div>

      <div className="feature-detail-content">
        {/* HERO 3D CHARACTER STAGE WITH PERIMETER OVERLAY HUD */}
        <div className="feature-hero-stage energy-theme">
          {/* Ambient Floor Shadow */}
          <div className="character-stage-shadow" />

          {/* 3D Character Looping Video - Blended seamlessly without black box */}
          <video
            className="character-stage-video"
            src="/character_pointing_calorie.mp4"
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Floating UI/UX Perimeter Overlay (Does not cover/touch character) */}
          <div className="stage-overlay-container">
            {/* Top Bar Overlay */}
            <div className="stage-overlay-top">
              <div className="overlay-pill-badge cyan">
                <Flame size={13} />
                <span>Telemetri Energi</span>
              </div>
              <div className="overlay-live-indicator">
                <span className="live-video-dot" />
                <span>3D AI Coach</span>
              </div>
            </div>

            {/* Mid Flank Floating Metric Chips (Left & Right safe zones) */}
            <div className="stage-overlay-flanks">
              <div className="flank-glass-chip left">
                <div className="flank-chip-header">
                  <Sparkles size={11} className="text-cyan" />
                  <span>Sisa</span>
                </div>
                <div className="flank-chip-val text-cyan">{remainingCalories.toLocaleString('id-ID')}</div>
                <div className="flank-chip-sub">kkal tersisa</div>
              </div>

              <div className="flank-glass-chip right">
                <div className="flank-chip-header">
                  <Flame size={11} className="text-orange" />
                  <span>TDEE</span>
                </div>
                <div className="flank-chip-val text-orange">{totalTDEE.toLocaleString('id-ID')}</div>
                <div className="flank-chip-sub">kkal keluar</div>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="stage-overlay-bottom">
              <p className="stage-bottom-text">
                <strong>{calorieDeficit >= 0 ? `Defisit Sehat (${calorieDeficit} kkal)` : `Surplus Kalori (${Math.abs(calorieDeficit)} kkal)`}!</strong> Target {data.user_profile.fitness_goals.target_weight_kg} kg terkawal.
              </p>
              <button
                className="stage-cta-btn cyan"
                onClick={onOpenFood}
              >
                <Utensils size={13} />
                <span>Catat Kalori</span>
              </button>
            </div>
          </div>
        </div>

        {/* QUICK ENERGY STATS BAR */}
        <div className="hero-quick-stats">
          <div className="h-stat-box">
            <span className="h-stat-label">Sisa Kalori</span>
            <span className="h-stat-num text-cyan">
              {remainingCalories.toLocaleString('id-ID')}
            </span>
            <span className="h-stat-unit">kkal</span>
          </div>
          <div className="h-stat-box">
            <span className="h-stat-label">Pengeluaran (TDEE)</span>
            <span className="h-stat-num text-orange">
              {totalTDEE.toLocaleString('id-ID')}
            </span>
            <span className="h-stat-unit">kkal</span>
          </div>
          <div className="h-stat-box">
            <span className="h-stat-label">Status Energi</span>
            <span className={`h-stat-num ${calorieDeficit >= 0 ? 'text-green' : 'text-rose'}`}>
              {calorieDeficit >= 0 ? 'Defisit' : 'Surplus'}
            </span>
            <span className="h-stat-unit">{Math.abs(calorieDeficit)} kkal</span>
          </div>
        </div>

        {/* 24-HOUR ENERGY FLUCTUATION INTERACTIVE GRAPHIC */}
        <div className="glass-card feature-chart-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-orange">
                <Flame size={12} /> Analisis 24 Jam
              </span>
              <h3>Fluktuasi Masuk vs Terbakar Hari Ini</h3>
            </div>
            <span className="chart-legend-badge">
              <span className="leg-dot intake" /> Masuk{' '}
              <span className="leg-dot burn" /> Terbakar
            </span>
          </div>

          {/* Interactive SVG Curve / Bar Chart */}
          <div className="energy-chart-container">
            <div className="chart-svg-wrapper">
              <svg viewBox="0 0 480 180" className="energy-svg-chart">
                <defs>
                  <linearGradient id="intakeBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="burnBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity="0.25" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1="20" y1="30" x2="470" y2="30" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="20" y1="80" x2="470" y2="80" stroke="#E2E8F0" strokeDasharray="3 3" />
                <line x1="20" y1="130" x2="470" y2="130" stroke="#E2E8F0" strokeDasharray="3 3" />

                {/* Render bars per hour */}
                {hourlyData.map((d, i) => {
                  const x = 30 + i * 18.5;
                  const maxVal = Math.max(300, consumedCalories * 0.45, 1);
                  const intakeHeight = Math.min(110, (d.intake / maxVal) * 110);
                  const burnHeight = Math.min(110, (d.burn / maxVal) * 110);
                  const isSelected = activeChartHour === d.hour;

                  return (
                    <g
                      key={d.hour}
                      className={`chart-bar-group ${isSelected ? 'selected' : ''}`}
                      onClick={() => setActiveChartHour(d.hour)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Active highlight pillar */}
                      {isSelected && (
                        <rect
                          x={x - 4}
                          y="10"
                          width="18"
                          height="140"
                          fill="rgba(56, 189, 248, 0.12)"
                          rx="4"
                        />
                      )}

                      {/* Burn bar */}
                      <rect
                        x={x + 3.5}
                        y={140 - burnHeight}
                        width="5.5"
                        height={Math.max(4, burnHeight)}
                        fill="url(#burnBarGrad)"
                        rx="2.5"
                      />

                      {/* Intake bar */}
                      <rect
                        x={x - 3}
                        y={140 - intakeHeight}
                        width="5.5"
                        height={Math.max(2, intakeHeight)}
                        fill="url(#intakeBarGrad)"
                        rx="2.5"
                      />

                      {/* Hour labels (every 4 hours) */}
                      {d.hour % 4 === 0 && (
                        <text
                          x={x}
                          y="160"
                          textAnchor="middle"
                          fontSize="9"
                          fill="#94A3B8"
                          fontWeight="600"
                        >
                          {String(d.hour).padStart(2, '0')}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Hour Telemetry Bar */}
            {selectedHourInfo && (
              <div className="selected-hour-telemetry">
                <div className="s-hour-left">
                  <Clock size={14} className="text-secondary" />
                  <strong>Pukul {selectedHourInfo.label}</strong>
                </div>
                <div className="s-hour-metrics">
                  <span className="s-pill cyan">
                    🍽 Masuk: <strong>{selectedHourInfo.intake} kkal</strong>
                  </span>
                  <span className="s-pill orange">
                    🔥 Terbakar: <strong>{selectedHourInfo.burn} kkal</strong>
                  </span>
                  <span className={`s-pill ${selectedHourInfo.net > 0 ? 'rose' : 'green'}`}>
                    Net: <strong>{selectedHourInfo.net > 0 ? `+${selectedHourInfo.net}` : selectedHourInfo.net} kkal</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE CALORIE DEFICIT & SURPLUS SIMULATOR */}
        <div className="glass-card feature-simulator-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-violet">
                <SlidersIcon size={12} /> Proyeksi Interaktif
              </span>
              <h3>Simulator Kalori & Penurunan Bobot</h3>
            </div>
            <span className="badge-mini badge-green">
              <Sparkles size={11} /> Smart AI
            </span>
          </div>

          <p className="simulator-desc">
            Geser nilai di bawah untuk melihat dampak penambahan makanan atau latihan terhadap sisa kalori dan proyeksi bobot badan mingguan.
          </p>

          <div className="simulator-sliders-grid">
            {/* Slider 1: Add food */}
            <div className="sim-slider-box">
              <div className="sim-slider-head">
                <span className="sim-label">
                  <Utensils size={14} className="text-cyan" /> Tambah Makanan
                </span>
                <strong className="sim-val text-cyan">+{simFood} kkal</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={simFood}
                onChange={(e) => setSimFood(Number(e.target.value))}
                className="sim-range range-cyan"
              />
              <div className="sim-range-labels">
                <span>0 kkal</span>
                <span>+500 kkal</span>
                <span>+1.000 kkal</span>
              </div>
            </div>

            {/* Slider 2: Add exercise burn */}
            <div className="sim-slider-box">
              <div className="sim-slider-head">
                <span className="sim-label">
                  <Flame size={14} className="text-orange" /> Tambah Olahraga
                </span>
                <strong className="sim-val text-orange">+{simBurn} kkal</strong>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                step="50"
                value={simBurn}
                onChange={(e) => setSimBurn(Number(e.target.value))}
                className="sim-range range-orange"
              />
              <div className="sim-range-labels">
                <span>0 kkal</span>
                <span>+400 kkal</span>
                <span>+800 kkal</span>
              </div>
            </div>
          </div>

          {/* Simulator Outcome Card */}
          <div className="sim-outcome-box">
            <div className="sim-outcome-header">
              <span className="so-title">Hasil Proyeksi Simulasi:</span>
              <button
                className="btn-reset-sim"
                onClick={() => {
                  setSimFood(0);
                  setSimBurn(0);
                }}
              >
                Reset Simulasi
              </button>
            </div>
            <div className="sim-outcome-grid">
              <div className="so-item">
                <span className="so-lbl">Sisa Kalori Proyeksi</span>
                <strong className="so-num text-cyan">{simRemaining.toLocaleString('id-ID')} kkal</strong>
              </div>
              <div className="so-item">
                <span className="so-lbl">Total Defisit Harian</span>
                <strong className={`so-num ${simDeficit >= 0 ? 'text-green' : 'text-rose'}`}>
                  {simDeficit.toLocaleString('id-ID')} kkal
                </strong>
              </div>
              <div className="so-item">
                <span className="so-lbl">Estimasi Bobot / Minggu</span>
                <strong className="so-num text-orange">
                  {simDeficit > 0
                    ? `-${((simDeficit * 7) / 7700).toFixed(2)} kg`
                    : `+${((Math.abs(simDeficit) * 7) / 7700).toFixed(2)} kg`}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ENERGY BREAKDOWN METRICS: BMR, TDEE, NEAT */}
        <div className="glass-card feature-science-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-green">
                <CheckCircle2 size={12} /> Sains Kebugaran
              </span>
              <h3>Rincian Pembakaran Alami (Metabolisme)</h3>
            </div>
          </div>

          <div className="science-metrics-grid">
            <div className="sci-card">
              <div className="sci-header">
                <span className="sci-dot cyan" />
                <h4>BMR Alami</h4>
              </div>
              <span className="sci-val">{bmrValue.toLocaleString('id-ID')} kkal</span>
              <p className="sci-desc">
                Kalori yang dibakar tubuh saat istirahat total untuk fungsi organ (otak, jantung, pernapasan).
              </p>
            </div>

            <div className="sci-card">
              <div className="sci-header">
                <span className="sci-dot orange" />
                <h4>Active Exercise</h4>
              </div>
              <span className="sci-val">{burnedCalories.toLocaleString('id-ID')} kkal</span>
              <p className="sci-desc">
                Kalori yang terbakar dari sesi kardio, latihan beban, dan aktivitas jalan kaki hari ini.
              </p>
            </div>

            <div className="sci-card">
              <div className="sci-header">
                <span className="sci-dot purple" />
                <h4>Total TDEE</h4>
              </div>
              <span className="sci-val">{totalTDEE.toLocaleString('id-ID')} kkal</span>
              <p className="sci-desc">
                Total keseluruhan energi yang dikeluarkan tubuh Anda dalam 24 jam penuh.
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="feature-action-bar">
          <button className="btn-feature-action food" onClick={onOpenFood}>
            <Utensils size={16} /> Catat Makanan Sekarang
          </button>
          <button className="btn-feature-action activity" onClick={onOpenActivity}>
            <Flame size={16} /> Catat Olahraga
          </button>
        </div>
      </div>
    </div>
  );
}
