## 1. Database - Create ingredient_mappings table

- [x] 1.1 Create migration: supabase/migrations/20260509000000_ingredient_mappings.sql
- [x] 1.2 Run migration: supabase db push
- [x] 1.3 Seed initial rules (ensalada → canónigos, tomate; tortilla → huevos, patatas; paella → arroz, pollo, mariscos)

## 2. Backend - Edge Function

- [x] 2.1 Create expand-ingredients edge function in supabase/functions/
- [x] 2.2 Implement dish-to-ingredients lookup logic
- [x] 2.3 Support multiple aliases per dish
- [x] 2.4 Return original dish + expanded ingredients

## 3. Integration - OCR Processor

- [x] 3.1 Modify ocr-processor to call expand-ingredients after dish creation
- [x] 3.2 Store expanded ingredients in dish_ingredients table
- [x] 3.3 Keep original dish name for reference

## 4. Frontend - Rules Management UI

- [x] 4.1 Add "Expansiones" section to ingredients.vue page
- [x] 4.2 List existing expansion rules
- [x] 4.3 Add form to create new rule (dish name, aliases, ingredients)
- [x] 4.4 Add edit/delete actions for rules

## 5. Testing

- [x] 5.1 Test expansion for "ensalada"
- [x] 5.2 Test expansion for "tortilla española"
- [x] 5.3 Test unexpanded dish fallback
- [x] 5.4 Test new rule creation via UI
- [x] 5.5 Test shopping list includes expanded ingredients

## 6. Deployment & Automation

- [x] 6.1 Deploy expand-ingredients edge function: supabase functions deploy expand-ingredients
- [x] 6.2 Run migration: supabase db push
- [x] 6.3 Create branch: git checkout -b feature/smart-ingredient-expansion
- [x] 6.4 Commit and push menu-web changes (0cd1293)
- [x] 6.5 Create PR against main (PR #5)
- [x] 6.6 Merge PR after verification