# Food Menu Creator — Migración a Frontend Layers

## Baseline

- Nuxt 3, Vue 3, Tailwind CSS
- Supabase backend
- 10 pages, 5 composables
- OCR server integration
- Playwright + node tests
- TypeScript config exists

## Layers objetivo

```
layers/
  00.core/       — shared domain models (Menu, Recipe, Ingredient, ShoppingItem)
  10.menu/       — weekly menus, menu detail, menu generation
  20.recipes/    — recipe library
  30.shopping/   — shopping list
```

## Estado

- Estructura de layers creada
- Domain models definidos en 00.core
- Pages legacy preservadas (sin renombrar aún)
- Pendiente: migrar páginas una a una

## Validación

- Build pendiente (requiere Supabase connection para server)
