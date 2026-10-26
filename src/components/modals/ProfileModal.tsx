"use client";

import React, { useState } from 'react';
import { User, X, Check } from 'lucide-react';
import { UserProfile } from '../../types/fitness';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave,
}) => {
  const [profName, setProfName] = useState(userProfile.name || 'Nandang');
  const [profAge, setProfAge] = useState(userProfile.demographics.age || 46);
  const [profGender, setProfGender] = useState(userProfile.demographics.gender || 'male');
  const [profHeight, setProfHeight] = useState(userProfile.biometrics.height_cm || 160);
  const [profWeight, setProfWeight] = useState(userProfile.biometrics.weight_kg || 69.0);
  const [profWaist, setProfWaist] = useState(userProfile.biometrics.waist_circumference_cm || 80.0);
  const [profTargetWeight, setProfTargetWeight] = useState(userProfile.fitness_goals.target_weight_kg || 58.5);
  const [profBodyFat, setProfBodyFat] = useState(userProfile.biometrics.estimated_body_fat_percentage || 26.7);
  const [profTargetBodyFat, setProfTargetBodyFat] = useState(userProfile.biometrics.target_body_fat_percentage || 22.0);
  const [profCalorieTarget, setProfCalorieTarget] = useState(userProfile.fitness_goals.daily_calorie_target || 1800);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hM = Number(profHeight) / 100;
    const bmiVal = Number((Number(profWeight) / (hM * hM)).toFixed(2));
    let bmiDesc = 'Normal';
    if (bmiVal >= 30) bmiDesc = 'Obesitas Tingkat II';
    else if (bmiVal >= 25) bmiDesc = 'Overweight / Obesitas Tingkat I';
    else if (bmiVal < 18.5) bmiDesc = 'Underweight';

    const updated: UserProfile = {
      ...userProfile,
      name: profName.trim() || 'Pengguna FitPulse',
      demographics: {
        ...userProfile.demographics,
        age: Number(profAge),
        gender: profGender,
      },
      biometrics: {
        ...userProfile.biometrics,
        height_cm: Number(profHeight),
        weight_kg: Number(profWeight),
        waist_circumference_cm: Number(profWaist),
        bmi: bmiVal,
        bmi_status: bmiDesc,
        estimated_body_fat_percentage: Number(profBodyFat),
        target_body_fat_percentage: Number(profTargetBodyFat),
      },
      fitness_goals: {
        ...userProfile.fitness_goals,
        target_weight_kg: Number(profTargetWeight),
        daily_calorie_target: Number(profCalorieTarget),
      },
    };

    onSave(updated);
  };

  return (
    <div className="modal-backdrop active" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3>
            <User size={18} className="color-blue" /> Profil Biometrik Pengguna
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ margin: 0 }}>Nama Lengkap</label>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                ID: {userProfile.user_id}
              </span>
            </div>
            <input
              type="text"
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
              placeholder="Nama Anda"
              required
            />
          </div>
          <div className="two-inputs-row">
            <div className="form-group">
              <label>Usia (Tahun)</label>
              <input
                type="number"
                value={profAge}
                onChange={(e) => setProfAge(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Jenis Kelamin</label>
              <select value={profGender} onChange={(e) => setProfGender(e.target.value)}>
                <option value="male">Pria</option>
                <option value="female">Wanita</option>
              </select>
            </div>
          </div>

          <div className="two-inputs-row">
            <div className="form-group">
              <label>Tinggi Badan (cm)</label>
              <input
                type="number"
                step="0.1"
                value={profHeight}
                onChange={(e) => setProfHeight(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Berat Badan Saat Ini (kg)</label>
              <input
                type="number"
                step="0.1"
                value={profWeight}
                onChange={(e) => setProfWeight(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="two-inputs-row">
            <div className="form-group">
              <label>Lingkar Perut (cm)</label>
              <input
                type="number"
                step="0.5"
                value={profWaist}
                onChange={(e) => setProfWaist(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Target Berat Badan (kg)</label>
              <input
                type="number"
                step="0.1"
                value={profTargetWeight}
                onChange={(e) => setProfTargetWeight(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="two-inputs-row">
            <div className="form-group">
              <label>Lemak Tubuh Saat Ini (%)</label>
              <input
                type="number"
                step="0.1"
                value={profBodyFat}
                onChange={(e) => setProfBodyFat(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Target Lemak Tubuh (%)</label>
              <input
                type="number"
                step="0.1"
                value={profTargetBodyFat}
                onChange={(e) => setProfTargetBodyFat(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Target Kalori Harian (kkal)</label>
            <input
              type="number"
              value={profCalorieTarget}
              onChange={(e) => setProfCalorieTarget(Number(e.target.value))}
              required
            />
          </div>

          <button type="submit" className="btn-submit-action">
            <Check size={16} /> Simpan Perubahan Profil
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
