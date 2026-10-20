"use client";

import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { NutritionLog } from '../types/fitness';

interface NutritionTabProps {
  nutritionLogs: NutritionLog[];
  onOpenAddModal: () => void;
  onSuggestLunch: () => void;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({
  nutritionLogs,
  onOpenAddModal,
  onSuggestLunch
}) => {
  const totalProtein = nutritionLogs.reduce((sum, n) => sum + (n.protein_g || 0), 0);
  const totalCarbs = nutritionLogs.reduce((sum, n) => sum + (n.carbs_g || 0), 0);
  const totalFat = nutritionLogs.reduce((sum, n) => sum + (n.fat_g || 0), 0);

  const targetProtein = 120; // 120g
  const targetCarbs = 180;   // 180g
  const targetFat = 50;      // 50g

  const getMealTitle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return 'Sarapan Pagi';
      case 'lunch':
        return 'Makan Siang';
      case 'dinner':
        return 'Makan Malam';
      case 'snack':
        return 'Camilan Sehat';
      default:
        return 'Makanan';
    }
  };

  const getMealEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return '🥣';
      case 'lunch':
        return '🥗';
      case 'dinner':
        return '🍲';
      default:
        return '🍎';
    }
  };

  return (
    <div className="tab-pane active">
      {/* Nutrition Head */}
      <div className="section-head-row">
        <div>
          <h2 className="section-title">Nutrisi & Makronutrien</h2>
          <span className="section-sub">Keseimbangan protein, karbohidrat, dan lemak sehat</span>
        </div>
        <button onClick={onOpenAddModal} className="btn-primary-sm">
          <Plus size={14} />
          <span>Tambah</span>
        </button>
      </div>

      {/* AI Suggest Lunch Banner */}
      <div className="ai-suggest-banner glass-panel">
        <div className="banner-left">
          <div className="ai-sparkle-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="banner-title">Rekomendasi Menu Makan Siang</h4>
            <p className="banner-desc">Menu tinggi protein & rendah kalori yang pas untuk target 58.5 kg</p>
          </div>
        </div>
        <button onClick={onSuggestLunch} className="btn-ai-action">
          Saran Menu
        </button>
      </div>

      {/* Macros Distribution Card */}
      <div className="macros-card glass-panel">
        <div className="macro-bar-row">
          {/* Protein */}
          <div className="macro-item">
            <div className="macro-header">
              <span className="macro-dot protein"></span>
              <span className="name">Protein</span>
            </div>
            <div className="macro-numbers">
              <span className="current">{totalProtein}g</span>
              <span className="target">/ {targetProtein}g</span>
            </div>
            <div className="macro-bar-bg">
              <div
                className="macro-bar-fill protein"
                style={{ width: `${Math.min(100, Math.round((totalProtein / targetProtein) * 100))}%` }}
              ></div>
            </div>
          </div>

          {/* Carbs */}
          <div className="macro-item">
            <div className="macro-header">
              <span className="macro-dot carbs"></span>
              <span className="name">Karbohidrat</span>
            </div>
            <div className="macro-numbers">
              <span className="current">{totalCarbs}g</span>
              <span className="target">/ {targetCarbs}g</span>
            </div>
            <div className="macro-bar-bg">
              <div
                className="macro-bar-fill carbs"
                style={{ width: `${Math.min(100, Math.round((totalCarbs / targetCarbs) * 100))}%` }}
              ></div>
            </div>
          </div>

          {/* Fat */}
          <div className="macro-item">
            <div className="macro-header">
              <span className="macro-dot fat"></span>
              <span className="name">Lemak</span>
            </div>
            <div className="macro-numbers">
              <span className="current">{totalFat}g</span>
              <span className="target">/ {targetFat}g</span>
            </div>
            <div className="macro-bar-bg">
              <div
                className="macro-bar-fill fat"
                style={{ width: `${Math.min(100, Math.round((totalFat / targetFat) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Food logs list */}
      <div className="nutrition-logs-list">
        {nutritionLogs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🍽️</span>
            <p>Belum ada catatan makanan hari ini.</p>
          </div>
        ) : (
          nutritionLogs.map((item) => (
            <div key={item.nutrition_log_id} className="meal-card glass-panel">
              <div className="meal-top">
                <div className="meal-type-badge">
                  <span className="meal-emoji">{getMealEmoji(item.meal_type)}</span>
                  <div>
                    <h4 className="meal-title">{getMealTitle(item.meal_type)}</h4>
                    <span className="meal-time">{item.time} WIB</span>
                  </div>
                </div>
                <div className="meal-cal-tag">
                  <span>{item.calories} kkal</span>
                </div>
              </div>

              <div className="food-items-tags">
                {item.food_items.map((food, fIdx) => (
                  <span key={fIdx} className="food-pill">
                    {typeof food === 'string' ? food : food.name}
                  </span>
                ))}
              </div>

              <div className="meal-macros-mini">
                <span className="macro-mini-tag protein">P: {item.protein_g}g</span>
                <span className="macro-mini-tag carbs">K: {item.carbs_g}g</span>
                <span className="macro-mini-tag fat">L: {item.fat_g}g</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
