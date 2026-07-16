-- Migration: Food Menu Creator schema → Neon
-- Run with: psql "$NEON_DATABASE_URL" -f migrate-to-neon.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE,
  telegram_chat_id BIGINT,
  daily_kcal_target INT DEFAULT 1900,
  daily_protein_target DECIMAL(5,1) DEFAULT 120.0,
  fat_pct_target INT DEFAULT 30,
  carbs_pct_target INT DEFAULT 45,
  persons_count INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS person_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sex VARCHAR(20) CHECK (sex IN ('female', 'male', 'other')),
  age INT CHECK (age BETWEEN 1 AND 120),
  daily_kcal_target INT CHECK (daily_kcal_target BETWEEN 800 AND 6000),
  fat_pct_target INT DEFAULT 30 CHECK (fat_pct_target BETWEEN 10 AND 70),
  carbs_pct_target INT DEFAULT 45 CHECK (carbs_pct_target BETWEEN 10 AND 80),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_person_profiles_user ON person_profiles(user_id);

CREATE TABLE IF NOT EXISTS menu_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  telegram_message_id BIGINT,
  image_url TEXT NOT NULL,
  meal_type VARCHAR(10) CHECK (meal_type IN ('comida', 'cena')),
  day_number INT CHECK (day_number BETWEEN 1 AND 21),
  ocr_raw_text TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_menu_images_user ON menu_images(user_id, processed);

CREATE TABLE IF NOT EXISTS weekly_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  week_number INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);
CREATE INDEX IF NOT EXISTS idx_weekly_menus_user ON weekly_menus(user_id);

CREATE TABLE IF NOT EXISTS weekly_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_menu_id UUID REFERENCES weekly_menus(id) ON DELETE CASCADE,
  day_number INT CHECK (day_number BETWEEN 1 AND 7),
  meal_type VARCHAR(10) CHECK (meal_type IN ('desayuno', 'comida', 'cena')),
  dish_name VARCHAR(255) NOT NULL,
  dish_description TEXT,
  image_url TEXT,
  kcal INT DEFAULT 0,
  protein_g DECIMAL(6,2) DEFAULT 0,
  carbs_g DECIMAL(6,2) DEFAULT 0,
  fat_g DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_weekly_meal_slot UNIQUE (weekly_menu_id, day_number, meal_type)
);
CREATE INDEX IF NOT EXISTS idx_weekly_meals_menu ON weekly_meals(weekly_menu_id);
CREATE INDEX IF NOT EXISTS idx_weekly_meals_day ON weekly_meals(weekly_menu_id, day_number, meal_type);

CREATE TABLE IF NOT EXISTS weekly_day_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_menu_id UUID REFERENCES weekly_menus(id) ON DELETE CASCADE,
  day_number INT CHECK (day_number BETWEEN 1 AND 7),
  image_url TEXT NOT NULL,
  source_mode VARCHAR(20) DEFAULT 'daily' CHECK (source_mode IN ('daily', 'block')),
  day_span_count INT DEFAULT 1 CHECK (day_span_count BETWEEN 1 AND 7),
  ocr_status VARCHAR(20) DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'processed', 'error')),
  ocr_raw_text TEXT,
  ocr_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_weekly_day_image UNIQUE (weekly_menu_id, day_number)
);
CREATE INDEX IF NOT EXISTS idx_weekly_day_images_menu ON weekly_day_images(weekly_menu_id);

CREATE TABLE IF NOT EXISTS weekly_meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_meal_id UUID REFERENCES weekly_meals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_weekly_meal_ingredient UNIQUE (weekly_meal_id, name, unit_type)
);
CREATE INDEX IF NOT EXISTS idx_weekly_meal_ingredients_meal ON weekly_meal_ingredients(weekly_meal_id);

CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_image_id UUID REFERENCES menu_images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255),
  description TEXT,
  kcal INT,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  servings_base INT DEFAULT 2,
  is_special BOOLEAN DEFAULT FALSE,
  special_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dishes_menu ON dishes(menu_image_id);
CREATE INDEX IF NOT EXISTS idx_dishes_user ON dishes(user_id);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  english_name VARCHAR(255),
  carrefour_category VARCHAR(100),
  carrefour_product_id VARCHAR(50),
  unit_type VARCHAR(20) CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'ocr', 'external')),
  enrichment_status VARCHAR(20) DEFAULT 'none' CHECK (enrichment_status IN ('none', 'pending', 'enriched', 'failed')),
  caloric_density DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dish_ingredients (
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2),
  unit_type VARCHAR(20),
  PRIMARY KEY (dish_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_dish_ingredients ON dish_ingredients(ingredient_id);

CREATE TABLE IF NOT EXISTS ingredient_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  price DECIMAL(8,2) NOT NULL,
  unit_price DECIMAL(8,2),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  url TEXT
);
CREATE INDEX IF NOT EXISTS idx_ingredient_prices_date ON ingredient_prices(ingredient_id, scraped_at DESC);

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_type VARCHAR(10) CHECK (meal_type IN ('desayuno', 'comida', 'cena')),
  dish_id UUID REFERENCES dishes(id),
  day_original INT CHECK (day_original BETWEEN 1 AND 21),
  kcal INT,
  protein_g DECIMAL(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_date_meal UNIQUE(user_id, plan_date, meal_type)
);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, plan_date);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  ingredient_id UUID REFERENCES ingredients(id),
  ingredient_name VARCHAR(255),
  quantity_needed DECIMAL(10,2),
  display_quantity DECIMAL(10,2),
  display_unit VARCHAR(5) DEFAULT 'g',
  estimated_price DECIMAL(8,2),
  purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_week_ingredient UNIQUE(user_id, week_start, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_week ON shopping_lists(user_id, week_start);

CREATE TABLE IF NOT EXISTS ocr_image_cache (
  file_hash TEXT PRIMARY KEY,
  ocr_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('web', 'telegram', 'ocr')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- Rotating menus
CREATE TABLE IF NOT EXISTS rotating_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES person_profiles(id),
  name VARCHAR(255),
  source_weekly_menu_ids UUID[] DEFAULT '{}',
  duration_days INT DEFAULT 7,
  persons_count INT DEFAULT 2,
  target_kcal INT,
  target_protein_g DECIMAL(6,2),
  target_carbs_g DECIMAL(6,2),
  target_fat_g DECIMAL(6,2),
  generator_type VARCHAR(50) DEFAULT 'manual',
  period_type VARCHAR(20),
  start_date DATE,
  end_date DATE,
  score DECIMAL(5,2),
  meets_targets BOOLEAN,
  diagnostics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rotating_menus_user ON rotating_menus(user_id);

CREATE TABLE IF NOT EXISTS rotating_menu_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_id UUID REFERENCES rotating_menus(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES person_profiles(id),
  target_kcal INT,
  target_protein_g DECIMAL(6,2),
  target_carbs_g DECIMAL(6,2),
  target_fat_g DECIMAL(6,2),
  protein_pct INT DEFAULT 25,
  fat_pct INT DEFAULT 30,
  carbs_pct INT DEFAULT 45
);
CREATE INDEX IF NOT EXISTS idx_rotating_menu_profiles_menu ON rotating_menu_profiles(rotating_menu_id);

CREATE TABLE IF NOT EXISTS rotating_menu_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_id UUID REFERENCES rotating_menus(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  day_date DATE,
  source_weekly_menu_id UUID,
  total_kcal INT,
  total_protein_g DECIMAL(6,2),
  total_carbs_g DECIMAL(6,2),
  total_fat_g DECIMAL(6,2),
  score DECIMAL(5,2),
  meets_targets BOOLEAN,
  diagnostics JSONB
);
CREATE INDEX IF NOT EXISTS idx_rotating_menu_days_menu ON rotating_menu_days(rotating_menu_id);

CREATE TABLE IF NOT EXISTS rotating_menu_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_day_id UUID REFERENCES rotating_menu_days(id) ON DELETE CASCADE,
  recipe_id UUID,
  meal_type VARCHAR(10) CHECK (meal_type IN ('desayuno', 'comida', 'cena')),
  meal_slot INT DEFAULT 1,
  dish_name VARCHAR(255),
  dish_description TEXT,
  base_servings INT DEFAULT 1,
  serving_multiplier DECIMAL(5,2) DEFAULT 1,
  final_kcal INT,
  final_protein_g DECIMAL(6,2),
  final_carbs_g DECIMAL(6,2),
  final_fat_g DECIMAL(6,2),
  is_special BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_rotating_menu_meals_day ON rotating_menu_meals(rotating_menu_day_id);

CREATE TABLE IF NOT EXISTS rotating_menu_meal_profile_portions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_meal_id UUID REFERENCES rotating_menu_meals(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES person_profiles(id),
  final_kcal INT,
  final_protein_g DECIMAL(6,2),
  final_carbs_g DECIMAL(6,2),
  final_fat_g DECIMAL(6,2)
);

CREATE TABLE IF NOT EXISTS rotating_menu_meal_profile_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_meal_profile_portion_id UUID REFERENCES rotating_menu_meal_profile_portions(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  name VARCHAR(255),
  quantity DECIMAL(10,2),
  unit_type VARCHAR(20)
);

-- Recipe system
CREATE TABLE IF NOT EXISTS recipe_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  suggested_dish_name TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID,
  ingredient_id UUID REFERENCES ingredients(id),
  name VARCHAR(255),
  quantity DECIMAL(10,2),
  unit_type VARCHAR(20),
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredient enrichment
CREATE TABLE IF NOT EXISTS ingredient_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  alias VARCHAR(255) NOT NULL,
  UNIQUE(ingredient_id, alias)
);

CREATE TABLE IF NOT EXISTS ingredient_enrichment_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  field_name VARCHAR(50) NOT NULL,
  proposed_value TEXT,
  confidence DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredient_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  external_source VARCHAR(50),
  external_id VARCHAR(255),
  external_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compound day meals
CREATE TABLE IF NOT EXISTS compound_day_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  meal_type VARCHAR(10) NOT NULL CHECK (meal_type IN ('desayuno', 'comida', 'cena')),
  dish_name VARCHAR(255),
  weekly_menu_id UUID REFERENCES weekly_menus(id),
  week_number INT,
  day_number INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu generation jobs
CREATE TABLE IF NOT EXISTS menu_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  progress INT DEFAULT 0,
  current_step VARCHAR(255),
  error_message TEXT,
  result_menu_id UUID,
  result_payload JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES menu_generation_jobs(id) ON DELETE CASCADE,
  level VARCHAR(10) DEFAULT 'info',
  step VARCHAR(255),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mobile shopping history
CREATE TABLE IF NOT EXISTS mobile_shopping_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shopping_date DATE DEFAULT NOW(),
  ingredient_name VARCHAR(255),
  quantity DECIMAL(10,2),
  unit_type VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_person_profiles_updated_at BEFORE UPDATE ON person_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_weekly_day_images_updated_at BEFORE UPDATE ON weekly_day_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_ocr_image_cache_updated_at BEFORE UPDATE ON ocr_image_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION insert_error_log(
  p_source TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_id UUID;
BEGIN
  INSERT INTO error_logs (source, message, stack_trace)
  VALUES (
    CASE WHEN p_source IN ('web', 'telegram', 'ocr') THEN p_source ELSE 'web' END,
    COALESCE(NULLIF(TRIM(p_message), ''), 'Unknown error'),
    p_stack_trace
  )
  RETURNING id INTO inserted_id;
  RETURN inserted_id;
END;
$$;

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO ingredients (name, carrefour_category, unit_type) VALUES
  ('pollo', 'Carnes y Aves', 'kg'),
  ('ternera', 'Carnes y Aves', 'kg'),
  ('cerdo', 'Carnes y Aves', 'kg'),
  ('merluza', 'Pescados', 'kg'),
  ('salmón', 'Pescados', 'kg'),
  ('atún', 'Pescados', 'kg'),
  ('huevos', 'Huevos y Lácteos', 'ud'),
  ('arroz', 'Arroz y Pasta', 'kg'),
  ('pasta', 'Arroz y Pasta', 'kg'),
  ('patatas', 'Frutas y Verduras', 'kg'),
  ('cebolla', 'Frutas y Verduras', 'kg'),
  ('ajo', 'Frutas y Verduras', 'kg'),
  ('tomate', 'Frutas y Verduras', 'kg'),
  ('pimiento', 'Frutas y Verduras', 'kg'),
  ('lechuga', 'Frutas y Verduras', 'ud'),
  ('zanahoria', 'Frutas y Verduras', 'kg'),
  ('aceite de oliva', 'Aceites y Vinagres', 'l'),
  ('leche', 'Huevos y Lácteos', 'l'),
  ('yogur', 'Huevos y Lácteos', 'ud'),
  ('queso', 'Huevos y Lácteos', 'kg'),
  ('pan', 'Panadería', 'ud'),
  ('fruta', 'Frutas y Verduras', 'kg'),
  ('legumbres', 'Conservas y Legumbres', 'kg'),
  ('caldo', 'Conservas y Legumbres', 'l')
ON CONFLICT (name) DO NOTHING;
