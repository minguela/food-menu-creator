import { defineEventHandler, setResponseHeader } from "h3";

/**
 * Security headers middleware.
 * Applied to all responses. CSP allows self + Supabase + OpenAI + Google Fonts.
 */
export default defineEventHandler((event) => {
  setResponseHeader(
    event,
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://tceusgxbfpekjcthrrqu.supabase.co; connect-src 'self' https://tceusgxbfpekjcthrrqu.supabase.co wss://tceusgxbfpekjcthrrqu.supabase.co https://api.openai.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );
  setResponseHeader(event, "X-Frame-Options", "DENY");
  setResponseHeader(event, "X-Content-Type-Options", "nosniff");
  setResponseHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");
  setResponseHeader(event, "Permissions-Policy", "camera=(), microphone=(), geolocation=()");
});
