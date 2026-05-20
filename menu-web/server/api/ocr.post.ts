import { defineEventHandler, readRawBody, getHeader, createError } from 'h3'

/**
 * Proxy OCR: reenvia el request al backend OCR configurado.
 *
 * Backend seleccionado:
 * - Si OCR_PROCESSOR_URL tiene valor → Docker OCR (external)
 * - Si esta vacio → Supabase Edge Function (default)
 *
 * FALLBACK AUTOMATICO (infra):
 *   Si Docker OCR devuelve 502/503/504 o timeout de red,
 *   se intenta fallback a Supabase Edge automaticamente.
 *   Solo aplica a errores de transporte/infra, NO a 401 ni validacion.
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
 * - Fallback automatico a Supabase en errores infra Docker
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

  // --- Funcion interna: llamada a Supabase Edge (fallback) ---
  async function callSupabaseFallback(reason: string): Promise<any> {
    const supabaseUrl = runtimeConfig.public.supabaseUrl
    const supabaseAnonKey = runtimeConfig.public.supabaseAnonKey

    console.log(`[server/api/ocr] FALLBACK → Supabase Edge (${reason}, ${body!.length} bytes)`)

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

      if (responseBody.length > MAX_RESPONSE_BYTES) {
        console.warn(`[server/api/ocr] Supabase Edge response too large: ${responseBody.length} bytes`)
        event.node.res.statusCode = 502
        return { success: false, error: 'OCR response too large' }
      }

      const duration = Date.now() - startTime
      console.log(`[server/api/ocr] ← Supabase ${response.status} ${duration}ms (fallback)`)

      event.node.res.statusCode = response.status
      return JSON.parse(responseBody)
    } catch (err: any) {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      const isTimeout = err.name === 'AbortError'
      console.error(`[server/api/ocr] Supabase Edge fallback error: ${isTimeout ? 'Timeout' : err.message} (${duration}ms)`)
      throw createError({
        statusCode: 504,
        statusMessage: isTimeout
          ? 'OCR timeout (45s). Both Docker and Supabase failed. Retry later.'
          : 'OCR unreachable. Both Docker and Supabase failed.',
      })
    }
  }

  // --- Modo Docker OCR (external) ---
  if (ocrUrl) {
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

      const duration = Date.now() - startTime
      console.log(`[server/api/ocr] ← Docker ${response.status} ${duration}ms`)

      // FALLBACK AUTOMATICO: solo errores de infra/transporte
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        console.warn(`[server/api/ocr] Docker returned ${response.status}, triggering fallback to Supabase`)
        return await callSupabaseFallback(`Docker HTTP ${response.status}`)
      }

      // Para 401/403/400/422/500: NO hacer fallback, devolver tal cual al cliente
      // El cliente debe manejar estos errores (ej: 401 = secreto mal)
      event.node.res.statusCode = response.status
      return JSON.parse(responseBody)
    } catch (err: any) {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      const isTimeout = err.name === 'AbortError'

      console.error(`[server/api/ocr] Docker OCR error: ${isTimeout ? 'Timeout' : err.message} (${duration}ms)`)

      // FALLBACK AUTOMATICO: timeout de red o conexion rechazada
      if (isTimeout || err.message?.includes('fetch failed') || err.message?.includes('ECONNREFUSED')) {
        console.warn(`[server/api/ocr] Docker unreachable (${isTimeout ? 'timeout' : err.message}), triggering fallback to Supabase`)
        return await callSupabaseFallback(isTimeout ? 'Docker timeout' : `Docker unreachable: ${err.message}`)
      }

      // Otros errores (DNS, etc): no fallback
      throw createError({
        statusCode: 504,
        statusMessage: isTimeout
          ? 'OCR Docker timeout (45s). The server may be overloaded.'
          : 'OCR Docker unreachable',
      })
    }
  }

  // --- Modo Supabase Edge Function (default fallback cuando URL vacia) ---
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