# Instrucciones para aplicar migraciones

## Opción 1: Dashboard de Supabase (Recomendada)

1. Ve a https://app.supabase.com/project/tceusgxbfpekjcthrrqu
2. Inicia sesión si es necesario
3. Ve a **SQL Editor** (en el menú lateral)
4. Copia y pega el contenido de `supabase/migrations/002_weekly_menus.sql`
5. Haz clic en **Run**

## Opción 2: Conectar con psql

Si tienes `psql` instalado, ejecuta:

```bash
psql postgresql://postgres:[PASSWORD]@db.tceusgxbfpekjcthrrqu.supabase.co:5432/postgres -f supabase/migrations/002_weekly_menus.sql
```

Necesitarás la contraseña de la base de datos (la encuentras en el dashboard de Supabase en **Settings > Database**).

## Opción 3: Supabase CLI

Si tienes el CLI instalado:

```bash
supabase link --project-ref tceusgxbfpekjcthrrqu
supabase db push
```

---

## SQL a ejecutar

El archivo `supabase/migrations/002_weekly_menus.sql` contiene:

```sql
-- Tabla weekly_menus
CREATE TABLE IF NOT EXISTS weekly_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  week_number INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_menus_user ON weekly_menus(user_id);

-- Tabla weekly_meals
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
```
