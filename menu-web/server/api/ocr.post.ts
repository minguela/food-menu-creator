import { defineEventHandler, readRawBody, getHeader, createError } from 'h3'

/**
 * Proxy OCR: reenvia el request al backend OCR Docker.
 * Ya no hay fallback a Supabase Edge — solo Docker OCR.
 *
 * El secreto x-ocr-secret nunca sale del servidor.
 *
 * Hardening:
 * - Timeout de 45s
 * - Max body size 6MB
 * - Solo POST
 * - Content-Type validado
 * - Respuesta truncada a 1MB
 */
const OCR_TIMEOUT_MS = 45000
const MAX_BODY_BYTES = 6 * 1024 * 1024
const MAX_RESPONSE_BYTES = 1024 * 1024

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const ocrUrl = (runtimeConfig.ocrProcessorUrl || '').trim()
  const ocrSecret = (runtimeConfig.ocrSharedSecret || '').trim()

  if (event.node.req.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const contentType = getHeader(event, 'content-type') || ''
  const isMultipart = contentType.toLowerCase().includes('multipart/form-data')
  const isJson = contentType.toLowerCase().includes('application/json')
  if (!isMultipart && !isJson) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported Content-Type. Use multipart/form-data or application/json' })
  }

  const contentLength = Number(getHeader(event, 'content-length') || '0')
  if (contentLength > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: `Payload too large. Max ${MAX_BODY_BYTES / 1024 / 1024}MB` })
  }

  const body = await readRawBody(event)
  if (body && body.length > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: `Payload too large. Max ${MAX_BODY_BYTES / 1024 / 1024}MB` })
  }
  if (!body || body.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Empty request body' })
  }

  const startTime = Date.now()

  // Docker OCR
  if (!ocrUrl) {
    throw createError({ statusCode: 503, statusMessage: 'OCR service not configured. Set OCR_PROCESSOR_URL env var.' })
  }

  console.log(`[server/api/ocr] → Docker OCR (${body.length} bytes)`)

  const headers: Record<string, string> = { 'Content-Type': contentType }
  if (ocrSecret) headers['x-ocr-secret'] = ocrSecret

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
    if (responseBody.length > MAX_RESPONSE_BYTES) {
      console.warn(`[server/api/ocr] Response too large: ${responseBody.length} bytes`)
      event.node.res.statusCode = 502
      return { success: false, error: 'OCR response too large' }
    }

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
        ? 'OCR timeout (45s). Retry later.'
        : 'OCR unreachable',
    })
  }
})
