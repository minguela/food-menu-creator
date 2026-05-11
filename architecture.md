# Arquitectura MenuPlanner

## Stack Técnico

```
┌─────────────────┐
│   Frontend      │
│   Nuxt 3 + Vue  │
│   TailwindCSS   │
│   (Vercel)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │
│   Supabase      │
│   - PostgreSQL  │
│   - Edge Fns    │
│   - Storage     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Telegram Bot  │
│   Webhook       │
│   OCR (GCP)     │
└─────────────────┘
```

## Componentes

### Frontend (menu-web/)
- `app.vue` - Layout con navegación
- `pages/index.vue` - Lista de menús
- `pages/generar.vue` - Generador rotativo
- `pages/menu/[id].vue` - Editor de menú
- `composables/useSupabase.ts` - Cliente DB

### Edge Functions (supabase/functions/)
- `telegram-webhook/` - Bot Telegram
- `ocr-processor/` - Procesamiento imágenes
- `generate-monthly-menu/` - Generación mensual + lista compra

### Base de Datos (supabase/)
- `schema.sql` - Schema completo
- `migrations/` - Migraciones versionadas

## Flujo de datos

```
1. Usuario → Telegram → Webhook
2. Webhook → Guarda en DB
3. OCR → Extrae texto → Guarda platos
4. /monthly → Genera meal_plans + shopping_lists
5. Web → Lee DB → Muestra al usuario
```

## Variables de entorno

```
NUXT_PUBLIC_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN (Supabase Secrets)
GOOGLE_CLOUD_API_KEY (Supabase Secrets)
```
