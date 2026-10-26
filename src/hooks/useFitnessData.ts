"use client";

import { useState, useMemo, useCallback } from 'react';
import {
  AppFitnessData,
  ActivityLog,
  NutritionLog,
  UserProfile,
  HeartRateLog,
  BloodPressureLog,
} from '../types/fitness';
import {
  initialFitnessData,
  calculateBMR,
} from '../lib/initialData';
import {
  initSupabase,
  syncActivityToCloud,
  syncNutritionToCloud,
  syncHydrationToCloud,
  syncProfileToCloud,
  syncBloodPressureToCloud,
  deleteActivityFromCloud,
  deleteNutritionFromCloud,
  deleteBloodPressureFromCloud,
} from '../lib/supabase';

interface UseFitnessDataProps {
  showToast: (msg: string) => void;
  clock: string;
}

export function useFitnessData({ showToast, clock }: UseFitnessDataProps) {
  // Load from LocalStorage synchronously during state initialization (avoids cascading render)
  const [data, setData] = useState<AppFitnessData>(() => {
    if (typeof window === 'undefined') return initialFitnessData;
    try {
      const saved = localStorage.getItem('fitpulse_app_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load LocalStorage data:', e);
    }
    return initialFitnessData;
  });

  // Save to LocalStorage & state
  const saveUpdatedData = useCallback((newData: AppFitnessData) => {
    setData(newData);
    try {
      localStorage.setItem('fitpulse_app_data', JSON.stringify(newData));
    } catch (e) {
      console.error('Failed to save LocalStorage data:', e);
    }
  }, []);

  // ====== REAL-TIME COMPUTED VALUES ======
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

  // Macros Total (memoized from actual nutrition_logs)
  const { totalProtein, totalCarbs, totalFat } = useMemo(() => {
    return {
      totalProtein: data.nutrition_logs.reduce((s, n) => s + (n.protein_g || 0), 0),
      totalCarbs: data.nutrition_logs.reduce((s, n) => s + (n.carbs_g || 0), 0),
      totalFat: data.nutrition_logs.reduce((s, n) => s + (n.fat_g || 0), 0),
    };
  }, [data.nutrition_logs]);

  // Real-time BMR using Mifflin-St Jeor equation (memoized)
  const bmrValue = useMemo(() => {
    return calculateBMR(
      data.user_profile.biometrics.weight_kg,
      data.user_profile.biometrics.height_cm,
      data.user_profile.demographics.age,
      data.user_profile.demographics.gender
    );
  }, [
    data.user_profile.biometrics.weight_kg,
    data.user_profile.biometrics.height_cm,
    data.user_profile.demographics.age,
    data.user_profile.demographics.gender,
  ]);

  // Real-time weight progress
  const currentWeight = data.user_profile.biometrics.weight_kg;
  const targetWeight = data.user_profile.fitness_goals.target_weight_kg;
  const weightDiff = currentWeight - targetWeight;
  const weightProgressPercent =
    weightDiff > 0
      ? Math.min(100, Math.round(currentWeight - targetWeight <= 0 ? 100 : (1 - weightDiff / currentWeight) * 100))
      : 100;

  // Real-time body fat progress
  const currentBodyFat = data.user_profile.biometrics.estimated_body_fat_percentage;
  const targetBodyFat = data.user_profile.biometrics.target_body_fat_percentage;
  const bodyFatDiff = currentBodyFat - targetBodyFat;
  const bodyFatProgressPercent =
    bodyFatDiff > 0 ? Math.min(100, Math.round((targetBodyFat / currentBodyFat) * 100)) : 100;

  // Real-time macro targets
  const proteinTarget = targetCalories > 0 ? Math.round((targetCalories * 0.3) / 4) : 0;
  const carbsTarget = targetCalories > 0 ? Math.round((targetCalories * 0.4) / 4) : 0;
  const fatTarget = targetCalories > 0 ? Math.round((targetCalories * 0.3) / 9) : 0;

  // Real-time roadmap calculations
  const weeklyLossRate = 0.45;
  const estimatedWeeks = weightDiff > 0 ? Math.round(weightDiff / weeklyLossRate) : 0;
  const milestone1 = weightDiff > 0 ? Math.round(currentWeight - weightDiff * 0.33) : currentWeight;
  const milestone2 = weightDiff > 0 ? Math.round(currentWeight - weightDiff * 0.66) : currentWeight;
  const roadmapProgressPercent = weightDiff > 0 ? Math.min(100, Math.max(10, Math.round(weightProgressPercent))) : 100;

  // Steps total from activity logs (memoized)
  const totalSteps = useMemo(() => {
    return data.activity_logs.reduce((s, a) => s + (a.metrics.steps_counted || 0), 0);
  }, [data.activity_logs]);

  // Availability flags
  const hasActivities = data.activity_logs.length > 0;
  const hasNutrition = data.nutrition_logs.length > 0;
  const hasProfile = data.user_profile.biometrics.weight_kg > 0;
  const remainingWeightKg = Math.max(0, weightDiff).toFixed(1);

  // ====== ACTION HANDLERS ======

  // Water Actions
  const handleAddWater = useCallback((ml: number) => {
    setData((prev) => {
      const newWater = (prev.daily_summary.water_intake_ml || 0) + ml;
      const updated: AppFitnessData = {
        ...prev,
        daily_summary: {
          ...prev.daily_summary,
          water_intake_ml: newWater,
        },
        hydration_logs: [...prev.hydration_logs, { time: clock, amount_ml: ml }],
      };
      try {
        localStorage.setItem('fitpulse_app_data', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    showToast(`Asupan air +${ml} ml dicatat!`);

    const client = initSupabase();
    if (client) {
      syncHydrationToCloud(client, data.user_profile.user_id, ml).catch(console.error);
    }
  }, [clock, data.user_profile.user_id, showToast]);

  const handleUndoWater = useCallback(() => {
    if (waterIntake <= 0) return;
    const newTotal = Math.max(0, waterIntake - 250);
    const updated: AppFitnessData = {
      ...data,
      daily_summary: {
        ...data.daily_summary,
        water_intake_ml: newTotal,
      },
    };
    saveUpdatedData(updated);
    showToast(`Asupan air dikurangi 250 ml (Total: ${newTotal} ml)`);
  }, [waterIntake, data, saveUpdatedData, showToast]);

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
      fat_g: 11,
    };
    const updated: AppFitnessData = {
      ...data,
      nutrition_logs: [...data.nutrition_logs, newLog],
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: consumedCalories + 485,
      },
    };
    saveUpdatedData(updated);
    showToast('Menu Makan Siang Sehat (+485 kkal, 38g Protein) ditambahkan!');

    const client = initSupabase();
    if (client) {
      syncNutritionToCloud(client, data.user_profile.user_id, newLog).catch(console.error);
    }
  }, [data, consumedCalories, saveUpdatedData, showToast]);

  // Submit Activity Form
  const handleSaveActivity = useCallback((newAct: ActivityLog) => {
    const newCaloriesBurned = burnedCalories + (newAct.metrics.calories_burned || 0);
    const updated: AppFitnessData = {
      ...data,
      activity_logs: [newAct, ...data.activity_logs],
      daily_summary: {
        ...data.daily_summary,
        calories_burned: newCaloriesBurned,
        net_calories: consumedCalories - newCaloriesBurned,
      },
    };
    saveUpdatedData(updated);
    showToast(`Aktivitas "${newAct.activity_type}" (+${newAct.metrics.calories_burned} kkal) disimpan!`);

    const client = initSupabase();
    if (client) {
      syncActivityToCloud(client, data.user_profile.user_id, newAct).catch(console.error);
    }
  }, [data, burnedCalories, consumedCalories, saveUpdatedData, showToast]);

  // Delete Activity
  const handleDeleteActivity = useCallback((id: string) => {
    const actToDelete = data.activity_logs.find((a) => a.activity_log_id === id);
    const calToSubtract = actToDelete ? actToDelete.metrics.calories_burned || 0 : 0;
    const newBurned = Math.max(0, burnedCalories - calToSubtract);

    const updated: AppFitnessData = {
      ...data,
      activity_logs: data.activity_logs.filter((a) => a.activity_log_id !== id),
      daily_summary: {
        ...data.daily_summary,
        calories_burned: newBurned,
        net_calories: consumedCalories - newBurned,
      },
    };
    saveUpdatedData(updated);
    showToast('Aktivitas berhasil dihapus.');

    const client = initSupabase();
    if (client) {
      deleteActivityFromCloud(client, id).catch(console.error);
    }
  }, [data, burnedCalories, consumedCalories, saveUpdatedData, showToast]);

  // Submit Food Form
  const handleSaveFood = useCallback((newNut: NutritionLog) => {
    const newCaloriesConsumed = consumedCalories + (newNut.calories || 0);
    const updated: AppFitnessData = {
      ...data,
      nutrition_logs: [newNut, ...data.nutrition_logs],
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: newCaloriesConsumed,
        net_calories: newCaloriesConsumed - burnedCalories,
      },
    };
    saveUpdatedData(updated);
    showToast(`Makanan "${newNut.food_items.join(', ')}" (+${newNut.calories} kkal) disimpan!`);

    const client = initSupabase();
    if (client) {
      syncNutritionToCloud(client, data.user_profile.user_id, newNut).catch(console.error);
    }
  }, [data, consumedCalories, burnedCalories, saveUpdatedData, showToast]);

  // Delete Nutrition
  const handleDeleteNutrition = useCallback((id: string) => {
    const nutToDelete = data.nutrition_logs.find((n) => n.nutrition_log_id === id);
    const calToSubtract = nutToDelete ? nutToDelete.calories || 0 : 0;
    const newConsumed = Math.max(0, consumedCalories - calToSubtract);

    const updated: AppFitnessData = {
      ...data,
      nutrition_logs: data.nutrition_logs.filter((n) => n.nutrition_log_id !== id),
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: newConsumed,
        net_calories: newConsumed - burnedCalories,
      },
    };
    saveUpdatedData(updated);
    showToast('Catatan nutrisi berhasil dihapus.');

    const client = initSupabase();
    if (client) {
      deleteNutritionFromCloud(client, id).catch(console.error);
    }
  }, [data, consumedCalories, burnedCalories, saveUpdatedData, showToast]);

  // Update Profile
  const handleSaveProfile = useCallback((newProfile: UserProfile) => {
    const updated: AppFitnessData = {
      ...data,
      user_profile: newProfile,
    };
    saveUpdatedData(updated);
    showToast('Profil & target kalori berhasil diperbarui!');

    const client = initSupabase();
    if (client) {
      syncProfileToCloud(client, newProfile).catch(console.error);
    }
  }, [data, saveUpdatedData, showToast]);

  // Save Heart Rate Log
  const handleSaveHeartRate = useCallback((newLog: HeartRateLog) => {
    const existingLogs = data.heart_rate_logs || [];
    const updated: AppFitnessData = {
      ...data,
      heart_rate_logs: [newLog, ...existingLogs],
    };
    saveUpdatedData(updated);
    showToast(`Detak jantung ${newLog.bpm} BPM tersimpan di Buku Vitals! ❤️`);
  }, [data, saveUpdatedData, showToast]);

  // Delete Heart Rate Log
  const handleDeleteHeartRate = useCallback((id: string) => {
    const existingLogs = data.heart_rate_logs || [];
    const updated: AppFitnessData = {
      ...data,
      heart_rate_logs: existingLogs.filter((h) => h.id !== id),
    };
    saveUpdatedData(updated);
    showToast('Catatan detak jantung dihapus.');
  }, [data, saveUpdatedData, showToast]);

  // Save Blood Pressure Log
  const handleSaveBloodPressure = useCallback((newLog: BloodPressureLog) => {
    const existingLogs = data.blood_pressure_logs || [];
    const updated: AppFitnessData = {
      ...data,
      blood_pressure_logs: [newLog, ...existingLogs],
    };
    saveUpdatedData(updated);
    showToast(`Tekanan darah ${newLog.systolic}/${newLog.diastolic} mmHg tersimpan di Buku Vitals! 🩸`);

    const client = initSupabase();
    if (client) {
      syncBloodPressureToCloud(client, data.user_profile.user_id, newLog).catch(console.error);
    }
  }, [data, saveUpdatedData, showToast]);

  // Delete Blood Pressure Log
  const handleDeleteBloodPressure = useCallback((id: string) => {
    const existingLogs = data.blood_pressure_logs || [];
    const updated: AppFitnessData = {
      ...data,
      blood_pressure_logs: existingLogs.filter((b) => b.id !== id),
    };
    saveUpdatedData(updated);
    showToast('Catatan tekanan darah dihapus.');

    const client = initSupabase();
    if (client) {
      deleteBloodPressureFromCloud(client, id).catch(console.error);
    }
  }, [data, saveUpdatedData, showToast]);

  // Reset Today's Data
  const handleResetTodayData = useCallback(() => {
    if (confirm('Yakin ingin mereset log aktivitas dan makanan hari ini ke data awal?')) {
      saveUpdatedData(initialFitnessData);
      showToast('Data hari ini berhasil direset ke nilai awal!');
    }
  }, [saveUpdatedData, showToast]);

  // Export JSON Backup
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

  // Shared step update handler
  const handleStepUpdate = useCallback((steps: number, calories: number, distance: number) => {
    setData((prev) => {
      const updated: AppFitnessData = {
        ...prev,
        daily_summary: {
          ...prev.daily_summary,
          calories_burned: (prev.daily_summary.calories_burned || 0) + calories,
        },
      };
      try {
        localStorage.setItem('fitpulse_app_data', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    showToast(`Pedometer: ${steps} langkah, ${calories} kkal, ${(distance / 1000).toFixed(2)} km`);
  }, [showToast]);

  return {
    data,
    setData,
    saveUpdatedData,
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
    bmrValue,
    currentWeight,
    targetWeight,
    weightDiff,
    weightProgressPercent,
    currentBodyFat,
    targetBodyFat,
    bodyFatProgressPercent,
    proteinTarget,
    carbsTarget,
    fatTarget,
    estimatedWeeks,
    milestone1,
    milestone2,
    roadmapProgressPercent,
    totalSteps,
    hasActivities,
    hasNutrition,
    hasProfile,
    remainingWeightKg,
    handleAddWater,
    handleUndoWater,
    handleSuggestLunch,
    handleSaveActivity,
    handleDeleteActivity,
    handleSaveFood,
    handleDeleteNutrition,
    handleSaveProfile,
    handleSaveHeartRate,
    handleDeleteHeartRate,
    handleSaveBloodPressure,
    handleDeleteBloodPressure,
    handleResetTodayData,
    handleExportJson,
    handleStepUpdate,
  };
}
