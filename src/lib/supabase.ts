import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ActivityLog, NutritionLog, UserProfile, BloodPressureLog, BloodPressureCategory, BloodPressureMethod } from '../types/fitness';

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
    name: profile.name || 'Pengguna',
    age: profile.demographics.age,
    gender: profile.demographics.gender,
    marital_status: profile.demographics.marital_status,
    height_cm: profile.biometrics.height_cm,
    weight_kg: profile.biometrics.weight_kg,
    waist_circumference_cm: profile.biometrics.waist_circumference_cm || null,
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
    activity_log_id: act.activity_log_id,
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

// Fixed: column names now match schema.sql (nutrition_log_id, log_date, meal_time, food_items JSONB, total_calories, carbohydrates_g, protein_g, fat_g)
export const syncNutritionToCloud = async (client: SupabaseClient, userId: string, nut: NutritionLog) => {
  const foodItemsJsonb = nut.food_items.map((item) => {
    if (typeof item === 'string') {
      return { food_name: item, calories: nut.calories };
    }
    return item;
  });

  const { error } = await client.from('nutrition_logs').insert({
    user_id: userId,
    nutrition_log_id: nut.nutrition_log_id,
    log_date: new Date().toISOString().slice(0, 10),
    meal_time: nut.meal_type,
    food_items: foodItemsJsonb,
    total_calories: nut.calories,
    carbohydrates_g: nut.carbs_g,
    protein_g: nut.protein_g,
    fat_g: nut.fat_g
  });
  if (error) throw error;
};

// Fixed: uses water_logs table (not hydration_logs), columns: consumed_ml, target_ml, log_date
export const syncHydrationToCloud = async (client: SupabaseClient, userId: string, amountMl: number, targetMl: number = 2500) => {
  const today = new Date().toISOString().slice(0, 10);

  // Upsert into water_logs — the schema has UNIQUE (user_id, log_date)
  const { data: existing } = await client
    .from('water_logs')
    .select('consumed_ml')
    .eq('user_id', userId)
    .eq('log_date', today)
    .maybeSingle();

  const newTotal = (existing?.consumed_ml || 0) + amountMl;

  const { error } = await client.from('water_logs').upsert({
    user_id: userId,
    log_date: today,
    consumed_ml: newTotal,
    target_ml: targetMl,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,log_date' });

  if (error) throw error;
};

// Fixed: uses water_logs and blood_pressure_logs tables, correct column ordering
export const fetchAllFromCloud = async (client: SupabaseClient, userId: string) => {
  const today = new Date().toISOString().slice(0, 10);

  const [pRes, aRes, nRes, wRes, bpRes] = await Promise.all([
    client.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    client.from('activity_logs').select('*').eq('user_id', userId).order('timestamp_start', { ascending: false }),
    client.from('nutrition_logs').select('*').eq('user_id', userId).eq('log_date', today).order('created_at', { ascending: false }),
    client.from('water_logs').select('*').eq('user_id', userId).eq('log_date', today).maybeSingle(),
    client.from('blood_pressure_logs').select('*').eq('user_id', userId).order('measured_at', { ascending: false }).then(
      (res) => res,
      () => ({ data: [] })
    )
  ]);

  return {
    profile: pRes.data,
    activities: aRes.data || [],
    nutritions: nRes.data || [],
    waterLog: wRes.data || null,
    bloodPressures: bpRes?.data || []
  };
};

// Transform cloud nutrition data back to app format
export const mapCloudNutritionToApp = (cloudNutrition: Record<string, unknown>): NutritionLog => {
  const foodItems = Array.isArray(cloudNutrition.food_items)
    ? (cloudNutrition.food_items as Array<{ food_name?: string }>).map((fi) => fi.food_name || 'Makanan')
    : [];

  return {
    nutrition_log_id: cloudNutrition.nutrition_log_id as string,
    meal_type: (cloudNutrition.meal_time as NutritionLog['meal_type']) || 'lunch',
    time: cloudNutrition.created_at
      ? new Date(cloudNutrition.created_at as string).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '00:00',
    calories: Number(cloudNutrition.total_calories) || 0,
    food_items: foodItems,
    protein_g: Number(cloudNutrition.protein_g) || 0,
    carbs_g: Number(cloudNutrition.carbohydrates_g) || 0,
    fat_g: Number(cloudNutrition.fat_g) || 0
  };
};

// Transform cloud activity data back to app format
export const mapCloudActivityToApp = (cloudAct: Record<string, unknown>): ActivityLog => {
  return {
    activity_log_id: cloudAct.activity_log_id as string,
    activity_type: cloudAct.activity_type as string,
    timestamp_start: cloudAct.timestamp_start as string,
    timestamp_end: (cloudAct.timestamp_end as string) || null,
    metrics: {
      duration_minutes: Number(cloudAct.duration_minutes) || 0,
      intensity_level: (cloudAct.intensity_level as ActivityLog['metrics']['intensity_level']) || 'medium',
      calories_burned: Number(cloudAct.calories_burned) || 0,
      average_heart_rate: cloudAct.average_heart_rate ? Number(cloudAct.average_heart_rate) : null,
      steps_counted: cloudAct.steps_counted ? Number(cloudAct.steps_counted) : null
    },
    device_source: (cloudAct.device_source as string) || 'FitPulse Pro'
  };
};

// Transform cloud blood pressure data back to app format
export const mapCloudBloodPressureToApp = (cloudBp: Record<string, unknown>): BloodPressureLog => {
  const measuredAt = cloudBp.measured_at ? new Date(cloudBp.measured_at as string) : new Date();
  return {
    id: (cloudBp.id as string) || `bp-${Date.now()}`,
    timestamp: measuredAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),
    date: (cloudBp.measured_at as string)?.slice(0, 10) || measuredAt.toISOString().slice(0, 10),
    systolic: Number(cloudBp.systolic) || 120,
    diastolic: Number(cloudBp.diastolic) || 80,
    pulse_bpm: cloudBp.pulse_bpm ? Number(cloudBp.pulse_bpm) : undefined,
    category: (cloudBp.category as BloodPressureCategory) || 'normal',
    method: (cloudBp.method as BloodPressureMethod) || 'manual',
    confidence: cloudBp.confidence ? Number(cloudBp.confidence) : undefined,
    is_calibrated: Boolean(cloudBp.is_calibrated),
    notes: (cloudBp.notes as string) || undefined
  };
};

export const syncBloodPressureToCloud = async (client: SupabaseClient, userId: string, bp: BloodPressureLog) => {
  const { error } = await client.from('blood_pressure_logs').insert({
    user_id: userId,
    systolic: bp.systolic,
    diastolic: bp.diastolic,
    pulse_bpm: bp.pulse_bpm || null,
    category: bp.category,
    method: bp.method,
    confidence: bp.confidence || 85,
    is_calibrated: Boolean(bp.is_calibrated),
    notes: bp.notes || null,
    measured_at: new Date().toISOString()
  });
  if (error) throw error;
};

export const deleteBloodPressureFromCloud = async (client: SupabaseClient, id: string) => {
  const { error } = await client.from('blood_pressure_logs').delete().eq('id', id);
  if (error) throw error;
};

export const deleteActivityFromCloud = async (client: SupabaseClient, activityLogId: string) => {
  const { error } = await client.from('activity_logs').delete().eq('activity_log_id', activityLogId);
  if (error) throw error;
};

export const deleteNutritionFromCloud = async (client: SupabaseClient, nutritionLogId: string) => {
  const { error } = await client.from('nutrition_logs').delete().eq('nutrition_log_id', nutritionLogId);
  if (error) throw error;
};

