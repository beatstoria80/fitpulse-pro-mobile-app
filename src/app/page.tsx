"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { formatDateIndonesian } from '../lib/initialData';
import OpeningVideo from '../components/OpeningVideo';
import { shouldShowOpening } from '../lib/openingController';
import DesktopBar from '../components/navigation/DesktopBar';
import BottomNav, { TabType } from '../components/navigation/BottomNav';
import DashboardTab from '../components/tabs/DashboardTab';
import ActivitiesTab from '../components/tabs/ActivitiesTab';
import NutritionTab from '../components/tabs/NutritionTab';
import AnalyticsTab from '../components/tabs/AnalyticsTab';

// Dynamic Code-Splitting for Modals (loaded on-demand)
const ActivityModal = dynamic(() => import('../components/modals/ActivityModal'), { ssr: false });
const NutritionModal = dynamic(() => import('../components/modals/NutritionModal'), { ssr: false });
const ProfileModal = dynamic(() => import('../components/modals/ProfileModal'), { ssr: false });
const SupabaseModal = dynamic(() => import('../components/modals/SupabaseModal'), { ssr: false });
const OnboardingModal = dynamic(
  () => import('../components/modals/OnboardingModal').then((mod) => mod.OnboardingModal),
  { ssr: false }
);

// Dynamic Code-Splitting for 3D Character Feature Detail Pages (loaded on-demand)
const EnergyCalorieDetailView = dynamic(() => import('../components/features/EnergyCalorieDetailView'), { ssr: false });
const NutritionDetailView = dynamic(() => import('../components/features/NutritionDetailView'), { ssr: false });
const ActivityPedometerDetailView = dynamic(() => import('../components/features/ActivityPedometerDetailView'), { ssr: false });
const HydrationDetailView = dynamic(() => import('../components/features/HydrationDetailView'), { ssr: false });
import { useFitnessData } from '../hooks/useFitnessData';
import { useCloudSync } from '../hooks/useCloudSync';
import { 
  mapCloudNutritionToApp, 
  mapCloudActivityToApp, 
  mapCloudBloodPressureToApp 
} from '../lib/supabase';
import { UserProfile } from '../types/fitness';

export default function Home() {
  // Navigation & Feature Route States
  const [activeTab, setActiveTab] = useState<TabType>('tabDashboard');
  const [activeFeatureDetail, setActiveFeatureDetail] = useState<'energy' | 'nutrition' | 'activity' | 'hydration' | null>(null);

  // System UI States (Static defaults for Next.js 16 prerendering compatibility)
  const [clock, setClock] = useState('12:00');
  const [todayFormatted, setTodayFormatted] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Opening & Animation Handoff States
  const [showOpening, setShowOpening] = useState(false);
  const [openingComplete, setOpeningComplete] = useState(false);
  const [ringAnimated, setRingAnimated] = useState(false);
  const [dashboardVfxActive, setDashboardVfxActive] = useState(false);

  // Modals Visibility States
  const [modalActivityOpen, setModalActivityOpen] = useState(false);
  const [modalFoodOpen, setModalFoodOpen] = useState(false);
  const [modalFoodDefaultMeal, setModalFoodDefaultMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [modalProfileOpen, setModalProfileOpen] = useState(false);
  const [modalSupabaseOpen, setModalSupabaseOpen] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Toast Dispatcher
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Client-side Clock & Date Sync (deferred to avoid prerender & cascading render warnings)
  useEffect(() => {
    const syncTime = () => {
      const now = new Date();
      setTodayFormatted(formatDateIndonesian(now));
      setClock(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'));
    };

    const initTimer = setTimeout(syncTime, 0);
    const intervalId = setInterval(syncTime, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(intervalId);
    };
  }, []);

  // Opening Animation Check
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

  // Check if this device or user has already registered or saved data
  const isUserAlreadyRegistered = useCallback(() => {
    if (typeof window === 'undefined') return true;
    if (localStorage.getItem('fitpulse_onboarding_completed') === 'true') return true;
    if (localStorage.getItem('fitpulse_device_user_id')) return true;
    
    // Check if fitpulse_app_data already exists
    const savedAppData = localStorage.getItem('fitpulse_app_data');
    if (savedAppData) {
      try {
        const parsed = JSON.parse(savedAppData);
        if (parsed && parsed.user_profile) {
          localStorage.setItem('fitpulse_onboarding_completed', 'true');
          return true;
        }
      } catch (e) {}
    }
    return false;
  }, []);

  // Opening Complete Handoff Sequence
  const handleOpeningComplete = useCallback(() => {
    setShowOpening(false);
    setOpeningComplete(true);
    setDashboardVfxActive(true);

    setTimeout(() => {
      setRingAnimated(true);
    }, 180);

    setTimeout(() => {
      setDashboardVfxActive(false);
      // Only prompt new unregistered devices
      if (!isUserAlreadyRegistered()) {
        setShowOnboardingModal(true);
      }
    }, 800);
  }, [isUserAlreadyRegistered]);

  // Check onboarding on mount if opening is skipped
  useEffect(() => {
    if (typeof window !== 'undefined' && !showOpening) {
      if (!isUserAlreadyRegistered()) {
        const timer = setTimeout(() => {
          setShowOnboardingModal(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [showOpening, isUserAlreadyRegistered]);

  // Encapsulated Fitness Domain Hook
  const {
    data,
    setData,
    targetCalories,
    consumedCalories,
    burnedCalories,
    remainingCalories,
    waterIntake,
    targetWater,
    ringOffset,
    totalProtein,
    totalCarbs,
    totalFat,
    bmrValue,
    currentWeight,
    targetWeight,
    weightDiff,
    weightProgressPercent,
    bodyFatProgressPercent,
    waterPercent,
    hasProfile,
    hasActivities,
    hasNutrition,
    proteinTarget,
    carbsTarget,
    fatTarget,
    estimatedWeeks,
    milestone1,
    milestone2,
    roadmapProgressPercent,
    totalSteps,
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
  } = useFitnessData({
    showToast,
    clock,
  });

  // Encapsulated Supabase Cloud Hook
  const {
    sbUrl,
    sbKey,
    isCloudSync,
    isSyncing,
    handleConnectSupabase,
    handleDisconnectSupabase,
  } = useCloudSync({
    setData,
    showToast,
  });

  return (
    <>
      {/* Opening Hero Video */}
      {showOpening && <OpeningVideo onComplete={handleOpeningComplete} />}

      {/* Desktop Utility Bar (Visible on larger monitors) */}
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
          {/* FEATURE DETAIL PAGES (WITH 3D LOOPING CHARACTER VIDEOS) */}
          {activeFeatureDetail === 'energy' && (
            <EnergyCalorieDetailView
              data={data}
              targetCalories={targetCalories}
              consumedCalories={consumedCalories}
              burnedCalories={burnedCalories}
              bmrValue={bmrValue}
              remainingCalories={remainingCalories}
              onBack={() => setActiveFeatureDetail(null)}
              onOpenFood={() => {
                setModalFoodDefaultMeal('lunch');
                setModalFoodOpen(true);
              }}
              onOpenActivity={() => setModalActivityOpen(true)}
              onShowToast={showToast}
            />
          )}

          {activeFeatureDetail === 'nutrition' && (
            <NutritionDetailView
              data={data}
              consumedCalories={consumedCalories}
              targetCalories={targetCalories}
              onBack={() => setActiveFeatureDetail(null)}
              onOpenFoodModal={(mealType) => {
                if (mealType) setModalFoodDefaultMeal(mealType);
                setModalFoodOpen(true);
              }}
              onDeleteFood={handleDeleteNutrition}
              onShowToast={showToast}
            />
          )}

          {activeFeatureDetail === 'activity' && (
            <ActivityPedometerDetailView
              data={data}
              totalSteps={totalSteps}
              burnedCalories={burnedCalories}
              onBack={() => setActiveFeatureDetail(null)}
              onOpenActivityModal={() => setModalActivityOpen(true)}
              onDeleteActivity={handleDeleteActivity}
              onStepUpdate={handleStepUpdate}
              onShowToast={showToast}
            />
          )}

          {activeFeatureDetail === 'hydration' && (
            <HydrationDetailView
              waterIntake={waterIntake}
              targetWater={targetWater}
              onAddWater={handleAddWater}
              onUndoWater={handleUndoWater}
              onBack={() => setActiveFeatureDetail(null)}
              onShowToast={showToast}
            />
          )}

          {/* NORMAL TAB VIEWS */}
          {activeFeatureDetail === null && (
            <>
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
                  onOpenFood={() => setModalFoodOpen(true)}
                  onOpenActivity={() => setModalActivityOpen(true)}
                  onAddWater={handleAddWater}
                  onUndoWater={handleUndoWater}
                  onNavigateToActivities={() => setActiveTab('tabActivities')}
                  onShowToast={showToast}
                  onOpenEnergyDetail={() => setActiveFeatureDetail('energy')}
                  onOpenNutritionDetail={() => setActiveFeatureDetail('nutrition')}
                  onOpenActivityDetail={() => setActiveFeatureDetail('activity')}
                  onOpenHydrationDetail={() => setActiveFeatureDetail('hydration')}
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
                  onStepUpdate={handleStepUpdate}
                  onHeartRateComplete={(bpm, confidence) => {
                    showToast(`Detak jantung terukur: ${bpm} BPM (Akurasi: ${confidence}%)`);
                  }}
                  onSaveHeartRate={handleSaveHeartRate}
                  onDeleteHeartRate={handleDeleteHeartRate}
                  onSaveBloodPressure={handleSaveBloodPressure}
                  onDeleteBloodPressure={handleDeleteBloodPressure}
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
            </>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveFeatureDetail(null);
            setActiveTab(tab);
          }}
          dashboardVfxActive={dashboardVfxActive}
        />
      </main>

      {/* Modals */}
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

      {/* Multi-Device Onboarding Modal */}
      {showOnboardingModal && (
        <OnboardingModal
          isOpen={showOnboardingModal}
          onComplete={(newProfile) => {
            setData((prev) => {
              const updated = { ...prev, user_profile: newProfile };
              try {
                localStorage.setItem('fitpulse_app_data', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
            setShowOnboardingModal(false);
          }}
          onRestoreFromCloud={(restoredProfile, cloudLogs) => {
            setData((prev) => {
              const updated = {
                ...prev,
                user_profile: restoredProfile,
                activity_logs: cloudLogs.activities && cloudLogs.activities.length > 0
                  ? cloudLogs.activities.map(mapCloudActivityToApp)
                  : prev.activity_logs,
                nutrition_logs: cloudLogs.nutritions && cloudLogs.nutritions.length > 0
                  ? cloudLogs.nutritions.map(mapCloudNutritionToApp)
                  : prev.nutrition_logs,
                blood_pressure_logs: cloudLogs.bloodPressures && cloudLogs.bloodPressures.length > 0
                  ? cloudLogs.bloodPressures.map(mapCloudBloodPressureToApp)
                  : prev.blood_pressure_logs,
              };
              try {
                localStorage.setItem('fitpulse_app_data', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
            setShowOnboardingModal(false);
          }}
          showToast={showToast}
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
