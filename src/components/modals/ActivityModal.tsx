"use client";

import React, { useState } from 'react';
import { Dumbbell, X, Check } from 'lucide-react';
import { ActivityLog } from '../../types/fitness';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userWeightKg: number;
  onSave: (activity: ActivityLog) => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  userWeightKg,
  onSave,
}) => {
  const [actType, setActType] = useState('Skateboard');
  const [actDuration, setActDuration] = useState(30);
  const [actIntensity, setActIntensity] = useState<'low' | 'medium' | 'high' | 'vigorous'>('medium');
  const [actHeartRate, setActHeartRate] = useState('120');
  const [actSteps, setActSteps] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let met = 5.0;
    if (actType === 'Skateboard') met = 5.5;
    else if (actType.includes('Lari')) met = 8.0;
    else if (actType.includes('Walking')) met = 3.8;
    else if (actType.includes('Sepeda')) met = 6.0;
    else if (actType.includes('Beban')) met = 5.0;

    const mult = actIntensity === 'low' ? 0.8 : actIntensity === 'high' || actIntensity === 'vigorous' ? 1.3 : 1.0;
    const burned = Math.round(((met * mult * 3.5 * (userWeightKg || 65)) / 200) * actDuration);

    const newAct: ActivityLog = {
      activity_log_id: `ACT-${Date.now()}`,
      activity_type: actType,
      timestamp_start: new Date().toISOString(),
      metrics: {
        duration_minutes: Number(actDuration),
        intensity_level: actIntensity,
        calories_burned: burned,
        average_heart_rate: actHeartRate ? Number(actHeartRate) : null,
        steps_counted: actSteps ? Number(actSteps) : null,
      },
      device_source: 'FitPulse Pro Mobile',
    };

    onSave(newAct);
  };

  return (
    <div className="modal-backdrop active" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3>
            <Dumbbell size={18} className="color-green" /> Catat Sesi Latihan
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Jenis Aktivitas</label>
            <select value={actType} onChange={(e) => setActType(e.target.value)} required>
              <option value="Skateboard">🛹 Skateboard</option>
              <option value="Power Walking">🚶‍♂️ Power Walking</option>
              <option value="Jogging / Lari Santai">🏃 Jogging / Lari Santai</option>
              <option value="Bersepeda">🚴 Sepeda Santai / Statis</option>
              <option value="Latihan Beban (Gym)">🏋️ Latihan Beban / Gym</option>
              <option value="Berenang">🏊 Renang</option>
              <option value="HIIT / Senam Kalistenik">⚡ HIIT / Kalistenik</option>
            </select>
          </div>

          <div className="two-inputs-row">
            <div className="form-group">
              <label>Durasi (Menit)</label>
              <input
                type="number"
                min="5"
                max="300"
                value={actDuration}
                onChange={(e) => setActDuration(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Intensitas</label>
              <select
                value={actIntensity}
                onChange={(e) => setActIntensity(e.target.value as 'low' | 'medium' | 'high' | 'vigorous')}
              >
                <option value="low">Rendah (Santai)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (Intensif)</option>
                <option value="vigorous">Maksimal (HIIT)</option>
              </select>
            </div>
          </div>

          <div className="two-inputs-row">
            <div className="form-group">
              <label>Rata-rata Heart Rate (bpm)</label>
              <input
                type="number"
                min="60"
                max="200"
                value={actHeartRate}
                onChange={(e) => setActHeartRate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Langkah (Opsional)</label>
              <input
                type="number"
                placeholder="cth: 3000"
                value={actSteps}
                onChange={(e) => setActSteps(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-submit-action">
            <Check size={16} /> Simpan Aktivitas
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivityModal;
