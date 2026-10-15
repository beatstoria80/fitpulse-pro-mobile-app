-- ============================================================================
-- FITPULSE PRO • SUPABASE POSTGRESQL SCHEMA
-- User: Pak Nandang (USR-4616069)
-- Salin dan jalankan seluruh skrip ini di SQL Editor pada Dashboard Supabase Anda
-- ============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat Tabel: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL,
    age INT DEFAULT 46,
    gender TEXT DEFAULT 'male',
    marital_status TEXT DEFAULT 'single',
    height_cm NUMERIC(5,2) DEFAULT 160.0,
    weight_kg NUMERIC(5,2) DEFAULT 69.0,
    estimated_body_fat_percentage NUMERIC(4,2) DEFAULT 26.7,
    target_body_fat_percentage NUMERIC(4,2) DEFAULT 22.0,
    bmi NUMERIC(4,2) DEFAULT 26.95,
    bmi_status TEXT DEFAULT 'Overweight / Obesity Class I',
    target_weight_kg NUMERIC(5,2) DEFAULT 58.5,
    daily_calorie_target INT DEFAULT 1800,
    daily_water_target_ml INT DEFAULT 2500,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buat Tabel: ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    activity_log_id TEXT UNIQUE NOT NULL,
    activity_type TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    intensity_level TEXT DEFAULT 'medium',
    calories_burned NUMERIC(6,2) NOT NULL,
    average_heart_rate INT,
    steps_counted INT,
    device_source TEXT,
    timestamp_start TIMESTAMPTZ NOT NULL,
    timestamp_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Buat Tabel: NUTRITION_LOGS
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    nutrition_log_id TEXT UNIQUE NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TEXT NOT NULL, -- 'breakfast', 'lunch', 'snack', 'dinner'
    food_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_calories NUMERIC(6,2) NOT NULL DEFAULT 0,
    carbohydrates_g NUMERIC(5,2) DEFAULT 0,
    protein_g NUMERIC(5,2) DEFAULT 0,
    fat_g NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Buat Tabel: WATER_LOGS
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consumed_ml INT DEFAULT 0,
    target_ml INT DEFAULT 2500,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_water_day UNIQUE (user_id, log_date)
);

-- 6. Aktifkan Row Level Security (RLS) & Berikan Akses Publik / Anon untuk Pengujian Cepat
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- Policy agar aplikasi frontend dapat membaca dan menulis data (menggunakan Anon Key)
DROP POLICY IF EXISTS "Public access for profiles" ON public.profiles;
CREATE POLICY "Public access for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for activity_logs" ON public.activity_logs;
CREATE POLICY "Public access for activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for nutrition_logs" ON public.nutrition_logs;
CREATE POLICY "Public access for nutrition_logs" ON public.nutrition_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for water_logs" ON public.water_logs;
CREATE POLICY "Public access for water_logs" ON public.water_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. SEED DATA AWAL PAK NANDANG (USR-4616069)
-- ============================================================================

INSERT INTO public.profiles (
    user_id, age, gender, marital_status,
    height_cm, weight_kg, estimated_body_fat_percentage, target_body_fat_percentage,
    bmi, bmi_status, target_weight_kg, daily_calorie_target, daily_water_target_ml
) VALUES (
    'USR-4616069', 46, 'male', 'single',
    160.0, 69.0, 26.7, 22.0,
    26.95, 'Overweight / Obesity Class I', 58.5, 1800, 2500
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.activity_logs (
    user_id, activity_log_id, activity_type, duration_minutes,
    intensity_level, calories_burned, average_heart_rate, steps_counted,
    device_source, timestamp_start, timestamp_end
) VALUES 
(
    'USR-4616069', 'ACT-20261015-001', 'Skateboard', 45,
    'medium', 280, 125, NULL,
    'Mobile Native Sensor / Apple Watch', '2026-10-15 16:00:00+00', '2026-10-15 16:45:00+00'
),
(
    'USR-4616069', 'ACT-20261015-002', 'Power Walking', 30,
    'low', 150, 105, 3500,
    'iPhone HealthKit', '2026-10-15 06:00:00+00', '2026-10-15 06:30:00+00'
) ON CONFLICT (activity_log_id) DO NOTHING;

INSERT INTO public.nutrition_logs (
    user_id, nutrition_log_id, log_date, meal_time,
    food_items, total_calories, carbohydrates_g, protein_g, fat_g
) VALUES (
    'USR-4616069', 'NUT-20261015-092', '2026-10-15', 'breakfast',
    '[
        {"food_name": "Nasi Merah", "serving_size": "1 porsi", "weight_grams": 100, "calories": 110, "carbs": 23, "protein": 3, "fat": 1},
        {"food_name": "Dada Ayam Panggang", "serving_size": "1 potong", "weight_grams": 120, "calories": 195, "carbs": 0, "protein": 32, "fat": 3.5}
    ]'::jsonb,
    305, 28.0, 35.0, 4.5
) ON CONFLICT (nutrition_log_id) DO NOTHING;

INSERT INTO public.water_logs (
    user_id, log_date, consumed_ml, target_ml
) VALUES (
    'USR-4616069', '2026-10-15', 1250, 2500
) ON CONFLICT (user_id, log_date) DO UPDATE 
SET consumed_ml = EXCLUDED.consumed_ml;
