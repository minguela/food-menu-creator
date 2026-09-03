-- Compatibility schema for the final Supabase Menu Planner schema.
-- This file is intentionally additive: it never drops target data.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS mobile_channel TEXT DEFAULT 'sms';

ALTER TABLE person_profiles
  ADD COLUMN IF NOT EXISTS daily_protein_target NUMERIC(8,2) DEFAULT 120,
  ADD COLUMN IF NOT EXISTS tolerance_percent NUMERIC(5,2) DEFAULT 15,
  ADD COLUMN IF NOT EXISTS protein_pct_target INT DEFAULT 25;

ALTER TABLE weekly_meals
  ADD COLUMN IF NOT EXISTS is_special BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS special_kcal_reserved INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meal_slot SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS compound_day_id UUID,
  ADD COLUMN IF NOT EXISTS dish_id UUID;

ALTER TABLE weekly_meals DROP CONSTRAINT IF EXISTS unique_weekly_meal_slot;
ALTER TABLE weekly_meals
  ADD CONSTRAINT unique_weekly_meal_slot UNIQUE (weekly_menu_id, day_number, meal_type, meal_slot);

ALTER TABLE weekly_day_images
  ADD COLUMN IF NOT EXISTS ocr_meta JSONB;

ALTER TABLE weekly_meal_ingredients
  ADD COLUMN IF NOT EXISTS ingredient_id UUID;

ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS recipe_status TEXT NOT NULL DEFAULT 'pending_ingredients',
  ADD COLUMN IF NOT EXISTS normalized_name TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_special BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS special_kcal_reserved INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meal_type TEXT,
  ADD COLUMN IF NOT EXISTS servings NUMERIC(8,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS kcal_per_100g NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS protein_per_100g NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS carbs_per_100g NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS fat_per_100g NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS normalized_name TEXT,
  ADD COLUMN IF NOT EXISTS default_unit_type TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nutrition_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS review_reason TEXT,
  ADD COLUMN IF NOT EXISTS caloric_density_level TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Supabase's curated catalog uses `manual_csv` for imported/curated rows.
-- Keep the original value rather than normalizing it during the migration.
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_source_check;
ALTER TABLE ingredients
  ADD CONSTRAINT ingredients_source_check
  CHECK (source IN ('manual', 'manual_csv', 'ocr', 'external'));

ALTER TABLE shopping_lists
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS quantity_grams NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS original_quantity NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS original_unit_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS conversion_status TEXT DEFAULT 'exact',
  ADD COLUMN IF NOT EXISTS conversion_note TEXT,
  ADD COLUMN IF NOT EXISTS is_extra BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS send_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS send_error TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS normalized_name TEXT,
  ADD COLUMN IF NOT EXISTS is_suggested BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE ingredient_aliases
  ADD COLUMN IF NOT EXISTS alias_es TEXT,
  ADD COLUMN IF NOT EXISTS alias_en TEXT,
  ADD COLUMN IF NOT EXISTS normalized_alias_es TEXT,
  ADD COLUMN IF NOT EXISTS normalized_alias_en TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE ingredient_mappings
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS dish_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS aliases VARCHAR(255)[],
  ADD COLUMN IF NOT EXISTS ingredients JSONB,
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rotating_menus
  ALTER COLUMN source_weekly_menu_ids DROP DEFAULT;
ALTER TABLE rotating_menus
  ALTER COLUMN source_weekly_menu_ids TYPE JSONB
  USING COALESCE(to_jsonb(source_weekly_menu_ids), '[]'::jsonb);
ALTER TABLE rotating_menus
  ALTER COLUMN source_weekly_menu_ids SET DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rotating_menu_profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rotating_menu_days
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rotating_menu_meals
  ALTER COLUMN serving_multiplier TYPE NUMERIC(8,3)
    USING serving_multiplier::numeric,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rotating_menu_meal_profile_portions
  ADD COLUMN IF NOT EXISTS serving_multiplier NUMERIC(8,3) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS nutrition_pending BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE rotating_menu_meal_profile_ingredients
  ADD COLUMN IF NOT EXISTS base_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nutrition_pending BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE menu_generation_jobs
  ADD COLUMN IF NOT EXISTS input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE compound_day_meals
  ADD COLUMN IF NOT EXISTS first_dish_id UUID,
  ADD COLUMN IF NOT EXISTS second_dish_id UUID,
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS monthly_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  menu_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  shopping_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  reused_from UUID REFERENCES monthly_menus(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_fixed_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type VARCHAR(10) NOT NULL,
  dish_name VARCHAR(255) NOT NULL,
  dish_description TEXT,
  kcal INT DEFAULT 0,
  protein_g NUMERIC(6,2) DEFAULT 0,
  carbs_g NUMERIC(6,2) DEFAULT 0,
  fat_g NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_fixed_meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_meal_id UUID NOT NULL REFERENCES saved_fixed_meals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotating_menu_meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_meal_id UUID NOT NULL REFERENCES rotating_menu_meals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  base_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fixed_meal_profile_portions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_meal_id UUID NOT NULL REFERENCES saved_fixed_meals(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES person_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (fixed_meal_id, profile_id)
);

CREATE TABLE IF NOT EXISTS fixed_meal_profile_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_meal_profile_portion_id UUID NOT NULL REFERENCES fixed_meal_profile_portions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_type VARCHAR(20) NOT NULL,
  nutrition_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredient_nutrition_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT,
  name TEXT NOT NULL,
  kcal_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  confidence NUMERIC NOT NULL DEFAULT 0,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dish_ingredient_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  confidence TEXT NOT NULL,
  source TEXT NOT NULL,
  needs_review BOOLEAN NOT NULL DEFAULT TRUE,
  confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (dish_id, name)
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  servings NUMERIC(8,2),
  meal_type TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  recipe_status TEXT,
  is_special BOOLEAN NOT NULL DEFAULT FALSE,
  special_kcal_reserved INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS servings NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS meal_type TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recipe_status TEXT,
  ADD COLUMN IF NOT EXISTS is_special BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS special_kcal_reserved INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_monthly_menus_user_created ON monthly_menus(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_fixed_meals_user ON saved_fixed_meals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingredient_nutrition_candidates_ingredient ON ingredient_nutrition_candidates(ingredient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dish_ingredient_suggestions_dish ON dish_ingredient_suggestions(dish_id, confirmed);
