# Spec: ci-fix-workflow

## Overview

GitHub Actions workflow that runs lint and build, captures errors, invokes opencode to fix them, and creates a PR with the fixes.

## Trigger

- **Primary**: `repository_dispatch` event with type `deploy-fix` (from deploy-monitor)
- **Manual**: `workflow_dispatch` with inputs for error logs and target branch

### Dispatch Payload

When triggered from deploy-monitor, the client payload contains:

```json
{
  "deployment_id": "dpl_xxx",
  "url": "https://menu-planning.vercel.app",
  "target": "production",
  "context": "production",
  "error_summary": "TypeScript error in pages/index.vue line 42"
}
```

## Inputs (workflow_dispatch)

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `error_logs` | string | `""` | Paste error output from Vercel/CLI |
| `branch` | string | `main` | Target branch to fix |

## Environment

- `GITHUB_TOKEN` — automatically provided
- `OPENCODE_API_KEY` — from repository secrets
- `TELEGRAM_BOT_TOKEN` — from repository secrets
- `TELEGRAM_CHAT_ID` — from repository secrets

## Steps

### 1. Checkout

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Setup Node

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

### 3. Install dependencies

```yaml
- run: npm ci
  working-directory: ./menu-web
```

### 4. Run lint

```yaml
- id: lint
  run: npm run lint
  working-directory: ./menu-web
  continue-on-error: true
```

### 5. Run build

```yaml
- id: build
  run: npm run build
  working-directory: ./menu-web
  continue-on-error: true
```

### 6. Check results

```yaml
- name: Check results
  run: |
    LINT_EXIT=${{ steps.lint.outcome }}
    BUILD_EXIT=${{ steps.build.outcome }}
    
    if [ "$LINT_EXIT" == "success" ] && [ "$BUILD_EXIT" == "success" ]; then
      echo "STATUS=success" >> $GITHUB_ENV
      echo "summary=All checks passed. No fixes needed." >> $GITHUB_ENV
    else
      echo "STATUS=failed" >> $GITHUB_ENV
      echo "summary=Lint: $LINT_EXIT, Build: $BUILD_EXIT" >> $GITHUB_ENV
    fi
```

### 7. If failed: Create fix branch

```yaml
if: env.STATUS == 'failed'
run: |
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  BRANCH_NAME="fix/deploy-${TIMESTAMP}"
  echo "BRANCH_NAME=$BRANCH_NAME" >> $GITHUB_ENV
  git checkout -b $BRANCH_NAME
```

### 8. If failed: Invoke opencode

```yaml
if: env.STATUS == 'failed'
env:
  OPENCODE_API_KEY: ${{ secrets.OPENCODE_API_KEY }}
  WORKING_DIRECTORY: ./menu-web
run: |
  npx -y opencode@latest fix-errors "${{ inputs.error_logs || github.event.client_payload.error_summary || 'See build logs' }}" \
    --skill nuxt-best-practices \
    --output commit \
    --working-dir ./menu-web
```

The `fix-errors` command:
- Parses the error logs
- Identifies affected files
- Applies fixes following `nuxt-best-practices` skill rules
- Commits changes directly

### 9. If failed: Commit and push

```yaml
if: env.STATUS == 'failed'
run: |
  git config user.name "opencode[bot]"
  git config user.email "opencode@users.noreply.github.com"
  git add -A
  git diff --staged --quiet || git commit -m "fix: auto-fix deploy failures"
  git push -u origin ${{ env.BRANCH_NAME }}
```

### 10. If failed: Create PR

```yaml
if: env.STATUS == 'failed'
uses: actions/github-script@v7
with:
  script: |
    const result = await github.rest.pulls.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: 'fix: auto-fix deploy failures',
      head: process.env.BRANCH_NAME,
      base: 'main',
      body: `## Auto-generated Fix\n\nAutomated fix for deployment failure.\n\n**Errors**: ${process.env.summary}\n\n**Deployment**: ${github.event.client_payload?.url || 'manual trigger'}\n\nPlease review before merging.`
    });
    console.log(`PR created: ${result.data.html_url}`);
    core.exportVariable('PR_URL', result.data.html_url);
    core.exportVariable('PR_NUMBER', result.data.number);
```

### 11. If failed: Notify via Telegram

```yaml
if: env.STATUS == 'failed'
env:
  TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
  TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
run: |
  ERROR_SUMMARY=$(echo '${{ env.summary }}' | head -c 500)
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=✅ *Fix PR created!*%0A%0APreview: ${{ env.PR_URL }}%0A%0AErrors: ${ERROR_SUMMARY}" \
    -d "parse_mode=Markdown"
```

### 12. If cannot fix: Send warning

```yaml
if: env.STATUS == 'failed'
run: |
  echo "::warning::Deploy failed, fix workflow completed. PR: ${{ env.PR_URL }}"
```

## Output Variables

| Variable | Description |
|----------|-------------|
| `STATUS` | `success` or `failed` |
| `BRANCH_NAME` | Fix branch name (if failed) |
| `PR_URL` | PR URL (if created) |
| `PR_NUMBER` | PR number (if created) |
| `summary` | Error summary string |

## Secrets Required

| Secret | Required | Description |
|--------|----------|-------------|
| `OPENCODE_API_KEY` | Yes | opencode API authentication |
| `TELEGRAM_BOT_TOKEN` | Yes | Existing bot token |
| `TELEGRAM_CHAT_ID` | Yes | User's Telegram chat ID |

## Timeout

- Max 30 minutes for entire workflow
- Individual steps have reasonable timeouts via GitHub Actions defaults