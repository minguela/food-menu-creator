-- ============================================
-- Migración: compra en gramos, móvil e histórico mensual
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS mobile_channel TEXT DEFAULT 'sms'
  CHECK (mobile_channel IN ('sms', 'whatsapp'));

ALTER TABLE shopping_lists
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS quantity_grams DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS original_quantity DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS original_unit_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS conversion_status TEXT DEFAULT 'exact'
  CHECK (conversion_status IN ('exact', 'estimated', 'ambiguous', 'manual')),
ADD COLUMN IF NOT EXISTS conversion_note TEXT,
ADD COLUMN IF NOT EXISTS is_extra BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS send_status TEXT DEFAULT 'pending'
  CHECK (send_status IN ('pending', 'sent', 'delivered', 'error')),
ADD COLUMN IF NOT EXISTS send_error TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE shopping_lists
SET
  item_name = COALESCE(item_name, ingredients.name),
  quantity_grams = COALESCE(quantity_grams, quantity_needed),
  original_quantity = COALESCE(original_quantity, quantity_needed),
  original_unit_type = COALESCE(original_unit_type, ingredients.unit_type, 'g')
FROM ingredients
WHERE shopping_lists.ingredient_id = ingredients.id;

UPDATE shopping_lists
SET
  item_name = COALESCE(item_name, 'Artículo'),
  quantity_grams = COALESCE(quantity_grams, quantity_needed, 1),
  original_quantity = COALESCE(original_quantity, quantity_needed, 1),
  original_unit_type = COALESCE(original_unit_type, 'g')
WHERE item_name IS NULL OR quantity_grams IS NULL;

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_created
ON shopping_lists(user_id, created_at DESC);

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

CREATE INDEX IF NOT EXISTS idx_monthly_menus_user_created
ON monthly_menus(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_monthly_menus_user_period
ON monthly_menus(user_id, year DESC, month DESC);

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_menus_updated_at
  BEFORE UPDATE ON monthly_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
