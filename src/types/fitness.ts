export interface Demographics {
  age: number;
  gender: 'male' | 'female' | string;
  marital_status: string;
}

export interface Biometrics {
  height_cm: number;
  weight_kg: number;
  estimated_body_fat_percentage: number;
  target_body_fat_percentage: number;
  bmi: number;
  bmi_status: string;
}

export interface FitnessGoals {
  target_weight_kg: number;
  daily_calorie_target: number;
  daily_water_target_ml: number;
}

export interface UserProfile {
  user_id: string;
  name?: string;
  created_at: string;
  demographics: Demographics;
  biometrics: Biometrics;
  fitness_goals: FitnessGoals;
}

export interface ActivityMetrics {
  duration_minutes: number;
  intensity_level: 'low' | 'medium' | 'high' | 'vigorous';
  calories_burned: number;
  average_heart_rate?: number | null;
  steps_counted?: number | null;
}

export interface ActivityLog {
  activity_log_id: string;
  timestamp_start: string;
  timestamp_end?: string | null;
  activity_type: string;
  metrics: ActivityMetrics;
  device_source: string;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface NutritionLog {
  nutrition_log_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  calories: number;
  food_items: (string | FoodItem)[];
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface HydrationLog {
  time: string;
  amount_ml: number;
}

export interface DailySummary {
  date: string;
  calories_consumed: number;
  calories_burned: number;
  water_intake_ml: number;
  net_calories?: number;
}

export type HeartRateMethod = 'camera_ppg' | 'tactile_tap' | 'ble_watch' | 'manual';

export interface HeartRateLog {
  id: string;
  timestamp: string; // e.g. "09:45"
  date: string; // e.g. "2026-10-23"
  bpm: number;
  confidence: number; // 0-100%
  method: HeartRateMethod;
  category: 'resting' | 'normal' | 'elevated' | 'high';
  hrv_ms?: number;
  notes?: string;
}

export type BloodPressureMethod = 'camera_ppg' | 'ble_sphygmomanometer' | 'manual';
export type BloodPressureCategory = 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';

export interface BloodPressureLog {
  id: string;
  timestamp: string; // e.g. "09:45"
  date: string; // e.g. "2026-10-26"
  systolic: number; // mmHg (e.g. 118)
  diastolic: number; // mmHg (e.g. 78)
  pulse_bpm?: number;
  category: BloodPressureCategory;
  method: BloodPressureMethod;
  confidence?: number; // 0-100% for camera PPG
  is_calibrated?: boolean;
  notes?: string;
}

export interface AppFitnessData {
  user_profile: UserProfile;
  activity_logs: ActivityLog[];
  nutrition_logs: NutritionLog[];
  hydration_logs: HydrationLog[];
  heart_rate_logs?: HeartRateLog[];
  blood_pressure_logs?: BloodPressureLog[];
  daily_summary: DailySummary;
}

