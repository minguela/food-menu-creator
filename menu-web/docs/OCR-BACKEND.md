# OCR Backend Configuration

Documento de migracion del backend OCR: Supabase Edge Function ↔ Docker local.

## Estado actual

- **Default (produccion)**: Supabase Edge Function
- **Opcional (desarrollo/homelab)**: Docker OCR via Tailscale
- **URL Docker**: http://100.121.143.66:8086/

## Como cambiar de backend OCR

### 1. Usar Supabase Edge Function (default, produccion)

No hacer nada. O asegurarse de que la variable este vacia:

```bash
# .env (server-only, Nuxt no lo expone al cliente)
OCR_PROCESSOR_URL=
```

El proxy server-side (`server/api/ocr.post.ts`) usa automaticamente la Edge Function de Supabase como fallback.

### 2. Usar Docker OCR (desarrollo local / homelab)

Solo si tu maquina de desarrollo esta en la VPN Tailscale:

```bash
# .env (server-only)
OCR_PROCESSOR_URL=http://100.121.143.66:8086/
OCR_SHARED_SECRET=<valor-del-.env-del-contenedor>
```

Reiniciar dev server:
```bash
npm run dev
```

### 3. Rollback a Supabase

Borra o comenta la variable:

```bash
# .env
# OCR_PROCESSOR_URL=http://100.121.143.66:8086/
OCR_PROCESSOR_URL=
```

Reiniciar dev server.

## Limitaciones importantes

### Vercel + Tailscale IP

**NO FUNCIONA**: Vercel no puede acceder a la IP Tailscale privada
`100.121.143.66` desde sus servidores edge. Los navegadores de los usuarios
finales tampoco estan en tu VPN Tailscale.

**Solucion para produccion con Docker OCR**:

1. Exponer el Docker OCR con Cloudflare Tunnel
2. Usar un dominio publico: `https://ocr.tu-dominio.com`
3. Configurar ese dominio en las variables de entorno de Vercel:
   ```bash
   OCR_PROCESSOR_URL=https://ocr.tu-dominio.com
   OCR_SHARED_SECRET=<secreto>
   ```

### Mixed Content (HTTP vs HTTPS)

Si el frontend se sirve por HTTPS (Vercel) y el OCR Docker usa HTTP
(Tailscale), el navegador bloqueara la peticion por mixed content.

**Solucion**: usar HTTPS en el OCR Docker (Cloudflare Tunnel, reverse proxy
con certificado) o usar un proxy server-side.

### Payload multipart/form-data

El Docker OCR acepta exactamente el mismo payload que la Edge Function:
- `file`: imagen como multipart
- `weekly_menu_id`: UUID del menu
- `weekly_day_image_ids`: array de UUIDs
- `image_url`: URL publica de la imagen
- `start_day`, `day_count`, `source_mode`, `meal_types`

## Logs

En modo desarrollo, el navegador muestra en consola:

```
[OCR] Modo: supabase-edge
[OCR] Modo: external-http → http://100.121.143.66:8086/
```

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `nuxt.config.ts` | Añadido `ocrProcessorUrl` y `ocrSharedSecret` a `runtimeConfig` (server-only) |
| `.env.example` | Añadido `OCR_PROCESSOR_URL` y `OCR_SHARED_SECRET` |
| `server/api/ocr.post.ts` | Nuevo proxy server-side: reenvia al Docker OCR o a Supabase Edge |
| `pages/menu/[id].vue` | Modificado `invokeOcrWithRetry` para llamar a `/api/ocr` |

## Checklist antes de desplegar

- [ ] `OCR_PROCESSOR_URL` esta vacia en produccion
- [ ] La Edge Function sigue funcionando (no se ha modificado)
- [ ] El proxy server-side (`server/api/ocr.post.ts`) funciona correctamente
- [ ] El fallback a Supabase funciona cuando `OCR_PROCESSOR_URL` esta vacia
