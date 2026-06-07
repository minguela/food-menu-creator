# 📦 Despliegue Completado - Bot de Telegram

## ✅ Completado

### 1. Función `telegram-webhook` actualizada
- **URL:** `https://your-project.supabase.co/functions/v1/telegram-webhook`
- **Estado:** Desplegada y funcionando
- **Nuevos comandos:**
  - `/semanal nuevo [nombre]` - Crear menú semanal
  - `/semanal lista` - Ver menús guardados
  - `/semanal info [nº]` - Ver detalles de un menú
  - `/generar [días]` - Generar menú rotativo (ej: `/generar 30`)

### 2. Webhook de Telegram
- **Configurado correctamente**
- **URL:** `https://your-project.supabase.co/functions/v1/telegram-webhook`
- **Allowed updates:** `["message"]`

### 3. Plugin claude-mem
- **Instalado:** `claude-mem@12.1.0`
- **Estado:** Activo tras reiniciar Claude Code

---

## ⚠️ Pendiente: Aplicar migración de base de datos

Las tablas `weekly_menus` y `weekly_meals` necesitan crearse manualmente.

### Pasos a seguir:

1. **Abre el dashboard de Supabase:**
   - https://app.supabase.com/project/your-project-ref

2. **Ve al SQL Editor:**
   - Menú lateral → **SQL Editor** → **New Query**

3. **Copia y ejecuta este SQL:**

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

4. **Haz clic en "Run"** (o presiona Ctrl+Enter)

5. **Verifica que se crearon las tablas:**
   - Menú lateral → **Table Editor**
   - Deberías ver `weekly_menus` y `weekly_meals`

---

## 🚀 Cómo usar el bot

### Crear tu primer menú semanal:

```
1. /semanal nuevo Semana1
2. Envía foto del plato + caption: "día 1 comida"
3. Repite para los 14 platos (7 días × comida y cena)
4. El bot te avisa del progreso: 1/14, 2/14...
```

### Generar menú para 30 días:

```
/generar 30
```

El bot rotará automáticamente entre tus menús guardados:
- Menú 1 → días 1-7
- Menú 2 → días 8-14
- Menú 3 → días 15-21
- Menú 1 → días 22-28
- Menú 2 → días 29-30

---

## 📁 Archivos modificados

| Archivo | Descripción |
|---------|-------------|
| `supabase/schema.sql` | Añadidas tablas weekly_menus y weekly_meals |
| `supabase/migrations/002_weekly_menus.sql` | Migración para aplicar en el dashboard |
| `supabase/functions/telegram-webhook/index.ts` | Nuevos comandos /semanal y /generar |
| `agents/telegram-menu-bot.md` | Documentación actualizada |
