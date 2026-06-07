# Contexto del Proyecto - MenuPlanner

## 1. OBJETIVO DE LA APLICACIÓN

Bot de Telegram + web app para gestión de menús semanales rotativos con lista de la compra automática.

### Funcionalidad principal
- Bot Telegram: subir menús semanales (imágenes), guardar procesados
- Generación menús mensuales: rotación cíclica de semanas disponibles
- Lista de la compra: ingredientes consolidados del menú mensual

### Personalización nutricional
- Por persona: kcal diarias objetivo, gramos proteína diarios
- Ajuste automático de cantidades

### Gestión de recetas
- Ingredientes manuales por receta
- Integración en lista de la compra

### Stack técnico
- **Frontend:** Nuxt 3 + Vue 3 + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Deploy:** Vercel (menu-web/)
- **Bot:** Telegram Bot API + webhook en Supabase Edge Functions

---

## 2. ESTRUCTURA DEL PROYECTO

```
/home/dminguela/ClaudeCode/
├── menu-web/                    # Aplicación web (único deploy a Vercel)
│   ├── .env                     # Variables locales (no commitear)
│   ├── .vercel/                 # Config Vercel
│   ├── app.vue                  # Layout principal
│   ├── nuxt.config.ts           # Config Nuxt
│   ├── package.json
│   ├── tsconfig.json
│   ├── composables/
│   │   └── useSupabase.ts       # Cliente Supabase
│   └── pages/
│       ├── index.vue            # Lista de menús semanales
│       ├── generar.vue          # Generar menú rotativo
│       └── menu/[id].vue        # Detalle/edición de menú
│
├── supabase/
│   ├── config.toml              # Config funciones edge
│   ├── schema.sql               # Schema completo DB
│   ├── migrations/
│   │   └── 002_weekly_menus.sql # Migración weekly_menus + weekly_meals
│   └── functions/
│       ├── telegram-webhook/    # Bot Telegram
│       ├── ocr-processor/       # Procesamiento OCR
│       └── generate-monthly-menu/ # Generación menú mensual + lista compra
│
└── agents/
    └── telegram-menu-bot.md     # Documentación bot
```

---

## 3. CONFIGURACIÓN ACTUAL

### Supabase
- **Project ID:** `your-project-ref`
- **Variables en:** `./menu-web/.env`
  - `NUXT_PUBLIC_SUPABASE_URL`
  - `NUXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **Secrets configurados:**
  - `TELEGRAM_BOT_TOKEN`
  - `GOOGLE_CLOUD_API_KEY` (OCR)

### Vercel
- **Carpeta deploy:** `./menu-web`
- **Config:** `.vercel/project.json`
- **Deploy:** CI/CD automático al pushear

### Bot Telegram
- **Webhook:** `https://your-project.supabase.co/functions/v1/telegram-webhook`
- **Comandos:**
  - `/start` - Registro usuario
  - `/semanal` - Gestión menús semanales
  - `/generar [días]` - Menú rotativo N días
  - `/monthly` - Generar menú mes actual
  - `/shopping` - Ver lista compra
  - `/help` - Ayuda

---

## 4. BASE DE DATOS

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios (telegram_id, chat_id, targets nutricionales) |
| `weekly_menus` | Menús semanales (1 por usuario × semana) |
| `weekly_meals` | Platos individuales (14 por menú: 7 días × 2 comidas) |
| `menu_images` | Imágenes legacy (flujo 1-21 días) |
| `dishes` | Platos procesados con OCR |
| `ingredients` | Catálogo de ingredientes |
| `dish_ingredients` | Relación plato-ingrediente con cantidades |
| `meal_plans` | Menús generados para fechas concretas |
| `shopping_lists` | Lista de compra consolidada |

### Migraciones aplicadas
- ✅ `002_weekly_menus.sql` - Tablas weekly_menus + weekly_meals

---

## 5. ESTADO ACTUAL

### Implementado
- Bot Telegram con comandos /semanal y /generar
- Edge Functions: telegram-webhook, ocr-processor, generate-monthly-menu
- Frontend: lista de menús, detalle/edición, generación rotativa
- OCR con Google Cloud Vision configurado
- OCR web con modo día a día / bloque y edición posterior de platos e ingredientes
- Health-check automatizado en GitHub Actions para rutas clave
- Todas las migraciones de DB aplicadas

### Pendiente
- Mejorar el parseo de OCR en bloques largos cuando el texto llegue poco estructurado
- Integración completa web ↔ bot

---

## 6. ARCHIVOS CLAVE

| Archivo | Propósito |
|---------|-----------|
| `supabase/functions/telegram-webhook/index.ts` | Bot Telegram |
| `supabase/functions/generate-monthly-menu/index.ts` | Generación mensual + lista compra |
| `supabase/schema.sql` | Schema completo DB |
| `menu-web/pages/index.vue` | Lista de menús |
| `menu-web/pages/generar.vue` | Generador rotativo |
| `menu-web/composables/useSupabase.ts` | Cliente Supabase |
