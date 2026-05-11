# Mapa del Codebase

## Estructura de archivos

```
/home/dminguela/ClaudeCode/
├── agents.md                  # Este archivo
├── architecture.md            # Arquitectura del sistema
├── codebase_index.md          # Este índice
├── feature_status.md          # Estado de funcionalidades
├── task_log.md                # Registro de tareas
├── PROJECT_CONTEXT.md         # Contexto completo
│
├── menu-web/                  # Aplicación web (deploy Vercel)
│   ├── .env                   # Variables locales
│   ├── .env.example
│   ├── .vercel/               # Config Vercel
│   ├── app.vue                # Layout principal
│   ├── nuxt.config.ts         # Config Nuxt
│   ├── package.json
│   ├── tsconfig.json
│   ├── composables/
│   │   └── useSupabase.ts     # Cliente Supabase
│   ├── types/
│   │   └── index.ts           # Tipos TypeScript
│   └── pages/
│       ├── index.vue          # Lista de menús
│       ├── generar.vue        # Generador rotativo
│       └── menu/[id].vue      # Editor de menú
│
├── supabase/
│   ├── config.toml            # Config funciones edge
│   ├── schema.sql             # Schema DB completo
│   ├── migrations/
│   │   ├── 002_weekly_menus.sql
│   │   └── 003_storage_bucket.sql
│   └── functions/
│       ├── telegram-webhook/index.ts
│       ├── ocr-processor/index.ts
│       ├── generate-monthly-menu/index.ts
│       └── apply-migration/index.ts
│
└── agents/
    └── telegram-menu-bot.md   # Documentación bot
```

## Funcionalidades por archivo

| Archivo | Funcionalidad | Estado |
|---------|---------------|--------|
| `menu-web/pages/index.vue` | Lista de menús semanales | ✅ |
| `menu-web/pages/generar.vue` | Generador menú rotativo | ✅ |
| `menu-web/pages/menu/[id].vue` | Editor + ingredientes + subida imágenes | ✅ |
| `menu-web/pages/shopping.vue` | Lista de la compra | ✅ |
| `menu-web/pages/config.vue` | Configuración nutricional | ✅ |
| `supabase/functions/telegram-webhook/` | Bot Telegram | ✅ |
| `supabase/functions/ocr-processor/` | OCR imágenes | ✅ |
| `supabase/functions/generate-monthly-menu/` | Generación mensual + ajuste dinámico | ✅ |

## Tipos definidos

- `User` - Usuario con targets nutricionales
- `WeeklyMenu` - Menú semanal
- `WeeklyMeal` - Plato individual
- `Dish` - Plato procesado con OCR
- `Ingredient` - Ingrediente con categoría
- `DishIngredient` - Relación plato-ingrediente
- `MealPlan` - Planificación por fecha
- `ShoppingListItem` - Item de lista de compra
- `MenuImage` - Imagen procesada con OCR
- `GeneratedMenu` - Resultado de generación
