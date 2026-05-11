## Context

Currently OCR extracts dishes like "ensalada", "tortilla", "paella" as single ingredients. The shopping list generation misses implicit ingredients, leading to incomplete shopping lists.

## Goals / Non-Goals

**Goals:**
- Automatically expand dish names to their base ingredients
- Provide UI to manage expansion rules
- Store original dish + expanded ingredients
- Apply expansions during OCR processing

**Non-Goals:**
- ML/AI-based ingredient prediction (manual rules only)
- User-specific expansions (global rules for now)
- Complex recipe lookups from external APIs

## Decisions

1. **JSON-based expansion rules** - Store rules in database as JSON
   - Reason: Flexible, easy to edit, supports multiple ingredients per dish
   - Alternative: Hard-coded was rejected - too rigid

2. **Apply expansion at OCR time** - Expand when dish is created
   - Reason: Keep original for reference, expansion is derivative
   - Alternative: Apply at shopping list time was rejected - lose original context

3. **Ingredients table for base ingredients** - Use existing ingredients table
   - Reason: Reuse existing infrastructure, proper normalization
   - Alternative: Free text was rejected - loses data quality

## Risks / Trade-offs

- [Risk] Dish names vary → Mitigation: Support multiple aliases per dish ("tortilla", "tortilla española", "tortilla de patatas")
- [Risk] Missing expansion rule → Mitigation: Keep original dish name, mark as "unexpanded"
- [Risk] Performance with many rules → Mitigation: Cache rules in edge function, only fetch on startup

## Migration Plan

1. Create ingredient_mappings table (migration)
2. Deploy expand-ingredients edge function
3. Update ocr-processor to call expansion after dish creation
4. Add rules via frontend UI or seed data