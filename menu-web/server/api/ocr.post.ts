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
 * - Timeout de 35s (OpenAI tarda ~10-25s)
 * - Max body size ~6MB (imagen base64 + overhead multipart)
 * - Solo acepta POST
 * - Content-Type validado
 * - Logs sanitizados (nunca loguean imagenes ni secretos)
 */

const OCR_TIMEOUT_MS = 35000
const MAX_BODY_BYTES = 6 * 1024 * 1024

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

  const body = await readRawBody(event)

  // Validar tamaño aproximado del body
  if (body && body.length > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: `Payload too large. Max ${MAX_BODY_BYTES / 1024 / 1024}MB allowed` })
  }

  // Headers de auth del cliente (para reenviar a Supabase si es necesario)
  const clientAuth = getHeader(event, 'authorization') || ''
  const clientApiKey = getHeader(event, 'apikey') || ''

  if (ocrUrl) {
    // Modo Docker OCR (external)
    console.log('[server/api/ocr] Proxying to Docker OCR')

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
      event.node.res.statusCode = response.status
      return JSON.parse(responseBody)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('[server/api/ocr] Docker OCR error:', err.name === 'AbortError' ? 'Timeout' : err.message)
      throw createError({
        statusCode: 504,
        statusMessage: err.name === 'AbortError'
          ? 'OCR Docker timeout (35s). The server may be overloaded.'
          : 'OCR Docker unreachable',
      })
    }
  }

  // Modo Supabase Edge Function (default fallback)
  const supabaseUrl = runtimeConfig.public.supabaseUrl
  const supabaseAnonKey = runtimeConfig.public.supabaseAnonKey

  console.log('[server/api/ocr] Proxying to Supabase Edge')

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
    event.node.res.statusCode = response.status
    return JSON.parse(responseBody)
  } catch (err: any) {
    clearTimeout(timeoutId)
    console.error('[server/api/ocr] Supabase Edge error:', err.name === 'AbortError' ? 'Timeout' : err.message)
    throw createError({
      statusCode: 504,
      statusMessage: err.name === 'AbortError'
        ? 'Supabase Edge timeout (35s). Retry later.'
        : 'Supabase Edge unreachable',
    })
  }
})
