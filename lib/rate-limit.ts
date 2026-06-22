/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window counter per IP address.
 * In production, use Redis-backed rate limiting (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number // milliseconds
}

export const RATE_LIMITS = {
  public: { maxRequests: 60, windowMs: 60_000 }, // 60 req/min
  auth: { maxRequests: 10, windowMs: 60_000 }, // 10 attempts/min (login/register)
  webhook: { maxRequests: 100, windowMs: 60_000 }, // 100 req/min
  search: { maxRequests: 30, windowMs: 60_000 }, // 30 searches/min
} as const

/**
 * Check if a request is rate limited.
 * Returns { limited: false } if allowed, or { limited: true, retryAfter } if blocked.
 */
export function checkRateLimit(
  identifier: string, // IP or userId
  config: RateLimitConfig = RATE_LIMITS.public,
): { limited: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now()
  const key = identifier

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { limited: false, remaining: config.maxRequests - 1 }
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { limited: true, remaining: 0, retryAfter }
  }

  entry.count++
  return { limited: false, remaining: config.maxRequests - entry.count }
}

/**
 * Get client IP from request headers (works with proxies/Vercel).
 */
export function getClientIP(request: Request): string {
  return (
    (request.headers as any).get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
    (request.headers as any).get?.('x-real-ip') ||
    'unknown'
  )
}
