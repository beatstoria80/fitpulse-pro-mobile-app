"use client";

import React, { useState } from 'react';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: {
    type: string;
    duration: number;
    intensity: 'low' | 'medium' | 'high';
    heartRate?: number;
    steps?: number;
    calories: number;
  }) => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, onSave }) => {
  const [actType, setActType] = useState('Skateboard');
  const [actDuration, setActDuration] = useState(30);
  const [actIntensity, setActIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [actHeartRate, setActHeartRate] = useState('120');
  const [actSteps, setActSteps] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let met = 5.0;
    if (actType === 'Skateboard') met = 5.5;
    else if (actType.includes('Walking')) met = 3.8;
    else if (actType.includes('Jogging') || actType.includes('Lari')) met = 8.0;
    else if (actType.includes('Sepeda')) met = 6.0;
    else if (actType.includes('Beban') || actType.includes('Gym')) met = 5.0;
    else if (actType.includes('Renang')) met = 7.0;
    else if (actType.includes('HIIT') || actType.includes('Kalistenik')) met = 8.5;

    let multiplier = 1.0;
    if (actIntensity === 'low') multiplier = 0.8;
    else if (actIntensity === 'high') multiplier = 1.25;

    const burned = Math.round(((met * multiplier * 3.5 * 69.0) / 200) * Number(actDuration));

    onSave({
      type: actType,
      duration: Number(actDuration),
      intensity: actIntensity,
      heartRate: actHeartRate ? Number(actHeartRate) : undefined,
      steps: actSteps ? Number(actSteps) : undefined,
      calories: burned
    });
    onClose();
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h3><i className="fa-solid fa-dumbbell color-green"></i> Catat Sesi Latihan</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
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
              <select value={actIntensity} onChange={(e) => setActIntensity(e.target.value as any)}>
                <option value="low">Rendah (Santai)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (Intensif)</option>
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
            <i className="fa-solid fa-check"></i> Simpan Aktivitas
          </button>
        </form>
      </div>
    </div>
  );
};
