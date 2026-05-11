# Design: Auto-Fix Deploy Failures

## Architecture

```
Push to main
  → Vercel deploy (automatic)
  → If deploy fails:
      Vercel sends webhook POST to deploy-monitor
  → deploy-monitor validates signature + dispatches GitHub Actions
  → GitHub Actions runs: npm run lint && npm run build
  → If either fails:
      Creates branch fix/deploy-{timestamp}
      Invokes opencode with error logs
      opencode uses nuxt-best-practices skill to fix errors
      Creates PR
      Notifies user via Telegram
```

## Components

### 1. deploy-monitor (Supabase Edge Function)

**Purpose**: Receive and validate Vercel webhooks, trigger the fix workflow.

**Endpoint**: `POST /functions/v1/deploy-monitor`

**Behavior**:
1. Parse `deployment.failed` event from Vercel
2. Validate `VERCEL_WEBHOOK_SECRET` signature
3. Extract: `url`, `ready`, `target`, `context`, `deploymentId`
4. Dispatch GitHub Actions workflow with `repository_dispatch` event type `deploy-fix`
5. Send Telegram notification: "Deploy failed: {url}. Fix workflow triggered."
6. Return 200 immediately (async processing)

**Secrets required**:
- `VERCEL_WEBHOOK_SECRET` — for signature validation
- `GITHUB_TOKEN` — to dispatch workflow
- `GITHUB_REPO` — in format `owner/repo`
- `TELEGRAM_BOT_TOKEN` — existing from telegram-webhook
- `TELEGRAM_CHAT_ID` — user's chat ID

**Errors**:
- Invalid signature → 401
- Invalid event type → 200 (ignore silently)
- GitHub API failure → 500, log to console

### 2. fix-deploy.yml (GitHub Actions)

**Trigger**: `repository_dispatch` event with type `deploy-fix`, OR manual `workflow_dispatch`

**Inputs** (for manual trigger):
- `error_logs` — paste the build/lint error output
- `branch` — target branch (default: `main`)

**Behavior**:
1. Checkout repo
2. Install dependencies (`npm ci`)
3. Run `npm run lint` → capture output
4. Run `npm run build` → capture output
5. If both pass → exit success
6. If any fails:
   a. Create branch `fix/deploy-{YYYYMMDD-HHMMSS}`
   b. Run `opencode fix-errors "{error_logs}" --skill nuxt-best-practices`
   c. Commit all changes
   d. Push branch
   e. Create PR with title "fix: auto-fix deploy failures" and description containing error summary
   f. Send Telegram notification with PR URL
7. Always output exit code 0 (to not block anything — the PR is the artifact)

**Secrets required**:
- `OPENCODE_API_KEY` — opencode API authentication
- `GITHUB_TOKEN` — default token available in GitHub Actions
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

**opencode invocation**:
```
opencode fix-errors "..." --skill nuxt-best-practices --output commit
```

The opencode command will:
- Analyze error logs
- Read affected files
- Apply fixes following nuxt-best-practices skill rules
- Output changes that the workflow commits

### 3. nuxt-best-practices skill

**Location**: `.agents/skills/nuxt-best-practices/SKILL.md`

**Purpose**: Guide code fixes for Nuxt 3 / Vue 3 projects.

**Rules**:
- TypeScript strict mode compliance
- Vue 3 Composition API patterns (script setup preferred)
- Nuxt auto-imports awareness
- SSR-safe code (no browser-only APIs without `process.client`)
- Proper error handling in composables
- TailwindCSS utility classes over inline styles
- Nitro server route patterns

### 4. Telegram Notifications

**Message on deploy failure** (from deploy-monitor):
```
🔴 Deploy failed on main
URL: {deployment_url}
Branch: {target}
Fix workflow triggered, standby...
```

**Message on PR created** (from GitHub Actions):
```
✅ Fix ready!
PR: {pr_url}
Review and merge when ready.
```

**Message on cannot fix** (from GitHub Actions):
```
⚠️ Deploy failed, couldn't auto-fix.
Errors: {summary}
Check logs: {workflow_url}
```

## Security

- Vercel webhook signature validated with HMAC-SHA256
- GitHub token has minimum required scopes
- Secrets stored in Supabase/Vercel environment variables
- Telegram bot token already in use (no new exposure)

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VERCEL_WEBHOOK_SECRET` | Vercel + Supabase secrets | Webhook signature secret |
| `GITHUB_TOKEN` | Supabase secrets | PAT with repo scope |
| `GITHUB_REPO` | Supabase secrets | `owner/repo` format |
| `TELEGRAM_CHAT_ID` | Supabase secrets | User's Telegram chat ID |
| `OPENCODE_API_KEY` | GitHub Actions secret | opencode API key |

## Vercel Webhook Setup (Manual)

1. Go to Vercel Dashboard → Project → Settings → Webhooks
2. Add webhook:
   - **Events**: `deployment.failed`
   - **URL**: `https://{project}.supabase.co/functions/v1/deploy-monitor`
   - **Secret**: Copy to `VERCEL_WEBHOOK_SECRET`
3. Deploy to all environments (Production + Preview + Development)