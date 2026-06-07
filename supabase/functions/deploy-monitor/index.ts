import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
const GITHUB_REPO = Deno.env.get("GITHUB_REPO");
const VERIFY_TOKEN = Deno.env.get("VERCEL_WEBHOOK_SECRET");
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function sendTelegramMessage(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram not configured, skipping notification");
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
  });
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!VERIFY_TOKEN) {
    console.warn("VERCEL_WEBHOOK_SECRET not configured, rejecting webhook");
    return false;
  }
  if (!signature.startsWith("sha256=")) {
    return false;
  }
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(VERIFY_TOKEN),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return signature === `sha256=${expectedSignature}`;
}

async function dispatchGitHubWorkflow(payload: {
  deploymentId: string;
  url: string;
  target: string | null;
  context: string;
  errorSummary: string;
}) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error("GitHub credentials not configured");
  }
  const [owner, repo] = GITHUB_REPO.split("/");
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: "deploy-fix",
        client_payload: {
          deployment_id: payload.deploymentId,
          url: payload.url,
          target: payload.target,
          context: payload.context,
          error_summary: payload.errorSummary,
        },
      }),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }
}

serve(async (req: Request) => {
  try {
    const signature = req.headers.get("vercel-signature") ?? "";
    const body = await req.text();

    const isValid = await verifySignature(body, signature);
    if (!isValid) {
      console.warn("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = req.headers.get("vercel-event") ?? "";

    if (event !== "deployment.failed") {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(body);

    const deploymentId = data.id ?? "unknown";
    const deploymentUrl = data.url ?? "unknown";
    const target = data.target ?? null;
    const context = data.context ?? "unknown";
    const readyState = data.readyState ?? "ERROR";

    await sendTelegramMessage(
      `🔴 *Deploy failed on ${context}*\n` +
      `URL: ${deploymentUrl}\n` +
      `Status: ${readyState}\n` +
      `Target: ${target ?? "preview"}\n` +
      `Fix workflow triggered, standby...`
    );

    await dispatchGitHubWorkflow({
      deploymentId,
      url: deploymentUrl,
      target,
      context,
      errorSummary: `Vercel deployment failed (${readyState})`,
    });

    return new Response(JSON.stringify({ ok: true, dispatched: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    await sendTelegramMessage(`⚠️ Webhook error: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
