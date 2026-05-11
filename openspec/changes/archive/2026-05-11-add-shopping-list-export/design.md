## Context

Users can view their shopping list in the app and via Telegram, but cannot export it for sharing or printing.

## Goals / Non-Goals

**Goals:**
- Add export functionality for shopping lists
- Support text and CSV formats
- Integrate with Telegram bot with `/shopping export` command
- Add export button in web UI

**Non-Goals:**
- PDF export (future enhancement)
- Email integration
- Integration with third-party shopping apps

## Decisions

1. **Edge Function for export** - Create `export-shopping-list` edge function instead of client-side generation
   - Reason: Reuse existing shopping list query logic, consistent with other API endpoints
   - Alternative: Client-side generation was rejected due to code duplication

2. **CSV format includes headers** - CSV output includes ingredient name, quantity, unit
   - Reason: Better interoperability with spreadsheet apps

3. **Telegram uses inline keyboard** - Export options as inline keyboard buttons
   - Reason: Better UX than typing format names

## Risks / Trade-offs

- [Risk] Large shopping lists → Mitigation: Limit to 100 items per export
- [Risk] Concurrent exports → Mitigation: Stateless edge function, no DB locks needed