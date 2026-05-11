---
name: telegram-menu-bot
description: Bot de Telegram para gestionar menús semanales rotativos
type: reference
---

# Agente: telegram-menu-bot

## Responsabilidades

1. **Gestión de menús semanales:** Almacenar menús completos (7 días × comida/cena)
2. **Generación rotativa:** Crear menús de N días usando los menús guardados en secuencia
3. **Recepción de imágenes:** Fotos de platos con caption estructurada
4. **Notificaciones:** Menú generado, lista de la compra, recordatorios

## Comandos del Bot

| Comando | Descripción |
|---------|-------------|
| `/start` | Iniciar bot, guardar telegram_id y chat_id |
| `/semanal` | Gestionar menús semanales (nuevo, lista, info) |
| `/generar [días]` | Generar menú rotativo para N días (ej: `/generar 30`) |
| `/status` | Ver estado de procesamiento de imágenes |
| `/monthly` | Solicitar generación de menú del mes |
| `/shopping` | Ver lista de la compra actual |
| `/help` | Ayuda y lista de comandos |

## Flujo: Crear Menú Semanal

```
1. Usuario: /semanal nuevo Semana1
   ↓
2. Bot: "✅ Menú creado. Envía fotos de los platos"
   ↓
3. Usuario: Envía foto + caption "día 1 comida"
   ↓
4. Bot: "✅ Plato guardado. Progreso: 1/14"
   ↓
5. Repetir hasta 14 platos (7 días × comida/cena)
   ↓
6. Bot: "🎉 ¡Menú semanal completo!"
```

## Flujo: Generar Menú Rotativo

```
Usuario: /generar 30
   ↓
Bot: Coge menú 1 → días 1-7
     Coge menú 2 → días 8-14
     Coge menú 3 → días 15-21
     Coge menú 1 → días 22-28
     Coge menú 2 → días 29-30
   ↓
Bot: Envía menú completo en mensajes de 4000 chars
```

## Endpoint Webhook (Supabase Edge Function)

```ts
// POST /telegram/webhook
// Recibe updates de Telegram Bot API
{
  update_id: number,
  message: {
    chat: { id: number },
    from: { id: number, username: string },
    photo: [{ file_id: string }],
    caption: string
  }
}
```

## Configuración Necesaria

1. **Webhook URL:** `https://<project>.supabase.co/functions/v1/telegram-webhook`
2. **Token:** Guardado en Supabase Secrets (`TELEGRAM_BOT_TOKEN`)
3. **Polling:** No necesario, usa webhook

## Integración con DB

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Datos del usuario (telegram_id, chat_id) |
| `weekly_menus` | Menús semanales base (1 por usuario × semana) |
| `weekly_meals` | Platos de cada menú semanal (14 filas por menú) |
| `menu_images` | Imágenes legacy (flujo diario 1-21) |
| `meal_plans` | Menús generados para fechas concretas |
| `shopping_lists` | Lista de compra por semana |

### Flujo de datos

```
1. /semanal nuevo → weekly_menus (1 fila)
2. Foto + "día X comida" → weekly_meals (1 fila)
3. /generar 30 → Lee weekly_menus en orden rotativo
4. Resultado → Mensajes de Telegram con el menú
```
