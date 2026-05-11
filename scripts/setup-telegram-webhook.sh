#!/bin/bash

# Script para configurar el webhook de Telegram
# Necesitas tener desplegada la Edge Function en Supabase primero

set -e

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Comprobar que existe el token
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN no está configurado"
    exit 1
fi

# Comprobar que existe la URL de Supabase
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL no está configurado"
    echo "Edita .env y añade tu URL de Supabase (ej: https://xxxxx.supabase.co)"
    exit 1
fi

# URL del webhook (la Edge Function de Supabase)
WEBHOOK_URL="${SUPABASE_URL}/functions/v1/telegram-webhook"

echo "🔧 Configurando webhook de Telegram..."
echo "   URL: $WEBHOOK_URL"

# Configurar webhook en Telegram API
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"allowed_updates\": [\"message\"]}")

# Comprobar resultado
OK=$(echo $RESPONSE | jq -r '.ok')

if [ "$OK" = "true" ]; then
    echo "✅ Webhook configurado correctamente"

    # Verificar estado del webhook
    echo ""
    echo "📋 Estado del webhook:"
    curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | jq '.result'
else
    echo "❌ Error al configurar el webhook:"
    echo $RESPONSE | jq '.'
    exit 1
fi

echo ""
echo "✅ ¡Listo! Envía /start a tu bot para probarlo"
