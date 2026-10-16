"use client";

import React from 'react';
import { AppFitnessData } from '../../types/fitness';

interface NutritionTabProps {
  data: AppFitnessData;
  consumedCalories: number;
  targetCalories: number;
  remainingCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  onOpenFoodModalForMeal: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onOpenFoodModalGeneral: () => void;
  onSuggestLunch: () => void;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({
  data,
  consumedCalories,
  targetCalories,
  remainingCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  onOpenFoodModalForMeal,
  onOpenFoodModalGeneral,
  onSuggestLunch
}) => {
  return (
    <section className="tab-pane active" id="tabNutrition">
      <div className="pane-header">
        <div>
          <span className="badge-mini badge-orange">Diet & Makanan</span>
          <h1 className="pane-title">Log Nutrisi Harian</h1>
        </div>
        <button className="btn-primary-add" onClick={onOpenFoodModalGeneral}>
          <i className="fa-solid fa-plus"></i> Tambah Makanan
        </button>
      </div>

      {/* Macro Summary Progress Card */}
      <div className="glass-card macro-full-summary-card">
        <div className="summary-macro-header">
          <div>
            <span className="macro-card-title">Asupan Kalori Masuk</span>
            <div className="big-calorie-stat">
              <strong>{consumedCalories}</strong> <small>/ {targetCalories} kkal</small>
            </div>
          </div>
          <div className="macro-donut-mini">
            <span className="donut-sub"><strong>{remainingCalories}</strong> kkal</span>
            <span className="donut-desc">Tersisa</span>
          </div>
        </div>

        <div className="macro-pills-trio">
          <div className="macro-pill p-box">
            <span className="pill-label">Protein</span>
            <strong className="pill-val">{totalProtein}g</strong>
            <span className="pill-pct">Target 135g</span>
          </div>
          <div className="macro-pill c-box">
            <span className="pill-label">Karbo</span>
            <strong className="pill-val">{totalCarbs}g</strong>
            <span className="pill-pct">Target 180g</span>
          </div>
          <div className="macro-pill f-box">
            <span className="pill-label">Lemak</span>
            <strong className="pill-val">{totalFat}g</strong>
            <span className="pill-pct">Target 50g</span>
          </div>
        </div>
      </div>

      {/* Meals Section Accordion/Cards */}
      <div className="meals-list-wrapper">
        {/* Breakfast */}
        <div className="glass-card meal-block">
          <div className="meal-block-header">
            <div className="meal-title-group">
              <div className="meal-icon-wrap breakfast"><i className="fa-solid fa-sun"></i></div>
              <div>
                <h4>Sarapan Pagi (Breakfast)</h4>
                <span className="meal-cal-tag">
                  {data.nutrition_logs.filter(n => n.meal_type === 'breakfast').reduce((s, n) => s + n.calories, 0)} kkal
                </span>
              </div>
            </div>
            <button
              className="btn-quick-add-meal"
              onClick={() => onOpenFoodModalForMeal('breakfast')}
              title="Tambah Sarapan"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className="meal-items-list">
            {data.nutrition_logs.filter(n => n.meal_type === 'breakfast').map((item) => (
              <div key={item.nutrition_log_id} className="food-log-row">
                <span className="food-name">{item.food_items.join(', ')}</span>
                <span className="food-cal">{item.calories} kkal</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lunch */}
        <div className="glass-card meal-block">
          <div className="meal-block-header">
            <div className="meal-title-group">
              <div className="meal-icon-wrap lunch"><i className="fa-solid fa-cloud-sun"></i></div>
              <div>
                <h4>Makan Siang (Lunch)</h4>
                <span className="meal-cal-tag">
                  {data.nutrition_logs.filter(n => n.meal_type === 'lunch').reduce((s, n) => s + n.calories, 0)} kkal
                </span>
              </div>
            </div>
            <button
              className="btn-quick-add-meal"
              onClick={() => onOpenFoodModalForMeal('lunch')}
              title="Tambah Makan Siang"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className="meal-items-list">
            {data.nutrition_logs.filter(n => n.meal_type === 'lunch').length === 0 ? (
              <div className="empty-meal-hint">
                <i className="fa-regular fa-clock"></i> Belum ada catatan makan siang.
                <button className="suggest-meal-btn" onClick={onSuggestLunch}>
                  💡 Sarankan Menu Siang Sehat
                </button>
              </div>
            ) : (
              data.nutrition_logs.filter(n => n.meal_type === 'lunch').map((item) => (
                <div key={item.nutrition_log_id} className="food-log-row">
                  <span className="food-name">{item.food_items.join(', ')}</span>
                  <span className="food-cal">{item.calories} kkal</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dinner */}
        <div className="glass-card meal-block">
          <div className="meal-block-header">
            <div className="meal-title-group">
              <div className="meal-icon-wrap dinner"><i className="fa-solid fa-moon"></i></div>
              <div>
                <h4>Makan Malam (Dinner)</h4>
                <span className="meal-cal-tag">
                  {data.nutrition_logs.filter(n => n.meal_type === 'dinner').reduce((s, n) => s + n.calories, 0)} kkal
                </span>
              </div>
            </div>
            <button
              className="btn-quick-add-meal"
              onClick={() => onOpenFoodModalForMeal('dinner')}
              title="Tambah Makan Malam"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className="meal-items-list">
            {data.nutrition_logs.filter(n => n.meal_type === 'dinner').length === 0 ? (
              <div className="empty-meal-hint">
                <i className="fa-regular fa-clock"></i> Belum ada catatan makan malam.
              </div>
            ) : (
              data.nutrition_logs.filter(n => n.meal_type === 'dinner').map((item) => (
                <div key={item.nutrition_log_id} className="food-log-row">
                  <span className="food-name">{item.food_items.join(', ')}</span>
                  <span className="food-cal">{item.calories} kkal</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
