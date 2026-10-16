"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  const [profName, setProfName] = useState(userProfile.name || 'Nandang');
  const [profAge, setProfAge] = useState(userProfile.demographics.age);
  const [profGender, setProfGender] = useState(userProfile.demographics.gender);
  const [profHeight, setProfHeight] = useState(userProfile.biometrics.height_cm);
  const [profWeight, setProfWeight] = useState(userProfile.biometrics.weight_kg);
  const [profWaist, setProfWaist] = useState(userProfile.biometrics.waist_circumference_cm || 88.0);
  const [profTargetWaist, setProfTargetWaist] = useState(userProfile.biometrics.target_waist_cm || 78.0);
  const [profTargetWeight, setProfTargetWeight] = useState(userProfile.fitness_goals.target_weight_kg);
  const [profBodyFat, setProfBodyFat] = useState(userProfile.biometrics.estimated_body_fat_percentage);
  const [profTargetBodyFat, setProfTargetBodyFat] = useState(userProfile.biometrics.target_body_fat_percentage);
  const [profCalorieTarget, setProfCalorieTarget] = useState(userProfile.fitness_goals.daily_calorie_target);

  useEffect(() => {
    setProfName(userProfile.name || 'Nandang');
    setProfAge(userProfile.demographics.age);
    setProfGender(userProfile.demographics.gender);
    setProfHeight(userProfile.biometrics.height_cm);
    setProfWeight(userProfile.biometrics.weight_kg);
    setProfWaist(userProfile.biometrics.waist_circumference_cm || 88.0);
    setProfTargetWaist(userProfile.biometrics.target_waist_cm || 78.0);
    setProfTargetWeight(userProfile.fitness_goals.target_weight_kg);
    setProfBodyFat(userProfile.biometrics.estimated_body_fat_percentage);
    setProfTargetBodyFat(userProfile.biometrics.target_body_fat_percentage);
    setProfCalorieTarget(userProfile.fitness_goals.daily_calorie_target);
  }, [userProfile]);

  // Live Calculations for Real-time Feedback
  const liveStats = useMemo(() => {
    const hM = Number(profHeight) / 100 || 1.6;
    const wKg = Number(profWeight) || 69;
    const waistCm = Number(profWaist) || 88;
    const bmiVal = Number((wKg / (hM * hM)).toFixed(2));

    let bmiLabel = 'Normal';
    let bmiColor = '#10B981';
    if (bmiVal < 18.5) {
      bmiLabel = 'Berat Kurang (Underweight)';
      bmiColor = '#3B82F6';
    } else if (bmiVal >= 25 && bmiVal < 30) {
      bmiLabel = 'Kelebihan Berat (Overweight Class I)';
      bmiColor = '#F59E0B';
    } else if (bmiVal >= 30) {
      bmiLabel = 'Obesitas (Class II)';
      bmiColor = '#EF4444';
    }

    // Waist-to-Height Ratio (WHtR)
    const whtrVal = Number((waistCm / Number(profHeight)).toFixed(2));
    const isMale = profGender === 'male';
    const waistLimit = isMale ? 90 : 80;

    let waistLabel = 'Normal & Sehat';
    let waistColor = '#10B981';
    if (waistCm > waistLimit + 5) {
      waistLabel = `Risiko Obesitas Sentral (>${waistLimit} cm)`;
      waistColor = '#EF4444';
    } else if (waistCm >= waistLimit) {
      waistLabel = `Batas Waspada (Standar ${isMale ? 'Pria <90' : 'Wanita <80'} cm)`;
      waistColor = '#F59E0B';
    } else {
      waistLabel = `Ideal & Sehat (<${waistLimit} cm)`;
    }

    return {
      bmiVal,
      bmiLabel,
      bmiColor,
      whtrVal,
      waistLabel,
      waistColor,
      waistLimit,
      waistCm
    };
  }, [profHeight, profWeight, profWaist, profGender]);

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
      name: profName.trim() || 'Nandang',
      demographics: {
        ...userProfile.demographics,
        age: Number(profAge),
        gender: profGender as any
      },
      biometrics: {
        ...userProfile.biometrics,
        height_cm: Number(profHeight),
        weight_kg: Number(profWeight),
        waist_circumference_cm: Number(profWaist),
        target_waist_cm: Number(profTargetWaist),
        waist_status: liveStats.waistLabel,
        whtr: liveStats.whtrVal,
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
          <div>
            <h3><i className="fa-solid fa-id-card color-blue"></i> Profil Biometrik Pengguna</h3>
            <span className="modal-subtext">Perbarui tinggi badan, berat badan, lingkar perut, dan target</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Live Health Indicator Chip Banner */}
        <div className="profile-live-preview-grid">
          <div className="preview-chip">
            <span className="lbl">BMI Otomatis</span>
            <strong style={{ color: liveStats.bmiColor }}>
              {liveStats.bmiVal} <small>({liveStats.bmiLabel.split(' ')[0]})</small>
            </strong>
          </div>
          <div className="preview-chip">
            <span className="lbl">Rasio Lingkar / Tinggi (WHtR)</span>
            <strong style={{ color: liveStats.waistColor }}>
              {liveStats.whtrVal} <small>({liveStats.waistCm ? `${liveStats.waistCm} cm` : ''})</small>
            </strong>
          </div>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* 1. Identitas Dasar */}
          <div className="form-group">
            <label>Nama Pengguna</label>
            <input
              type="text"
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
              placeholder="Contoh: Nandang"
              required
            />
          </div>

          <div className="two-inputs-row">
            <div className="form-group">
              <label>Usia (Tahun)</label>
              <input
                type="number"
                min="12"
                max="120"
                value={profAge}
                onChange={(e) => setProfAge(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Jenis Kelamin</label>
              <select value={profGender} onChange={(e) => setProfGender(e.target.value as any)}>
                <option value="male">Pria (Batas Lingkar Perut &lt; 90 cm)</option>
                <option value="female">Wanita (Batas Lingkar Perut &lt; 80 cm)</option>
              </select>
            </div>
          </div>

          {/* 2. Pengukuran Tubuh Utama (Tinggi Badan & Berat Badan) */}
          <div className="two-inputs-row">
            <div className="form-group">
              <label>Tinggi Badan (cm)</label>
              <input
                type="number"
                step="0.1"
                min="100"
                max="250"
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
                min="30"
                max="300"
                value={profWeight}
                onChange={(e) => setProfWeight(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* 3. Pengukuran Lingkar Perut (Fitur Baru Permintaan Pengguna) */}
          <div className="two-inputs-row highlight-inputs-row">
            <div className="form-group">
              <label>
                <i className="fa-solid fa-ruler-horizontal text-orange"></i> Lingkar Perut Saat Ini (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="40"
                max="200"
                value={profWaist}
                onChange={(e) => setProfWaist(Number(e.target.value))}
                placeholder="Cth: 88 cm"
                required
              />
              <span className="input-hint-small">Batas sehat: &lt;{liveStats.waistLimit} cm</span>
            </div>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-bullseye text-cyan"></i> Target Lingkar Perut (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="40"
                max="200"
                value={profTargetWaist}
                onChange={(e) => setProfTargetWaist(Number(e.target.value))}
                placeholder="Cth: 78 cm"
                required
              />
              <span className="input-hint-small">Selisih: -{Math.max(0, profWaist - profTargetWaist).toFixed(1)} cm</span>
            </div>
          </div>

          {/* 4. Target Berat & Lemak Tubuh */}
          <div className="two-inputs-row">
            <div className="form-group">
              <label>Target Berat Badan (kg)</label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="200"
                value={profTargetWeight}
                onChange={(e) => setProfTargetWeight(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Target Kalori Harian (kkal)</label>
              <input
                type="number"
                min="1000"
                max="5000"
                value={profCalorieTarget}
                onChange={(e) => setProfCalorieTarget(Number(e.target.value))}
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
                min="3"
                max="60"
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
                min="3"
                max="40"
                value={profTargetBodyFat}
                onChange={(e) => setProfTargetBodyFat(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-submit-action">
            <i className="fa-solid fa-floppy-disk"></i> Simpan Data Profil & Lingkar Perut
          </button>
        </form>
      </div>
    </div>
  );
};
