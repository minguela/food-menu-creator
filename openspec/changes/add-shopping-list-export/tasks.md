## 1. Backend - Edge Function

- [x] 1.1 Create export-shopping-list edge function in supabase/functions/
- [x] 1.2 Implement text format generation
- [x] 1.3 Implement CSV format generation with proper escaping
- [x] 1.4 Add user_id validation and auth check

## 2. Frontend - Web UI

- [x] 2.1 Add export button to shopping list page in menu-web/pages/
- [x] 2.2 Implement text export download (Blob URL)
- [x] 2.3 Implement CSV export download
- [x] 2.4 Add loading state during export

## 3. Telegram Bot

- [x] 3.1 Add /shopping export command handler in telegram-webhook
- [x] 3.2 Implement inline keyboard for format selection
- [x] 3.3 Handle text export in chat response
- [x] 3.4 Handle CSV export as file attachment

## 4. Testing

- [x] 4.1 Test text export with items
- [x] 4.2 Test CSV export with special characters
- [x] 4.3 Test empty list export
- [x] 4.4 Test Telegram export commands

## 5. Deployment & Automation

- [x] 5.1 Deploy export-shopping-list edge function: `supabase functions deploy export-shopping-list`
- [x] 5.2 Create branch for menu-web changes: `git checkout -b feature/shopping-list-export`
- [x] 5.3 Commit and push changes to menu-web
- [x] 5.4 Create PR against main
- [x] 5.5 Merge PR after verification
