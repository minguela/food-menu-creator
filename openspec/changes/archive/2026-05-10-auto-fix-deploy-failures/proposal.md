# Auto-Fix Deploy Failures

## Why

When Vercel deploys `main` branch automatically on push, build failures send emails with logs but require manual intervention to fix. This wastes time and creates friction. The goal is to automatically detect failures and create code fixes via PR, reducing manual work and faster recovery.

## What Changes

- **New Supabase Edge Function `deploy-monitor`**: Receives Vercel webhooks on `deployment.failed` events, validates signatures, and triggers the fix workflow.
- **New GitHub Actions workflow `fix-deploy.yml`**: Runs `npm run lint` and `npm run build`, captures errors, creates a fix branch, and invokes opencode with error logs.
- **New opencode skill `nuxt-best-practices`**: Best practices rules for Nuxt 3 / Vue 3 code review and auto-fix.
- **Vercel webhook configuration**: Set up webhook pointing to `deploy-monitor` edge function.

## Capabilities

### New Capabilities

- `deploy-failure-webhook`: Supabase Edge Function that receives and validates Vercel deployment failure events, then orchestrates the fix workflow.
- `ci-fix-workflow`: GitHub Actions workflow that runs lint + build, creates fix branches, and invokes the code-fixing agent.
- `nuxt-best-practices-skill`: Skill for code review and auto-fix of Nuxt 3 / Vue 3 code.
- `deploy-failure-notification`: Telegram message to user when deploy fails and when fix is ready.

### Modified Capabilities

- _(none)_

## Impact

- **New files**: `supabase/functions/deploy-monitor/index.ts`, `.github/workflows/fix-deploy.yml`, `.agents/skills/nuxt-best-practices/`
- **Modified files**: `vercel.json` (no changes needed - webhook configured via Vercel dashboard), environment variables added to Vercel project
- **New dependencies**: Vercel webhook secret, GitHub token with repo scope, Supabase secrets
- **New env vars**: `VERCEL_WEBHOOK_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPO` (full repo path), `TELEGRAM_CHAT_ID` (for notifications)

## Non-Goals

- This does not automatically merge the fix PR — human review is still required.
- Does not fix runtime errors (only lint/typecheck/build errors).
- Does not modify the Vercel project settings programmatically — webhook setup remains manual.