# 🍽️ MenuPlanner

Interfaz web para gestionar menús semanales rotativos conectada a Supabase, con perfiles de personas, control nutricional, ingredientes exactos y lista de la compra.

## 🚀 Inicio rápido

### Desarrollo local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

Abre http://localhost:3000

### Build para producción

```bash
npm run build
```

### Tests

```bash
npm test
```

## 📁 Estructura

```
menu-web/
├── pages/
│   ├── index.vue           # Lista de menús semanales
│   ├── menu/[id].vue       # Detalle: desayuno/comida/cena, imágenes e ingredientes
│   ├── generar.vue         # Generar menú rotativo de N días
│   ├── shopping.vue        # Lista de compra consolidada
│   └── config.vue          # Perfiles y objetivos nutricionales
├── composables/
│   ├── useCurrentUser.ts   # Usuario activo de la app
│   └── useSupabase.ts      # Cliente Supabase
├── utils/
│   └── nutrition.js        # Validación y cálculo de macros
├── tests/
│   └── nutrition.test.mjs  # Tests de lógica nutricional
├── types/
│   └── index.ts            # Tipos TypeScript
├── app.vue                 # Layout principal
├── nuxt.config.ts          # Configuración
└── vercel.json             # Configuración Vercel
```

## 🔧 Configuración

### Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NUXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor) |

### Base de datos requerida

Las siguientes tablas deben existir en Supabase:

- `weekly_menus` - Menús semanales
- `weekly_meals` - Desayuno, comida y cena de cada día
- `weekly_meal_ingredients` - Ingredientes exactos por plato
- `weekly_day_images` - Imagen representativa del menú diario
- `person_profiles` - Perfiles de personas y objetivos
- `shopping_lists` - Lista de compra consolidada

Aplica las migraciones de `../supabase/migrations/`, especialmente:

- `004_weekly_meals_unique_slot.sql`
- `005_profiles_daily_images_macros_ingredients.sql`

El generador mensual usa `weekly_menus`/`weekly_meals` como fuente principal y consolida la compra desde `weekly_meal_ingredients`.

## 🌐 Despliegue en Vercel

1. Ve a https://vercel.com/new
2. Importa este proyecto
3. Configura las variables de entorno:
   - `NUXT_PUBLIC_SUPABASE_URL`
   - `NUXT_PUBLIC_SUPABASE_ANON_KEY`
4. Haz clic en **Deploy**

Ver `DEPLOY.md` para más detalles.

## 📋 Funcionalidades

- ✅ Crear menús semanales con nombre personalizado
- ✅ Añadir desayuno, comida y cena para cada día
- ✅ Guardar kcal, proteína, hidratos, grasas e ingredientes por plato
- ✅ Subir imagen representativa del menú diario
- ✅ Gestionar perfiles de personas
- ✅ Configurar porcentajes objetivo de grasas e hidratos; proteína deducida automáticamente
- ✅ Rechazar combinaciones de macros ilógicas
- ✅ Visualizar progreso (X/21 comidas)
- ✅ Generar menú rotativo para N días
- ✅ Vista previa del menú generado
- ✅ Lista de compra exacta y deduplicada desde ingredientes
- ✅ Imprimir o copiar al portapapeles

## 🛠️ Tecnologías

- **Nuxt 3** - Framework Vue.js
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Supabase** - Base de datos y backend
- **Vercel** - Hosting
