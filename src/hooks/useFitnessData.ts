"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { initialFitnessData } from '../lib/initialData';
import { AppFitnessData, ActivityLog, NutritionLog, HydrationLog, UserProfile } from '../types/fitness';
import {
  initSupabase,
  getSupabaseConfig,
  syncProfileToCloud,
  syncActivityToCloud,
  syncNutritionToCloud,
  syncHydrationToCloud,
  fetchAllFromCloud
} from '../lib/supabase';

export function useFitnessData() {
  const [data, setData] = useState<AppFitnessData>(initialFitnessData);
  const [activeTab, setActiveTab] = useState<'tabDashboard' | 'tabActivities' | 'tabNutrition' | 'tabAnalytics'>('tabDashboard');
  const [isFullView, setIsFullView] = useState(false);
  const [clock, setClock] = useState('14:04');
  const [toast, setToast] = useState<string | null>(null);

  // Supabase Cloud states
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [isCloudSync, setIsCloudSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Sync isFullView with body classes
  useEffect(() => {
    if (isFullView) {
      document.body.classList.add('fullscreen-mode');
      document.body.classList.remove('device-framed');
    } else {
      document.body.classList.add('device-framed');
      document.body.classList.remove('fullscreen-mode');
    }
  }, [isFullView]);

  // Clock & LocalStorage Initialization
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);

    // Load LocalStorage
    try {
      const saved = localStorage.getItem('fitpulse_app_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed);
      }
    } catch (e) {
      console.error("Failed to load local storage:", e);
    }

    // Load Supabase config
    const conf = getSupabaseConfig();
    if (conf.url && conf.key) {
      setSbUrl(conf.url);
      setSbKey(conf.key);
      setIsCloudSync(true);

      const client = initSupabase(conf.url, conf.key);
      if (client) {
        setIsSyncing(true);
        fetchAllFromCloud(client, initialFitnessData.user_profile.user_id)
          .then((cloud) => {
            if (cloud.profile) {
              setData((prev) => {
                const next: AppFitnessData = {
                  ...prev,
                  user_profile: cloud.profile as UserProfile,
                  activity_logs: cloud.activities.length > 0 ? cloud.activities : prev.activity_logs,
                  nutrition_logs: cloud.nutritions.length > 0 ? cloud.nutritions : prev.nutrition_logs
                };
                localStorage.setItem('fitpulse_app_data', JSON.stringify(next));
                return next;
              });
              showToast('Data tersinkronisasi dari Supabase Cloud! ☁️');
            }
          })
          .catch(console.error)
          .finally(() => setIsSyncing(false));
      }
    }

    return () => clearInterval(interval);
  }, [showToast]);

  const saveUpdatedData = useCallback((newData: AppFitnessData) => {
    setData(newData);
    try {
      localStorage.setItem('fitpulse_app_data', JSON.stringify(newData));
    } catch (e) {
      console.error("Failed to save to local storage:", e);
    }
  }, []);

  // Derived Metrics & Calculations
  const targetCalories = data.user_profile.fitness_goals.daily_calorie_target || 1800;
  const consumedCalories = data.daily_summary.calories_consumed || 0;
  const burnedCalories = data.daily_summary.calories_burned || 0;
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);
  const waterIntake = data.daily_summary.water_intake_ml || 0;
  const targetWater = data.user_profile.fitness_goals.daily_water_target_ml || 2500;
  const waterPercent = Math.min(100, Math.round((waterIntake / targetWater) * 100));

  const caloriePercent = Math.min(1, consumedCalories / targetCalories);
  const ringOffset = 477.5 - 477.5 * caloriePercent;

  const totalProtein = useMemo(() => data.nutrition_logs.reduce((s, n) => s + (n.protein_g || 0), 0), [data.nutrition_logs]);
  const totalCarbs = useMemo(() => data.nutrition_logs.reduce((s, n) => s + (n.carbs_g || 0), 0), [data.nutrition_logs]);
  const totalFat = useMemo(() => data.nutrition_logs.reduce((s, n) => s + (n.fat_g || 0), 0), [data.nutrition_logs]);

  const remainingWeightKg = useMemo(() => {
    return Math.max(0, data.user_profile.biometrics.weight_kg - data.user_profile.fitness_goals.target_weight_kg).toFixed(1);
  }, [data.user_profile.biometrics.weight_kg, data.user_profile.fitness_goals.target_weight_kg]);

  // Water Actions
  const handleAddWater = useCallback((ml: number) => {
    const updated: AppFitnessData = {
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
  }, [data, waterIntake, clock, targetWater, saveUpdatedData, showToast, isCloudSync]);

  const handleUndoWater = useCallback(() => {
    if (waterIntake <= 0) return;
    const newTotal = Math.max(0, waterIntake - 250);
    const updated: AppFitnessData = {
      ...data,
      daily_summary: {
        ...data.daily_summary,
        water_intake_ml: newTotal
      }
    };
    saveUpdatedData(updated);
    showToast(`Asupan air dikurangi 250 ml (Total: ${newTotal} ml)`);
  }, [data, waterIntake, saveUpdatedData, showToast]);

  // Lunch Suggestion
  const handleSuggestLunch = useCallback(() => {
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
    const updated: AppFitnessData = {
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
  }, [data, consumedCalories, saveUpdatedData, showToast, isCloudSync]);

  // Export JSON
  const handleExportJson = useCallback(() => {
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
  }, [data, showToast]);

  // Supabase Handlers
  const handleSaveSupabaseConfig = useCallback(async (url: string, key: string) => {
    if (!url.trim() || !key.trim()) return;
    setIsSyncing(true);
    try {
      localStorage.setItem('fitpulse_sb_url', url.trim());
      localStorage.setItem('fitpulse_sb_key', key.trim());
      setSbUrl(url.trim());
      setSbKey(key.trim());
      setIsCloudSync(true);

      const client = initSupabase(url.trim(), key.trim());
      if (client) {
        await syncProfileToCloud(client, data.user_profile);
        showToast('Supabase Cloud terhubung! Profil disinkronkan.');
      }
    } catch (err: any) {
      showToast('Gagal menghubungkan Supabase: ' + (err?.message || 'Error'));
    } finally {
      setIsSyncing(false);
    }
  }, [data.user_profile, showToast]);

  const handleDisconnectSupabase = useCallback(() => {
    localStorage.removeItem('fitpulse_sb_url');
    localStorage.removeItem('fitpulse_sb_key');
    setSbUrl('');
    setSbKey('');
    setIsCloudSync(false);
    showToast('Koneksi Supabase diputuskan. Menggunakan mode lokal.');
  }, [showToast]);

  return {
    data,
    setData,
    activeTab,
    setActiveTab,
    isFullView,
    setIsFullView,
    clock,
    toast,
    showToast,
    sbUrl,
    setSbUrl,
    sbKey,
    setSbKey,
    isCloudSync,
    setIsCloudSync,
    isSyncing,
    targetCalories,
    consumedCalories,
    burnedCalories,
    remainingCalories,
    waterIntake,
    targetWater,
    waterPercent,
    caloriePercent,
    ringOffset,
    totalProtein,
    totalCarbs,
    totalFat,
    remainingWeightKg,
    saveUpdatedData,
    handleAddWater,
    handleUndoWater,
    handleSuggestLunch,
    handleExportJson,
    handleSaveSupabaseConfig,
    handleDisconnectSupabase
  };
}
