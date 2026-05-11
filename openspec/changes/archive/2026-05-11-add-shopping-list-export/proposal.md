## Why

Currently, users can view their shopping list in the app and via Telegram, but there's no way to export it in a structured format. This limits usability for users who want to share lists, print them, or use them in other apps.

## What Changes

- Add export functionality to generate shopping list as text/CSV
- New `/shopping export` command in Telegram bot
- Export button in web UI for current shopping list
- Include ingredient quantities and categories in export

## Capabilities

### New Capabilities
- `shopping-list-export`: Export shopping list in multiple formats (text, CSV)

### Modified Capabilities
- None

## Impact

- **Frontend**: New export button in shopping list view (menu-web)
- **Backend**: New edge function for export generation (supabase/functions/)
- **Telegram**: New `/shopping export` command