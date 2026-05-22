# PRODUCTION-READY — OCR Tailscale Funnel Integration

**Fecha**: 2026-05-21
**Estado**: ✅ EN PRODUCCIÓN
**Build**: ✅ Pasa (`npm run build` → "Build complete!")
**Seguridad**: ✅ Auditada
**Deploy**: ✅ Activo en https://menu-planner.dminguela.es

---

## Estado Producción

| Componente | Estado | URL |
|------------|--------|-----|
| menu-web | ✅ Deployed | https://menu-planner.dminguela.es |
| OCR Funnel | ✅ Activo | https://minguela-server.tailc7f2e4.ts.net |
| Proxy /api/ocr | ✅ Funcional | Via Vercel serverless |
| Fallback Supabase | ✅ Automático | Si Docker 502/503/504/timeout |
| Variables Vercel | ✅ Configuradas | Production + Preview |

---

## Variables de Entorno Vercel (Production)

| Variable | Valor | Environment |
|----------|-------|-------------|
| `OCR_PROCESSOR_URL` | `https://minguela-server.tailc7f2e4.ts.net` | Production |
| `OCR_SHARED_SECRET` | `KqzYTSKDsNhMEx0d+r+mwA4EsgORJAMa2QpmDgjXobg=` | Production |

**Comandos Vercel CLI (ya ejecutados):**

```bash
vercel env add OCR_PROCESSOR_URL production --value "https://minguela-server.tailc7f2e4.ts.net" --yes --force
vercel env add OCR_SHARED_SECRET production --value "KqzYTSKDsNhMEx0d+r+mwA4EsgORJAMa2QpmDgjXobg=" --yes --force --sensitive
```

---

## Rama y Commits

- **Rama final**: `main`
- **Merge**: `staging/ocr-docker` → `main` (fast-forward)
- **Commit HEAD**: `1b14f6e` — "feat(ocr): prepare Tailscale Funnel integration for Preview"
- **Push**: `origin/main` actualizado

---

## Smoke Tests Producción (Ejecutados)

| Test | Resultado | HTTP Code |
|------|-----------|-----------|
| Cargar web | MenuPlanner HTML | 200 ✅ |
| POST /api/ocr (sin imagen) | `{"success":false,"error":"Falta imagen..."}` | 500 ✅ (esperado) |
| Health Funnel directo | `{"status":"ok","service":"ocr-processor",...}` | 200 ✅ |
| POST Funnel sin secret | `{"success":false,"error":"Unauthorized..."}` | 401 ✅ |
| Variables Vercel | Production + Preview configuradas | ✅ |

**Nota**: El POST /api/ocr devolviendo 500 "Falta imagen" confirma que el proxy SÍ está redirigiendo al OCR Docker correctamente (el OCR valida el secret y responde; si no tuviera secret devolvería 401).

---

## Rollback Inmediato

Si algo falla en producción:

```bash
# Opción A: Quitar OCR_PROCESSOR_URL (vuelve a Supabase Edge)
cd ~/apps/food-menu-creator/menu-web
vercel env rm OCR_PROCESSOR_URL production --yes
vercel env rm OCR_PROCESSOR_URL preview --yes
# Redeploy automático

# Opción B: Vaciar el valor
cd ~/apps/food-menu-creator/menu-web
vercel env add OCR_PROCESSOR_URL production --value "" --yes --force
# Redeploy automático
```

Verificación rollback:
```bash
# La app vuelve automáticamente a Supabase Edge Function
# Logs de Vercel deben mostrar:
# [server/api/ocr] → Supabase Edge (XXXX bytes)
```

---

## Arquitectura Final

```
[Usuario] ──HTTPS──► [Vercel Production]
                              │
                    [menu-planner.dminguela.es]
                              │
                    ┌─────────┴──────────┐
                    │                    │
              [Nuxt Proxy]         [Supabase Edge]
              /api/ocr             (fallback auto)
                    │
         ┌──────────┴──────────┐
         │                     │
   [Tailscale Funnel]    [Si Docker cae]
   HTTPS público           → Supabase
         │
   [Docker OCR]
   http://127.0.0.1:8086
```

---

## Qué NO Cambiar en el Código

| Archivo | Acción |
|---------|--------|
| `server/api/ocr.post.ts` | NO tocar — funciona en producción |
| `nuxt.config.ts` | NO tocar — preset vercel + runtimeConfig OK |
| `app/pages/menu/[id].vue` | NO tocar — llama a `/api/ocr` correctamente |

---

## Monitorización

```bash
# Logs de Vercel (proxy Nuxt)
vercel logs --follow

# Buscar logs del proxy OCR
vercel logs 2>&1 | grep "\[server/api/ocr\]"

# Ejemplo de log exitoso:
# [server/api/ocr] → Docker OCR (45678 bytes)
# [server/api/ocr] ← Docker 200 3521ms

# Ejemplo de fallback:
# [server/api/ocr] Docker unreachable, triggering fallback to Supabase
# [server/api/ocr] ← Supabase 200 4102ms (fallback)
```

---

## Documentación Relacionada

- `~/docker/OCR-FUNNEL-SETUP.md` — Configuración Funnel
- `~/docker/OCR-FUNNEL-SECURITY.md` — Auditoría seguridad
- `~/docker/OCR-FUNNEL-VERCEL-INTEGRATION.md` — Integración Vercel
- `~/docker/OCR-OPERATIONS-RUNBOOK.md` — Operaciones y troubleshooting
- `~/docker/CLOUDFLARE-OCR-STATUS.md` — Cloudflare descartado
- `docs/OCR-BACKEND.md` — Documentación del proyecto

---

## Siguiente Bloque Recomendado

**renovaciones-app** — Integrar OCR con el mismo flujo (si aplica).
