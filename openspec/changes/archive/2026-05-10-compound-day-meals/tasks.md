## 1. Database - Create compound_day_meals table

- [x] 1.1 Create migration: supabase/migrations/20260507100000_compound_day_meals.sql
- [x] 1.2 Run migration: supabase db push

## 2. Backend - API for compound days

- [x] 2.1 Add CRUD endpoints for compound_day_meals in existing API or new edge function
- [x] 2.2 Add endpoint to list available compound days for a user
- [x] 2.3 Add endpoint to get dishes that are part of compound days

## 3. Integration - Generate Monthly Menu

- [x] 3.1 Modify generate-monthly-menu to include compound days in rotation pool
- [x] 3.2 Update algorithm to select compound days as atomic unit
- [x] 3.3 Ensure compound days add both dishes to generated menu

## 4. Frontend - UI for Compound Days

- [x] 4.1 Add "Compound Days" section in menu/[id].vue page
- [x] 4.2 Add form to create compound day (select 2 dishes)
- [x] 4.3 Display list of existing compound days with edit/delete
- [x] 4.4 Show compound days as option when assigning day type in weekly menu

## 5. Integration - Telegram Bot

- [x] 5.1 Update /semanal to handle compound day selection
- [x] 5.2 Show compound days as grouped options in bot UI

## 6. Testing

- [x] 6.1 Test creating compound day with 2 dishes
- [x] 6.2 Test rotating menu includes compound days
- [x] 6.3 Test same first dish appears in multiple compound days
- [x] 6.4 Test generated menu has correct number of dishes

## 7. Deployment & Automation

- [x] 7.1 Deploy any new edge functions (telegram-webhook deployed ✓)
- [x] 7.2 Run migration: supabase db push (done ✓)
- [x] 7.3 Create branch: git checkout -b feature/compound-day-meals (done ✓)
- [x] 7.4 Commit and push menu-web changes (done: 7bc9b5d)
- [x] 7.5 Create PR against main (PR #4: https://github.com/minguela/food-menu-creator/pull/4)
- [x] 7.6 Merge PR after verification (merged ✓)

## 8. OCR Auto-Detection (NEW)

- [x] 8.1 Add compound_day_id column to weekly_meals (migration ✓)
- [x] 8.2 Modify ocr-processor to detect compound days from OCR (deployed ✓)
- [x] 8.3 Deploy supabase changes (deployed via supabase CLI ✓)