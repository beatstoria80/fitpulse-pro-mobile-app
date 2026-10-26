"use client";

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  User, 
  Scale, 
  Flame, 
  Droplet, 
  Activity, 
  ChevronRight, 
  CheckCircle2, 
  Link2, 
  Smartphone,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { UserProfile, Demographics, Biometrics, FitnessGoals } from '../../types/fitness';
import { calculateBMR } from '../../lib/initialData';
import { getSupabase, fetchAllFromCloud, syncProfileToCloud } from '../../lib/supabase';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile) => void;
  onRestoreFromCloud?: (profile: UserProfile, logs: any) => void;
  showToast: (msg: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onRestoreFromCloud,
  showToast,
}) => {
  const [mode, setMode] = useState<'create' | 'link'>('create');

  // Form State for New User on this Device
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(68);
  const [waistCm, setWaistCm] = useState<number>(80);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(65);
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active'>('moderate');

  // State for Linking Existing Account
  const [existingUserId, setExistingUserId] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Live Computed Biometrics & Recommendations
  const bmiData = useMemo(() => {
    const hM = heightCm / 100;
    if (hM <= 0 || weightKg <= 0) return { bmi: 22, status: 'Normal', color: '#10B981' };
    const bmiVal = Number((weightKg / (hM * hM)).toFixed(1));
    let status = 'Normal';
    let color = '#10B981';
    if (bmiVal < 18.5) {
      status = 'Underweight';
      color = '#38BDF8';
    } else if (bmiVal >= 25 && bmiVal < 30) {
      status = 'Overweight';
      color = '#F59E0B';
    } else if (bmiVal >= 30) {
      status = 'Obesitas';
      color = '#EF4444';
    }
    return { bmi: bmiVal, status, color };
  }, [heightCm, weightKg]);

  // Real-time BMR and TDEE based on Activity Level
  const { bmr, tdee, recommendedCalories, recommendedWater } = useMemo(() => {
    const bmrVal = calculateBMR(weightKg, heightCm, age, gender);
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725
    };
    const tdeeVal = Math.round(bmrVal * multipliers[activityLevel]);
    // If target weight < current weight: calorie deficit 300-500 kcal
    // If target weight > current weight: calorie surplus 300 kcal
    let targetCal = tdeeVal;
    if (targetWeightKg < weightKg) {
      targetCal = Math.max(1400, tdeeVal - 400);
    } else if (targetWeightKg > weightKg) {
      targetCal = tdeeVal + 300;
    }
    // Water: 35ml per kg of weight
    const water = Math.round(weightKg * 35);
    return {
      bmr: bmrVal,
      tdee: tdeeVal,
      recommendedCalories: targetCal,
      recommendedWater: Math.max(2000, water)
    };
  }, [weightKg, heightCm, age, gender, activityLevel, targetWeightKg]);

  if (!isOpen) return null;

  // Handle Form Submission for Device Creation
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Pengguna FitPulse';
    
    // Generate unique user_id and device_id for this device
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
    const newUserId = `USR-${randomSuffix}`;
    const newDeviceId = `DEV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Calculate Estimated Body Fat (Deurenberg Formula approximation)
    // Body Fat % = (1.20 × BMI) + (0.23 × Age) - (10.8 × gender_num) - 5.4 (male=1, female=0)
    const genderFactor = gender === 'male' ? 1 : 0;
    const bodyFatEstimate = Math.max(8, Number(((1.20 * bmiData.bmi) + (0.23 * age) - (10.8 * genderFactor) - 5.4).toFixed(1)));
    const targetBodyFat = gender === 'male' ? 18.0 : 23.0;

    const newProfile: UserProfile = {
      user_id: newUserId,
      name: finalName,
      created_at: new Date().toISOString(),
      demographics: {
        age: Number(age),
        gender,
        marital_status: 'single'
      },
      biometrics: {
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        waist_circumference_cm: Number(waistCm),
        estimated_body_fat_percentage: bodyFatEstimate,
        target_body_fat_percentage: targetBodyFat,
        bmi: bmiData.bmi,
        bmi_status: bmiData.status
      },
      fitness_goals: {
        target_weight_kg: Number(targetWeightKg),
        daily_calorie_target: recommendedCalories,
        daily_water_target_ml: recommendedWater
      }
    };

    // Save device-specific flags in LocalStorage
    try {
      localStorage.setItem('fitpulse_device_id', newDeviceId);
      localStorage.setItem('fitpulse_device_user_id', newUserId);
      localStorage.setItem('fitpulse_onboarding_completed', 'true');
    } catch (err) {
      console.warn('Could not store device flags in localStorage:', err);
    }

    // Attempt cloud sync if Supabase is connected
    const sb = getSupabase();
    if (sb) {
      syncProfileToCloud(sb, newProfile).catch((err) => {
        console.warn('Cloud sync defer:', err);
      });
    }

    showToast(`Selamat datang, ${finalName}! Profil berhasil dikalibrasi.`);
    onComplete(newProfile);
  };

  // Handle Linking Existing User ID from another device
  const handleLinkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = existingUserId.trim().toUpperCase();
    if (!cleanId) {
      showToast('Harap masukkan User ID yang valid.');
      return;
    }

    setIsLinking(true);
    try {
      const sb = getSupabase();
      if (!sb) {
        showToast('Supabase belum terhubung. Silakan setup profil baru terlebih dahulu.');
        setIsLinking(false);
        return;
      }

      const cloudData = await fetchAllFromCloud(sb, cleanId);
      if (cloudData.profile) {
        const p = cloudData.profile;
        const restoredProfile: UserProfile = {
          user_id: p.user_id,
          name: p.name || 'Pengguna FitPulse',
          created_at: p.created_at || new Date().toISOString(),
          demographics: {
            age: p.age || 30,
            gender: (p.gender === 'female' ? 'female' : 'male') as 'male' | 'female',
            marital_status: p.marital_status || 'single'
          },
          biometrics: {
            height_cm: Number(p.height_cm) || 170,
            weight_kg: Number(p.weight_kg) || 70,
            waist_circumference_cm: Number(p.waist_circumference_cm) || 80,
            estimated_body_fat_percentage: Number(p.estimated_body_fat_percentage) || 20,
            target_body_fat_percentage: Number(p.target_body_fat_percentage) || 18,
            bmi: Number(p.bmi) || 22.5,
            bmi_status: p.bmi_status || 'Normal'
          },
          fitness_goals: {
            target_weight_kg: Number(p.target_weight_kg) || 68,
            daily_calorie_target: Number(p.daily_calorie_target) || 2000,
            daily_water_target_ml: Number(p.daily_water_target_ml) || 2500
          }
        };

        try {
          localStorage.setItem('fitpulse_device_user_id', p.user_id);
          localStorage.setItem('fitpulse_onboarding_completed', 'true');
        } catch (e) {}

        showToast(`Akun ${restoredProfile.name} (${p.user_id}) berhasil disinkronkan ke device ini!`);
        if (onRestoreFromCloud) {
          onRestoreFromCloud(restoredProfile, cloudData);
        } else {
          onComplete(restoredProfile);
        }
      } else {
        showToast(`User ID ${cleanId} tidak ditemukan di database Supabase.`);
      }
    } catch (err: any) {
      showToast(`Gagal menghubungkan akun: ${err.message || 'Koneksi error'}`);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="modal-backdrop active" style={{ zIndex: 9999, backdropFilter: 'blur(16px)' }} role="dialog" aria-modal="true">
      <div 
        className="modal-sheet" 
        style={{ 
          maxWidth: '460px', 
          maxHeight: '92vh',
          borderRadius: '32px 32px 0 0',
          background: 'linear-gradient(180deg, #0F172A 0%, #090D16 100%)',
          color: '#F8FAFC',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.8)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" style={{ background: 'rgba(255, 255, 255, 0.25)' }} />

        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '99px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34D399',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            marginBottom: '10px'
          }}>
            <Sparkles size={13} />
            <span>SETUP PERANGKAT BARU</span>
          </div>

          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '22px',
            fontWeight: 800,
            margin: '0 0 6px 0',
            letterSpacing: '-0.3px',
            color: '#FFFFFF'
          }}>
            Selamat Datang di FitPulse Pro
          </h2>
          <p style={{
            fontSize: '12.5px',
            color: 'rgba(255, 255, 255, 0.65)',
            lineHeight: 1.4,
            margin: 0
          }}>
            Setiap link/perangkat membutuhkan kalibrasi biometrik agar target energi, kalori, dan nutrisi tepat sasaran.
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '18px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => setMode('create')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              transition: 'all 0.2s',
              background: mode === 'create' ? 'linear-gradient(135deg, #10B981, #059669)' : 'transparent',
              color: mode === 'create' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'
            }}
          >
            <Smartphone size={14} />
            <span>Profil Baru</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('link')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              transition: 'all 0.2s',
              background: mode === 'link' ? 'linear-gradient(135deg, #38BDF8, #0284C7)' : 'transparent',
              color: mode === 'link' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'
            }}
          >
            <Link2 size={14} />
            <span>Hubungkan ID</span>
          </button>
        </div>

        {/* MODE 1: CREATE NEW PROFILE ON THIS DEVICE */}
        {mode === 'create' && (
          <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Nama Lengkap */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={13} className="color-green" /> Nama Lengkap Anda
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Nandang, Budi, atau Nama Panggilan"
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Usia & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                  Usia (Tahun)
                </label>
                <input
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}
                >
                  <option value="male">Pria</option>
                  <option value="female">Wanita</option>
                </select>
              </div>
            </div>

            {/* Tinggi & Berat Badan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                  Tinggi Badan (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={100}
                  max={240}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                  Berat Saat Ini (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={30}
                  max={250}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Lingkar Perut & Target Berat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                  Lingkar Perut (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={40}
                  max={200}
                  value={waistCm}
                  onChange={(e) => setWaistCm(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                  Target Berat (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={30}
                  max={200}
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Aktivitas Harian */}
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                Aktivitas Fisik Harian
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                style={{
                  width: '100%',
                  background: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                  fontSize: '13px'
                }}
              >
                <option value="sedentary">Duduk (Sedentary)</option>
                <option value="light">Ringan (1-2x/minggu)</option>
                <option value="moderate">Sedang (3-5x/minggu)</option>
                <option value="active">Sangat Aktif (Olahraga Intens)</option>
              </select>
            </div>

            {/* Live Telemetry Recommendation Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.5px' }}>
                  TELEMETRI BIOMETRIK TERHITUNG
                </span>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: `${bmiData.color}25`,
                  color: bmiData.color,
                  border: `1px solid ${bmiData.color}40`
                }}>
                  BMI {bmiData.bmi} • {bmiData.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                    <Flame size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.55)', fontWeight: 600 }}>Target Kalori</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
                      {recommendedCalories.toLocaleString('id-ID')} <span style={{ fontSize: '10px', fontWeight: 600 }}>kkal/hr</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                    <Droplet size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.55)', fontWeight: 600 }}>Kebutuhan Air</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', fontFamily: "'Outfit', sans-serif" }}>
                      {recommendedWater.toLocaleString('id-ID')} <span style={{ fontSize: '10px', fontWeight: 600 }}>ml/hr</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                marginTop: '4px'
              }}
            >
              <span>Mulai Sekarang</span>
              <ChevronRight size={16} />
            </button>
          </form>
        )}

        {/* MODE 2: LINK EXISTING USER ID FROM SUPABASE */}
        {mode === 'link' && (
          <form onSubmit={handleLinkExisting} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.45
            }}>
              Sudah pernah mengisi data di perangkat lain (laptop/ponsel)? Masukkan <strong>User ID</strong> Anda (contoh: <code>USR-4616069</code>) untuk memuat seluruh profil dan riwayat kebugaran ke browser ini.
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>
                User ID Akun
              </label>
              <input
                type="text"
                placeholder="USR-XXXXXXX"
                value={existingUserId}
                onChange={(e) => setExistingUserId(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  letterSpacing: '1px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLinking}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 800,
                cursor: isLinking ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(56, 189, 248, 0.35)',
                opacity: isLinking ? 0.7 : 1
              }}
            >
              {isLinking ? (
                <>
                  <RefreshCw size={16} className="spin-slow" />
                  <span>Menghubungkan ke Supabase...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Tarik Data & Hubungkan</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security badge at bottom */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          marginTop: '16px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.45)'
        }}>
          <ShieldCheck size={13} className="color-green" />
          <span>Data tersimpan aman secara lokal & dienkripsi di cloud</span>
        </div>
      </div>
    </div>
  );
};
