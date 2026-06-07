-- ============================================
-- Schema para Planificador de Menús
-- ============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: users
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

-- ============================================
-- TABLA: person_profiles
-- ============================================
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

CREATE INDEX idx_person_profiles_user ON person_profiles(user_id);

-- ============================================
-- TABLA: menu_images
-- ============================================
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

CREATE INDEX idx_menu_images_user ON menu_images(user_id, processed);

-- ============================================
-- TABLA: weekly_menus
-- ============================================
-- Almacena menús semanales completos (7 días × comida/cena)
CREATE TABLE IF NOT EXISTS weekly_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  week_number INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

CREATE INDEX idx_weekly_menus_user ON weekly_menus(user_id);

-- ============================================
-- TABLA: weekly_meals
-- ============================================
-- Almacena cada plato (comida/cena) de un menú semanal
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

CREATE INDEX idx_weekly_meals_menu ON weekly_meals(weekly_menu_id);
CREATE INDEX idx_weekly_meals_day ON weekly_meals(weekly_menu_id, day_number, meal_type);

-- ============================================
-- TABLA: weekly_day_images
-- ============================================
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

CREATE INDEX idx_weekly_day_images_menu ON weekly_day_images(weekly_menu_id);

-- ============================================
-- TABLA: weekly_meal_ingredients
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_meal_id UUID REFERENCES weekly_meals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_weekly_meal_ingredient UNIQUE (weekly_meal_id, name, unit_type)
);

CREATE INDEX idx_weekly_meal_ingredients_meal ON weekly_meal_ingredients(weekly_meal_id);

-- ============================================
-- TABLA: dishes
-- ============================================
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_image_id UUID REFERENCES menu_images(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  kcal INT,
  protein_g DECIMAL(5,1),
  carbs_g DECIMAL(5,1),
  fat_g DECIMAL(5,1),
  servings_base INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dishes_menu ON dishes(menu_image_id);

-- ============================================
-- TABLA: ingredients
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  carrefour_category VARCHAR(100),
  carrefour_product_id VARCHAR(50),
  unit_type VARCHAR(20) CHECK (unit_type IN ('kg', 'g', 'l', 'ml', 'ud', 'pack', 'unidad')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: dish_ingredients
-- ============================================
CREATE TABLE IF NOT EXISTS dish_ingredients (
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(10,2),
  unit_type VARCHAR(20),
  PRIMARY KEY (dish_id, ingredient_id)
);

CREATE INDEX idx_dish_ingredients ON dish_ingredients(ingredient_id);

-- ============================================
-- TABLA: ingredient_prices
-- ============================================
CREATE TABLE IF NOT EXISTS ingredient_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id),
  price DECIMAL(8,2) NOT NULL,
  unit_price DECIMAL(8,2),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  url TEXT
);

CREATE INDEX idx_ingredient_prices_date ON ingredient_prices(ingredient_id, scraped_at DESC);

-- ============================================
-- TABLA: meal_plans
-- ============================================
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

CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, plan_date);

-- ============================================
-- TABLA: shopping_lists
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity_needed DECIMAL(10,2),
  estimated_price DECIMAL(8,2),
  purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_week_ingredient UNIQUE(user_id, week_start, ingredient_id)
);

CREATE INDEX idx_shopping_lists_week ON shopping_lists(user_id, week_start);

-- ============================================
-- TABLA: ocr_image_cache
-- ============================================
CREATE TABLE IF NOT EXISTS ocr_image_cache (
  file_hash TEXT PRIMARY KEY,
  ocr_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: error_logs
-- ============================================
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('web', 'telegram', 'ocr')),
  message TEXT NOT NULL,
  stack_trace TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at en users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_person_profiles_updated_at
  BEFORE UPDATE ON person_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_day_images_updated_at
  BEFORE UPDATE ON weekly_day_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_ocr_image_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ocr_image_cache_updated_at_trigger
  BEFORE UPDATE ON ocr_image_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_ocr_image_cache_updated_at();

-- ============================================
-- FUNCIONES: logging
-- ============================================
CREATE OR REPLACE FUNCTION insert_error_log(
  p_source TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_id UUID;
BEGIN
  INSERT INTO error_logs (source, message, stack_trace)
  VALUES (
    CASE
      WHEN p_source IN ('web', 'telegram', 'ocr') THEN p_source
      ELSE 'web'
    END,
    COALESCE(NULLIF(TRIM(p_message), ''), 'Unknown error'),
    p_stack_trace
  )
  RETURNING id INTO inserted_id;

  RETURN inserted_id;
END;
$$;

CREATE OR REPLACE FUNCTION list_error_logs(
  p_telegram_id BIGINT,
  p_limit INT DEFAULT 200
)
RETURNS TABLE (
  id UUID,
  source TEXT,
  message TEXT,
  stack_trace TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE telegram_id = p_telegram_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.source,
    e.message,
    e.stack_trace,
    e.created_at
  FROM error_logs e
  ORDER BY e.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 200), 1000));
END;
$$;

REVOKE EXECUTE ON FUNCTION insert_error_log(TEXT, TEXT, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION list_error_logs(BIGINT, INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_error_log(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION list_error_logs(BIGINT, INT) TO service_role;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar ingredientes comunes con categorías de Carrefour
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
