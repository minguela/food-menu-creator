-- Create ingredient_mappings table
-- Stores expansion rules: dish name → base ingredients
CREATE TABLE IF NOT EXISTS ingredient_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dish_name VARCHAR(255) NOT NULL,
  aliases VARCHAR(255)[],  -- Multiple aliases for same dish
  ingredients JSONB NOT NULL,  -- Array of {name, quantity?, unit_type?}
  is_global BOOLEAN DEFAULT false,  -- Global rule (visible to all users)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_dish UNIQUE (user_id, dish_name)
);

CREATE INDEX idx_ingredient_mappings_user ON ingredient_mappings(user_id);
CREATE INDEX idx_ingredient_mappings_dish_name ON ingredient_mappings(dish_name);
CREATE INDEX idx_ingredient_mappings_global ON ingredient_mappings(is_global) WHERE is_global = true;

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredient_mappings_updated_at
  BEFORE UPDATE ON ingredient_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed initial global rules
INSERT INTO ingredient_mappings (dish_name, aliases, ingredients, is_global) VALUES
  ('ensalada', ARRAY['ensalada verde', 'ensalada mixta'], '[{"name": "canónigos", "quantity": 50, "unit_type": "g"}, {"name": "tomate", "quantity": 100, "unit_type": "g"}, {"name": "aceite de oliva", "quantity": 15, "unit_type": "ml"}]', true),
  ('tortilla', ARRAY['tortilla española', 'tortilla de patatas', 'tortilla de papa'], '[{"name": "huevos", "quantity": 3, "unit_type": "ud"}, {"name": "patatas", "quantity": 200, "unit_type": "g"}, {"name": "aceite de oliva", "quantity": 30, "unit_type": "ml"}]', true),
  ('paella', ARRAY['paella valenciana', 'arroz'], '[{"name": "arroz", "quantity": 200, "unit_type": "g"}, {"name": "pollo", "quantity": 150, "unit_type": "g"}, {"name": "mariscos", "quantity": 100, "unit_type": "g"}, {"name": "caldo", "quantity": 500, "unit_type": "ml"}]', true)
ON CONFLICT DO NOTHING;