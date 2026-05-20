# OCR Backend Configuration

Documento de migracion del backend OCR: Supabase Edge Function a Docker local.

## Arquitectura Final

```
Cliente (Nuxt/Vercel)
    |
    v POST /api/ocr
Proxy server-side (server/api/ocr.post.ts)
    |
    +-- OCR_PROCESSOR_URL vacio --> Supabase Edge Function (default, produccion)
    |
    +-- OCR_PROCESSOR_URL set   --> Docker OCR (Traefik/Tailscale/Cloudflare)
                                        |
                                        +-- Golden Fixtures cache (SHA256)
                                        +-- OpenAI gpt-4o-mini
                                        +-- Supabase DB (insert/update)
```

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `nuxt.config.ts` | Anadido `ocrProcessorUrl` y `ocrSharedSecret` a runtimeConfig (server-only) |
| `.env.example` | Anadido `OCR_PROCESSOR_URL` y `OCR_SHARED_SECRET` |
| `server/api/ocr.post.ts` | Nuevo proxy server-side: reenvia al Docker OCR o a Supabase Edge |
| `pages/menu/[id].vue` | Modificado `invokeOcrWithRetry` para llamar a `/api/ocr` |

## Como Cambiar de Backend OCR

### 1. Usar Supabase Edge Function (default, produccion actual)

No hacer nada. O asegurarse de que la variable este vacia:

```bash
# En Vercel (o .env local)
OCR_PROCESSOR_URL=
OCR_SHARED_SECRET=
```

El proxy server-side usa automaticamente la Edge Function de Supabase.

### 2. Usar Docker OCR (desarrollo local / homelab)

Solo accesible desde Tailscale:

```bash
# .env local (Nuxt)
OCR_PROCESSOR_URL=http://100.121.143.66:8086/
OCR_SHARED_SECRET=<valor-del-.env-del-contenedor>
```

**IMPORTANTE**: Esto solo funciona en desarrollo local (desde la VPN Tailscale).
Vercel NO puede acceder a IPs Tailscale.

### 3. Rollback a Supabase

Borra o comenta la variable:

```bash
# .env
OCR_PROCESSOR_URL=
```

Reiniciar dev server o redeploy.

### 4. Usar Docker OCR en produccion con Vercel

Necesario exponer el contenedor via Cloudflare Tunnel:

```bash
# En Vercel
OCR_PROCESSOR_URL=https://ocr.tu-dominio.com
OCR_SHARED_SECRET=<secreto-compartido>
```

## Limitaciones Importantes

### Vercel + Tailscale IP

NO FUNCIONA: Vercel no puede acceder a la IP Tailscale privada
`100.121.143.66` desde sus servidores edge.

Solucion para produccion con Docker OCR:
1. Exponer el Docker OCR con Cloudflare Tunnel
2. Usar un dominio publico: `https://ocr.tu-dominio.com`
3. Configurar en Vercel como variable de entorno

### Mixed Content (HTTP vs HTTPS)

Si el frontend se sirve por HTTPS (Vercel) y el OCR Docker usa HTTP
por Tailscale, el navegador NO puede hacer peticiones directas a HTTP
desde HTTPS. Por eso el proxy server-side (`server/api/ocr.post.ts`)
existe: la peticion al Docker OCR se hace desde el servidor Nuxt, no
desde el navegador del cliente.

### Payload

Soporta exactamente el mismo formato que la Edge Function:
- `file`: imagen como multipart
- `weekly_menu_id`: UUID del menu
- `weekly_day_image_ids`: array de UUIDs (max 50)
- `image_url`: URL publica de la imagen (max 2048 chars, HTTP(S) only)
- `start_day`, `day_count`, `source_mode`, `meal_types`
- `image_base64`: imagen como base64 (max 4MB)

## Seguridad

| Capa | Proxy Nuxt | Docker OCR |
|------|-----------|------------|
| Auth | Reenvia apikey/authorization a Supabase | Header x-ocr-secret |
| Tamano | Max 6MB | Max 6MB |
| Content-Type | multipart o json | multipart o json |
| Timeout | 45s | 60s global, 45s OpenAI, 10s download |
| Response | Max 1MB truncado | Sanitized errors |
| Secretos | OCR_SHARED_SECRET nunca al cliente | - |

## Logs

Proxy Nuxt (server-side):
```
[server/api/ocr] → Docker OCR (12345 bytes)
[server/api/ocr] ← Docker 200 3521ms
[server/api/ocr] Docker OCR error: Timeout (45003ms)
```

Docker OCR:
```
[ocr-processor] Starting on :8085 | max_concurrent=3
[ocr-processor] OpenAI response: 1234 chars | 3521ms | model=gpt-4o-mini
[ocr-processor] Concurrency limit: 3/3
[ocr-processor] Error: OpenAI rate limit. Retry later. | concurrent=2
```

## Checklist Antes de Desplegar

- [ ] `OCR_PROCESSOR_URL` esta vacia en produccion (Vercel)
- [ ] La Edge Function sigue funcionando (no se ha modificado)
- [ ] El proxy server-side (`server/api/ocr.post.ts`) compila correctamente
- [ ] El fallback a Supabase funciona cuando `OCR_PROCESSOR_URL` esta vacia
- [ ] `OCR_SHARED_SECRET` esta configurado en .env del contenedor Docker
- [ ] `OCR_SHARED_SECRET` en Vercel solo si se usa Docker OCR en produccion
- [ ] Health check funciona: `curl http://100.121.143.66:8086/health`

## Checklist Rollback

1. Poner `OCR_PROCESSOR_URL=` vacio en Vercel
2. Redeploy (push o Vercel dashboard)
3. Verificar que las peticiones van a Supabase Edge
4. Detener contenedor Docker si se quiere: `docker compose down`

## Troubleshooting

### Error 504: OCR Docker timeout

- Verificar que el contenedor esta running: `docker ps | grep ocr-processor`
- Verificar health: `curl http://localhost:8085/health`
- Verificar Traefik: `curl http://100.121.143.66:8086/health`
- Verificar que `OCR_SHARED_SECRET` coincide en .env del contenedor y .env del proxy

### Error 401: Unauthorized

- `OCR_SHARED_SECRET` no coincide entre proxy y contenedor
- Verificar que el header `x-ocr-secret` se envia correctamente

### Error 413: Payload too large

- Imagenes mayores de 3MB son rechazadas
- Base64 mayores de 4MB son rechazadas
- Body completo mayor de 6MB es rechazado

### Error 503: Server busy

- Mas de 3 requests OCR simultaneas
- Reintentar despues de 10s
- Aumentar `MAX_CONCURRENT_OCR` en .env si es necesario

### OpenAI rate limit

- gpt-4o-mini tiene limites de API
- Si hay muchos requests, considerar golden fixtures para menus recurrentes
- Verificar en https://platform.openai.com/usage