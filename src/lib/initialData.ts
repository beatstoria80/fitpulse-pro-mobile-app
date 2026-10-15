import { AppFitnessData } from '../types/fitness';

export const initialFitnessData: AppFitnessData = {
  user_profile: {
    user_id: "USR-4616069",
    name: "Nandang",
    created_at: "2026-10-15T08:00:00Z",
    demographics: {
      age: 46,
      gender: "male",
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
  },
  activity_logs: [
    {
      activity_log_id: "ACT-20261015-001",
      timestamp_start: "2026-10-15T16:00:00Z",
      timestamp_end: "2026-10-15T16:45:00Z",
      activity_type: "Skateboard",
      metrics: {
        duration_minutes: 45,
        intensity_level: "medium",
        calories_burned: 280,
        average_heart_rate: 125,
        steps_counted: null
      },
      device_source: "Mobile Native Sensor / App"
    }
  ],
  nutrition_logs: [
    {
      nutrition_log_id: "NUT-20261015-001",
      meal_type: "breakfast",
      time: "07:30",
      calories: 340,
      food_items: ["Oatmeal dengan pisang", "Kopi hitam tanpa gula"],
      protein_g: 12,
      carbs_g: 58,
      fat_g: 6
    }
  ],
  hydration_logs: [
    { time: "07:00", amount_ml: 350 },
    { time: "10:15", amount_ml: 500 },
    { time: "13:30", amount_ml: 400 }
  ],
  daily_summary: {
    date: "2026-10-15",
    calories_consumed: 340,
    calories_burned: 280,
    water_intake_ml: 1250,
    net_calories: 60
  }
};
