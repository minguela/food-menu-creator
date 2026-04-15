# 🚀 Despliegue en Vercel

## Opción 1: Vercel Dashboard (Recomendada)

1. **Ve a** https://vercel.com/new
2. **Importa el repositorio** desde GitHub o sube el proyecto
3. **Configura las variables de entorno:**
   - `NUXT_PUBLIC_SUPABASE_URL` = `https://tceusgxbfpekjcthrrqu.supabase.co`
   - `NUXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable__ar3t49-ts89flpoWupqTA_44jctdfW`
4. **Haz clic en Deploy**

## Opción 2: Vercel CLI

```bash
cd /home/dminguela/ClaudeCode/menu-web

# Iniciar sesión (si no lo estás)
npx vercel login

# Enlazar proyecto
npx vercel link

# Desplegar
npx vercel --prod
```

## Estructura del proyecto

```
menu-web/
├── app.vue                 # Layout principal
├── nuxt.config.ts          # Configuración de Nuxt
├── vercel.json             # Configuración de Vercel
├── composables/
│   └── useSupabase.ts      # Cliente de Supabase
├── types/
│   └── index.ts            # Tipos TypeScript
├── pages/
│   ├── index.vue           # Lista de menús
│   ├── menu/[id].vue       # Detalle de menú (añadir platos)
│   └── generar.vue         # Generar menú rotativo
└── .env.example            # Variables de entorno (ejemplo)
```

## Comandos locales

```bash
# Desarrollo
npm run dev

# Build para producción
npm run generate

# Preview local del build
npm run preview
```

## Notas

- La aplicación está configurada para usar **Nuxt 3** con **Tailwind CSS**
- El preset de Vercel está configurado en `nuxt.config.ts` como `vercel-edge`
- Las variables de entorno sensibles (`SUPABASE_SERVICE_ROLE_KEY`) no deben exponerse en el cliente
