"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  initSupabase,
  getSupabaseConfig,
  fetchAllFromCloud,
  mapCloudActivityToApp,
  mapCloudNutritionToApp,
} from '../lib/supabase';
import { AppFitnessData } from '../types/fitness';
import { initialFitnessData, getTodayDateStr } from '../lib/initialData';

interface UseCloudSyncProps {
  data: AppFitnessData;
  setData: React.Dispatch<React.SetStateAction<AppFitnessData>>;
  showToast: (msg: string) => void;
}

export function useCloudSync({ setData, showToast }: UseCloudSyncProps) {
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [isCloudSync, setIsCloudSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize Supabase from storage config
  useEffect(() => {
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

              const next: AppFitnessData = {
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
              try {
                localStorage.setItem('fitpulse_app_data', JSON.stringify(next));
              } catch (e) {
                console.error(e);
              }
              return next;
            });
            showToast('Data tersinkronisasi dari Supabase Cloud! ☁️');
          })
          .catch(console.error)
          .finally(() => setIsSyncing(false));
      }
    }
  }, [setData, showToast]);

  const handleConnectSupabase = useCallback((url: string, key: string) => {
    try {
      localStorage.setItem('fitpulse_sb_url', url);
      localStorage.setItem('fitpulse_sb_key', key);
    } catch (e) {
      console.error(e);
    }
    setSbUrl(url);
    setSbKey(key);
    const client = initSupabase(url, key);
    if (client) {
      setIsCloudSync(true);
      showToast('Supabase Cloud terhubung! Data akan disinkronkan otomatis.');
    } else {
      showToast('Gagal menghubungkan Supabase. Periksa URL & Anon Key.');
    }
  }, [showToast]);

  const handleDisconnectSupabase = useCallback(() => {
    try {
      localStorage.removeItem('fitpulse_sb_url');
      localStorage.removeItem('fitpulse_sb_key');
    } catch (e) {
      console.error(e);
    }
    setSbUrl('');
    setSbKey('');
    setIsCloudSync(false);
    showToast('Supabase Cloud dinonaktifkan. Mode penyimpanan lokal aktif.');
  }, [showToast]);

  return {
    sbUrl,
    sbKey,
    isCloudSync,
    isSyncing,
    handleConnectSupabase,
    handleDisconnectSupabase,
  };
}
