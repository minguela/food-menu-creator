# 🚀 Despliegue en Vercel

## Opción 1: Vercel Dashboard (Recomendada)

1. **Ve a** https://vercel.com/new
2. **Importa el repositorio** desde GitHub
3. **Asegúrate de que `main` esté marcado como `Production Branch`**
4. **Configura las variables de entorno:**
   - `NUXT_PUBLIC_SUPABASE_URL` = `https://tceusgxbfpekjcthrrqu.supabase.co`
   - `NUXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable__ar3t49-ts89flpoWupqTA_44jctdfW`
5. **Haz clic en Deploy**

Con la integración nativa de GitHub activa, cada push a `main` se despliega automáticamente en producción.

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
├── app/                    # Código fuente de la app (Nuxt 4)
│   ├── app.vue             # Layout principal
│   ├── assets/
│   ├── components/
│   ├── composables/
│   │   └── useSupabase.ts      # Cliente de Supabase
│   ├── pages/
│   │   ├── index.vue           # Lista de menús
│   │   ├── menu/[id].vue       # Detalle de menú (añadir platos)
│   │   └── generar.vue         # Generar menú rotativo
│   ├── public/
│   ├── types/
│   │   └── index.ts            # Tipos TypeScript
│   └── utils/
├── server/                 # API y middleware (Nitro)
│   ├── api/
│   ├── middleware/
│   ├── services/
│   └── utils/
├── tests/
├── scripts/
├── docs/
├── nuxt.config.ts          # Configuración de Nuxt
├── package.json
├── tsconfig.json
├── vercel.json             # Configuración de Vercel
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
- No hace falta un workflow de GitHub Actions para desplegar si la integración GitHub-Vercel está activa y `main` es la producción.
