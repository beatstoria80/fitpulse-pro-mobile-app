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
    name TEXT DEFAULT 'Pengguna FitPulse',
    device_id TEXT,
    age INT DEFAULT 46,
    gender TEXT DEFAULT 'male',
    marital_status TEXT DEFAULT 'single',
    height_cm NUMERIC(5,2) DEFAULT 160.0,
    weight_kg NUMERIC(5,2) DEFAULT 69.0,
    waist_circumference_cm NUMERIC(5,2) DEFAULT 80.0,
    estimated_body_fat_percentage NUMERIC(4,2) DEFAULT 26.7,
    target_body_fat_percentage NUMERIC(4,2) DEFAULT 22.0,
    bmi NUMERIC(4,2) DEFAULT 26.95,
    bmi_status TEXT DEFAULT 'Overweight / Obesity Class I',
    target_weight_kg NUMERIC(5,2) DEFAULT 58.5,
    daily_calorie_target INT DEFAULT 1800,
    daily_water_target_ml INT DEFAULT 2500,
    activity_level TEXT DEFAULT 'moderate',
    device_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety for existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Pengguna FitPulse';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS waist_circumference_cm NUMERIC(5,2) DEFAULT 80.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;

-- 2.1 Buat Tabel: DEVICE_SESSIONS (Melacak setiap link / device yang dibuka)
CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    device_name TEXT,
    platform TEXT,
    user_agent TEXT,
    ip_address TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- 5.1. Buat Tabel: BLOOD_PRESSURE_LOGS (Tekanan Darah)
CREATE TABLE IF NOT EXISTS public.blood_pressure_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    systolic INT NOT NULL CHECK (systolic BETWEEN 50 AND 300),
    diastolic INT NOT NULL CHECK (diastolic BETWEEN 30 AND 200),
    pulse_bpm INT,
    category TEXT NOT NULL, -- 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis'
    method TEXT NOT NULL, -- 'camera_ppg' | 'ble_sphygmomanometer' | 'manual'
    confidence INT DEFAULT 85,
    is_calibrated BOOLEAN DEFAULT false,
    notes TEXT,
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Aktifkan Row Level Security (RLS) & Berikan Akses Publik / Anon untuk Pengujian Cepat
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_pressure_logs ENABLE ROW LEVEL SECURITY;

-- Policy agar aplikasi frontend dapat membaca dan menulis data (menggunakan Anon Key)
DROP POLICY IF EXISTS "Public access for profiles" ON public.profiles;
CREATE POLICY "Public access for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for device_sessions" ON public.device_sessions;
CREATE POLICY "Public access for device_sessions" ON public.device_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for activity_logs" ON public.activity_logs;
CREATE POLICY "Public access for activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for nutrition_logs" ON public.nutrition_logs;
CREATE POLICY "Public access for nutrition_logs" ON public.nutrition_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for water_logs" ON public.water_logs;
CREATE POLICY "Public access for water_logs" ON public.water_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for blood_pressure_logs" ON public.blood_pressure_logs;
CREATE POLICY "Public access for blood_pressure_logs" ON public.blood_pressure_logs FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. EXPLICIT DATA API GRANTS (PERATURAN RESMI TERBARU SUPABASE - OKTOBER 30)
-- Mulai 30 Oktober, Supabase TIDAK lagi memberikan grant otomatis pada tabel public.
-- Wajib memberikan GRANT eksplisit agar supabase-js, PostgREST, & GraphQL dapat mengakses tabel.
-- ============================================================================

-- A. Berikan hak akses skema public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- B. Explicit Grants untuk tabel PROFILES & DEVICE_SESSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_sessions TO anon, authenticated, service_role;

-- C. Explicit Grants untuk tabel ACTIVITY_LOGS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO service_role;

-- D. Explicit Grants untuk tabel NUTRITION_LOGS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO service_role;

-- E. Explicit Grants untuk tabel WATER_LOGS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO service_role;

-- F. Explicit Grants untuk tabel BLOOD_PRESSURE_LOGS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_pressure_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_pressure_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_pressure_logs TO service_role;

-- G. Berikan hak akses sequences (untuk auto-increment / serial jika digunakan)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- H. Atur Default Privileges agar tabel baru di masa depan otomatis memiliki hak akses Data API
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;


-- ============================================================================
-- 8. SEED DATA AWAL PAK NANDANG (USR-4616069)
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
