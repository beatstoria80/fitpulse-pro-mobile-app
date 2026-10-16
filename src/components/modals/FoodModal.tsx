"use client";

import React, { useState, useEffect } from 'react';
import { NutritionLog } from '../../types/fitness';

interface FoodModalProps {
  isOpen: boolean;
  defaultMeal?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  clock: string;
  onClose: () => void;
  onSave: (food: NutritionLog) => void;
}

export const FoodModal: React.FC<FoodModalProps> = ({
  isOpen,
  defaultMeal = 'lunch',
  clock,
  onClose,
  onSave
}) => {
  const [foodMeal, setFoodMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(defaultMeal);
  const [foodName, setFoodName] = useState('');
  const [foodWeight, setFoodWeight] = useState(100);
  const [foodCalories, setFoodCalories] = useState(150);
  const [foodCarbs, setFoodCarbs] = useState(10);
  const [foodProtein, setFoodProtein] = useState(15);
  const [foodFat, setFoodFat] = useState(4);

  useEffect(() => {
    if (defaultMeal) {
      setFoodMeal(defaultMeal);
    }
  }, [defaultMeal]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const newNut: NutritionLog = {
      nutrition_log_id: `NUT-${Date.now()}`,
      meal_type: foodMeal,
      time: clock,
      calories: Number(foodCalories),
      food_items: [foodName.trim()],
      protein_g: Number(foodProtein),
      carbs_g: Number(foodCarbs),
      fat_g: Number(foodFat)
    };

    onSave(newNut);
    setFoodName('');
    onClose();
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h3><i className="fa-solid fa-utensils color-orange"></i> Catat Menu Makanan</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Waktu Makan</label>
            <select value={foodMeal} onChange={(e) => setFoodMeal(e.target.value as any)} required>
              <option value="breakfast">🍳 Sarapan (Breakfast)</option>
              <option value="lunch">🍱 Makan Siang (Lunch)</option>
              <option value="snack">🍎 Camilan Sore (Snack)</option>
              <option value="dinner">🍲 Makan Malam (Dinner)</option>
            </select>
          </div>

          {/* Quick Preset Buttons */}
          <div className="form-group">
            <label>Pilihan Cepat (Menu Rekomendasi)</label>
            <div className="quick-food-tags">
              <button
                type="button"
                className="food-tag"
                onClick={() => { setFoodName('Ikan Kembung Bakar'); setFoodCalories(200); setFoodProtein(26); setFoodCarbs(0); setFoodFat(10); }}
              >
                🐟 Ikan Kembung (200 kkal)
              </button>
              <button
                type="button"
                className="food-tag"
                onClick={() => { setFoodName('Nasi Merah'); setFoodCalories(110); setFoodProtein(3); setFoodCarbs(23); setFoodFat(1); }}
              >
                🍚 Nasi Merah (110 kkal)
              </button>
              <button
                type="button"
                className="food-tag"
                onClick={() => { setFoodName('Tumis Sayur Bayam'); setFoodCalories(65); setFoodProtein(3); setFoodCarbs(5); setFoodFat(4); }}
              >
                🥬 Sayur Bayam (65 kkal)
              </button>
              <button
                type="button"
                className="food-tag"
                onClick={() => { setFoodName('Tempe Panggang'); setFoodCalories(150); setFoodProtein(15); setFoodCarbs(8); setFoodFat(6); }}
              >
                🫘 Tempe (150 kkal)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Nama Makanan</label>
            <input
              type="text"
              placeholder="Contoh: Ikan Kembung Bakar"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
            />
          </div>

          <div className="two-inputs-row">
            <div className="form-group">
              <label>Porsi / Berat (Gram)</label>
              <input
                type="number"
                value={foodWeight}
                onChange={(e) => setFoodWeight(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Total Kalori (kkal)</label>
              <input
                type="number"
                value={foodCalories}
                onChange={(e) => setFoodCalories(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="three-inputs-row">
            <div className="form-group">
              <label>Karbo (g)</label>
              <input
                type="number"
                step="0.1"
                value={foodCarbs}
                onChange={(e) => setFoodCarbs(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Protein (g)</label>
              <input
                type="number"
                step="0.1"
                value={foodProtein}
                onChange={(e) => setFoodProtein(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Lemak (g)</label>
              <input
                type="number"
                step="0.1"
                value={foodFat}
                onChange={(e) => setFoodFat(Number(e.target.value))}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit-action">
            <i className="fa-solid fa-plus"></i> Tambahkan ke Log Makanan
          </button>
        </form>
      </div>
    </div>
  );
};
