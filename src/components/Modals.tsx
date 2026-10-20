"use client";

import React, { useState } from 'react';
import { X, Flame, Utensils, Droplet, Database } from 'lucide-react';

/* ---------------- ACTIVITY MODAL ---------------- */
interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    activity_type: string;
    duration_minutes: number;
    intensity_level: 'low' | 'medium' | 'high' | 'vigorous';
    calories_burned: number;
    average_heart_rate?: number;
    steps_counted?: number;
  }) => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState('Skateboard');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high' | 'vigorous'>('medium');
  const [heartRate, setHeartRate] = useState<string>('120');
  const [steps, setSteps] = useState<string>('');

  if (!isOpen) return null;

  // Auto calculate estimated calories
  const calculateCalories = () => {
    let met = 5.0; // default medium
    if (type === 'Skateboard') met = 5.5;
    else if (type === 'Lari') met = 8.0;
    else if (type === 'Bersepeda') met = 6.0;
    else if (type === 'Gym / Angkat Beban') met = 5.0;
    else if (type === 'Jalan Cepat') met = 3.8;
    else if (type === 'Renang') met = 7.0;

    let multiplier = 1.0;
    if (intensity === 'low') multiplier = 0.8;
    else if (intensity === 'high') multiplier = 1.25;
    else if (intensity === 'vigorous') multiplier = 1.5;

    // formula approx: (MET * 3.5 * weightKg / 200) * duration
    const weightKg = 69.0;
    return Math.round(((met * multiplier * 3.5 * weightKg) / 200) * duration);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      activity_type: type,
      duration_minutes: Number(duration),
      intensity_level: intensity,
      calories_burned: calculateCalories(),
      average_heart_rate: heartRate ? Number(heartRate) : undefined,
      steps_counted: steps ? Number(steps) : undefined
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Flame size={18} className="text-warning" />
            <h3 className="modal-title">Tambah Aktivitas Fisik</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Jenis Aktivitas</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="Skateboard">🛹 Skateboard</option>
              <option value="Lari">🏃 Lari / Jogging</option>
              <option value="Bersepeda">🚴 Bersepeda</option>
              <option value="Gym / Angkat Beban">🏋️ Gym / Angkat Beban</option>
              <option value="Jalan Cepat">🚶 Jalan Cepat</option>
              <option value="Renang">🏊 Renang</option>
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Durasi (Menit)</label>
              <input
                type="number"
                min="5"
                max="300"
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Intensitas</label>
              <select
                className="form-select"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as 'low' | 'medium' | 'high' | 'vigorous')}
              >
                <option value="low">Rendah (Santai)</option>
                <option value="medium">Sedang (Standar)</option>
                <option value="high">Tinggi (Berkeringat)</option>
                <option value="vigorous">Maksimal (HIIT)</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Detak Jantung (bpm)</label>
              <input
                type="number"
                placeholder="cth: 125"
                className="form-input"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Langkah (Opsional)</label>
              <input
                type="number"
                placeholder="cth: 3000"
                className="form-input"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
              />
            </div>
          </div>

          <div className="cal-preview-box">
            <span>Estimasi Terbakar:</span>
            <span className="cal-preview-val">🔥 ~{calculateCalories()} kkal</span>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Batal</button>
            <button type="submit" className="btn-submit">Simpan Aktivitas</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- NUTRITION MODAL ---------------- */
interface NutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }) => void;
}

export const NutritionModal: React.FC<NutritionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState(420);
  const [protein, setProtein] = useState(25);
  const [carbs, setCarbs] = useState(45);
  const [fat, setFat] = useState(12);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;
    onSubmit({
      meal_type: mealType,
      food_name: foodName.trim(),
      calories: Number(calories),
      protein_g: Number(protein),
      carbs_g: Number(carbs),
      fat_g: Number(fat)
    });
    setFoodName('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Utensils size={18} className="text-success" />
            <h3 className="modal-title">Tambah Makanan & Nutrisi</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Waktu Makan</label>
            <select
              className="form-select"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
            >
              <option value="breakfast">🥣 Sarapan Pagi</option>
              <option value="lunch">🥗 Makan Siang</option>
              <option value="dinner">🍲 Makan Malam</option>
              <option value="snack">🍎 Camilan Sehat</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Makanan / Minuman</label>
            <input
              type="text"
              placeholder="cth: Dada ayam panggang + nasi merah"
              className="form-input"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Kalori (kkal)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Protein (gram)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Karbohidrat (gram)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lemak (gram)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Batal</button>
            <button type="submit" className="btn-submit">Simpan Makanan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- HYDRATION MODAL ---------------- */
interface HydrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amountMl: number) => void;
}

export const HydrationModal: React.FC<HydrationModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState(300);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    onSubmit(Number(amount));
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Droplet size={18} className="text-info" />
            <h3 className="modal-title">Catat Asupan Air Minum</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Jumlah Air (Mililiter)</label>
            <input
              type="number"
              min="50"
              max="2000"
              step="50"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>

          <div className="quick-chip-row">
            <button type="button" onClick={() => setAmount(200)} className="chip-btn">200ml</button>
            <button type="button" onClick={() => setAmount(330)} className="chip-btn">330ml</button>
            <button type="button" onClick={() => setAmount(500)} className="chip-btn">500ml</button>
            <button type="button" onClick={() => setAmount(600)} className="chip-btn">600ml</button>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Batal</button>
            <button type="submit" className="btn-submit">Catat Minum</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- SUPABASE MODAL ---------------- */
interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabaseUrl: string;
  supabaseKey: string;
  isCloudSync: boolean;
  isSyncing: boolean;
  onSave: (url: string, key: string) => void;
  onSyncNow: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  supabaseUrl,
  supabaseKey,
  isCloudSync,
  onSave
}) => {
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseKey);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(url.trim(), key.trim());
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Database size={18} className="text-cyan" />
            <h3 className="modal-title">Pengaturan Cloud Database</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="cloud-status-banner">
            <div className={`status-circle ${isCloudSync ? 'online' : 'offline'}`}></div>
            <span>{isCloudSync ? 'Tersambung ke Supabase Cloud' : 'Mode Penyimpanan Lokal (Offline)'}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Project URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon Public Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">Tutup</button>
            <button type="submit" className="btn-submit">Sambungkan</button>
          </div>
        </form>
      </div>
    </div>
  );
};
