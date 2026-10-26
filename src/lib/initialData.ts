import { AppFitnessData } from '../types/fitness';

// Helper: Calculate BMR using Mifflin-St Jeor equation
export const calculateBMR = (weightKg: number, heightCm: number, age: number, gender: string): number => {
  if (gender === 'female') {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
};

// Helper: Format date in Indonesian locale
export const formatDateIndonesian = (date: Date): string => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Helper: Get today's date string in YYYY-MM-DD format
export const getTodayDateStr = (): string => {
  return new Date().toISOString().slice(0, 10);
};

// Default user profile — seeded from Supabase schema or first-run setup
export const defaultUserProfile = {
  user_id: "USR-4616069",
  name: "Nandang",
  created_at: "2026-01-01T00:00:00.000Z",
  demographics: {
    age: 46,
    gender: "male" as const,
    marital_status: "single"
  },
  biometrics: {
    height_cm: 160.0,
    weight_kg: 69.0,
    estimated_body_fat_percentage: 26.7,
    target_body_fat_percentage: 22.0,
    bmi: 26.95,
    bmi_status: "Overweight / Obesity Class I"
  },
  fitness_goals: {
    target_weight_kg: 58.5,
    daily_calorie_target: 1800,
    daily_water_target_ml: 2500
  }
};

// Initial empty-state data: no decorative/fake data.
// All logs start empty — data only appears when the user enters it or syncs from Supabase.
export const initialFitnessData: AppFitnessData = {
  user_profile: defaultUserProfile,
  activity_logs: [],
  nutrition_logs: [],
  hydration_logs: [],
  heart_rate_logs: [],
  blood_pressure_logs: [],
  daily_summary: {
    date: getTodayDateStr(),
    calories_consumed: 0,
    calories_burned: 0,
    water_intake_ml: 0,
    net_calories: 0
  }
};
