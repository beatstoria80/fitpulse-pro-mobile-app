"use client";

import React from 'react';
import { Plus, Trash2, Sun, CloudSun, Moon, Apple, Clock } from 'lucide-react';
import { AppFitnessData } from '../../types/fitness';

interface NutritionTabProps {
  data: AppFitnessData;
  consumedCalories: number;
  targetCalories: number;
  remainingCalories: number;
  totalProtein: number;
  proteinTarget: number;
  totalCarbs: number;
  carbsTarget: number;
  totalFat: number;
  fatTarget: number;
  onOpenFoodModal: (mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onDeleteNutrition: (id: string) => void;
  onSuggestLunch: () => void;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({
  data,
  consumedCalories,
  targetCalories,
  remainingCalories,
  totalProtein,
  proteinTarget,
  totalCarbs,
  carbsTarget,
  totalFat,
  fatTarget,
  onOpenFoodModal,
  onDeleteNutrition,
  onSuggestLunch,
}) => {
  return (
    <section className="tab-pane active" id="tabNutrition">
      <div className="pane-header">
        <div>
          <span className="badge-mini badge-orange">Diet & Makanan</span>
          <h1 className="pane-title">Log Nutrisi Harian</h1>
        </div>
        <button className="btn-primary-add" onClick={() => onOpenFoodModal('lunch')}>
          <Plus size={14} /> Tambah Makanan
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
            <span className="donut-sub">
              <strong>{remainingCalories}</strong> kkal
            </span>
            <span className="donut-desc">Tersisa</span>
          </div>
        </div>

        <div className="macro-pills-trio">
          <div className="macro-pill p-box">
            <span className="pill-label">Protein</span>
            <strong className="pill-val">{totalProtein}g</strong>
            <span className="pill-pct">Target {proteinTarget}g</span>
          </div>
          <div className="macro-pill c-box">
            <span className="pill-label">Karbo</span>
            <strong className="pill-val">{totalCarbs}g</strong>
            <span className="pill-pct">Target {carbsTarget}g</span>
          </div>
          <div className="macro-pill f-box">
            <span className="pill-label">Lemak</span>
            <strong className="pill-val">{totalFat}g</strong>
            <span className="pill-pct">Target {fatTarget}g</span>
          </div>
        </div>
      </div>

      {/* Meals Section Accordion/Cards */}
      <div className="meals-list-wrapper">
        {/* Breakfast */}
        <div className="glass-card meal-block">
          <div className="meal-block-header">
            <div className="meal-title-group">
              <div className="meal-icon-wrap breakfast">
                <Sun size={18} />
              </div>
              <div>
                <h4>Sarapan Pagi (Breakfast)</h4>
                <span className="meal-cal-tag">
                  {data.nutrition_logs.filter((n) => n.meal_type === 'breakfast').reduce((s, n) => s + n.calories, 0)}{' '}
                  kkal
                </span>
              </div>
            </div>
            <button
              className="btn-quick-add-meal"
              onClick={() => onOpenFoodModal('breakfast')}
              title="Tambah Sarapan"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="meal-items-list">
            {data.nutrition_logs.filter((n) => n.meal_type === 'breakfast').length === 0 ? (
              <div className="empty-meal-hint">
                <Clock size={12} /> Belum ada catatan sarapan.
              </div>
            ) : (
              data.nutrition_logs
                .filter((n) => n.meal_type === 'breakfast')
                .map((item) => (
                  <div key={item.nutrition_log_id} className="food-log-row">
                    <span className="food-name">{item.food_items.join(', ')}</span>
                    <div className="food-row-right">
                      <span className="food-cal">{item.calories} kkal</span>
                      <button
                        className="btn-delete-mini-food"
                        onClick={() => onDeleteNutrition(item.nutrition_log_id)}
                        title="Hapus makanan ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Lunch */}
        <div className="glass-card meal-block">
          <div className="meal-block-header">
            <div className="meal-title-group">
              <div className="meal-icon-wrap lunch">
                <CloudSun size={18} />
              </div>
              <div>
                <h4>Makan Siang (Lunch)</h4>
                <span className="meal-cal-tag">
                  {data.nutrition_logs.filter((n) => n.meal_type === 'lunch').reduce((s, n) => s + n.calories, 0)} kkal
                </span>
              </div>
            </div>
            <button
              className="btn-quick-add-meal"
              onClick={() => onOpenFoodModal('lunch')}
              title="Tambah Makan Siang"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="meal-items-list">
            {data.nutrition_logs.filter((n) => n.meal_type === 'lunch').length === 0 ? (
              <div className="empty-meal-hint">
                <Clock size={12} /> Belum ada catatan makan siang.
                <button className="suggest-meal-btn" onClick={onSuggestLunch}>
                  💡 Sarankan Menu Siang Sehat
                </button>
              </div>
            ) : (
              data.nutrition_logs
                .filter((n) => n.meal_type === 'lunch')
                .map((item) => (
                  <div key={item.nutrition_log_id} className="food-log-row">
                    <span className="food-name">{item.food_items.join(', ')}</span>
                    <div className="food-row-right">
                      <span className="food-cal">{item.calories} kkal</span>
                      <button
                        className="btn-delete-mini-food"
                        onClick={() => onDeleteNutrition(item.nutrition_log_id)}
                        title="Hapus makanan ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Dinner */}
        <div className="glass-card meal-block">
          <div className="meal-block-header">
            <div className="meal-title-group">
              <div className="meal-icon-wrap dinner">
                <Moon size={18} />
              </div>
              <div>
                <h4>Makan Malam (Dinner)</h4>
                <span className="meal-cal-tag">
                  {data.nutrition_logs.filter((n) => n.meal_type === 'dinner').reduce((s, n) => s + n.calories, 0)} kkal
                </span>
              </div>
            </div>
            <button
              className="btn-quick-add-meal"
              onClick={() => onOpenFoodModal('dinner')}
              title="Tambah Makan Malam"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="meal-items-list">
            {data.nutrition_logs.filter((n) => n.meal_type === 'dinner').length === 0 ? (
              <div className="empty-meal-hint">
                <Clock size={12} /> Belum ada catatan makan malam.
              </div>
            ) : (
              data.nutrition_logs
                .filter((n) => n.meal_type === 'dinner')
                .map((item) => (
                  <div key={item.nutrition_log_id} className="food-log-row">
                    <span className="food-name">{item.food_items.join(', ')}</span>
                    <div className="food-row-right">
                      <span className="food-cal">{item.calories} kkal</span>
                      <button
                        className="btn-delete-mini-food"
                        onClick={() => onDeleteNutrition(item.nutrition_log_id)}
                        title="Hapus makanan ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Snack */}
        <div className="glass-card meal-block">
          <div className="meal-block-header">
            <div className="meal-title-group">
              <div className="meal-icon-wrap snack">
                <Apple size={18} />
              </div>
              <div>
                <h4>Camilan Sehat (Snack)</h4>
                <span className="meal-cal-tag">
                  {data.nutrition_logs.filter((n) => n.meal_type === 'snack').reduce((s, n) => s + n.calories, 0)} kkal
                </span>
              </div>
            </div>
            <button
              className="btn-quick-add-meal"
              onClick={() => onOpenFoodModal('snack')}
              title="Tambah Camilan"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="meal-items-list">
            {data.nutrition_logs.filter((n) => n.meal_type === 'snack').length === 0 ? (
              <div className="empty-meal-hint">
                <Clock size={12} /> Belum ada catatan camilan.
              </div>
            ) : (
              data.nutrition_logs
                .filter((n) => n.meal_type === 'snack')
                .map((item) => (
                  <div key={item.nutrition_log_id} className="food-log-row">
                    <span className="food-name">{item.food_items.join(', ')}</span>
                    <div className="food-row-right">
                      <span className="food-cal">{item.calories} kkal</span>
                      <button
                        className="btn-delete-mini-food"
                        onClick={() => onDeleteNutrition(item.nutrition_log_id)}
                        title="Hapus camilan ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(NutritionTab);
