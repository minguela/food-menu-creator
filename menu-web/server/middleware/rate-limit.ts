import { defineEventHandler, createError, getRequestURL } from "h3";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 60_000;
const OCR_MAX = 10; // req/min
const API_MAX = 60; // req/min
const WINDOW_MS = 60_000;

function getClientIP(event: any): string {
  const forwarded = event.node.req.headers["x-forwarded-for"];
  if (forwarded) {
    const parts = String(forwarded).split(",");
    return parts.length > 0 ? parts[0].trim() : "";
  }
  const realIP = event.node.req.headers["x-real-ip"];
  if (realIP) return String(realIP);
  // Fallback to socket remoteAddress
  return event.node.req.socket?.remoteAddress || "unknown";
}

function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return true;
  }
  store.set(key, entry);
  return false;
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

export default defineEventHandler((event) => {
  const url = getRequestURL(event);

  // Only apply to API routes
  if (!url.pathname.startsWith("/api/")) {
    return;
  }

  const ip = getClientIP(event);

  // OCR endpoint: stricter limit
  if (url.pathname === "/api/ocr") {
    const key = `ocr:${ip}`;
    if (isRateLimited(key, OCR_MAX, WINDOW_MS)) {
      throw createError({
        statusCode: 429,
        statusMessage: "Too Many Requests",
      });
    }
    return;
  }

  // General API limit
  const key = `api:${ip}`;
  if (isRateLimited(key, API_MAX, WINDOW_MS)) {
    throw createError({
      statusCode: 429,
      statusMessage: "Too Many Requests",
    });
  }
});
