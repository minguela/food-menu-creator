-- ============================================
-- Migración: Menús Semanales Rotativos
-- ============================================
-- Añade soporte para guardar menús semanales completos
-- y generar menús rotativos bajo demanda

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

CREATE INDEX IF NOT EXISTS idx_weekly_menus_user ON weekly_menus(user_id);

-- ============================================
-- TABLA: weekly_meals
-- ============================================
-- Almacena cada plato (comida/cena) de un menú semanal
CREATE TABLE IF NOT EXISTS weekly_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_menu_id UUID REFERENCES weekly_menus(id) ON DELETE CASCADE,
  day_number INT CHECK (day_number BETWEEN 1 AND 7),
  meal_type VARCHAR(10) CHECK (meal_type IN ('comida', 'cena')),
  dish_name VARCHAR(255) NOT NULL,
  dish_description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_meals_menu ON weekly_meals(weekly_menu_id);
CREATE INDEX IF NOT EXISTS idx_weekly_meals_day ON weekly_meals(weekly_menu_id, day_number, meal_type);
