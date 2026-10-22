"use client";

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { initialFitnessData, calculateBMR, formatDateIndonesian, getTodayDateStr } from '../lib/initialData';
import { mapCloudNutritionToApp, mapCloudActivityToApp } from '../lib/supabase';
import { AppFitnessData, ActivityLog, NutritionLog, UserProfile } from '../types/fitness';
import OpeningVideo from '../components/OpeningVideo';
import { shouldShowOpening } from '../lib/openingController';
import DesktopBar from '../components/navigation/DesktopBar';
import BottomNav, { TabType } from '../components/navigation/BottomNav';
import ActivityModal from '../components/modals/ActivityModal';
import NutritionModal from '../components/modals/NutritionModal';
import ProfileModal from '../components/modals/ProfileModal';
import SupabaseModal from '../components/modals/SupabaseModal';
import DashboardTab from '../components/tabs/DashboardTab';
import ActivitiesTab from '../components/tabs/ActivitiesTab';
import NutritionTab from '../components/tabs/NutritionTab';
import AnalyticsTab from '../components/tabs/AnalyticsTab';
import {
  initSupabase,
  getSupabaseConfig,
  syncProfileToCloud,
  syncActivityToCloud,
  syncNutritionToCloud,
  syncHydrationToCloud,
  fetchAllFromCloud,
  deleteActivityFromCloud,
  deleteNutritionFromCloud,
} from '../lib/supabase';

export default function Home() {
  const [data, setData] = useState<AppFitnessData>(initialFitnessData);
  const [activeTab, setActiveTab] = useState<TabType>('tabDashboard');
  const [clock, setClock] = useState('14:04');
  const [toast, setToast] = useState<string | null>(null);

  // Opening video state
  const [showOpening, setShowOpening] = useState(false);
  const [openingComplete, setOpeningComplete] = useState(false);
  const [ringAnimated, setRingAnimated] = useState(false);
  const [dashboardVfxActive, setDashboardVfxActive] = useState(false);

  // Modals state
  const [modalActivityOpen, setModalActivityOpen] = useState(false);
  const [modalFoodOpen, setModalFoodOpen] = useState(false);
  const [modalFoodDefaultMeal, setModalFoodDefaultMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [modalProfileOpen, setModalProfileOpen] = useState(false);
  const [modalSupabaseOpen, setModalSupabaseOpen] = useState(false);

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

  // Check if opening should play (only on client mount)
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      if (shouldShowOpening()) {
        setShowOpening(true);
      } else {
        setOpeningComplete(true);
        setRingAnimated(true);
      }
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // Handle opening completion — trigger VFX shockwave handoff, stagger & celebratory confetti
  const handleOpeningComplete = useCallback(() => {
    setShowOpening(false);
    setOpeningComplete(true);
    setDashboardVfxActive(true);

    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.62 },
        colors: ['#0284C7', '#38BDF8', '#10B981', '#F59E0B'],
      });
    } catch {
      // ignore in SSR / unsupported environments
    }

    setTimeout(() => {
      setRingAnimated(true);
    }, 280);

    setTimeout(() => {
      setDashboardVfxActive(false);
    }, 1400);
  }, []);

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
                const mappedActivities =
                  cloud.activities.length > 0 ? cloud.activities.map(mapCloudActivityToApp) : prev.activity_logs;
                const mappedNutritions =
                  cloud.nutritions.length > 0 ? cloud.nutritions.map(mapCloudNutritionToApp) : prev.nutrition_logs;
                const totalCaloriesConsumed = mappedNutritions.reduce((s, n) => s + (n.calories || 0), 0);
                const totalCaloriesBurned = mappedActivities.reduce(
                  (s, a) => s + (a.metrics.calories_burned || 0),
                  0
                );
                const waterIntakeFromCloud = cloud.waterLog
                  ? cloud.waterLog.consumed_ml
                  : prev.daily_summary.water_intake_ml;

                const updatedProfile = cloud.profile
                  ? {
                      ...prev.user_profile,
                      demographics: {
                        age: cloud.profile.age ?? prev.user_profile.demographics.age,
                        gender: cloud.profile.gender ?? prev.user_profile.demographics.gender,
                        marital_status: cloud.profile.marital_status ?? prev.user_profile.demographics.marital_status,
                      },
                      biometrics: {
                        height_cm: cloud.profile.height_cm ?? prev.user_profile.biometrics.height_cm,
                        weight_kg: cloud.profile.weight_kg ?? prev.user_profile.biometrics.weight_kg,
                        estimated_body_fat_percentage:
                          cloud.profile.estimated_body_fat_percentage ??
                          prev.user_profile.biometrics.estimated_body_fat_percentage,
                        target_body_fat_percentage:
                          cloud.profile.target_body_fat_percentage ??
                          prev.user_profile.biometrics.target_body_fat_percentage,
                        bmi: cloud.profile.bmi ?? prev.user_profile.biometrics.bmi,
                        bmi_status: cloud.profile.bmi_status ?? prev.user_profile.biometrics.bmi_status,
                      },
                      fitness_goals: {
                        target_weight_kg:
                          cloud.profile.target_weight_kg ?? prev.user_profile.fitness_goals.target_weight_kg,
                        daily_calorie_target:
                          cloud.profile.daily_calorie_target ?? prev.user_profile.fitness_goals.daily_calorie_target,
                        daily_water_target_ml:
                          cloud.profile.daily_water_target_ml ?? prev.user_profile.fitness_goals.daily_water_target_ml,
                      },
                    }
                  : prev.user_profile;

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
                    net_calories: totalCaloriesConsumed - totalCaloriesBurned,
                  },
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

  // Macros Total (computed from actual nutrition_logs)
  const totalProtein = data.nutrition_logs.reduce((s, n) => s + (n.protein_g || 0), 0);
  const totalCarbs = data.nutrition_logs.reduce((s, n) => s + (n.carbs_g || 0), 0);
  const totalFat = data.nutrition_logs.reduce((s, n) => s + (n.fat_g || 0), 0);

  // Real-time BMR using Mifflin-St Jeor equation
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
  const roadmapProgressPercent =
    weightDiff > 0 ? Math.min(100, Math.round(((currentWeight - currentWeight) / weightDiff) * 100)) : 100;

  // Steps total from activity logs
  const totalSteps = data.activity_logs.reduce((s, a) => s + (a.metrics.steps_counted || 0), 0);

  // Check for data availability
  const hasActivities = data.activity_logs.length > 0;
  const hasNutrition = data.nutrition_logs.length > 0;
  const hasProfile = data.user_profile.biometrics.weight_kg > 0;
  const remainingWeightKg = Math.max(0, weightDiff).toFixed(1);

  // Water Actions
  const handleAddWater = (ml: number) => {
    const updated = {
      ...data,
      daily_summary: {
        ...data.daily_summary,
        water_intake_ml: waterIntake + ml,
      },
      hydration_logs: [...data.hydration_logs, { time: clock, amount_ml: ml }],
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
        water_intake_ml: newTotal,
      },
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
      fat_g: 11,
    };
    const updated = {
      ...data,
      nutrition_logs: [...data.nutrition_logs, newLog],
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: consumedCalories + 485,
      },
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
  const handleSaveActivity = (newAct: ActivityLog) => {
    const updated = {
      ...data,
      activity_logs: [newAct, ...data.activity_logs],
      daily_summary: {
        ...data.daily_summary,
        calories_burned: burnedCalories + newAct.metrics.calories_burned,
      },
    };
    saveUpdatedData(updated);
    setModalActivityOpen(false);
    showToast(`Aktivitas ${newAct.activity_type} (+${newAct.metrics.calories_burned} kkal) disimpan!`);

    const client = initSupabase();
    if (client && isCloudSync) {
      syncActivityToCloud(client, data.user_profile.user_id, newAct).catch(console.error);
    }
  };

  // Submit Food Form
  const handleSaveFood = (newNut: NutritionLog) => {
    const updated = {
      ...data,
      nutrition_logs: [...data.nutrition_logs, newNut],
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: consumedCalories + Number(newNut.calories),
      },
    };
    saveUpdatedData(updated);
    setModalFoodOpen(false);
    showToast(`Menu ${newNut.food_items[0]} (+${newNut.calories} kkal) dicatat!`);

    const client = initSupabase();
    if (client && isCloudSync) {
      syncNutritionToCloud(client, data.user_profile.user_id, newNut).catch(console.error);
    }
  };

  // Delete Activity
  const handleDeleteActivity = (id: string) => {
    const act = data.activity_logs.find((a) => a.activity_log_id === id);
    const newLogs = data.activity_logs.filter((a) => a.activity_log_id !== id);
    const newBurned = newLogs.reduce((s, a) => s + (a.metrics.calories_burned || 0), 0);
    const updated = {
      ...data,
      activity_logs: newLogs,
      daily_summary: {
        ...data.daily_summary,
        calories_burned: newBurned,
      },
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
    const nut = data.nutrition_logs.find((n) => n.nutrition_log_id === id);
    const newLogs = data.nutrition_logs.filter((n) => n.nutrition_log_id !== id);
    const newConsumed = newLogs.reduce((s, n) => s + (n.calories || 0), 0);
    const updated = {
      ...data,
      nutrition_logs: newLogs,
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: newConsumed,
      },
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
    if (!window.confirm('Kosongkan semua log latihan, makanan, dan air hari ini untuk menguji status Tanpa Data?'))
      return;
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
        net_calories: 0,
      },
    };
    saveUpdatedData(updated);
    showToast('Data hari ini dikosongkan. Menampilkan status data kosong (null).');
  };

  // Save Profile Form
  const handleSaveProfile = (updatedProfile: UserProfile) => {
    const updated = {
      ...data,
      user_profile: updatedProfile,
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
  const handleConnectSupabase = (url: string, key: string) => {
    localStorage.setItem('fitpulse_sb_url', url);
    localStorage.setItem('fitpulse_sb_key', key);
    setSbUrl(url);
    setSbKey(key);
    const client = initSupabase(url, key);
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

  return (
    <>
      {/* ================= OPENING VIDEO ================= */}
      {showOpening && <OpeningVideo onComplete={handleOpeningComplete} />}

      {/* Desktop Bar (Hanya tampil di monitor layar lebar) */}
      <DesktopBar
        userId={data.user_profile.user_id}
        userName={data.user_profile.name}
        userAge={data.user_profile.demographics.age}
        isCloudSync={isCloudSync}
        isSyncing={isSyncing}
        onOpenSupabase={() => setModalSupabaseOpen(true)}
        onResetTodayData={handleResetTodayData}
        onExportJson={handleExportJson}
      />

      {/* Native Mobile Smartphone Container */}
      <main className="app-frame" id="appFrame">
        {/* Main Scrollable App Content */}
        <div className={`app-content${dashboardVfxActive ? ' dashboard-vfx-enter' : ''}`} id="appContent">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'tabDashboard' && (
            <DashboardTab
              data={data}
              dashboardVfxActive={dashboardVfxActive}
              todayFormatted={todayFormatted}
              isCloudSync={isCloudSync}
              ringAnimated={ringAnimated}
              openingComplete={openingComplete}
              ringOffset={ringOffset}
              targetCalories={targetCalories}
              consumedCalories={consumedCalories}
              burnedCalories={burnedCalories}
              remainingCalories={remainingCalories}
              bmrValue={bmrValue}
              totalProtein={totalProtein}
              proteinTarget={proteinTarget}
              totalCarbs={totalCarbs}
              carbsTarget={carbsTarget}
              totalFat={totalFat}
              fatTarget={fatTarget}
              remainingWeightKg={remainingWeightKg}
              weightProgressPercent={weightProgressPercent}
              bodyFatProgressPercent={bodyFatProgressPercent}
              waterIntake={waterIntake}
              targetWater={targetWater}
              waterPercent={waterPercent}
              hasProfile={hasProfile}
              hasActivities={hasActivities}
              hasNutrition={hasNutrition}
              onOpenProfile={() => setModalProfileOpen(true)}
              onOpenSupabase={() => setModalSupabaseOpen(true)}
              onOpenFood={() => {
                setModalFoodDefaultMeal('lunch');
                setModalFoodOpen(true);
              }}
              onOpenActivity={() => setModalActivityOpen(true)}
              onAddWater={handleAddWater}
              onUndoWater={handleUndoWater}
              onNavigateToActivities={() => setActiveTab('tabActivities')}
              onShowToast={showToast}
            />
          )}

          {/* TAB 2: AKTIVITAS */}
          {activeTab === 'tabActivities' && (
            <ActivitiesTab
              data={data}
              burnedCalories={burnedCalories}
              totalSteps={totalSteps}
              onOpenActivityModal={() => setModalActivityOpen(true)}
              onDeleteActivity={handleDeleteActivity}
              onStepUpdate={(steps, calories, distance) => {
                const updated = {
                  ...data,
                  daily_summary: {
                    ...data.daily_summary,
                    calories_burned: data.daily_summary.calories_burned + calories,
                  },
                };
                saveUpdatedData(updated);
                showToast(`Sesi berjalan: ${steps} langkah, ${calories} kkal, ${(distance / 1000).toFixed(2)} km`);
              }}
              onHeartRateComplete={(bpm, confidence) => {
                showToast(`Detak jantung terukur: ${bpm} BPM (Akurasi: ${confidence}%)`);
              }}
            />
          )}

          {/* TAB 3: NUTRISI */}
          {activeTab === 'tabNutrition' && (
            <NutritionTab
              data={data}
              consumedCalories={consumedCalories}
              targetCalories={targetCalories}
              remainingCalories={remainingCalories}
              totalProtein={totalProtein}
              proteinTarget={proteinTarget}
              totalCarbs={totalCarbs}
              carbsTarget={carbsTarget}
              totalFat={totalFat}
              fatTarget={fatTarget}
              onOpenFoodModal={(mealType) => {
                if (mealType) setModalFoodDefaultMeal(mealType);
                setModalFoodOpen(true);
              }}
              onDeleteNutrition={handleDeleteNutrition}
              onSuggestLunch={handleSuggestLunch}
            />
          )}

          {/* TAB 4: ANALISIS & PROYEKSI */}
          {activeTab === 'tabAnalytics' && (
            <AnalyticsTab
              data={data}
              currentWeight={currentWeight}
              targetWeight={targetWeight}
              weightDiff={weightDiff}
              remainingWeightKg={remainingWeightKg}
              estimatedWeeks={estimatedWeeks}
              milestone1={milestone1}
              milestone2={milestone2}
              roadmapProgressPercent={roadmapProgressPercent}
              onResetTodayData={handleResetTodayData}
              onExportJson={handleExportJson}
            />
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          dashboardVfxActive={dashboardVfxActive}
        />
      </main>

      {/* ================= MODALS ================= */}
      {modalActivityOpen && (
        <ActivityModal
          isOpen={modalActivityOpen}
          onClose={() => setModalActivityOpen(false)}
          userWeightKg={data.user_profile.biometrics.weight_kg}
          onSave={handleSaveActivity}
        />
      )}

      {modalFoodOpen && (
        <NutritionModal
          isOpen={modalFoodOpen}
          onClose={() => setModalFoodOpen(false)}
          defaultMeal={modalFoodDefaultMeal}
          currentTimeStr={clock}
          onSave={handleSaveFood}
        />
      )}

      {modalProfileOpen && (
        <ProfileModal
          isOpen={modalProfileOpen}
          onClose={() => setModalProfileOpen(false)}
          userProfile={data.user_profile}
          onSave={handleSaveProfile}
        />
      )}

      {modalSupabaseOpen && (
        <SupabaseModal
          isOpen={modalSupabaseOpen}
          onClose={() => setModalSupabaseOpen(false)}
          isCloudSync={isCloudSync}
          initialUrl={sbUrl}
          initialKey={sbKey}
          onConnect={handleConnectSupabase}
          onDisconnect={handleDisconnectSupabase}
        />
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
