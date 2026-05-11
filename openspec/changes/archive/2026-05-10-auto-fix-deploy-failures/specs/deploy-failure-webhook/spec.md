# Spec: deploy-failure-webhook

## Overview

Supabase Edge Function that receives Vercel `deployment.failed` webhooks, validates them, and dispatches the GitHub Actions fix workflow.

## Endpoint

```
POST /functions/v1/deploy-monitor
```

## Request

### Vercel Webhook Payload (deployment.failed)

```typescript
interface VercelDeploymentFailed {
  id: string;           // Deployment ID
  url: string;          // Deployment URL (preview or production)
  name: string;         // Project name
  target: string | null; // "production" or null (preview)
  context: string;      // "production" or "preview"
  readyState: string;   // "ERROR", "BUILDING", "READY"
  creator: {
    uid: string;        // User ID
    username: string;  // Username
    email: string;
  };
  plan: string;         // "hobby", "pro", etc.
  regions?: string[];
  targetChangedAt?: number; // Unix timestamp
}
```

### Headers

| Header | Description |
|--------|-------------|
| `vercel-signature` | HMAC-SHA256 signature for verification |
| `content-type` | `application/json` |

## Validation

1. Verify `VERCEL_WEBHOOK_SECRET` exists in environment
2. Compute HMAC-SHA256 of raw request body with secret
3. Compare against `vercel-signature` header (format: `sha256={hash}`)
4. Reject with 401 if signature mismatch

## Behavior

```
1. Parse JSON body
2. Validate Vercel signature
3. Extract deployment info (id, url, target, context)
4. Send Telegram notification: "Deploy failed: {url}"
5. Dispatch GitHub Actions workflow:
   - Event: repository_dispatch
   - Event type: deploy-fix
   - Client payload: { deployment_id, url, target, context, error_summary }
6. Return 200
```

## Response

| Status | Body |
|--------|------|
| 200 | `{ "ok": true, "dispatched": true }` |
| 401 | `{ "error": "Invalid signature" }` |
| 400 | `{ "error": "Invalid payload" }` |
| 500 | `{ "error": "Failed to dispatch workflow" }` |

## Error Handling

- If GitHub API dispatch fails → log error + return 500
- Telegram send failure → log error but don't fail (non-critical)
- Return 200 for ignored events (e.g., `deployment.succeeded`)

## Secrets

| Secret | Source |
|--------|--------|
| `VERCEL_WEBHOOK_SECRET` | Vercel webhook settings |
| `GITHUB_TOKEN` | GitHub PAT with `repo` scope |
| `GITHUB_REPO` | `owner/repo` format |
| `TELEGRAM_BOT_TOKEN` | Existing (from telegram-webhook) |
| `TELEGRAM_CHAT_ID` | User's Telegram chat ID |
| `SUPABASE_URL` | Auto-injected |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected |

## Dependencies

- `https://esm.sh/@supabase/supabase-js@2` — Supabase client
- Native `crypto.subtle` — HMAC-SHA256 for signature validation
- Native `fetch` — GitHub API + Telegram API