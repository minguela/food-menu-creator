ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_dishes_user_id ON dishes(user_id);
