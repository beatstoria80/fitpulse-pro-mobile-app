"use client";

import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Sparkles,
  Info,
  Apple,
  Sun,
  CloudSun,
  Moon,
  Trash2,
} from 'lucide-react';
import { AppFitnessData } from '../../types/fitness';
import { BackIcon, SnackIcon } from '../icons/FeatureIcons';

interface NutritionDetailViewProps {
  data: AppFitnessData;
  consumedCalories: number;
  targetCalories: number;
  onBack: () => void;
  onOpenFoodModal: (mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onDeleteFood: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export default function NutritionDetailView({
  data,
  consumedCalories,
  targetCalories,
  onBack,
  onOpenFoodModal,
  onDeleteFood,
  onShowToast,
}: NutritionDetailViewProps) {
  const [selectedMealFilter, setSelectedMealFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');

  // Compute total macros consumed from logs
  const protein_g = data.nutrition_logs.reduce((s, i) => s + (i.protein_g || 0), 0);
  const carbs_g = data.nutrition_logs.reduce((s, i) => s + (i.carbs_g || 0), 0);
  const fat_g = data.nutrition_logs.reduce((s, i) => s + (i.fat_g || 0), 0);

  // Targets (standard 30% protein, 45% carbs, 25% fat)
  const targetProtein = Math.round((targetCalories * 0.3) / 4) || 135;
  const targetCarbs = Math.round((targetCalories * 0.45) / 4) || 180;
  const targetFat = Math.round((targetCalories * 0.25) / 9) || 60;

  const proteinPct = Math.min(100, Math.round((protein_g / (targetProtein || 1)) * 100));
  const carbsPct = Math.min(100, Math.round((carbs_g / (targetCarbs || 1)) * 100));
  const fatPct = Math.min(100, Math.round((fat_g / (targetFat || 1)) * 100));

  // Filter food logs by meal type
  const filteredMeals = data.nutrition_logs.filter((item) => {
    if (selectedMealFilter === 'all') return true;
    return item.meal_type === selectedMealFilter;
  });

  // Calculate calories per meal category
  const mealCalSummary = {
    breakfast: data.nutrition_logs
      .filter((i) => i.meal_type === 'breakfast')
      .reduce((s, i) => s + i.calories, 0),
    lunch: data.nutrition_logs
      .filter((i) => i.meal_type === 'lunch')
      .reduce((s, i) => s + i.calories, 0),
    dinner: data.nutrition_logs
      .filter((i) => i.meal_type === 'dinner')
      .reduce((s, i) => s + i.calories, 0),
    snack: data.nutrition_logs
      .filter((i) => i.meal_type === 'snack')
      .reduce((s, i) => s + i.calories, 0),
  };

  // Healthy food recommendation data (Indonesian local nutrition)
  const healthyRecommendations = [
    {
      name: 'Dada Ayam Panggang Herbal',
      cals: 220,
      protein: 36,
      carbs: 2,
      fat: 4,
      desc: 'Tinggi protein murni & rendah lemak jenuh.',
      badge: 'High Protein',
    },
    {
      name: 'Tempe Bacem Bakar & Nasi Merah',
      cals: 310,
      protein: 18,
      carbs: 42,
      fat: 6,
      desc: 'Probiotik nabati alami & karbohidrat kompleks berserat.',
      badge: 'Fiber Rich',
    },
    {
      name: 'Gado-Gado Telur Rebus (Saus Kacang Ringan)',
      cals: 280,
      protein: 16,
      carbs: 26,
      fat: 9,
      desc: 'Kaya vitamin antioksidan & fitonutrien sayuran hijau.',
      badge: 'Nutrient Dense',
    },
    {
      name: 'Pepes Ikan Kembung Daun Kemangi',
      cals: 240,
      protein: 28,
      carbs: 3,
      fat: 8,
      desc: 'Omega-3 tinggi untuk kesehatan jantung dan pemulihan otot.',
      badge: 'Omega-3',
    },
  ];

  return (
    <div className="feature-detail-page nutrition-detail-page">
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
          <span className="badge-mini badge-green">
            <Utensils size={12} /> Nutrisi & Diet Sehat
          </span>
          <h2>Pusat Makronutrien & Pola Makan</h2>
        </div>
        <button
          className="feature-info-btn"
          onClick={() =>
            onShowToast(
              `Target makro harian: Protein ${targetProtein}g, Karbohidrat ${targetCarbs}g, Lemak ${targetFat}g.`
            )
          }
          title="Info Target Nutrisi"
        >
          <Info size={18} />
        </button>
      </div>

      <div className="feature-detail-content">
        {/* HERO 3D CHARACTER STAGE WITH PERIMETER OVERLAY HUD */}
        <div className="feature-hero-stage nutrition-theme">
          {/* Ambient Floor Shadow */}
          <div className="character-stage-shadow" />

          {/* 3D Character Looping Video - Blended seamlessly without black box */}
          <video
            className="character-stage-video"
            src="/character_eating_healthy_food.mp4"
            autoPlay
            loop
            muted
            playsInline
          />

          {/* Floating UI/UX Perimeter Overlay (Does not cover/touch character) */}
          <div className="stage-overlay-container">
            {/* Top Bar Overlay */}
            <div className="stage-overlay-top">
              <div className="overlay-pill-badge green">
                <Utensils size={13} />
                <span>Nutrisi & Diet Sehat</span>
              </div>
              <div className="overlay-live-indicator">
                <span className="live-video-dot green" />
                <span>3D Companion</span>
              </div>
            </div>

            {/* Mid Flank Floating Metric Chips (Left & Right safe zones) */}
            <div className="stage-overlay-flanks">
              <div className="flank-glass-chip left">
                <div className="flank-chip-header">
                  <Apple size={11} className="text-green" />
                  <span>Asupan</span>
                </div>
                <div className="flank-chip-val text-green">{consumedCalories}</div>
                <div className="flank-chip-sub">/ {targetCalories} kkal</div>
              </div>

              <div className="flank-glass-chip right">
                <div className="flank-chip-header">
                  <Sparkles size={11} className="text-cyan" />
                  <span>Protein</span>
                </div>
                <div className="flank-chip-val text-cyan">{protein_g}g</div>
                <div className="flank-chip-sub">{proteinPct}% target</div>
              </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="stage-overlay-bottom">
              <p className="stage-bottom-text">
                <strong>Bahan bakar metabolisme prima!</strong> Asupan tercatat {consumedCalories} kkal hari ini.
              </p>
              <button
                className="stage-cta-btn green"
                onClick={() => onOpenFoodModal('lunch')}
              >
                <Plus size={13} />
                <span>Catat Menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* QUICK MACRO BREAKDOWN CHIPS */}
        <div className="hero-quick-stats">
          <div className="h-stat-box">
            <span className="h-stat-label">Protein</span>
            <span className="h-stat-num text-green">{protein_g}g</span>
            <span className="h-stat-unit">/ {targetProtein}g ({proteinPct}%)</span>
          </div>
          <div className="h-stat-box">
            <span className="h-stat-label">Karbohidrat</span>
            <span className="h-stat-num text-cyan">{carbs_g}g</span>
            <span className="h-stat-unit">/ {targetCarbs}g ({carbsPct}%)</span>
          </div>
          <div className="h-stat-box">
            <span className="h-stat-label">Lemak Sehat</span>
            <span className="h-stat-num text-orange">{fat_g}g</span>
            <span className="h-stat-unit">/ {targetFat}g ({fatPct}%)</span>
          </div>
        </div>

        {/* RADIAL MACRONUTRIENT PROGRESS MATRIX */}
        <div className="glass-card feature-macro-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-green">
                <Apple size={12} /> Rasio Nutrisi
              </span>
              <h3>Distribusi 3 Makronutrien Utama</h3>
            </div>
            <span className="macro-ratio-tag">40P / 40C / 20F</span>
          </div>

          <div className="macro-matrix-layout">
            {/* Multi-layered Circular Ring Graphic */}
            <div className="radial-rings-wrapper">
              <svg viewBox="0 0 160 160" className="radial-rings-svg">
                {/* Background tracks */}
                <circle cx="80" cy="80" r="66" className="r-track" strokeWidth="8" />
                <circle cx="80" cy="80" r="52" className="r-track" strokeWidth="8" />
                <circle cx="80" cy="80" r="38" className="r-track" strokeWidth="8" />

                {/* Protein Ring (Outer - Radius 66, Circumference ~414.7) */}
                <circle
                  cx="80"
                  cy="80"
                  r="66"
                  className="r-fill protein"
                  strokeWidth="8"
                  strokeDasharray="414.7"
                  strokeDashoffset={414.7 - (414.7 * proteinPct) / 100}
                />

                {/* Carbs Ring (Middle - Radius 52, Circumference ~326.7) */}
                <circle
                  cx="80"
                  cy="80"
                  r="52"
                  className="r-fill carbs"
                  strokeWidth="8"
                  strokeDasharray="326.7"
                  strokeDashoffset={326.7 - (326.7 * carbsPct) / 100}
                />

                {/* Fat Ring (Inner - Radius 38, Circumference ~238.8) */}
                <circle
                  cx="80"
                  cy="80"
                  r="38"
                  className="r-fill fat"
                  strokeWidth="8"
                  strokeDasharray="238.8"
                  strokeDashoffset={238.8 - (238.8 * fatPct) / 100}
                />
              </svg>

              <div className="radial-center-badge">
                <span className="rc-cals">{consumedCalories}</span>
                <span className="rc-lbl">kkal masuk</span>
              </div>
            </div>

            {/* Macro Detail Progress Bars */}
            <div className="macro-bars-list">
              {/* Protein */}
              <div className="m-bar-row">
                <div className="m-bar-info">
                  <span className="m-dot protein" />
                  <span className="m-name">Protein</span>
                  <strong className="m-val">{protein_g} / {targetProtein}g</strong>
                  <span className="m-pct text-green">{proteinPct}%</span>
                </div>
                <div className="m-track">
                  <div className="m-fill protein" style={{ width: `${proteinPct}%` }} />
                </div>
              </div>

              {/* Carbs */}
              <div className="m-bar-row">
                <div className="m-bar-info">
                  <span className="m-dot carbs" />
                  <span className="m-name">Karbohidrat</span>
                  <strong className="m-val">{carbs_g} / {targetCarbs}g</strong>
                  <span className="m-pct text-cyan">{carbsPct}%</span>
                </div>
                <div className="m-track">
                  <div className="m-fill carbs" style={{ width: `${carbsPct}%` }} />
                </div>
              </div>

              {/* Fat */}
              <div className="m-bar-row">
                <div className="m-bar-info">
                  <span className="m-dot fat" />
                  <span className="m-name">Lemak</span>
                  <strong className="m-val">{fat_g} / {targetFat}g</strong>
                  <span className="m-pct text-orange">{fatPct}%</span>
                </div>
                <div className="m-track">
                  <div className="m-fill fat" style={{ width: `${fatPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MEAL TIMELINE & LOGS */}
        <div className="glass-card feature-timeline-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-cyan">
                <Utensils size={12} /> Waktu Makan
              </span>
              <h3>Riwayat & Jadwal Makan Hari Ini</h3>
            </div>
            <button
              className="btn-quick-add-food"
              onClick={() => onOpenFoodModal('lunch')}
            >
              <Plus size={14} /> Catat Menu
            </button>
          </div>

          {/* Meal Filter Pills */}
          <div className="meal-filter-tabs">
            <button
              className={`m-tab-btn ${selectedMealFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedMealFilter('all')}
            >
              Semua ({data.nutrition_logs.length})
            </button>
            <button
              className={`m-tab-btn ${selectedMealFilter === 'breakfast' ? 'active' : ''}`}
              onClick={() => setSelectedMealFilter('breakfast')}
            >
              <Sun size={12} /> Sarapan ({mealCalSummary.breakfast} kkal)
            </button>
            <button
              className={`m-tab-btn ${selectedMealFilter === 'lunch' ? 'active' : ''}`}
              onClick={() => setSelectedMealFilter('lunch')}
            >
              <CloudSun size={12} /> Siang ({mealCalSummary.lunch} kkal)
            </button>
            <button
              className={`m-tab-btn ${selectedMealFilter === 'dinner' ? 'active' : ''}`}
              onClick={() => setSelectedMealFilter('dinner')}
            >
              <Moon size={12} /> Malam ({mealCalSummary.dinner} kkal)
            </button>
            <button
              className={`m-tab-btn ${selectedMealFilter === 'snack' ? 'active' : ''}`}
              onClick={() => setSelectedMealFilter('snack')}
            >
              <SnackIcon size={12} /> Camilan ({mealCalSummary.snack} kkal)
            </button>
          </div>

          {/* Meals List */}
          <div className="meals-log-list">
            {filteredMeals.length > 0 ? (
              filteredMeals.map((item) => {
                const foodName =
                  typeof item.food_items?.[0] === 'string'
                    ? item.food_items[0]
                    : item.food_items?.[0]?.name || 'Menu Makanan';

                return (
                  <div key={item.nutrition_log_id} className="meal-log-item-card">
                    <div className="m-log-icon-box">
                      {item.meal_type === 'breakfast' && <Sun size={18} className="text-orange" />}
                      {item.meal_type === 'lunch' && <CloudSun size={18} className="text-cyan" />}
                      {item.meal_type === 'dinner' && <Moon size={18} className="text-purple" />}
                      {item.meal_type === 'snack' && <SnackIcon size={18} className="text-pink" />}
                    </div>

                    <div className="m-log-body">
                      <div className="m-log-top">
                        <strong className="m-log-name">{foodName}</strong>
                        <span className="m-log-cals">{item.calories} kkal</span>
                      </div>
                    <div className="m-log-meta">
                      <span className="m-log-time">{item.time}</span>
                      <span className="m-log-macros">
                        P: {item.protein_g}g • C: {item.carbs_g}g • F: {item.fat_g}g
                      </span>
                    </div>
                  </div>

                  <button
                    className="m-log-del-btn"
                    onClick={() => onDeleteFood(item.nutrition_log_id)}
                    title="Hapus Makanan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
            ) : (
              <div className="meal-empty-state">
                <Utensils size={28} className="text-tertiary" />
                <p>Belum ada makanan dicatat untuk kategori ini.</p>
                <button
                  className="btn-add-meal-empty"
                  onClick={() =>
                    onOpenFoodModal(
                      selectedMealFilter === 'all' ? 'lunch' : selectedMealFilter
                    )
                  }
                >
                  <Plus size={14} /> Tambah Makanan Sekarang
                </button>
              </div>
            )}
          </div>
        </div>

        {/* HEALTHY FOOD RECOMMENDATIONS */}
        <div className="glass-card feature-recommend-card">
          <div className="card-header-clean">
            <div className="card-title-group">
              <span className="badge-mini badge-violet">
                <Sparkles size={12} /> Rekomendasi Menu AI
              </span>
              <h3>Menu Sehat Pilihan Ahli Gizi</h3>
            </div>
          </div>

          <div className="rec-food-grid">
            {healthyRecommendations.map((rec, idx) => (
              <div key={idx} className="rec-food-card">
                <div className="rec-food-top">
                  <span className="rec-food-badge">{rec.badge}</span>
                  <span className="rec-food-cals">{rec.cals} kkal</span>
                </div>
                <h4 className="rec-food-title">{rec.name}</h4>
                <p className="rec-food-desc">{rec.desc}</p>
                <div className="rec-food-footer">
                  <span className="rec-food-macros">
                    P: {rec.protein}g • C: {rec.carbs}g • F: {rec.fat}g
                  </span>
                  <button
                    className="btn-log-rec"
                    onClick={() => {
                      onOpenFoodModal('lunch');
                      onShowToast(`Membuka pencatatan untuk: ${rec.name}`);
                    }}
                  >
                    + Catat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
