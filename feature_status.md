# Estado de Funcionalidades

## Bot Telegram

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| `/start` | ✅ Implementado | Registro telegram_id + chat_id |
| `/semanal nuevo` | ✅ Implementado | Crea menú + progreso 1/14 |
| `/semanal lista` | ✅ Implementado | Muestra menús con estado |
| `/semanal info` | ✅ Implementado | Detalle por día |
| `/generar [días]` | ✅ Implementado | Rotación cíclica |
| `/monthly` | ✅ Implementado | Llama a edge function |
| `/shopping` | ✅ Implementado | Lista por categoría |
| `/help` | ✅ Implementado | Lista de comandos |
| Recepción fotos | ✅ Implementado | Caption "día X comida/cena" |
| OCR automático | ✅ Implementado | Google Cloud Vision |

## Backend (Supabase)

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Tabla `users` | ✅ Implementada | Campos nutricionales OK |
| Tabla `weekly_menus` | ✅ Implementada | + migración aplicada |
| Tabla `weekly_meals` | ✅ Implementada | + migración aplicada |
| Tabla `dishes` | ✅ Implementada | Con macros |
| Tabla `ingredients` | ✅ Implementada | Con categorías Carrefour |
| Tabla `dish_ingredients` | ✅ Implementada | Cantidades por plato |
| Tabla `meal_plans` | ✅ Implementada | Planificación por fecha |
| Tabla `shopping_lists` | ✅ Implementada | Consolidada por semana |
| Tabla `ingredient_prices` | ⚠️ Existe vacía | Sin datos reales |
| Edge Function telegram-webhook | ✅ Implementada | Desplegada |
| Edge Function ocr-processor | ✅ Implementada | GCP configurado |
| Edge Function generate-monthly-menu | ✅ Implementada | + lista compra + factor dinámico |
| Rotación cíclica | ✅ Implementada | N días con bucle |
| Lista compra consolidada | ✅ Implementada | Agrupa por ingrediente |
| Ajuste por personas | ✅ Implementado | Factor = 1.7 × (personsCount / 2) |
| OCR desde web | ✅ Implementado | Modo día a día y por bloque con edición posterior |
| Desayuno en lote | ✅ Implementado | Desayuno recurrente editable y duplicable en toda la semana |
| Jobs generación rotativa | ✅ Implementado | Estado, progreso, paso actual, heartbeat y logs persistidos |
| Debug generación rotativa | ✅ Implementado | Logs realtime en `/generar` e históricos desde `/history` |

## Frontend (Nuxt 3)

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Lista de menús (`/`) | ✅ Implementada | Grid con estado |
| Editor de menú (`/menu/[id]`) | ✅ Implementada | Grid 7×2 + ingredientes + subida imágenes |
| Generador (`/generar`) | ✅ Implementada | 30 días rotativos |
| Lista compra (`/shopping`) | ✅ Implementada | Agrupada por categoría, checkbox, imprimir |
| Configuración (`/config`) | ✅ Implementada | Edita targets nutricionales + personas |
| Subida imágenes web | ✅ Implementada | Storage bucket `menu-images` |
| Vista de ingredientes | ✅ Implementada | Consolidado por ingrediente |
| Tipos TypeScript | ✅ Implementados | `types/index.ts` |
| Cliente Supabase | ✅ Implementado | `composables/useSupabase.ts` |

## Integraciones

| Funcionalidad | Estado | Notas |
|---------------|--------|-------|
| Deploy Vercel | ✅ Configurado | Carpeta menu-web |
| Auto deploy main | ✅ Configurado | Integración nativa GitHub-Vercel activa en producción |
| Webhook Telegram | ✅ Configurado | URL válida |
| OCR Google Cloud | ✅ Configurado | API key en secrets |
| Sync web ↔ bot | ❌ Pendiente | No hay notificaciones cruzadas |

## Pendientes críticos

1. Precios reales en `ingredient_prices` (scraping Carrefour)
2. Sync web ↔ bot (notificaciones cruzadas)
3. Automatizar mejor el parseo de menús en bloque cuando el OCR trae texto poco estructurado
