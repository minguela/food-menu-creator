# 🍽️ MenuPlanner

Interfaz web para gestionar menús semanales rotativos conectada a Supabase.

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
npm run generate
```

## 📁 Estructura

```
menu-web/
├── pages/
│   ├── index.vue           # Lista de menús semanales
│   ├── menu/[id].vue       # Detalle: añadir/editar platos
│   └── generar.vue         # Generar menú rotativo de N días
├── composables/
│   └── useSupabase.ts      # Cliente Supabase
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
- `weekly_meals` - Platos de cada menú

Puedes crearlas ejecutando el SQL en `../supabase/migrations/002_weekly_menus.sql`

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
- ✅ Añadir platos para cada día (comida/cena)
- ✅ Visualizar progreso (X/14 platos)
- ✅ Generar menú rotativo para N días
- ✅ Vista previa del menú generado
- ✅ Imprimir o copiar al portapapeles

## 🛠️ Tecnologías

- **Nuxt 3** - Framework Vue.js
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Supabase** - Base de datos y backend
- **Vercel** - Hosting
