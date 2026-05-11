-- Add compound_day_id foreign key to weekly_meals for automatic compound day detection
ALTER TABLE weekly_meals 
ADD COLUMN compound_day_id UUID REFERENCES compound_day_meals(id) ON DELETE SET NULL;

CREATE INDEX idx_weekly_meals_compound_day ON weekly_meals(compound_day_id) WHERE compound_day_id IS NOT NULL;