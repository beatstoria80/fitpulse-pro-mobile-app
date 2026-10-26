-- ============================================================================
-- FITPULSE PRO • MULTI-DEVICE & ONBOARDING DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ============================================================================
-- Skrip SQL ini dirancang khusus untuk mendukung aplikasi FitPulse Pro yang dibuka
-- di berbagai perangkat/browser/link berbeda.
--
-- FITUR UTAMA:
-- 1. Setiap perangkat yang membuka link memiliki User ID & Device ID unik.
-- 2. Mendukung penyimpanan Profil Biometrik Pengguna (Nama, Usia, Gender, TB, BB, Target).
-- 3. Tabel DEVICE_SESSIONS untuk melacak riwayat perangkat & browser yang membuka link.
-- 4. Stored Procedure `register_or_link_device` untuk mempermudah pendaftaran & penautan akun.
-- 5. Row Level Security (RLS) & Explicit Grants sesuai regulasi Supabase (Data API 30 Okt).
-- ============================================================================

-- 1. Aktifkan Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Buat / Perbarui Tabel: PROFILES (Mendukung Multi-User & Multi-Device)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT 'Pengguna FitPulse',
    device_id TEXT,
    age INT DEFAULT 30,
    gender TEXT DEFAULT 'male',
    marital_status TEXT DEFAULT 'single',
    height_cm NUMERIC(5,2) DEFAULT 170.0,
    weight_kg NUMERIC(5,2) DEFAULT 68.0,
    waist_circumference_cm NUMERIC(5,2) DEFAULT 80.0,
    estimated_body_fat_percentage NUMERIC(4,2) DEFAULT 20.0,
    target_body_fat_percentage NUMERIC(4,2) DEFAULT 18.0,
    bmi NUMERIC(4,2) DEFAULT 23.53,
    bmi_status TEXT DEFAULT 'Normal',
    target_weight_kg NUMERIC(5,2) DEFAULT 65.0,
    daily_calorie_target INT DEFAULT 2000,
    daily_water_target_ml INT DEFAULT 2500,
    activity_level TEXT DEFAULT 'moderate',
    device_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom-kolom baru tersedia jika tabel sudah pernah dibuat sebelumnya (Migration Safe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Pengguna FitPulse';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS waist_circumference_cm NUMERIC(5,2) DEFAULT 80.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;

-- 3. Buat Tabel: DEVICE_SESSIONS (Melacak Setiap Perangkat / Link yang Dibuka)
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

-- Buat Index untuk pencarian cepat berdasarkan user_id dan device_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON public.device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON public.device_sessions(user_id);

-- 4. Buat Tabel Pendukung Telemetri: ACTIVITY_LOGS, NUTRITION_LOGS, WATER_LOGS, BLOOD_PRESSURE_LOGS
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

CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    nutrition_log_id TEXT UNIQUE NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_time TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
    food_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_calories NUMERIC(6,2) NOT NULL DEFAULT 0,
    carbohydrates_g NUMERIC(5,2) DEFAULT 0,
    protein_g NUMERIC(5,2) DEFAULT 0,
    fat_g NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    consumed_ml INT DEFAULT 0,
    target_ml INT DEFAULT 2500,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_water_day UNIQUE (user_id, log_date)
);

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

-- 5. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_pressure_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses untuk Anon & Authenticated Client (FitPulse Frontend)
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

-- 6. EXPLICIT GRANTS (Kesesuaian Regulasi PostgREST / Supabase Data API)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_sessions TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blood_pressure_logs TO anon, authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- 7. STORED PROCEDURE: Register / Upsert Device Profile & Catat Sesi
CREATE OR REPLACE FUNCTION public.register_or_link_device(
    p_user_id TEXT,
    p_name TEXT,
    p_device_id TEXT,
    p_age INT,
    p_gender TEXT,
    p_height_cm NUMERIC,
    p_weight_kg NUMERIC,
    p_target_weight_kg NUMERIC,
    p_daily_calorie_target INT,
    p_daily_water_target_ml INT,
    p_activity_level TEXT DEFAULT 'moderate',
    p_device_info JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_record public.profiles%ROWTYPE;
    v_h_m NUMERIC;
    v_bmi NUMERIC;
    v_bmi_status TEXT;
BEGIN
    -- Hitung BMI
    v_h_m := p_height_cm / 100.0;
    IF v_h_m > 0 THEN
        v_bmi := ROUND((p_weight_kg / (v_h_m * v_h_m))::NUMERIC, 2);
    ELSE
        v_bmi := 22.0;
    END IF;

    IF v_bmi < 18.5 THEN
        v_bmi_status := 'Underweight';
    ELSIF v_bmi < 25.0 THEN
        v_bmi_status := 'Normal';
    ELSIF v_bmi < 30.0 THEN
        v_bmi_status := 'Overweight';
    ELSE
        v_bmi_status := 'Obesitas';
    END IF;

    -- Upsert Profil Pengguna
    INSERT INTO public.profiles (
        user_id, name, device_id, age, gender, height_cm, weight_kg,
        target_weight_kg, bmi, bmi_status, daily_calorie_target,
        daily_water_target_ml, activity_level, device_info, updated_at
    ) VALUES (
        p_user_id, p_name, p_device_id, p_age, p_gender, p_height_cm, p_weight_kg,
        p_target_weight_kg, v_bmi, v_bmi_status, p_daily_calorie_target,
        p_daily_water_target_ml, p_activity_level, p_device_info, NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        device_id = EXCLUDED.device_id,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        height_cm = EXCLUDED.height_cm,
        weight_kg = EXCLUDED.weight_kg,
        target_weight_kg = EXCLUDED.target_weight_kg,
        bmi = EXCLUDED.bmi,
        bmi_status = EXCLUDED.bmi_status,
        daily_calorie_target = EXCLUDED.daily_calorie_target,
        daily_water_target_ml = EXCLUDED.daily_water_target_ml,
        activity_level = EXCLUDED.activity_level,
        device_info = EXCLUDED.device_info,
        updated_at = NOW()
    RETURNING * INTO v_profile_record;

    -- Catat Sesi Perangkat
    INSERT INTO public.device_sessions (
        device_id, user_id, device_name, platform, user_agent, last_active_at
    ) VALUES (
        p_device_id,
        p_user_id,
        COALESCE(p_device_info->>'device_name', 'Web Client'),
        COALESCE(p_device_info->>'platform', 'Browser'),
        COALESCE(p_device_info->>'user_agent', 'FitPulse App'),
        NOW()
    );

    RETURN to_jsonb(v_profile_record);
END;
$$;

-- 8. CONTOH SEED DEFAULT UNTUK PENGUJIAN (Pak Nandang - USR-4616069)
INSERT INTO public.profiles (
    user_id, name, age, gender, marital_status,
    height_cm, weight_kg, estimated_body_fat_percentage, target_body_fat_percentage,
    bmi, bmi_status, target_weight_kg, daily_calorie_target, daily_water_target_ml, activity_level
) VALUES (
    'USR-4616069', 'Nandang', 46, 'male', 'single',
    160.0, 69.0, 26.7, 22.0,
    26.95, 'Overweight / Obesity Class I', 58.5, 1800, 2500, 'moderate'
) ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();
