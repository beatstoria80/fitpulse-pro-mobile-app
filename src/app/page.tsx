"use client";

import React, { useState, useEffect } from 'react';
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
import { Header } from '../components/Header';
import { MetricCards } from '../components/MetricCards';
import { WeightGoalCard } from '../components/WeightGoalCard';
import { ActivitiesTab } from '../components/ActivitiesTab';
import { NutritionTab } from '../components/NutritionTab';
import { HydrationTab } from '../components/HydrationTab';
import { ProfileTab } from '../components/ProfileTab';
import { BottomNav, TabType } from '../components/BottomNav';
import { ActivityModal, NutritionModal, HydrationModal, SupabaseModal } from '../components/Modals';

export default function Home() {
  const [data, setData] = useState<AppFitnessData>(initialFitnessData);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCloudSync, setIsCloudSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [isHydrationModalOpen, setIsHydrationModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load from local storage or cloud on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('fitpulse_app_data');
      if (savedData) {
        setData(JSON.parse(savedData));
      }
    } catch (e) {
      console.error('Error loading local data', e);
    }

    const { url, key } = getSupabaseConfig();
    if (url && key) {
      setSupabaseUrl(url);
      setSupabaseKey(key);
      const client = initSupabase(url, key);
      if (client) {
        setIsCloudSync(true);
        // Sync fetch from cloud
        setIsSyncing(true);
        fetchAllFromCloud(client, initialFitnessData.user_profile.user_id)
          .then((cloudData) => {
            if (cloudData.profile || cloudData.activities.length > 0) {
              setData((prev) => {
                const updated: AppFitnessData = {
                  ...prev,
                  activity_logs: cloudData.activities.length > 0 ? cloudData.activities : prev.activity_logs,
                  nutrition_logs: cloudData.nutritions.length > 0 ? cloudData.nutritions : prev.nutrition_logs
                };
                localStorage.setItem('fitpulse_app_data', JSON.stringify(updated));
                return updated;
              });
              showToast('Data tersinkronisasi dari Supabase Cloud! ☁️');
            }
          })
          .catch((err) => {
            console.error('Cloud load error:', err);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      }
    }
  }, []);

  const saveLocalData = (newData: AppFitnessData) => {
    setData(newData);
    try {
      localStorage.setItem('fitpulse_app_data', JSON.stringify(newData));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  };

  // Handlers for Add Operations
  const handleAddActivity = async (payload: {
    activity_type: string;
    duration_minutes: number;
    intensity_level: 'low' | 'medium' | 'high' | 'vigorous';
    calories_burned: number;
    average_heart_rate?: number;
    steps_counted?: number;
  }) => {
    const newLog: ActivityLog = {
      activity_log_id: `ACT-${Date.now()}`,
      timestamp_start: new Date().toISOString(),
      activity_type: payload.activity_type,
      metrics: {
        duration_minutes: payload.duration_minutes,
        intensity_level: payload.intensity_level,
        calories_burned: payload.calories_burned,
        average_heart_rate: payload.average_heart_rate || null,
        steps_counted: payload.steps_counted || null
      },
      device_source: 'FitPulse Pro Mobile'
    };

    const updatedLogs = [newLog, ...data.activity_logs];
    const newBurned = data.daily_summary.calories_burned + payload.calories_burned;
    const updatedData: AppFitnessData = {
      ...data,
      activity_logs: updatedLogs,
      daily_summary: {
        ...data.daily_summary,
        calories_burned: newBurned
      }
    };

    saveLocalData(updatedData);
    showToast(`Aktivitas ${payload.activity_type} (+${payload.calories_burned} kkal) dicatat!`);

    if (newBurned >= 500) {
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
    }

    // Cloud sync
    const client = initSupabase();
    if (client && isCloudSync) {
      try {
        await syncActivityToCloud(client, data.user_profile.user_id, newLog);
        showToast('Tersinkron ke Supabase Cloud ☁️');
      } catch (err) {
        console.error('Failed sync activity to cloud:', err);
      }
    }
  };

  const handleAddNutrition = async (payload: {
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }) => {
    const newNut: NutritionLog = {
      nutrition_log_id: `NUT-${Date.now()}`,
      meal_type: payload.meal_type,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      calories: payload.calories,
      food_items: [payload.food_name],
      protein_g: payload.protein_g,
      carbs_g: payload.carbs_g,
      fat_g: payload.fat_g
    };

    const updatedLogs = [newNut, ...data.nutrition_logs];
    const newConsumed = data.daily_summary.calories_consumed + payload.calories;
    const updatedData: AppFitnessData = {
      ...data,
      nutrition_logs: updatedLogs,
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: newConsumed
      }
    };

    saveLocalData(updatedData);
    showToast(`Menu ${payload.food_name} (+${payload.calories} kkal) ditambahkan!`);

    // Cloud sync
    const client = initSupabase();
    if (client && isCloudSync) {
      try {
        await syncNutritionToCloud(client, data.user_profile.user_id, newNut);
        showToast('Tersinkron ke Supabase Cloud ☁️');
      } catch (err) {
        console.error('Failed sync nutrition to cloud:', err);
      }
    }
  };

  const handleAddHydration = async (amountMl: number) => {
    const newHydration: HydrationLog = {
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      amount_ml: amountMl
    };

    const updatedLogs = [newHydration, ...data.hydration_logs];
    const newTotal = data.daily_summary.water_intake_ml + amountMl;
    const updatedData: AppFitnessData = {
      ...data,
      hydration_logs: updatedLogs,
      daily_summary: {
        ...data.daily_summary,
        water_intake_ml: newTotal
      }
    };

    saveLocalData(updatedData);
    showToast(`Asupan air +${amountMl} ml ditambahkan!`);

    if (newTotal >= data.user_profile.fitness_goals.daily_water_target_ml) {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    }

    // Cloud sync
    const client = initSupabase();
    if (client && isCloudSync) {
      try {
        await syncHydrationToCloud(client, data.user_profile.user_id, amountMl);
        showToast('Tersinkron ke Supabase Cloud ☁️');
      } catch (err) {
        console.error('Failed sync hydration to cloud:', err);
      }
    }
  };

  const handleSuggestLunch = () => {
    handleAddNutrition({
      meal_type: 'lunch',
      food_name: 'Dada Ayam Panggang Herbal, Nasi Merah, Tumis Buncis & Wortel, Jus Jeruk Segar',
      calories: 485,
      protein_g: 38,
      carbs_g: 48,
      fat_g: 11
    });
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleSaveSupabaseConfig = async (url: string, key: string) => {
    setSupabaseUrl(url);
    setSupabaseKey(key);
    localStorage.setItem('fitpulse_sb_url', url);
    localStorage.setItem('fitpulse_sb_key', key);

    const client = initSupabase(url, key);
    if (client) {
      setIsCloudSync(true);
      showToast('Kredensial Supabase tersambung! ☁️');
      handleSyncNow();
    } else {
      setIsCloudSync(false);
      showToast('Kredensial dibersihkan, mode lokal aktif.');
    }
  };

  const handleSyncNow = async () => {
    const client = initSupabase();
    if (!client) {
      showToast('Masukkan URL & Anon Key Supabase terlebih dahulu.');
      return;
    }
    setIsSyncing(true);
    try {
      await syncProfileToCloud(client, data.user_profile);
      showToast('Semua data berhasil disinkronkan ke Supabase Cloud! 🎉');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal sinkron: ' + (err.message || 'Koneksi error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitpulse_data_${data.user_profile.user_id}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data FitPulse Pro berhasil diekspor ke file JSON!');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`app-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <main className="app-frame">
        {/* Dynamic Header */}
        <Header
          userProfile={data.user_profile}
          isCloudSync={isCloudSync}
          isSyncing={isSyncing}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onExportJson={handleExportJson}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />

        {/* Content Pane by Tab */}
        <div className="app-content-scroll">
          {activeTab === 'summary' && (
            <div className="tab-pane active fade-in">
              <WeightGoalCard
                biometrics={data.user_profile.biometrics}
                fitnessGoals={data.user_profile.fitness_goals}
              />

              <MetricCards
                dailySummary={data.daily_summary}
                fitnessGoals={data.user_profile.fitness_goals}
                onOpenHydrationModal={() => setIsHydrationModalOpen(true)}
                onOpenNutritionModal={() => setIsNutritionModalOpen(true)}
                onOpenActivityModal={() => setIsActivityModalOpen(true)}
              />

              {/* Today's Activities Preview */}
              <div className="section-block">
                <ActivitiesTab
                  activityLogs={data.activity_logs.slice(0, 2)}
                  onOpenAddModal={() => setIsActivityModalOpen(true)}
                />
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="tab-pane active fade-in">
              <ActivitiesTab
                activityLogs={data.activity_logs}
                onOpenAddModal={() => setIsActivityModalOpen(true)}
              />
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="tab-pane active fade-in">
              <NutritionTab
                nutritionLogs={data.nutrition_logs}
                onOpenAddModal={() => setIsNutritionModalOpen(true)}
                onSuggestLunch={handleSuggestLunch}
              />
            </div>
          )}

          {activeTab === 'hydration' && (
            <div className="tab-pane active fade-in">
              <HydrationTab
                hydrationLogs={data.hydration_logs}
                waterTotal={data.daily_summary.water_intake_ml}
                fitnessGoals={data.user_profile.fitness_goals}
                onQuickAddWater={handleAddHydration}
                onOpenAddModal={() => setIsHydrationModalOpen(true)}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="tab-pane active fade-in">
              <ProfileTab
                userProfile={data.user_profile}
                supabaseUrl={supabaseUrl}
                supabaseKey={supabaseKey}
                isCloudSync={isCloudSync}
                isSyncing={isSyncing}
                onSaveSupabaseConfig={handleSaveSupabaseConfig}
                onSyncNow={handleSyncNow}
                onUpdateProfile={(updated) => saveLocalData({ ...data, user_profile: updated })}
              />
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Toast Alert */}
        {toast && (
          <div className="toast-notification">
            <span>{toast}</span>
          </div>
        )}

        {/* Modals */}
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          onSubmit={handleAddActivity}
        />

        <NutritionModal
          isOpen={isNutritionModalOpen}
          onClose={() => setIsNutritionModalOpen(false)}
          onSubmit={handleAddNutrition}
        />

        <HydrationModal
          isOpen={isHydrationModalOpen}
          onClose={() => setIsHydrationModalOpen(false)}
          onSubmit={handleAddHydration}
        />

        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          isCloudSync={isCloudSync}
          isSyncing={isSyncing}
          onSave={handleSaveSupabaseConfig}
          onSyncNow={handleSyncNow}
        />
      </main>
    </div>
  );
}
