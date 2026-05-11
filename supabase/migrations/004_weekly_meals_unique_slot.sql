-- ============================================
-- Migración: Evitar platos duplicados por hueco semanal
-- ============================================

DELETE FROM weekly_meals a
USING weekly_meals b
WHERE a.id > b.id
  AND a.weekly_menu_id = b.weekly_menu_id
  AND a.day_number = b.day_number
  AND a.meal_type = b.meal_type;

ALTER TABLE weekly_meals
ADD CONSTRAINT unique_weekly_meal_slot
UNIQUE (weekly_menu_id, day_number, meal_type);
