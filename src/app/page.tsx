"use client";

import React, { useState, useCallback } from 'react';
import { useFitnessData } from '../hooks/useFitnessData';
import { ActivityLog, NutritionLog, UserProfile, AppFitnessData } from '../types/fitness';
import { StravaRunSession } from '../components/StravaRunTracker';
import { initSupabase, syncActivityToCloud, syncNutritionToCloud, syncProfileToCloud } from '../lib/supabase';

// Layout Components
import { DesktopSidebar } from '../components/layout/DesktopSidebar';
import { MobileStatusBar } from '../components/layout/MobileStatusBar';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { ToastNotification } from '../components/ui/ToastNotification';

// Tab Components
import { DashboardTab } from '../components/tabs/DashboardTab';
import { ActivitiesTab } from '../components/tabs/ActivitiesTab';
import { NutritionTab } from '../components/tabs/NutritionTab';
import { AnalyticsTab } from '../components/tabs/AnalyticsTab';

// Modal Components
import { ActivityModal } from '../components/modals/ActivityModal';
import { FoodModal } from '../components/modals/FoodModal';
import { ProfileModal } from '../components/modals/ProfileModal';
import { SupabaseModal } from '../components/modals/SupabaseModal';

export default function Home() {
  const {
    data,
    activeTab,
    setActiveTab,
    isFullView,
    setIsFullView,
    clock,
    toast,
    showToast,
    sbUrl,
    sbKey,
    isCloudSync,
    isSyncing,
    targetCalories,
    consumedCalories,
    burnedCalories,
    remainingCalories,
    waterIntake,
    targetWater,
    waterPercent,
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
  } = useFitnessData();

  // Modals Visibility State
  const [modalActivityOpen, setModalActivityOpen] = useState(false);
  const [modalFoodOpen, setModalFoodOpen] = useState(false);
  const [modalProfileOpen, setModalProfileOpen] = useState(false);
  const [modalSupabaseOpen, setModalSupabaseOpen] = useState(false);
  const [foodMealPreset, setFoodMealPreset] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

  // Submit Activity Form
  const handleSaveActivity = useCallback((act: {
    type: string;
    duration: number;
    intensity: 'low' | 'medium' | 'high';
    heartRate?: number;
    steps?: number;
    calories: number;
  }) => {
    const newAct: ActivityLog = {
      activity_log_id: `ACT-${Date.now()}`,
      activity_type: act.type,
      timestamp_start: new Date().toISOString(),
      metrics: {
        duration_minutes: act.duration,
        intensity_level: act.intensity,
        calories_burned: act.calories,
        average_heart_rate: act.heartRate || null,
        steps_counted: act.steps || null
      },
      device_source: 'FitPulse Pro Mobile'
    };

    const updated: AppFitnessData = {
      ...data,
      activity_logs: [newAct, ...data.activity_logs],
      daily_summary: {
        ...data.daily_summary,
        calories_burned: burnedCalories + act.calories
      }
    };
    saveUpdatedData(updated);
    showToast(`Aktivitas ${act.type} (+${act.calories} kkal) disimpan!`);

    const client = initSupabase();
    if (client && isCloudSync) {
      syncActivityToCloud(client, data.user_profile.user_id, newAct).catch(console.error);
    }
  }, [data, burnedCalories, saveUpdatedData, showToast, isCloudSync]);

  // Submit Strava Run Session
  const handleSaveStravaRun = useCallback((session: StravaRunSession) => {
    const newAct: ActivityLog = {
      activity_log_id: `ACT-${Date.now()}`,
      activity_type: session.title,
      timestamp_start: new Date(Date.now() - session.durationMinutes * 60000).toISOString(),
      timestamp_end: new Date().toISOString(),
      metrics: {
        duration_minutes: session.durationMinutes,
        intensity_level: 'high',
        calories_burned: session.calories,
        average_heart_rate: session.avgHr,
        steps_counted: session.steps,
        distance_meters: Math.round(session.distanceKm * 1000)
      },
      device_source: 'FitPulse Strava GPS Pro'
    };

    const updated: AppFitnessData = {
      ...data,
      activity_logs: [newAct, ...data.activity_logs],
      daily_summary: {
        ...data.daily_summary,
        calories_burned: burnedCalories + session.calories
      }
    };
    saveUpdatedData(updated);
    showToast(`🏃 Sesi ${session.title} (+${session.calories} kkal, ${session.distanceKm} km) tersimpan!`);

    const client = initSupabase();
    if (client && isCloudSync) {
      syncActivityToCloud(client, data.user_profile.user_id, newAct).catch(console.error);
    }
  }, [data, burnedCalories, saveUpdatedData, showToast, isCloudSync]);

  // Submit Food Form
  const handleSaveFood = useCallback((newNut: NutritionLog) => {
    const updated: AppFitnessData = {
      ...data,
      nutrition_logs: [...data.nutrition_logs, newNut],
      daily_summary: {
        ...data.daily_summary,
        calories_consumed: consumedCalories + newNut.calories
      }
    };
    saveUpdatedData(updated);
    showToast(`Makanan ${newNut.food_items[0]} (+${newNut.calories} kkal) dicatat!`);

    const client = initSupabase();
    if (client && isCloudSync) {
      syncNutritionToCloud(client, data.user_profile.user_id, newNut).catch(console.error);
    }
  }, [data, consumedCalories, saveUpdatedData, showToast, isCloudSync]);

  // Submit Profile Form
  const handleSaveProfile = useCallback((updatedProfile: UserProfile) => {
    const updated: AppFitnessData = {
      ...data,
      user_profile: updatedProfile
    };
    saveUpdatedData(updated);
    showToast('Profil biometrik berhasil diperbarui!');

    const client = initSupabase();
    if (client && isCloudSync) {
      syncProfileToCloud(client, updatedProfile).catch(console.error);
    }
  }, [data, saveUpdatedData, showToast, isCloudSync]);

  // Handle Step Counter Live Update
  const handleStepUpdate = useCallback((steps: number, calories: number, distance: number) => {
    const updated: AppFitnessData = {
      ...data,
      daily_summary: {
        ...data.daily_summary,
        calories_burned: data.daily_summary.calories_burned + calories
      }
    };
    saveUpdatedData(updated);
    showToast(`Sesi berjalan: ${steps} langkah, ${calories} kkal, ${(distance / 1000).toFixed(2)} km`);
  }, [data, saveUpdatedData, showToast]);

  return (
    <>
      {/* Desktop Controls Sidebar */}
      <DesktopSidebar
        userProfile={data.user_profile}
        isFullView={isFullView}
        setIsFullView={setIsFullView}
        isCloudSync={isCloudSync}
        isSyncing={isSyncing}
        onOpenSupabaseModal={() => setModalSupabaseOpen(true)}
        onExportJson={handleExportJson}
      />

      {/* Mobile Device Mockup Frame */}
      <main className="app-frame" id="appFrame">
        <MobileStatusBar clock={clock} burnedCalories={burnedCalories} />

        <div className="app-content" id="appContent">
          {activeTab === 'tabDashboard' && (
            <DashboardTab
              data={data}
              remainingCalories={remainingCalories}
              consumedCalories={consumedCalories}
              burnedCalories={burnedCalories}
              targetCalories={targetCalories}
              ringOffset={ringOffset}
              totalProtein={totalProtein}
              totalCarbs={totalCarbs}
              totalFat={totalFat}
              remainingWeightKg={remainingWeightKg}
              waterIntake={waterIntake}
              targetWater={targetWater}
              waterPercent={waterPercent}
              isCloudSync={isCloudSync}
              onOpenProfileModal={() => setModalProfileOpen(true)}
              onOpenSupabaseModal={() => setModalSupabaseOpen(true)}
              onOpenFoodModal={() => { setFoodMealPreset('lunch'); setModalFoodOpen(true); }}
              onOpenActivityModal={() => setModalActivityOpen(true)}
              onAddWater={handleAddWater}
              onUndoWater={handleUndoWater}
              onShowToast={showToast}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'tabActivities' && (
            <ActivitiesTab
              data={data}
              burnedCalories={burnedCalories}
              onOpenActivityModal={() => setModalActivityOpen(true)}
              onSaveStravaRun={handleSaveStravaRun}
              onStepUpdate={handleStepUpdate}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'tabNutrition' && (
            <NutritionTab
              data={data}
              consumedCalories={consumedCalories}
              targetCalories={targetCalories}
              remainingCalories={remainingCalories}
              totalProtein={totalProtein}
              totalCarbs={totalCarbs}
              totalFat={totalFat}
              onOpenFoodModalForMeal={(meal) => { setFoodMealPreset(meal); setModalFoodOpen(true); }}
              onOpenFoodModalGeneral={() => { setFoodMealPreset('lunch'); setModalFoodOpen(true); }}
              onSuggestLunch={handleSuggestLunch}
            />
          )}

          {activeTab === 'tabAnalytics' && (
            <AnalyticsTab data={data} remainingWeightKg={remainingWeightKg} />
          )}
        </div>

        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="home-indicator"></div>
      </main>

      {/* Global Modals */}
      <ActivityModal
        isOpen={modalActivityOpen}
        onClose={() => setModalActivityOpen(false)}
        onSave={handleSaveActivity}
      />

      <FoodModal
        isOpen={modalFoodOpen}
        defaultMeal={foodMealPreset}
        clock={clock}
        onClose={() => setModalFoodOpen(false)}
        onSave={handleSaveFood}
      />

      <ProfileModal
        isOpen={modalProfileOpen}
        userProfile={data.user_profile}
        onClose={() => setModalProfileOpen(false)}
        onSave={handleSaveProfile}
      />

      <SupabaseModal
        isOpen={modalSupabaseOpen}
        initialUrl={sbUrl}
        initialKey={sbKey}
        isCloudSync={isCloudSync}
        onClose={() => setModalSupabaseOpen(false)}
        onConnect={handleSaveSupabaseConfig}
        onDisconnect={handleDisconnectSupabase}
      />

      {/* Toast Alert */}
      <ToastNotification toast={toast} />
    </>
  );
}
