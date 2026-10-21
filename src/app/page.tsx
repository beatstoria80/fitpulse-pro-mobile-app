"use client";

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { initialFitnessData, calculateBMR, formatDateIndonesian, getTodayDateStr } from '../lib/initialData';
import { mapCloudNutritionToApp, mapCloudActivityToApp } from '../lib/supabase';
import { AppFitnessData, ActivityLog, NutritionLog, UserProfile } from '../types/fitness';
import HeartRateMonitor from '../components/HeartRateMonitor';
import StepCounter from '../components/StepCounter';
import {
  Smartphone,
  Maximize2,
  Cloud,
  Download,
  RotateCcw,
  Flame,
  Signal,
  Wifi,
  BatteryMedium,
  Edit3,
  Info,
  Utensils,
  Activity,
  Droplet,
  Clock,
  HeartPulse,
  Scale,
  PieChart,
  Plus,
  ChevronRight,
  FolderOpen,
  Sparkles,
  Dumbbell,
  Sun,
  CloudSun,
  Moon,
  Apple,
  Trash2,
  Trophy,
  Check,
  X,
  User,
  Link2,
  Unlink2,
  LayoutDashboard
} from 'lucide-react';
import {
  initSupabase,
  getSupabaseConfig,
  syncProfileToCloud,
  syncActivityToCloud,
  syncNutritionToCloud,
  syncHydrationToCloud,
  fetchAllFromCloud,
  deleteActivityFromCloud,
  deleteNutritionFromCloud
} from '../lib/supabase';

export default function Home() {
  const [data, setData] = useState<AppFitnessData>(initialFitnessData);
  const [activeTab, setActiveTab] = useState<'tabDashboard' | 'tabActivities' | 'tabNutrition' | 'tabAnalytics'>('tabDashboard');
  const [clock, setClock] = useState('14:04');
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [modalActivityOpen, setModalActivityOpen] = useState(false);
  const [modalFoodOpen, setModalFoodOpen] = useState(false);
  const [modalProfileOpen, setModalProfileOpen] = useState(false);
  const [modalSupabaseOpen, setModalSupabaseOpen] = useState(false);

  // Form states
  const [actType, setActType] = useState('Skateboard');
  const [actDuration, setActDuration] = useState(30);
  const [actIntensity, setActIntensity] = useState<'low' | 'medium' | 'high' | 'vigorous'>('medium');
  const [actHeartRate, setActHeartRate] = useState('120');
  const [actSteps, setActSteps] = useState('');

  const [foodMeal, setFoodMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [foodName, setFoodName] = useState('');
  const [foodWeight, setFoodWeight] = useState(100);
  const [foodCalories, setFoodCalories] = useState(150);
  const [foodCarbs, setFoodCarbs] = useState(10);
  const [foodProtein, setFoodProtein] = useState(15);
  const [foodFat, setFoodFat] = useState(4);

  // Profile Form state
  const [profAge, setProfAge] = useState(46);
  const [profGender, setProfGender] = useState('male');
  const [profHeight, setProfHeight] = useState(160);
  const [profWeight, setProfWeight] = useState(69.0);
  const [profTargetWeight, setProfTargetWeight] = useState(58.5);
  const [profBodyFat, setProfBodyFat] = useState(26.7);
  const [profTargetBodyFat, setProfTargetBodyFat] = useState(22.0);
  const [profCalorieTarget, setProfCalorieTarget] = useState(1800);

  // Supabase states
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [isCloudSync, setIsCloudSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [todayFormatted, setTodayFormatted] = useState<string>('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Clock & Storage Initialization
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    const timer = setTimeout(() => {
      const now = new Date();
      setTodayFormatted(formatDateIndonesian(now));
      setClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'));
      
      intervalId = setInterval(() => {
        const tick = new Date();
        setClock(tick.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'));
      }, 30000);

      // Load LocalStorage
    try {
      const saved = localStorage.getItem('fitpulse_app_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
        setProfAge(parsed.user_profile?.demographics?.age || 46);
        setProfHeight(parsed.user_profile?.biometrics?.height_cm || 160);
        setProfWeight(parsed.user_profile?.biometrics?.weight_kg || 69);
        setProfTargetWeight(parsed.user_profile?.fitness_goals?.target_weight_kg || 58.5);
        setProfBodyFat(parsed.user_profile?.biometrics?.estimated_body_fat_percentage || 26.7);
        setProfTargetBodyFat(parsed.user_profile?.biometrics?.target_body_fat_percentage || 22.0);
        setProfCalorieTarget(parsed.user_profile?.fitness_goals?.daily_calorie_target || 1800);
      }
    } catch (e) {
      console.error(e);
    }

    // Load Supabase config
    const conf = getSupabaseConfig();
    if (conf.url && conf.key) {
      setSbUrl(conf.url);
      setSbKey(conf.key);
      const client = initSupabase(conf.url, conf.key);
      if (client) {
        setIsCloudSync(true);
        setIsSyncing(true);
        fetchAllFromCloud(client, initialFitnessData.user_profile.user_id)
          .then((cloud) => {
            setData((prev) => {
              // Map cloud activities to app format
              const mappedActivities = cloud.activities.length > 0
                ? cloud.activities.map(mapCloudActivityToApp)
                : prev.activity_logs;

              // Map cloud nutrition to app format
              const mappedNutritions = cloud.nutritions.length > 0
                ? cloud.nutritions.map(mapCloudNutritionToApp)
                : prev.nutrition_logs;

              // Calculate daily summary from actual cloud data
              const totalCaloriesConsumed = mappedNutritions.reduce((s, n) => s + (n.calories || 0), 0);
              const totalCaloriesBurned = mappedActivities.reduce((s, a) => s + (a.metrics.calories_burned || 0), 0);
              const waterIntakeFromCloud = cloud.waterLog ? cloud.waterLog.consumed_ml : prev.daily_summary.water_intake_ml;

              // Map cloud profile if available
              const updatedProfile = cloud.profile ? {
                ...prev.user_profile,
                demographics: {
                  age: cloud.profile.age ?? prev.user_profile.demographics.age,
                  gender: cloud.profile.gender ?? prev.user_profile.demographics.gender,
                  marital_status: cloud.profile.marital_status ?? prev.user_profile.demographics.marital_status
                },
                biometrics: {
                  height_cm: cloud.profile.height_cm ?? prev.user_profile.biometrics.height_cm,
                  weight_kg: cloud.profile.weight_kg ?? prev.user_profile.biometrics.weight_kg,
                  estimated_body_fat_percentage: cloud.profile.estimated_body_fat_percentage ?? prev.user_profile.biometrics.estimated_body_fat_percentage,
                  target_body_fat_percentage: cloud.profile.target_body_fat_percentage ?? prev.user_profile.biometrics.target_body_fat_percentage,
                  bmi: cloud.profile.bmi ?? prev.user_profile.biometrics.bmi,
                  bmi_status: cloud.profile.bmi_status ?? prev.user_profile.biometrics.bmi_status
                },
                fitness_goals: {
                  target_weight_kg: cloud.profile.target_weight_kg ?? prev.user_profile.fitness_goals.target_weight_kg,
                  daily_calorie_target: cloud.profile.daily_calorie_target ?? prev.user_profile.fitness_goals.daily_calorie_target,
                  daily_water_target_ml: cloud.profile.daily_water_target_ml ?? prev.user_profile.fitness_goals.daily_water_target_ml
                }
              } : prev.user_profile;

              const next = {
                user_profile: updatedProfile,
                activity_logs: mappedActivities,
                nutrition_logs: mappedNutritions,
                hydration_logs: prev.hydration_logs,
                daily_summary: {
                  date: getTodayDateStr(),
                  calories_consumed: totalCaloriesConsumed,
                  calories_burned: totalCaloriesBurned,
                  water_intake_ml: waterIntakeFromCloud,
                  net_calories: totalCaloriesConsumed - totalCaloriesBurned
                }
              };
              localStorage.setItem('fitpulse_app_data', JSON.stringify(next));
              return next;
            });
            showToast('Data tersinkronisasi dari Supabase Cloud! ☁️');
          })
          .catch(console.error)
          .finally(() => setIsSyncing(false));
      }
    }
    }, 0);

    return () => {
      clearTimeout(timer);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const saveUpdatedData = (newData: AppFitnessData) => {
    setData(newData);
    try {
      localStorage.setItem('fitpulse_app_data', JSON.stringify(newData));
    } catch (e) {
      console.error(e);
    }
  };

  // ====== REAL-TIME COMPUTED VALUES (No hardcoding) ======
  const targetCalories = data.user_profile.fitness_goals.daily_calorie_target || 0;
  const consumedCalories = data.daily_summary.calories_consumed || 0;
  const burnedCalories = data.daily_summary.calories_burned || 0;
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const waterIntake = data.daily_summary.water_intake_ml || 0;
  const targetWater = data.user_profile.fitness_goals.daily_water_target_ml || 0;
  const waterPercent = targetWater > 0 ? Math.min(100, Math.round((waterIntake / targetWater) * 100)) : 0;

  // Ring calculations: perimeter = 2 * PI * 76 = 477.5
  const caloriePercent = targetCalories > 0 ? Math.min(1, consumedCalories / targetCalories) : 0;
  const ringOffset = 477.5 - 477.5 * caloriePercent;

  // Macros Total (computed from actual nutrition_logs)
  const totalProtein = data.nutrition_logs.reduce((s, n) => s + (n.protein_g || 0), 0);
  const totalCarbs = data.nutrition_logs.reduce((s, n) => s + (n.carbs_g || 0), 0);
  const totalFat = data.nutrition_logs.reduce((s, n) => s + (n.fat_g || 0), 0);

  // Real-time BMR using Mifflin-St Jeor equation (not hardcoded)
  const bmrValue = calculateBMR(
    data.user_profile.biometrics.weight_kg,
    data.user_profile.biometrics.height_cm,
    data.user_profile.demographics.age,
    data.user_profile.demographics.gender
  );

  // Real-time weight progress
  const currentWeight = data.user_profile.biometrics.weight_kg;
  const targetWeight = data.user_profile.fitness_goals.target_weight_kg;
  const weightDiff = currentWeight - targetWeight;
  const weightProgressPercent = weightDiff > 0 ? Math.min(100, Math.round(((currentWeight - targetWeight) <= 0 ? 100 : (1 - weightDiff / currentWeight) * 100))) : 100;

  // Real-time body fat progress
  const currentBodyFat = data.user_profile.biometrics.estimated_body_fat_percentage;
  const targetBodyFat = data.user_profile.biometrics.target_body_fat_percentage;
  const bodyFatDiff = currentBodyFat - targetBodyFat;
  const bodyFatProgressPercent = bodyFatDiff > 0 ? Math.min(100, Math.round((targetBodyFat / currentBodyFat) * 100)) : 100;

  // Real-time macro targets (calculated from calorie target)
  const proteinTarget = targetCalories > 0 ? Math.round((targetCalories * 0.30) / 4) : 0;  // 30% of calories from protein
  const carbsTarget = targetCalories > 0 ? Math.round((targetCalories * 0.40) / 4) : 0;    // 40% from carbs
  const fatTarget = targetCalories > 0 ? Math.round((targetCalories * 0.30) / 9) : 0;       // 30% from fat

  // Real-time roadmap calculations
  const weeklyLossRate = 0.45; // kg per week (safe rate)
  const estimatedWeeks = weightDiff > 0 ? Math.round(weightDiff / weeklyLossRate) : 0;
  const milestone1 = weightDiff > 0 ? Math.round(currentWeight - weightDiff * 0.33) : currentWeight;
  const milestone2 = weightDiff > 0 ? Math.round(currentWeight - weightDiff * 0.66) : currentWeight;
  const roadmapProgressPercent = weightDiff > 0 ? Math.min(100, Math.round(((currentWeight - currentWeight) / weightDiff) * 100)) : 100;

  // Steps total from activity logs
  const totalSteps = data.activity_logs.reduce((s, a) => s + (a.metrics.steps_counted || 0), 0);

  // Check for data availability
  const hasActivities = data.activity_logs.length > 0;
  const hasNutrition = data.nutrition_logs.length > 0;
  const hasProfile = data.user_profile.biometrics.weight_kg > 0;

  // Water Actions
  const handleAddWater = (ml: number) => {
    const updated = {
      ...data,
      daily_summary: {
        ...data.daily_summary,
        water_intake_ml: waterIntake + ml
      },
      hydration_logs: [
        ...data.hydration_logs,
        { time: clock, amount_ml: ml }
      ]
    };
    saveUpdatedData(updated);
    showToast(`Asupan air +${ml} ml dicatat!`);

    if (waterIntake + ml >= targetWater) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    const client = initSupabase();
    if (client && isCloudSync) {
      syncHydrationToCloud(client, data.user_profile.user_id, ml).catch(console.error);
    }
  };

  const handleUndoWater = () => {
    if (waterIntake <= 0) return;
    const newTotal = Math.max(0, waterIntake - 250);
    const updated = {
      ...data,
      daily_summary: {
        ...data.daily_summary,
        water_intake_ml: newTotal
      }
    };
    saveUpdatedData(updated);
    showToast(`Asupan air dikurangi 250 ml (Total: ${newTotal} ml)`);
  };

  // Lunch Suggestion
  const handleSuggestLunch = () => {
    const newLog: NutritionLog = {
      nutrition_log_id: `NUT-${Date.now()}`,
      meal_type: 'lunch',
      time: '12:30',
      calories: 485,
      food_items: ['Ikan Kembung Bakar', 'Nasi Merah', 'Sayur Bayam Jagung', 'Tempe Kukus'],
      protein_g: 38,
      carbs_g: 48,
      fat_g: 11
    };
    const updated = {
      ...data,
      nutrition_logs: [...data.nutrition_logs, newLog],
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: consumedCalories + 485
      }
    };
    saveUpdatedData(updated);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    showToast('Menu Makan Siang Sehat (+485 kkal, 38g Protein) ditambahkan!');

    const client = initSupabase();
    if (client && isCloudSync) {
      syncNutritionToCloud(client, data.user_profile.user_id, newLog).catch(console.error);
    }
  };

  // Submit Activity Form
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    let met = 5.0;
    if (actType === 'Skateboard') met = 5.5;
    else if (actType.includes('Lari')) met = 8.0;
    else if (actType.includes('Walking')) met = 3.8;
    else if (actType.includes('Sepeda')) met = 6.0;
    else if (actType.includes('Beban')) met = 5.0;

    const mult = actIntensity === 'low' ? 0.8 : actIntensity === 'high' || actIntensity === 'vigorous' ? 1.3 : 1.0;
    const burned = Math.round(((met * mult * 3.5 * data.user_profile.biometrics.weight_kg) / 200) * actDuration);

    const newAct: ActivityLog = {
      activity_log_id: `ACT-${Date.now()}`,
      activity_type: actType,
      timestamp_start: new Date().toISOString(),
      metrics: {
        duration_minutes: Number(actDuration),
        intensity_level: actIntensity,
        calories_burned: burned,
        average_heart_rate: actHeartRate ? Number(actHeartRate) : null,
        steps_counted: actSteps ? Number(actSteps) : null
      },
      device_source: 'FitPulse Pro Mobile'
    };

    const updated = {
      ...data,
      activity_logs: [newAct, ...data.activity_logs],
      daily_summary: {
        ...data.daily_summary,
        calories_burned: burnedCalories + burned
      }
    };
    saveUpdatedData(updated);
    setModalActivityOpen(false);
    showToast(`Aktivitas ${actType} (+${burned} kkal) disimpan!`);

    const client = initSupabase();
    if (client && isCloudSync) {
      syncActivityToCloud(client, data.user_profile.user_id, newAct).catch(console.error);
    }
  };

  // Submit Food Form
  const handleSaveFood = (e: React.FormEvent) => {
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

    const updated = {
      ...data,
      nutrition_logs: [...data.nutrition_logs, newNut],
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: consumedCalories + Number(foodCalories)
      }
    };
    saveUpdatedData(updated);
    setFoodName('');
    setModalFoodOpen(false);
    showToast(`Menu ${newNut.food_items[0]} (+${foodCalories} kkal) dicatat!`);

    const client = initSupabase();
    if (client && isCloudSync) {
      syncNutritionToCloud(client, data.user_profile.user_id, newNut).catch(console.error);
    }
  };

  // Delete Activity
  const handleDeleteActivity = (id: string) => {
    const act = data.activity_logs.find(a => a.activity_log_id === id);
    const newLogs = data.activity_logs.filter(a => a.activity_log_id !== id);
    const newBurned = newLogs.reduce((s, a) => s + (a.metrics.calories_burned || 0), 0);
    const updated = {
      ...data,
      activity_logs: newLogs,
      daily_summary: {
        ...data.daily_summary,
        calories_burned: newBurned
      }
    };
    saveUpdatedData(updated);
    showToast(`Aktivitas ${act?.activity_type || ''} dihapus`);

    const client = initSupabase();
    if (client && isCloudSync) {
      deleteActivityFromCloud(client, id).catch(console.error);
    }
  };

  // Delete Food Item
  const handleDeleteNutrition = (id: string) => {
    const nut = data.nutrition_logs.find(n => n.nutrition_log_id === id);
    const newLogs = data.nutrition_logs.filter(n => n.nutrition_log_id !== id);
    const newConsumed = newLogs.reduce((s, n) => s + (n.calories || 0), 0);
    const updated = {
      ...data,
      nutrition_logs: newLogs,
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: newConsumed
      }
    };
    saveUpdatedData(updated);
    showToast(`Catatan makanan ${nut?.food_items?.[0] || ''} dihapus`);

    const client = initSupabase();
    if (client && isCloudSync) {
      deleteNutritionFromCloud(client, id).catch(console.error);
    }
  };

  // Reset Today's Logs (to test empty / null state)
  const handleResetTodayData = () => {
    if (!window.confirm('Kosongkan semua log latihan, makanan, dan air hari ini untuk menguji status Tanpa Data?')) return;
    const updated: AppFitnessData = {
      ...data,
      activity_logs: [],
      nutrition_logs: [],
      hydration_logs: [],
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: 0,
        calories_burned: 0,
        water_intake_ml: 0,
        net_calories: 0
      }
    };
    saveUpdatedData(updated);
    showToast('Data hari ini dikosongkan. Menampilkan status data kosong (null).');
  };

  // Save Profile Form
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const hM = Number(profHeight) / 100;
    const bmiVal = Number((Number(profWeight) / (hM * hM)).toFixed(2));
    let bmiDesc = 'Normal';
    if (bmiVal >= 30) bmiDesc = 'Obesitas Tingkat II';
    else if (bmiVal >= 25) bmiDesc = 'Overweight / Obesitas Tingkat I';
    else if (bmiVal < 18.5) bmiDesc = 'Underweight';

    const updatedProfile: UserProfile = {
      ...data.user_profile,
      demographics: {
        ...data.user_profile.demographics,
        age: Number(profAge),
        gender: profGender
      },
      biometrics: {
        ...data.user_profile.biometrics,
        height_cm: Number(profHeight),
        weight_kg: Number(profWeight),
        bmi: bmiVal,
        bmi_status: bmiDesc,
        estimated_body_fat_percentage: Number(profBodyFat),
        target_body_fat_percentage: Number(profTargetBodyFat)
      },
      fitness_goals: {
        ...data.user_profile.fitness_goals,
        target_weight_kg: Number(profTargetWeight),
        daily_calorie_target: Number(profCalorieTarget)
      }
    };

    const updated = {
      ...data,
      user_profile: updatedProfile
    };
    saveUpdatedData(updated);
    setModalProfileOpen(false);
    showToast('Profil biometrik berhasil diperbarui!');

    const client = initSupabase();
    if (client && isCloudSync) {
      syncProfileToCloud(client, updatedProfile).catch(console.error);
    }
  };

  // Save Supabase
  const handleConnectSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl.trim() || !sbKey.trim()) return;

    localStorage.setItem('fitpulse_sb_url', sbUrl.trim());
    localStorage.setItem('fitpulse_sb_key', sbKey.trim());
    const client = initSupabase(sbUrl.trim(), sbKey.trim());
    if (client) {
      setIsCloudSync(true);
      showToast('Koneksi Supabase tersambung! ☁️');
      setIsSyncing(true);
      syncProfileToCloud(client, data.user_profile)
        .then(() => showToast('Data tersinkronkan ke Supabase Cloud! 🎉'))
        .catch((err) => showToast('Sinkronisasi gagal: ' + err.message))
        .finally(() => setIsSyncing(false));
    }
    setModalSupabaseOpen(false);
  };

  const handleDisconnectSupabase = () => {
    localStorage.removeItem('fitpulse_sb_url');
    localStorage.removeItem('fitpulse_sb_key');
    setSbUrl('');
    setSbKey('');
    setIsCloudSync(false);
    setModalSupabaseOpen(false);
    showToast('Koneksi Supabase diputuskan. Menggunakan mode lokal.');
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitpulse_backup_${data.user_profile.user_id}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data FitPulse Pro berhasil diekspor ke file JSON!');
  };

  const remainingWeightKg = Math.max(0, weightDiff).toFixed(1);

  return (
    <>
      {/* Desktop Bar (Hanya tampil di monitor layar lebar) */}
      <aside className="desktop-bar" id="desktopBar" aria-label="Desktop Controls">
        <div className="desktop-bar-left">
          <span className="pulse-indicator"></span>
          <span className="desktop-title">FitPulse Pro • Health & Fitness Tracker</span>
          <span className="badge user-badge">{data.user_profile.user_id} ({data.user_profile.name || 'Pengguna'} • {data.user_profile.demographics.age} th)</span>
        </div>
        <div className="desktop-bar-actions">
          <button
            className="control-btn"
            onClick={() => setModalSupabaseOpen(true)}
            title="Hubungkan Cloud Database Supabase"
          >
            <Cloud size={14} className={isCloudSync ? 'color-cyan' : ''} />
            <span>{isSyncing ? 'Menyinkronkan...' : isCloudSync ? 'Supabase: Cloud Aktif' : 'Supabase: Lokal'}</span>
          </button>
          <button
            className="control-btn"
            onClick={handleResetTodayData}
            title="Kosongkan data hari ini untuk menguji status Tanpa Data (Null)"
          >
            <RotateCcw size={14} /> Reset Data Nol
          </button>
          <button
            className="control-btn action-highlight"
            onClick={handleExportJson}
            title="Unduh Data JSON Terbaru"
          >
            <Download size={14} /> Ekspor JSON
          </button>
        </div>
      </aside>

      {/* Native Mobile Smartphone Container */}
      <main className="app-frame" id="appFrame">
        {/* Main Scrollable App Content */}
        <div className="app-content" id="appContent">

          {/* ================= TAB 1: DASHBOARD ================= */}
          {activeTab === 'tabDashboard' && (
            <section className="tab-pane active" id="tabDashboard">
              {/* Header User Greeting */}
              <div className="user-greeting-card">
                <div className="greeting-info">
                  <span className="greeting-sub">{todayFormatted}</span>
                  <h1 className="greeting-name">Halo, {data.user_profile.name || 'Pengguna'}</h1>
                  <div className="header-tags-row">
                    <div className="bmi-pill-tag">
                      <span className="status-dot warning"></span>
                      <span>BMI {data.user_profile.biometrics.bmi} ({data.user_profile.biometrics.bmi_status})</span>
                    </div>
                    <button
                      className="cloud-status-chip"
                      onClick={() => setModalSupabaseOpen(true)}
                      title="Konfigurasi Supabase Cloud"
                    >
                      <Cloud size={13} className={isCloudSync ? 'color-cyan' : ''} />
                      <span>{isCloudSync ? 'Cloud Aktif' : 'Lokal'}</span>
                    </button>
                  </div>
                </div>
                <button
                  className="avatar-btn"
                  onClick={() => setModalProfileOpen(true)}
                  aria-label="Buka Profil"
                >
                  <div className="avatar-circle">
                    <span>ND</span>
                  </div>
                  <span className="avatar-edit-badge"><Edit3 size={11} /></span>
                </button>
              </div>

              {/* Hero: Calorie & Energy Balance Glass Card */}
              <div className="glass-card hero-energy-card">
                <div className="card-header-clean">
                  <div className="card-title-group">
                    <span className="badge-mini badge-cyan">Keseimbangan Energi</span>
                    <h2>Target Kalori Harian</h2>
                  </div>
                  <button
                    className="icon-action-btn"
                    onClick={() => showToast(`Target harian: ${targetCalories > 0 ? targetCalories.toLocaleString('id-ID') : '—'} kkal | BMR: ${bmrValue.toLocaleString('id-ID')} kkal`)}
                    title="Penjelasan TDEE & BMR"
                  >
                    <Info size={16} />
                  </button>
                </div>

                <div className="energy-visual-container">
                  {/* Circular Animated Gauge */}
                  <div className="circle-gauge-wrap">
                    <svg className="progress-ring" width="180" height="180" viewBox="0 0 180 180">
                      <defs>
                        <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0284C7" />
                          <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                        <linearGradient id="burnGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#EA580C" />
                          <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                      </defs>
                      <circle className="ring-bg" cx="90" cy="90" r="76" strokeWidth="12" />
                      <circle
                        className="ring-progress"
                        id="ringCalories"
                        cx="90"
                        cy="90"
                        r="76"
                        strokeWidth="12"
                        strokeDasharray="477.5"
                        strokeDashoffset={ringOffset}
                      />
                    </svg>
                    <div className="gauge-center-content">
                      <span className="gauge-label">SISA HARI INI</span>
                      <span className="gauge-value" id="valRemainingCalories">{remainingCalories.toLocaleString('id-ID')}</span>
                      <span className="gauge-unit">kkal tersisa</span>
                    </div>
                  </div>

                  {/* Side Metric Column */}
                  <div className="energy-metrics-col">
                    <div className="metric-mini-box intake" onClick={() => setModalFoodOpen(true)} style={{ cursor: 'pointer' }}>
                      <div className="metric-icon-wrap intake-icon">
                        <Utensils size={18} />
                      </div>
                      <div className="metric-data">
                        <span className="metric-title">Makanan Masuk</span>
                        <div className="metric-num"><strong>{consumedCalories}</strong> <small>/ {targetCalories} kkal</small></div>
                      </div>
                    </div>

                    <div className="metric-mini-box burn" onClick={() => setModalActivityOpen(true)} style={{ cursor: 'pointer' }}>
                      <div className="metric-icon-wrap burn-icon">
                        <Flame size={18} />
                      </div>
                      <div className="metric-data">
                        <span className="metric-title">Kalori Terbakar</span>
                        <div className="metric-num"><strong>{burnedCalories}</strong> <small>kkal aktif</small></div>
                      </div>
                    </div>

                    <div className="metric-mini-box net">
                      <div className="metric-icon-wrap net-icon">
                        <Activity size={18} />
                      </div>
                      <div className="metric-data">
                        <span className="metric-title">BMR Alami</span>
                        <div className="metric-num"><strong>{hasProfile ? `~${bmrValue.toLocaleString('id-ID')}` : '—'}</strong> <small>kkal / hari</small></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Macro Distribution Mini Bars */}
                <div className="macro-breakdown-row">
                  <div className="macro-item">
                    <div className="macro-labels">
                      <span className="macro-name"><Utensils size={13} className="color-protein" /> Protein</span>
                      <span className="macro-qty">{totalProtein}g / {proteinTarget}g</span>
                    </div>
                    <div className="macro-bar-track">
                      <div className="macro-bar-fill fill-protein" style={{ width: `${proteinTarget > 0 ? Math.min(100, Math.round((totalProtein / proteinTarget) * 100)) : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="macro-item">
                    <div className="macro-labels">
                      <span className="macro-name"><Apple size={13} className="color-carbs" /> Karbohidrat</span>
                      <span className="macro-qty">{totalCarbs}g / {carbsTarget}g</span>
                    </div>
                    <div className="macro-bar-track">
                      <div className="macro-bar-fill fill-carbs" style={{ width: `${carbsTarget > 0 ? Math.min(100, Math.round((totalCarbs / carbsTarget) * 100)) : 0}%` }}></div>
                    </div>
                  </div>

                  <div className="macro-item">
                    <div className="macro-labels">
                      <span className="macro-name"><Droplet size={13} className="color-fat" /> Lemak</span>
                      <span className="macro-qty">{totalFat}g / {fatTarget}g</span>
                    </div>
                    <div className="macro-bar-track">
                      <div className="macro-bar-fill fill-fat" style={{ width: `${fatTarget > 0 ? Math.min(100, Math.round((totalFat / fatTarget) * 100)) : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goal Progress Duo: Weight & Body Fat Target Cards */}
              <div className="two-col-grid">
                {/* Weight Card */}
                <div className="glass-card stat-tile" onClick={() => setModalProfileOpen(true)} style={{ cursor: 'pointer' }}>
                  <div className="stat-tile-head">
                    <div className="stat-icon-circle blue">
                      <Scale size={18} />
                    </div>
                    <span className="badge-pill">Target -{remainingWeightKg} kg</span>
                  </div>
                  <div className="stat-tile-body">
                    <div className="stat-big-num">
                      <span>{data.user_profile.biometrics.weight_kg}</span>
                      <small>kg</small>
                    </div>
                    <p className="stat-subtext">Target: <strong>{data.user_profile.fitness_goals.target_weight_kg} kg</strong></p>
                    <div className="mini-progress-bar">
                      <div className="progress-fill fill-blue" style={{ width: `${weightProgressPercent}%` }}></div>
                    </div>
                    <span className="stat-footnote">Tinggi: {data.user_profile.biometrics.height_cm} cm • BMI {data.user_profile.biometrics.bmi}</span>
                  </div>
                </div>

                {/* Body Fat Card */}
                <div className="glass-card stat-tile" onClick={() => setModalProfileOpen(true)} style={{ cursor: 'pointer' }}>
                  <div className="stat-tile-head">
                    <div className="stat-icon-circle purple">
                      <PieChart size={18} />
                    </div>
                    <span className="badge-pill">Target {data.user_profile.biometrics.target_body_fat_percentage}%</span>
                  </div>
                  <div className="stat-tile-body">
                    <div className="stat-big-num">
                      <span>{data.user_profile.biometrics.estimated_body_fat_percentage}</span>
                      <small>%</small>
                    </div>
                    <p className="stat-subtext">Est. Lemak Tubuh</p>
                    <div className="mini-progress-bar">
                      <div className="progress-fill fill-purple" style={{ width: `${bodyFatProgressPercent}%` }}></div>
                    </div>
                    <span className="stat-footnote">Selisih: <strong>-{(data.user_profile.biometrics.estimated_body_fat_percentage - data.user_profile.biometrics.target_body_fat_percentage).toFixed(1)}%</strong> lagi</span>
                  </div>
                </div>
              </div>

              {/* Hydration Water Tracker Card */}
              <div className="glass-card water-tracker-card">
                <div className="card-header-clean">
                  <div className="card-title-group">
                    <span className="badge-mini badge-blue"><Droplet size={13} /> Target Hidrasi</span>
                    <h2>Asupan Air Minum</h2>
                  </div>
                  <span className="water-target-label">
                    <strong>{waterIntake.toLocaleString('id-ID')}</strong> / {targetWater.toLocaleString('id-ID')} ml
                  </span>
                </div>

                <div className="water-bar-container">
                  <div className="water-level-track">
                    <div className="water-level-fill" style={{ width: `${waterPercent}%` }}>
                      <div className="water-bubble b1"></div>
                      <div className="water-bubble b2"></div>
                    </div>
                  </div>
                </div>

                <div className="water-action-row">
                  <button className="btn-water-quick" onClick={() => handleAddWater(250)}>
                    <Plus size={14} /> 250 ml (Gelas)
                  </button>
                  <button className="btn-water-quick" onClick={() => handleAddWater(500)}>
                    <Plus size={14} /> 500 ml (Botol)
                  </button>
                  <button className="btn-water-sub" onClick={handleUndoWater} title="Kurangi 250 ml">
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {/* Today's Activities Preview */}
              <div className="section-title-row">
                <h3>Aktivitas Hari Ini ({data.activity_logs.reduce((s, a) => s + a.metrics.duration_minutes, 0)} mnt)</h3>
                <button className="text-link-btn" onClick={() => setActiveTab('tabActivities')}>
                  Lihat Semua <ChevronRight size={14} />
                </button>
              </div>

              <div className="recent-activities-stack">
                {hasActivities ? (
                  data.activity_logs.slice(0, 2).map((act) => (
                    <div key={act.activity_log_id} className="activity-item-card">
                      <div className="act-icon-box">
                        {act.activity_type.toLowerCase().includes('skate') ? '🛹' : act.activity_type.toLowerCase().includes('walk') ? '🚶' : act.activity_type.toLowerCase().includes('sepeda') || act.activity_type.toLowerCase().includes('cycling') ? '🚴' : act.activity_type.toLowerCase().includes('renang') || act.activity_type.toLowerCase().includes('swim') ? '🏊' : act.activity_type.toLowerCase().includes('beban') || act.activity_type.toLowerCase().includes('gym') ? '🏋️' : '🏃'}
                      </div>
                      <div className="act-details">
                        <div className="act-title-row">
                          <h4>{act.activity_type}</h4>
                          <span className="act-burn-tag">+{act.metrics.calories_burned} kkal</span>
                        </div>
                        <div className="act-sub-row">
                          <span><Clock size={12} /> {act.metrics.duration_minutes} Menit</span>
                          <span>•</span>
                          <span>{act.metrics.intensity_level}</span>
                          {act.metrics.average_heart_rate ? (
                            <>
                              <span>•</span>
                              <span className="color-rose"><HeartPulse size={12} /> {act.metrics.average_heart_rate} bpm</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-card">
                    <FolderOpen size={24} />
                    <p>Belum ada aktivitas hari ini</p>
                    <button className="btn-primary-add" onClick={() => setModalActivityOpen(true)} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                      <Plus size={14} /> Catat Aktivitas Pertama
                    </button>
                  </div>
                )}
              </div>

              {/* AI Health Insights — Data-Driven */}
              <div className="glass-card ai-insight-card">
                <div className="ai-header">
                  <div className="ai-sparkle">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="ai-title">FitPulse AI • Rekomendasi Hari Ini</h4>
                    <span className="ai-sub">Dipersonalisasi untuk Usia {data.user_profile.demographics.age} Tahun</span>
                  </div>
                </div>
                <div className="ai-content-box">
                  {hasActivities ? (
                    <p>✅ <strong>{data.activity_logs[0].activity_type} ({data.activity_logs[0].metrics.duration_minutes} mnt)</strong> membakar <strong>{data.activity_logs[0].metrics.calories_burned} kkal</strong> dengan intensitas {data.activity_logs[0].metrics.intensity_level}{data.activity_logs[0].metrics.average_heart_rate ? ` (HR ${data.activity_logs[0].metrics.average_heart_rate} bpm)` : ''}. Pastikan lakukan <em>stretching</em> setelah latihan.</p>
                  ) : (
                    <p>💪 Belum ada aktivitas hari ini. Mulai dengan olahraga ringan 30 menit untuk membakar kalori dan menjaga metabolisme Anda.</p>
                  )}
                  {hasNutrition ? (
                    <p>🥩 Total asupan <strong>{consumedCalories.toLocaleString('id-ID')} kkal</strong> (Protein: {totalProtein}g). Anda masih punya sisa <strong>{remainingCalories.toLocaleString('id-ID')} kkal</strong> untuk sisa hari ini.</p>
                  ) : (
                    <p>🍽️ Belum ada catatan makanan hari ini. Catat asupan untuk memantau target kalori harian ({targetCalories > 0 ? `${targetCalories.toLocaleString('id-ID')} kkal` : 'belum diatur'}).</p>
                  )}
                  {hasProfile && bmrValue > 0 && (
                    <p>📊 BMR Anda: <strong>{bmrValue.toLocaleString('id-ID')} kkal/hari</strong>. Target defisit sehat: {targetCalories > 0 ? `${(bmrValue - targetCalories).toLocaleString('id-ID')} kkal/hari` : 'belum dihitung'}.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================= TAB 2: AKTIVITAS ================= */}
          {activeTab === 'tabActivities' && (
            <section className="tab-pane active" id="tabActivities">
              <div className="pane-header">
                <div>
                  <span className="badge-mini badge-green">Latihan & Kardio</span>
                  <h1 className="pane-title">Aktivitas Fisik</h1>
                </div>
                <button className="btn-primary-add" onClick={() => setModalActivityOpen(true)}>
                  <Plus size={14} /> Catat Latihan
                </button>
              </div>

              {/* Summary Banner */}
              <div className="glass-card workout-summary-banner">
                <div className="summary-stat-box">
                  <span className="summary-val">{data.activity_logs.reduce((s, a) => s + a.metrics.duration_minutes, 0)}</span>
                  <span className="summary-lbl">Menit Total</span>
                </div>
                <div className="stat-divider"></div>
                <div className="summary-stat-box">
                  <span className="summary-val color-fire">{burnedCalories}</span>
                  <span className="summary-lbl">Kkal Terbakar</span>
                </div>
                <div className="stat-divider"></div>
                <div className="summary-stat-box">
                  <span className="summary-val">{totalSteps > 0 ? totalSteps.toLocaleString('id-ID') : '0'}</span>
                  <span className="summary-lbl">Langkah Kaki</span>
                </div>
              </div>

              {/* Real-Time Sensor Section Header */}
              <div className="sensor-section-header">
                <h3>
                  <Activity size={16} /> Sensor Real-Time
                </h3>
                <span className="sensor-live-badge">
                  <span className="live-dot"></span> LIVE
                </span>
              </div>

              {/* Camera PPG Heart Rate Monitor (REAL-TIME) */}
              <HeartRateMonitor
                userAge={data.user_profile.demographics.age}
                onMeasurementComplete={(bpm, confidence) => {
                  showToast(`Detak jantung terukur: ${bpm} BPM (Akurasi: ${confidence}%)`);
                }}
              />

              {/* Step Counter / Pedometer (REAL-TIME) */}
              <StepCounter
                weightKg={data.user_profile.biometrics.weight_kg}
                heightCm={data.user_profile.biometrics.height_cm}
                onStepUpdate={(steps, calories, distance) => {
                  // Update daily summary with real step data
                  const updated = {
                    ...data,
                    daily_summary: {
                      ...data.daily_summary,
                      calories_burned: data.daily_summary.calories_burned + calories
                    }
                  };
                  saveUpdatedData(updated);
                  showToast(`Sesi berjalan: ${steps} langkah, ${calories} kkal, ${(distance/1000).toFixed(2)} km`);
                }}
              />

              {/* Full List of Activities */}
              <h3 className="subheading-list">Riwayat Sesi Latihan</h3>
              <div className="activity-cards-container">
                {data.activity_logs.length > 0 ? (
                  data.activity_logs.map((act) => (
                    <div key={act.activity_log_id} className="glass-card activity-full-card">
                      <div className="act-full-header">
                        <div className="act-type-info">
                          <span className="act-emoji-big">
                            {act.activity_type.toLowerCase().includes('skate') ? '🛹' : act.activity_type.toLowerCase().includes('sepeda') || act.activity_type.toLowerCase().includes('cycling') ? '🚴' : act.activity_type.toLowerCase().includes('renang') || act.activity_type.toLowerCase().includes('swim') ? '🏊' : act.activity_type.toLowerCase().includes('beban') || act.activity_type.toLowerCase().includes('gym') ? '🏋️' : act.activity_type.toLowerCase().includes('walk') ? '🚶' : '🏃'}
                          </span>
                          <div>
                            <h4>{act.activity_type}</h4>
                            <span className="act-source"><Smartphone size={12} /> {act.device_source}</span>
                          </div>
                        </div>
                        <div className="act-header-right">
                          <span className="act-cal-pill">+{act.metrics.calories_burned} kkal</span>
                          <button
                            className="btn-delete-mini"
                            onClick={() => handleDeleteActivity(act.activity_log_id)}
                            title="Hapus sesi latihan"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="act-metrics-trio">
                        <div className="m-box">
                          <span className="lbl">Durasi</span>
                          <strong className="val">{act.metrics.duration_minutes} mnt</strong>
                        </div>
                        <div className="m-box">
                          <span className="lbl">Intensitas</span>
                          <strong className="val capitalize">{act.metrics.intensity_level}</strong>
                        </div>
                        <div className="m-box">
                          <span className="lbl">Heart Rate</span>
                          <strong className="val color-rose">{act.metrics.average_heart_rate ? `${act.metrics.average_heart_rate} bpm` : '— bpm'}</strong>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-card">
                    <FolderOpen size={24} />
                    <p>Belum ada riwayat aktivitas fisik yang dicatat hari ini</p>
                    <button className="btn-primary-add" onClick={() => setModalActivityOpen(true)}>
                      <Plus size={14} /> Catat Latihan Pertama
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= TAB 3: NUTRISI ================= */}
          {activeTab === 'tabNutrition' && (
            <section className="tab-pane active" id="tabNutrition">
              <div className="pane-header">
                <div>
                  <span className="badge-mini badge-orange">Diet & Makanan</span>
                  <h1 className="pane-title">Log Nutrisi Harian</h1>
                </div>
                <button className="btn-primary-add" onClick={() => setModalFoodOpen(true)}>
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
                    <span className="donut-sub"><strong>{remainingCalories}</strong> kkal</span>
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
                      <div className="meal-icon-wrap breakfast"><Sun size={18} /></div>
                      <div>
                        <h4>Sarapan Pagi (Breakfast)</h4>
                        <span className="meal-cal-tag">
                          {data.nutrition_logs.filter(n => n.meal_type === 'breakfast').reduce((s, n) => s + n.calories, 0)} kkal
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-quick-add-meal"
                      onClick={() => { setFoodMeal('breakfast'); setModalFoodOpen(true); }}
                      title="Tambah Sarapan"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="meal-items-list">
                    {data.nutrition_logs.filter(n => n.meal_type === 'breakfast').length === 0 ? (
                      <div className="empty-meal-hint">
                        <Clock size={12} /> Belum ada catatan sarapan.
                      </div>
                    ) : (
                      data.nutrition_logs.filter(n => n.meal_type === 'breakfast').map((item) => (
                        <div key={item.nutrition_log_id} className="food-log-row">
                          <span className="food-name">{item.food_items.join(', ')}</span>
                          <div className="food-row-right">
                            <span className="food-cal">{item.calories} kkal</span>
                            <button
                              className="btn-delete-mini-food"
                              onClick={() => handleDeleteNutrition(item.nutrition_log_id)}
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
                      <div className="meal-icon-wrap lunch"><CloudSun size={18} /></div>
                      <div>
                        <h4>Makan Siang (Lunch)</h4>
                        <span className="meal-cal-tag">
                          {data.nutrition_logs.filter(n => n.meal_type === 'lunch').reduce((s, n) => s + n.calories, 0)} kkal
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-quick-add-meal"
                      onClick={() => { setFoodMeal('lunch'); setModalFoodOpen(true); }}
                      title="Tambah Makan Siang"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="meal-items-list">
                    {data.nutrition_logs.filter(n => n.meal_type === 'lunch').length === 0 ? (
                      <div className="empty-meal-hint">
                        <Clock size={12} /> Belum ada catatan makan siang.
                        <button className="suggest-meal-btn" onClick={handleSuggestLunch}>
                          💡 Sarankan Menu Siang Sehat
                        </button>
                      </div>
                    ) : (
                      data.nutrition_logs.filter(n => n.meal_type === 'lunch').map((item) => (
                        <div key={item.nutrition_log_id} className="food-log-row">
                          <span className="food-name">{item.food_items.join(', ')}</span>
                          <div className="food-row-right">
                            <span className="food-cal">{item.calories} kkal</span>
                            <button
                              className="btn-delete-mini-food"
                              onClick={() => handleDeleteNutrition(item.nutrition_log_id)}
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
                      <div className="meal-icon-wrap dinner"><Moon size={18} /></div>
                      <div>
                        <h4>Makan Malam (Dinner)</h4>
                        <span className="meal-cal-tag">
                          {data.nutrition_logs.filter(n => n.meal_type === 'dinner').reduce((s, n) => s + n.calories, 0)} kkal
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-quick-add-meal"
                      onClick={() => { setFoodMeal('dinner'); setModalFoodOpen(true); }}
                      title="Tambah Makan Malam"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="meal-items-list">
                    {data.nutrition_logs.filter(n => n.meal_type === 'dinner').length === 0 ? (
                      <div className="empty-meal-hint">
                        <Clock size={12} /> Belum ada catatan makan malam.
                      </div>
                    ) : (
                      data.nutrition_logs.filter(n => n.meal_type === 'dinner').map((item) => (
                        <div key={item.nutrition_log_id} className="food-log-row">
                          <span className="food-name">{item.food_items.join(', ')}</span>
                          <div className="food-row-right">
                            <span className="food-cal">{item.calories} kkal</span>
                            <button
                              className="btn-delete-mini-food"
                              onClick={() => handleDeleteNutrition(item.nutrition_log_id)}
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
                      <div className="meal-icon-wrap snack"><Apple size={18} /></div>
                      <div>
                        <h4>Camilan Sehat (Snack)</h4>
                        <span className="meal-cal-tag">
                          {data.nutrition_logs.filter(n => n.meal_type === 'snack').reduce((s, n) => s + n.calories, 0)} kkal
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-quick-add-meal"
                      onClick={() => { setFoodMeal('snack'); setModalFoodOpen(true); }}
                      title="Tambah Camilan"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="meal-items-list">
                    {data.nutrition_logs.filter(n => n.meal_type === 'snack').length === 0 ? (
                      <div className="empty-meal-hint">
                        <Clock size={12} /> Belum ada catatan camilan.
                      </div>
                    ) : (
                      data.nutrition_logs.filter(n => n.meal_type === 'snack').map((item) => (
                        <div key={item.nutrition_log_id} className="food-log-row">
                          <span className="food-name">{item.food_items.join(', ')}</span>
                          <div className="food-row-right">
                            <span className="food-cal">{item.calories} kkal</span>
                            <button
                              className="btn-delete-mini-food"
                              onClick={() => handleDeleteNutrition(item.nutrition_log_id)}
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
          )}

          {/* ================= TAB 4: ANALISIS & PROYEKSI ================= */}
          {activeTab === 'tabAnalytics' && (
            <section className="tab-pane active" id="tabAnalytics">
              <div className="pane-header">
                <div>
                  <span className="badge-mini badge-purple">Proyeksi Target</span>
                  <h1 className="pane-title">Analisis & Roadmap</h1>
                </div>
              </div>

              {/* Roadmap — computed from actual profile data */}
              <div className="glass-card roadmap-card">
                <div className="card-header-clean">
                  <div className="card-title-group">
                    <span className="badge-mini badge-blue">Roadmap Defisit Sehat</span>
                    <h3>Menuju Berat {targetWeight > 0 ? `${targetWeight} kg` : '— kg'}</h3>
                  </div>
                  <span className="badge-pill highlight">{estimatedWeeks > 0 ? `~${estimatedWeeks} Minggu` : 'Target tercapai! 🎉'}</span>
                </div>

                <div className="roadmap-stats-grid">
                  <div className="r-box">
                    <span className="r-label">Berat Saat Ini</span>
                    <strong className="r-val">{currentWeight > 0 ? `${currentWeight} kg` : '— kg'}</strong>
                  </div>
                  <div className="r-box">
                    <span className="r-label">Target Berat</span>
                    <strong className="r-val text-cyan">{targetWeight > 0 ? `${targetWeight} kg` : '— kg'}</strong>
                  </div>
                  <div className="r-box">
                    <span className="r-label">Selisih Penurunan</span>
                    <strong className="r-val text-rose">{weightDiff > 0 ? `-${remainingWeightKg} kg` : '0 kg'}</strong>
                  </div>
                  <div className="r-box">
                    <span className="r-label">Laju Aman</span>
                    <strong className="r-val text-green">0.4 - 0.5 kg/mgg</strong>
                  </div>
                </div>

                <div className="roadmap-visual">
                  <div className="roadmap-checkpoint reached">
                    <div className="point-circle"><Check size={14} /></div>
                    <span className="point-lbl">{currentWeight > 0 ? `${currentWeight} kg` : '—'} (Saat Ini)</span>
                  </div>
                  <div className="roadmap-line">
                    <div className="roadmap-fill" style={{ width: `${roadmapProgressPercent}%` }}></div>
                  </div>
                  <div className="roadmap-checkpoint">
                    <div className="point-circle">{weightDiff > 0 ? `${milestone1}` : '✓'}</div>
                    <span className="point-lbl">{weightDiff > 0 ? `${milestone1} kg` : 'Tercapai'}</span>
                  </div>
                  <div className="roadmap-line"></div>
                  <div className="roadmap-checkpoint">
                    <div className="point-circle">{weightDiff > 0 ? `${milestone2}` : '✓'}</div>
                    <span className="point-lbl">{weightDiff > 0 ? `${milestone2} kg` : 'Tercapai'}</span>
                  </div>
                  <div className="roadmap-line"></div>
                  <div className="roadmap-checkpoint target">
                    <div className="point-circle"><Trophy size={14} /></div>
                    <span className="point-lbl">{targetWeight > 0 ? `${targetWeight} kg` : '—'} (Ideal)</span>
                  </div>
                </div>
              </div>

              {/* JSON Data Inspector */}
              <div className="glass-card json-card">
                <div className="card-header-clean">
                  <div className="card-title-group">
                    <span className="badge-mini badge-cyan">Sistem Log Real-time</span>
                    <h3>Data Profil & Log Pengguna</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-copy-json" onClick={handleResetTodayData} title="Kosongkan data hari ini untuk menguji status Tanpa Data (Null)">
                      <RotateCcw size={14} /> Reset Data Nol
                    </button>
                    <button className="btn-copy-json" onClick={handleExportJson}>
                      <Download size={14} /> Unduh JSON
                    </button>
                  </div>
                </div>
                <pre className="json-code-box"><code>{JSON.stringify(data, null, 2)}</code></pre>
              </div>
            </section>
          )}

        </div>{/* /app-content */}

        {/* Mobile Bottom Navigation Bar */}
        <nav className="bottom-nav" id="bottomNav">
          <button
            className={`nav-item ${activeTab === 'tabDashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('tabDashboard')}
          >
            <div className="nav-icon-wrap">
              <LayoutDashboard size={20} />
            </div>
            <span className="nav-label">Ringkasan</span>
            <div className="active-dot"></div>
          </button>

          <button
            className={`nav-item ${activeTab === 'tabActivities' ? 'active' : ''}`}
            onClick={() => setActiveTab('tabActivities')}
          >
            <div className="nav-icon-wrap">
              <Activity size={20} />
            </div>
            <span className="nav-label">Aktivitas</span>
            <div className="active-dot"></div>
          </button>

          <button
            className={`nav-item ${activeTab === 'tabNutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('tabNutrition')}
          >
            <div className="nav-icon-wrap">
              <Utensils size={20} />
            </div>
            <span className="nav-label">Nutrisi</span>
            <div className="active-dot"></div>
          </button>

          <button
            className={`nav-item ${activeTab === 'tabAnalytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('tabAnalytics')}
          >
            <div className="nav-icon-wrap">
              <Trophy size={20} />
            </div>
            <span className="nav-label">Roadmap</span>
            <div className="active-dot"></div>
          </button>
        </nav>
      </main>

      {/* ================= MODALS ================= */}

      {/* 1. Modal: Tambah Aktivitas Latihan */}
      {modalActivityOpen && (
        <div className="modal-backdrop active" onClick={() => setModalActivityOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <h3><Dumbbell size={18} className="color-green" /> Catat Sesi Latihan</h3>
              <button className="modal-close-btn" onClick={() => setModalActivityOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSaveActivity}>
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
                  <select value={actIntensity} onChange={(e) => setActIntensity(e.target.value as 'low' | 'medium' | 'high' | 'vigorous')}>
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
      )}

      {/* 2. Modal: Tambah Makanan / Nutrisi */}
      {modalFoodOpen && (
        <div className="modal-backdrop active" onClick={() => setModalFoodOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <h3><Utensils size={18} className="color-orange" /> Catat Menu Makanan</h3>
              <button className="modal-close-btn" onClick={() => setModalFoodOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSaveFood}>
              <div className="form-group">
                <label>Waktu Makan</label>
                <select value={foodMeal} onChange={(e) => setFoodMeal(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')} required>
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
                <Plus size={16} /> Tambahkan ke Log Makanan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Profil & Target Biometrik */}
      {modalProfileOpen && (
        <div className="modal-backdrop active" onClick={() => setModalProfileOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <h3><User size={18} className="color-blue" /> Profil Biometrik Pengguna</h3>
              <button className="modal-close-btn" onClick={() => setModalProfileOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleSaveProfile}>
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
                <Check size={16} /> Simpan Perubahan Profil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Konfigurasi Supabase Cloud Database */}
      {modalSupabaseOpen && (
        <div className="modal-backdrop active" onClick={() => setModalSupabaseOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <h3><Cloud size={18} className="color-cyan" /> Database Cloud (Supabase)</h3>
              <button className="modal-close-btn" onClick={() => setModalSupabaseOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="supabase-info-banner">
              <p><strong>Kenapa Supabase?</strong> Data aktivitas, nutrisi, hidrasi, dan berat badan Anda akan tersimpan abadi di cloud PostgreSQL, sehingga dapat disinkronkan langsung saat dibuka di HP, laptop, atau tablet tanpa hilang saat cache dibersihkan.</p>
              <span className="schema-hint"><Activity size={13} /> Skrip database siap pakai: <code>schema.sql</code></span>
            </div>
            <form className="modal-form" onSubmit={handleConnectSupabase}>
              <div className="form-group">
                <label>Supabase Project URL</label>
                <input
                  type="url"
                  placeholder="https://xxxxxxxxxxxx.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Supabase Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  required
                />
              </div>

              <div className="supabase-status-indicator">
                <span className={`status-dot ${isCloudSync ? 'success' : 'warning'}`}></span>
                <span>{isCloudSync ? 'Status: Terhubung ke Supabase Cloud' : 'Status: Menggunakan Penyimpanan Lokal (Offline)'}</span>
              </div>

              <div className="two-inputs-row">
                <button type="submit" className="btn-submit-action">
                  <Link2 size={16} /> Sambungkan
                </button>
                {isCloudSync && (
                  <button type="button" className="btn-disconnect-action" onClick={handleDisconnectSupabase}>
                    <Unlink2 size={16} /> Putuskan
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="toast-container">
          <div className="toast-box show">
            <span>{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}
