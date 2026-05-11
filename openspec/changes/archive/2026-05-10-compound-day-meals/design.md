## Context

Currently weekly menus store meals per day with meal_type (comida/cena) and position (1/2 for first/second dish). When generating rotating menus, individual dishes can be mixed arbitrarily across days.

Users want to preserve "compound days" where 2 dishes always go together (e.g., first dish "ensalada granada" used with different second dishes on different days).

## Goals / Non-Goals

**Goals:**
- Store compound days (2 linked dishes) separately from regular single-dish days
- Allow individual dishes to be reused across multiple compound days
- When generating rotating menus, keep compound days intact
- Simple UI to create/manage compound days
- **Auto-detect compound days from OCR when uploading images**

**Non-Goals:**
- Complex ordering/ranking within compound days
- Cross-user sharing of compound days

## Decisions

1. **New table compound_day_meals** - Store pairs of dishes that must stay together
   - Reason: Clear separation from regular weekly_meals, explicit relationship
   - Alternative: Add nullable FK to weekly_meals was rejected - less clear semantics

2. **Compound day as unit in rotation** - When rotating, compound days are selected as atomic unit
   - Reason: Ensures integrity - both dishes always go together
   - Alternative: Select individual dishes was rejected - breaks compound semantics

3. **Two paths for day assignment** - User selects either compound_day OR individual dish(s)
   - Reason: Backwards compatible, clear UX
   - Alternative: Force compound days was rejected - too restrictive

## Risks / Trade-offs

- [Risk] Existing weekly_meals with 2 dishes → Migration: Mark them as "legacy compound" or let user manually migrate
- [Risk] Changing dish in compound day → Mitigation: Update all compound_day_meals references, or create new compound day
- [Risk] Rotation algorithm complexity → Mitigation: Simple approach - shuffle compound days list, take first N days needed

## Migration Plan

1. Create compound_day_meals table
2. Update UI to allow creating compound days from existing dishes
3. Modify generate-monthly-menu to treat compound days as single unit
4. Backfill: User can optionally convert old 2-dish days to compound days
5. Add compound_day_id FK to weekly_meals for auto-detection
6. Deploy ocr-processor with compound day detection logic
7. When OCR extracts a dish with "+", auto-link to existing compound_day