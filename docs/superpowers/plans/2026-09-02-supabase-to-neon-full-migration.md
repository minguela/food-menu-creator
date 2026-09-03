# Supabase to Neon Full Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate the curated Menu Planner data and image assets from Supabase project `tceusgxbfpekjcthrrqu` into Neon project `food-menu-creator`, preserving UUIDs, relationships, and application behavior.

**Architecture:** Read source rows through Supabase's privileged SQL/API access into a private export, reconcile the Supabase schema with the current Neon schema, and import rows in foreign-key dependency order inside a Neon transaction. Copy the 58 public PNG assets to the selected Vercel Blob store and rewrite database URLs only after binary verification; keep the Supabase source untouched until all read-backs pass.

**Tech Stack:** Supabase SQL/MCP read access, Node.js `pg`, Neon pooled PostgreSQL, Vercel CLI/Blob, Nuxt 4, Node test runner.

**Spec:** User-approved full content migration request in this conversation; source inventory captured on 2026-09-02.

## Global Constraints

- Never print or commit Supabase, Neon, Vercel, or Telegram secrets.
- Preserve source UUIDs wherever the target schema supports the same entity.
- Do not delete or mutate Supabase source rows or objects.
- Run target preflight and backup before destructive target cleanup.
- Verify row counts, foreign-key integrity, image byte counts, and production behavior before completion.
- Keep migrations and importer idempotent so a failed run can be resumed safely.

### Task 1: Freeze source and target inventories

**Files:**
- Create: `menu-web/scripts/migrate-supabase-to-neon.mjs`
- Create: `menu-web/scripts/migration-inventory.mjs`
- Test: `menu-web/tests/migration-contract.test.mjs`

- [ ] Capture source counts for users, profiles, menus, meals, dishes, ingredients, recipes, rotating menus, shopping lists, fixed meals, mappings, candidates, and Storage objects.
- [ ] Capture target counts and schema columns without displaying row payloads or secrets.
- [ ] Make the importer fail closed if the source inventory changes between export and import.

### Task 2: Reconcile the target schema

**Files:**
- Create: `menu-web/scripts/migrate-supabase-schema.sql`
- Modify: `menu-web/scripts/migrate-to-neon.sql`

- [ ] Add the missing Supabase-era entities required by the curated data: monthly menus, saved fixed meals, fixed meal profile portions/ingredients, nutrition candidates, dish ingredient suggestions, and rotating meal ingredient compatibility.
- [ ] Add missing columns to shared entities while retaining current Neon defaults and constraints.
- [ ] Use `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` only; do not drop or rename existing target data.
- [ ] Verify every source foreign-key target exists before importing rows.

### Task 3: Import relational data with preserved identity

**Files:**
- Modify: `menu-web/scripts/migrate-supabase-to-neon.mjs`
- Test: `menu-web/tests/migration-contract.test.mjs`

- [ ] Import users and person profiles first, then ingredients and aliases, dishes and recipe ingredients, weekly menus and children, rotating menus and children, fixed/monthly menus, shopping lists, mappings, candidates, and operational history.
- [ ] Upsert by source UUID and resolve the 24 existing Neon seed ingredients by normalized name before inserting dependent rows.
- [ ] Preserve source timestamps, JSONB/array values, nullable fields, and source IDs; map only columns with an explicit compatibility rule.
- [ ] Commit once at the end of a transaction and write an import manifest with source counts, target counts, and checksums outside the database.

### Task 4: Move image assets and rewrite references

**Files:**
- Create: `menu-web/scripts/migrate-supabase-storage-to-blob.mjs`
- Modify: `menu-web/server/utils/storage.ts`
- Modify: `menu-web/server/middleware/security.ts`

- [ ] Provision or select a public Vercel Blob store only after confirming its project/environment connection and any account cost prompt.
- [ ] Download each source object from the public `menu-images` bucket, verify PNG content and byte count, upload under a stable path based on the source object ID/path, and record the new URL.
- [ ] Rewrite only verified `weekly_day_images.image_url` and `weekly_meals.image_url` references; retain a source-to-target manifest.
- [ ] Add the Blob host to CSP and use the same public delivery semantics as the existing bucket.

### Task 5: Application compatibility and release verification

**Files:**
- Modify: `menu-web/layers/00.core/app/repositories.ts`
- Modify: `menu-web/layers/00.core/app/domain/models.ts`
- Create/Modify: focused production verification tests

- [ ] Make menu, recipe, shopping, and ingredient repositories query the migrated canonical tables and expose the same user-visible shape as before.
- [ ] Verify menu list/detail, recipe list, rotating menu detail, shopping list, and image rendering against production.
- [ ] Run `npm test`, build, production endpoint checks, and a browser smoke test.
- [ ] Deploy from `main`, verify `HEAD == origin/main`, and report any intentionally retained compatibility layer.
