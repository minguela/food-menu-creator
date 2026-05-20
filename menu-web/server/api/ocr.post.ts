import { defineEventHandler, readRawBody, getHeader, createError } from 'h3'

/**
 * Proxy OCR: reenvia el request al backend OCR configurado.
 *
 * Backend seleccionado:
 * - Si OCR_PROCESSOR_URL tiene valor → Docker OCR (external)
 * - Si esta vacio → Supabase Edge Function (default)
 *
 * El secreto x-ocr-secret nunca sale del servidor.
 *
 * Hardening:
 * - Timeout de 45s (OpenAI puede tardar 10-30s)
 * - Max body size 6MB (imagen base64 + overhead multipart)
 * - Solo acepta POST
 * - Content-Type validado
 * - Logs sanitizados (nunca loguean imagenes ni secretos)
 * - Respuesta OCR truncada a 1MB para proteger memoria
 * - No filtra secretos en errores
 * - Retry 0 (1 solo intento, el cliente hace retry si quiere)
 */

const OCR_TIMEOUT_MS = 45000
const MAX_BODY_BYTES = 6 * 1024 * 1024
const MAX_RESPONSE_BYTES = 1024 * 1024 // 1MB max respuesta OCR

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  const ocrUrl = (runtimeConfig.ocrProcessorUrl || '').trim()
  const ocrSecret = (runtimeConfig.ocrSharedSecret || '').trim()

  // Solo POST permitido
  if (event.node.req.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const contentType = getHeader(event, 'content-type') || ''

  // Validar Content-Type minimo
  const isMultipart = contentType.toLowerCase().includes('multipart/form-data')
  const isJson = contentType.toLowerCase().includes('application/json')
  if (!isMultipart && !isJson) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported Content-Type. Use multipart/form-data or application/json' })
  }

  // Validar Content-Length antes de leer el body
  const contentLength = Number(getHeader(event, 'content-length') || '0')
  if (contentLength > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: `Payload too large. Max ${MAX_BODY_BYTES / 1024 / 1024}MB` })
  }

  const body = await readRawBody(event)

  // Validar tamaño del body real
  if (body && body.length > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: `Payload too large. Max ${MAX_BODY_BYTES / 1024 / 1024}MB` })
  }

  if (!body || body.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Empty request body' })
  }

  // Headers de auth del cliente (para reenviar a Supabase si es necesario)
  const clientAuth = getHeader(event, 'authorization') || ''
  const clientApiKey = getHeader(event, 'apikey') || ''

  const startTime = Date.now()

  if (ocrUrl) {
    // Modo Docker OCR (external)
    console.log(`[server/api/ocr] → Docker OCR (${body.length} bytes)`)

    const headers: Record<string, string> = {
      'Content-Type': contentType,
    }

    if (ocrSecret) {
      headers['x-ocr-secret'] = ocrSecret
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS)

    try {
      const response = await fetch(ocrUrl, {
        method: 'POST',
        headers,
        body: body || undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseBody = await response.text()

      // Truncar respuesta si es excesivamente grande
      if (responseBody.length > MAX_RESPONSE_BYTES) {
        console.warn(`[server/api/ocr] Docker OCR response too large: ${responseBody.length} bytes (truncating)`)
        event.node.res.statusCode = 502
        return { success: false, error: 'OCR response too large' }
      }

      // Sanitizar: no loguear el body completo (puede contener datos de menus)
      const duration = Date.now() - startTime
      console.log(`[server/api/ocr] ← Docker ${response.status} ${duration}ms`)

      event.node.res.statusCode = response.status
      return JSON.parse(responseBody)
    } catch (err: any) {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      const isTimeout = err.name === 'AbortError'
      console.error(`[server/api/ocr] Docker OCR error: ${isTimeout ? 'Timeout' : err.message} (${duration}ms)`)
      throw createError({
        statusCode: 504,
        statusMessage: isTimeout
          ? 'OCR Docker timeout (45s). The server may be overloaded.'
          : 'OCR Docker unreachable',
      })
    }
  }

  // Modo Supabase Edge Function (default fallback)
  const supabaseUrl = runtimeConfig.public.supabaseUrl
  const supabaseAnonKey = runtimeConfig.public.supabaseAnonKey

  console.log(`[server/api/ocr] → Supabase Edge (${body.length} bytes)`)

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'apikey': clientApiKey || supabaseAnonKey,
  }

  if (clientAuth) {
    headers['Authorization'] = clientAuth
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/ocr-processor`,
      {
        method: 'POST',
        headers,
        body: body || undefined,
        signal: controller.signal,
      },
    )

    clearTimeout(timeoutId)

    const responseBody = await response.text()

    // Truncar respuesta si es excesivamente grande
    if (responseBody.length > MAX_RESPONSE_BYTES) {
      console.warn(`[server/api/ocr] Supabase Edge response too large: ${responseBody.length} bytes`)
      event.node.res.statusCode = 502
      return { success: false, error: 'OCR response too large' }
    }

    const duration = Date.now() - startTime
    console.log(`[server/api/ocr] ← Supabase ${response.status} ${duration}ms`)

    event.node.res.statusCode = response.status
    return JSON.parse(responseBody)
  } catch (err: any) {
    clearTimeout(timeoutId)
    const duration = Date.now() - startTime
    const isTimeout = err.name === 'AbortError'
    console.error(`[server/api/ocr] Supabase Edge error: ${isTimeout ? 'Timeout' : err.message} (${duration}ms)`)
    throw createError({
      statusCode: 504,
      statusMessage: isTimeout
        ? 'Supabase Edge timeout (45s). Retry later.'
        : 'Supabase Edge unreachable',
    })
  }
})