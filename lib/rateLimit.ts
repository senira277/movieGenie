// lib/rateLimit.ts

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

// Store limits in memory (Note: This resets on server restart/redeploy)
const ipCache = new Map<string, RateLimitRecord>();

// Config: 10 requests per 24 hours
const LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export function checkRateLimit(ip: string) {
  const now = Date.now();
  const record = ipCache.get(ip);

  // 1. If no record exists, create one
  if (!record) {
    ipCache.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true, remaining: LIMIT - 1 };
  }

  // 2. If the window has expired, reset the count
  if (now > record.resetTime) {
    ipCache.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true, remaining: LIMIT - 1 };
  }

  // 3. If within window, check count
  if (record.count >= LIMIT) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  // 4. Increment count
  record.count += 1;
  return { success: true, remaining: LIMIT - record.count };
}

// Helper to get IP from headers (works for Vercel/Next.js)
export function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1"; // Fallback for localhost
}