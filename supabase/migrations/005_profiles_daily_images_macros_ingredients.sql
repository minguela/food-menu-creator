-- ============================================
-- Migración: perfiles, imágenes diarias, desayuno e ingredientes exactos
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS fat_pct_target INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS carbs_pct_target INT DEFAULT 45;

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

CREATE TABLE IF NOT EXISTS weekly_day_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_menu_id UUID REFERENCES weekly_menus(id) ON DELETE CASCADE,
  day_number INT CHECK (day_number BETWEEN 1 AND 7),
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_weekly_day_image UNIQUE (weekly_menu_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_day_images_menu ON weekly_day_images(weekly_menu_id);

ALTER TABLE weekly_meals
DROP CONSTRAINT IF EXISTS weekly_meals_meal_type_check;

ALTER TABLE weekly_meals
ADD CONSTRAINT weekly_meals_meal_type_check
CHECK (meal_type IN ('desayuno', 'comida', 'cena'));

ALTER TABLE weekly_meals
ADD COLUMN IF NOT EXISTS kcal INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS protein_g DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS carbs_g DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fat_g DECIMAL(6,2) DEFAULT 0;

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

ALTER TABLE meal_plans
DROP CONSTRAINT IF EXISTS meal_plans_meal_type_check;

ALTER TABLE meal_plans
ADD CONSTRAINT meal_plans_meal_type_check
CHECK (meal_type IN ('desayuno', 'comida', 'cena'));

CREATE TRIGGER update_person_profiles_updated_at
  BEFORE UPDATE ON person_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_day_images_updated_at
  BEFORE UPDATE ON weekly_day_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
