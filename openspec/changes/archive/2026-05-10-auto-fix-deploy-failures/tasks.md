# Tasks: Auto-Fix Deploy Failures

## 1. Supabase Edge Function (deploy-monitor)

- [ ] 1.1 Create `supabase/functions/deploy-monitor/index.ts` with Vercel webhook handler
- [ ] 1.2 Add HMAC-SHA256 signature validation
- [ ] 1.3 Implement GitHub Actions `repository_dispatch` trigger
- [ ] 1.4 Add Telegram notification on deploy failure
- [ ] 1.5 Deploy edge function to Supabase

## 2. GitHub Actions Workflow

- [ ] 2.1 Create `.github/workflows/fix-deploy.yml`
- [ ] 2.2 Configure `repository_dispatch` and `workflow_dispatch` triggers
- [ ] 2.3 Implement lint + build steps with error capture
- [ ] 2.4 Add opencode invocation step
- [ ] 2.5 Add branch creation and PR workflow
- [ ] 2.6 Add Telegram notification on PR created

## 3. Skill Creation

- [ ] 3.1 Create `.agents/skills/nuxt-best-practices/SKILL.md`
- [ ] 3.2 Define TypeScript rules (strict mode, no any, etc.)
- [ ] 3.3 Define Vue 3 Composition API patterns
- [ ] 3.4 Define Nuxt-specific rules (auto-imports, SSR safety)
- [ ] 3.5 Define TailwindCSS conventions
- [ ] 3.6 Define error handling patterns

## 4. Configuration & Secrets

- [ ] 4.1 Generate Vercel webhook secret
- [ ] 4.2 Generate GitHub PAT with repo scope
- [ ] 4.3 Configure Vercel webhook pointing to deploy-monitor
- [ ] 4.4 Add GitHub Actions secrets: OPENCODE_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- [ ] 4.5 Add Supabase secrets: VERCEL_WEBHOOK_SECRET, GITHUB_TOKEN, GITHUB_REPO, TELEGRAM_CHAT_ID

## 5. Testing

- [ ] 5.1 Manually trigger workflow_dispatch with sample errors
- [ ] 5.2 Verify Telegram notifications are received
- [ ] 5.3 Verify PR is created with fixes
- [ ] 5.4 Clean up test branch and PR