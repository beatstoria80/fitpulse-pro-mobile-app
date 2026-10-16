"use client";

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/fitness';

interface ProfileModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  userProfile,
  onClose,
  onSave
}) => {
  const [profAge, setProfAge] = useState(userProfile.demographics.age);
  const [profGender, setProfGender] = useState(userProfile.demographics.gender);
  const [profHeight, setProfHeight] = useState(userProfile.biometrics.height_cm);
  const [profWeight, setProfWeight] = useState(userProfile.biometrics.weight_kg);
  const [profTargetWeight, setProfTargetWeight] = useState(userProfile.fitness_goals.target_weight_kg);
  const [profBodyFat, setProfBodyFat] = useState(userProfile.biometrics.estimated_body_fat_percentage);
  const [profTargetBodyFat, setProfTargetBodyFat] = useState(userProfile.biometrics.target_body_fat_percentage);
  const [profCalorieTarget, setProfCalorieTarget] = useState(userProfile.fitness_goals.daily_calorie_target);

  useEffect(() => {
    setProfAge(userProfile.demographics.age);
    setProfGender(userProfile.demographics.gender);
    setProfHeight(userProfile.biometrics.height_cm);
    setProfWeight(userProfile.biometrics.weight_kg);
    setProfTargetWeight(userProfile.fitness_goals.target_weight_kg);
    setProfBodyFat(userProfile.biometrics.estimated_body_fat_percentage);
    setProfTargetBodyFat(userProfile.biometrics.target_body_fat_percentage);
    setProfCalorieTarget(userProfile.fitness_goals.daily_calorie_target);
  }, [userProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const heightM = Number(profHeight) / 100;
    const newBmi = Number((Number(profWeight) / (heightM * heightM)).toFixed(2));
    let bmiStatus = 'Normal';
    if (newBmi < 18.5) bmiStatus = 'Underweight';
    else if (newBmi >= 25 && newBmi < 30) bmiStatus = 'Overweight / Obesity Class I';
    else if (newBmi >= 30) bmiStatus = 'Obesity Class II';

    const updatedProfile: UserProfile = {
      ...userProfile,
      demographics: {
        ...userProfile.demographics,
        age: Number(profAge),
        gender: profGender as any
      },
      biometrics: {
        ...userProfile.biometrics,
        height_cm: Number(profHeight),
        weight_kg: Number(profWeight),
        bmi: newBmi,
        bmi_status: bmiStatus,
        estimated_body_fat_percentage: Number(profBodyFat),
        target_body_fat_percentage: Number(profTargetBodyFat)
      },
      fitness_goals: {
        ...userProfile.fitness_goals,
        target_weight_kg: Number(profTargetWeight),
        daily_calorie_target: Number(profCalorieTarget)
      }
    };

    onSave(updatedProfile);
    onClose();
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h3><i className="fa-solid fa-id-card color-blue"></i> Profil Biometrik Pengguna</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
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
              <select value={profGender} onChange={(e) => setProfGender(e.target.value as any)}>
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
              <label>Target Berat Badan (kg)</label>
              <input
                type="number"
                step="0.1"
                value={profTargetWeight}
                onChange={(e) => setProfTargetWeight(Number(e.target.value))}
                required
              />
            </div>
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
          </div>

          <div className="two-inputs-row">
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
            <div className="form-group">
              <label>Target Kalori Harian (kkal)</label>
              <input
                type="number"
                value={profCalorieTarget}
                onChange={(e) => setProfCalorieTarget(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit-action">
            <i className="fa-solid fa-floppy-disk"></i> Simpan Perubahan Profil
          </button>
        </form>
      </div>
    </div>
  );
};
