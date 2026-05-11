-- Multi-profile portions for rotating menus + ingredient nutrition fields

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS kcal_per_100g DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS protein_per_100g DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS carbs_per_100g DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS fat_per_100g DECIMAL(8,2);

CREATE TABLE IF NOT EXISTS rotating_menu_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_id UUID NOT NULL REFERENCES rotating_menus(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES person_profiles(id) ON DELETE CASCADE,
  target_kcal INT NOT NULL,
  target_protein_g DECIMAL(8,2) NOT NULL,
  target_carbs_g DECIMAL(8,2) NOT NULL,
  target_fat_g DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_rotating_menu_profile UNIQUE (rotating_menu_id, profile_id)
);

CREATE TABLE IF NOT EXISTS rotating_menu_meal_profile_portions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_meal_id UUID NOT NULL REFERENCES rotating_menu_meals(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES person_profiles(id) ON DELETE CASCADE,
  serving_multiplier DECIMAL(8,3) NOT NULL DEFAULT 1,
  final_kcal DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_protein_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_carbs_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_fat_g DECIMAL(10,2) NOT NULL DEFAULT 0,
  nutrition_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_rotating_meal_profile UNIQUE (rotating_menu_meal_id, profile_id)
);

CREATE TABLE IF NOT EXISTS rotating_menu_meal_profile_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotating_menu_meal_profile_portion_id UUID NOT NULL REFERENCES rotating_menu_meal_profile_portions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  base_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  nutrition_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fixed_meal_profile_portions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_meal_id UUID NOT NULL REFERENCES saved_fixed_meals(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES person_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_fixed_meal_profile UNIQUE (fixed_meal_id, profile_id)
);

CREATE TABLE IF NOT EXISTS fixed_meal_profile_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixed_meal_profile_portion_id UUID NOT NULL REFERENCES fixed_meal_profile_portions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  nutrition_pending BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
