import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppFitnessData, ActivityLog, NutritionLog, HydrationLog, UserProfile } from '../types/fitness';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    };
  }
  return {
    url: localStorage.getItem('fitpulse_sb_url') || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: localStorage.getItem('fitpulse_sb_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  };
};

export const initSupabase = (url?: string, key?: string): SupabaseClient | null => {
  const config = getSupabaseConfig();
  const targetUrl = url || config.url;
  const targetKey = key || config.key;

  if (!targetUrl || !targetKey) {
    supabaseClient = null;
    return null;
  }

  try {
    supabaseClient = createClient(targetUrl, targetKey);
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseClient = null;
    return null;
  }
};

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
};

// Cloud Sync Helpers
export const syncProfileToCloud = async (client: SupabaseClient, profile: UserProfile) => {
  const { error } = await client.from('profiles').upsert({
    user_id: profile.user_id,
    age: profile.demographics.age,
    gender: profile.demographics.gender,
    marital_status: profile.demographics.marital_status,
    height_cm: profile.biometrics.height_cm,
    weight_kg: profile.biometrics.weight_kg,
    estimated_body_fat_percentage: profile.biometrics.estimated_body_fat_percentage,
    target_body_fat_percentage: profile.biometrics.target_body_fat_percentage,
    bmi: profile.biometrics.bmi,
    bmi_status: profile.biometrics.bmi_status,
    target_weight_kg: profile.fitness_goals.target_weight_kg,
    daily_calorie_target: profile.fitness_goals.daily_calorie_target,
    daily_water_target_ml: profile.fitness_goals.daily_water_target_ml,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
};

export const syncActivityToCloud = async (client: SupabaseClient, userId: string, act: ActivityLog) => {
  const { error } = await client.from('activity_logs').insert({
    user_id: userId,
    activity_type: act.activity_type,
    duration_minutes: act.metrics.duration_minutes,
    intensity_level: act.metrics.intensity_level,
    calories_burned: act.metrics.calories_burned,
    average_heart_rate: act.metrics.average_heart_rate || null,
    steps_counted: act.metrics.steps_counted || null,
    device_source: act.device_source,
    timestamp_start: act.timestamp_start,
    timestamp_end: act.timestamp_end || null
  });
  if (error) throw error;
};

export const syncNutritionToCloud = async (client: SupabaseClient, userId: string, nut: NutritionLog) => {
  const { error } = await client.from('nutrition_logs').insert({
    user_id: userId,
    meal_type: nut.meal_type,
    calories: nut.calories,
    food_items: nut.food_items,
    protein_g: nut.protein_g,
    carbs_g: nut.carbs_g,
    fat_g: nut.fat_g,
    logged_at: new Date().toISOString()
  });
  if (error) throw error;
};

export const syncHydrationToCloud = async (client: SupabaseClient, userId: string, amountMl: number) => {
  const { error } = await client.from('hydration_logs').insert({
    user_id: userId,
    volume_ml: amountMl,
    beverage_type: 'Air Mineral',
    logged_at: new Date().toISOString()
  });
  if (error) throw error;
};

export const fetchAllFromCloud = async (client: SupabaseClient, userId: string) => {
  const [pRes, aRes, nRes, hRes] = await Promise.all([
    client.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    client.from('activity_logs').select('*').eq('user_id', userId).order('timestamp_start', { ascending: false }),
    client.from('nutrition_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }),
    client.from('hydration_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false })
  ]);

  return {
    profile: pRes.data,
    activities: aRes.data || [],
    nutritions: nRes.data || [],
    hydrations: hRes.data || []
  };
};
