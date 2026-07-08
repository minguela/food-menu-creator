// POST /api/telegram/send — Envía menú semanal a Telegram
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const menuText = typeof body.text === 'string' ? body.text : ''
  const chatId = typeof body.chatId === 'string' ? body.chatId : process.env.TELEGRAM_CHAT_ID || ''
  const botToken = process.env.TELEGRAM_BOT_TOKEN || ''

  if (!menuText || !chatId || !botToken) {
    throw createError({ statusCode: 400, statusMessage: 'Faltan parámetros: text, chatId, o TELEGRAM_BOT_TOKEN no configurado' })
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: menuText,
      parse_mode: 'HTML',
    }),
  })

  const result = await response.json()
  if (!result.ok) {
    throw createError({ statusCode: 500, statusMessage: `Telegram error: ${result.description}` })
  }

  return { ok: true, messageId: result.result.message_id }
})
