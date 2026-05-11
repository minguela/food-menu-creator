-- Rotating menus and fixed reusable meals

CREATE TABLE IF NOT EXISTS saved_fixed_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type VARCHAR(10) NOT NULL CHECK (meal_type IN ('desayuno', 'comida', 'cena')),
  dish_name VARCHAR(255) NOT NULL,
  dish_description TEXT,
  kcal INT DEFAULT 0,
  protein_g DECIMAL(6,2) DEFAULT 0,
  carbs_g DECIMAL(6,2) DEFAULT 0,
  fat_g DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_fixed_meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_meal_id UUID NOT NULL REFERENCES saved_fixed_meals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotating_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES person_profiles(id) ON DELETE SET NULL,
  name VARCHAR(140) NOT NULL,
  source_weekly_menu_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_days INT NOT NULL CHECK (duration_days BETWEEN 1 AND 90),
  persons_count INT NOT NULL DEFAULT 1 CHECK (persons_count > 0),
  target_kcal INT NOT NULL DEFAULT 1900,
  target_protein_g DECIMAL(6,2) NOT NULL DEFAULT 120,
  target_carbs_g DECIMAL(6,2) NOT NULL DEFAULT 200,
  target_fat_g DECIMAL(6,2) NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotating_menus_user ON rotating_menus(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rotating_menu_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_id UUID NOT NULL REFERENCES rotating_menus(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 90),
  day_date DATE,
  total_kcal INT DEFAULT 0,
  total_protein_g DECIMAL(8,2) DEFAULT 0,
  total_carbs_g DECIMAL(8,2) DEFAULT 0,
  total_fat_g DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_rotating_day UNIQUE (rotating_menu_id, day_number)
);

CREATE TABLE IF NOT EXISTS rotating_menu_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_day_id UUID NOT NULL REFERENCES rotating_menu_days(id) ON DELETE CASCADE,
  meal_type VARCHAR(10) NOT NULL CHECK (meal_type IN ('desayuno', 'comida', 'cena')),
  source_weekly_meal_id UUID REFERENCES weekly_meals(id) ON DELETE SET NULL,
  dish_name VARCHAR(255) NOT NULL,
  dish_description TEXT,
  base_servings DECIMAL(8,3) NOT NULL DEFAULT 1,
  serving_multiplier DECIMAL(8,3) NOT NULL DEFAULT 1,
  final_kcal INT NOT NULL DEFAULT 0,
  final_protein_g DECIMAL(8,2) NOT NULL DEFAULT 0,
  final_carbs_g DECIMAL(8,2) NOT NULL DEFAULT 0,
  final_fat_g DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_rotating_day_meal UNIQUE (rotating_menu_day_id, meal_type)
);

CREATE TABLE IF NOT EXISTS rotating_menu_meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_meal_id UUID NOT NULL REFERENCES rotating_menu_meals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  base_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_rotating_menus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rotating_menus_updated_at_trigger ON rotating_menus;
CREATE TRIGGER update_rotating_menus_updated_at_trigger
  BEFORE UPDATE ON rotating_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_rotating_menus_updated_at();
