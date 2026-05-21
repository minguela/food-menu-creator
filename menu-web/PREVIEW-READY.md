# PREVIEW-READY — OCR Tailscale Funnel Integration

**Fecha**: 2026-05-21
**Estado**: Listo para Preview
**Build**: ✅ Pasa (`npm run build` → "Build complete!")
**Seguridad**: ✅ Auditada
**Smoke tests**: ✅ Pasan

---

## Checklist Pre-Deploy

### Código

- [x] `server/api/ocr.post.ts` implementado con fallback automático
- [x] `nuxt.config.ts` runtimeConfig incluye `ocrProcessorUrl` + `ocrSharedSecret` (server-only)
- [x] Frontend (`pages/menu/[id].vue`) llama a `/api/ocr` — no accede a secrets
- [x] Build pasa sin errores
- [x] Handler compilado en `.vercel/output/functions/__fallback.func/chunks/routes/api/ocr.post.mjs`
- [x] No hay secrets hardcodeados en código trackeado
- [ ] `.env.example` modificado — incluir en commit
- [ ] Limpiar backups no trackeados antes de commit (ver SAFE TO DELETE abajo)

### Seguridad

- [x] `ocrProcessorUrl` y `ocrSharedSecret` están en `runtimeConfig` (NO en `public`)
- [x] `x-ocr-secret` nunca sale al cliente
- [x] Logs sanitizados (no loguean imagen ni secret)
- [x] Body limit 6MB
- [x] Response limit 1MB
- [x] Timeout 45s
- [x] Solo POST permitido
- [x] Content-Type validado
- [x] Fallback automático a Supabase en errores infra

### Infra OCR (Docker)

- [x] Tailscale Funnel activo: `https://minguela-server.tailc7f2e4.ts.net`
- [x] Health check responde 200
- [x] POST sin secret → 401
- [x] Docker/Traefik operativos
- [x] OCR Docker con rate limiting (3 concurrentes)

### Variables Vercel

Añadir en Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Valor | Environment |
|----------|-------|-------------|
| `OCR_PROCESSOR_URL` | `https://minguela-server.tailc7f2e4.ts.net` | Preview |
| `OCR_SHARED_SECRET` | `KqzYTSKDsNhMEx0d+r+mwA4EsgORJAMa2QpmDgjXobg=` | Preview |

**Comandos Vercel CLI:**

```bash
vercel env add OCR_PROCESSOR_URL preview
# Pegar: https://minguela-server.tailc7f2e4.ts.net

vercel env add OCR_SHARED_SECRET preview
# Pegar: KqzYTSKDsNhMEx0d+r+mwA4EsgORJAMa2QpmDgjXobg=
```

### Commit Recomendado

```bash
cd ~/apps/food-menu-creator/menu-web

# 1. Limpiar backups no trackeados
rm nuxt.config.ts.backup-ocr-blockers-20260520-091206
rm server/api/ocr.post.ts.backup-ocr-blockers-20260520-091206

# 2. Añadir .env.example actualizado
git add .env.example

# 3. Commit
git commit -m "feat(ocr): Tailscale Funnel integration ready for Preview

- Add OCR_PROCESSOR_URL and OCR_SHARED_SECRET to runtimeConfig
- server/api/ocr.post.ts: proxy with automatic Supabase fallback
- Hardening: timeouts, body/response limits, sanitized logs
- Tailscale Funnel: https://minguela-server.tailc7f2e4.ts.net
- Cloudflare Tunnel definitively abandoned"

# 4. Push a rama de preview
git push origin preview/ocr-funnel
```

**Rama recomendada**: `preview/ocr-funnel` (o la que uses para Preview en Vercel)

---

## Rollback Inmediato

Si algo falla en Preview:

1. Ir a Vercel Dashboard → Environment Variables
2. Borrar `OCR_PROCESSOR_URL` (o dejar vacío)
3. Redeploy Preview
4. La app vuelve automáticamente a Supabase Edge Function

---

## SAFE TO DELETE

| Ruta | Motivo | Riesgo |
|------|--------|--------|
| `nuxt.config.ts.backup-ocr-blockers-20260520-091206` | Backup intermedio de sesión anterior | Ninguno |
| `server/api/ocr.post.ts.backup-ocr-blockers-20260520-091206` | Backup intermedio de sesión anterior | Ninguno |

**NO borrar**:
- `docs/OCR-BACKEND.md` — documentación del proyecto
- `.vercel/` — output de build (se regenera, pero no es crítico)
- `~/docker/CLOUDFLARE-OCR-STATUS.md` — historial de decisiones

---

## Smoke Tests Post-Deploy Preview

Después de deploy a Preview, ejecutar:

```bash
# 1. Health check directo
 curl -s https://minguela-server.tailc7f2e4.ts.net/health

# 2. Test contra Preview URL
curl -s -X POST https://<preview-url>/api/ocr \
  -F "file=@/ruta/a/menu-real.jpg" \
  -F "weekly_menu_id=<UUID>" \
  -F "start_day=1" \
  -F "day_count=7" \
  | jq .

# 3. Verificar logs de Vercel
vercel logs --follow
# Esperar ver: [server/api/ocr] → Docker OCR (XXXXX bytes)
# Esperar ver: [server/api/ocr] ← Docker 200 XXXXms
```

---

## Siguiente Paso: Production

1. Si Preview OK por 24-48h → copiar vars a Production
2. Redeploy Production
3. Ejecutar smoke tests contra `https://menu-planner.dminguela.es`
