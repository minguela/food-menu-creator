-- Create compound_day_meals table
-- Stores pairs of dishes that must stay together in rotating menus
CREATE TABLE IF NOT EXISTS compound_day_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  second_dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_compound_day UNIQUE (user_id, name)
);

CREATE INDEX idx_compound_day_meals_user ON compound_day_meals(user_id);
CREATE INDEX idx_compound_day_meals_first_dish ON compound_day_meals(first_dish_id);
CREATE INDEX idx_compound_day_meals_second_dish ON compound_day_meals(second_dish_id);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_compound_day_meals_updated_at
  BEFORE UPDATE ON compound_day_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();