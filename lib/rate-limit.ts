import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

let redisRateLimiter: Ratelimit | null = null
let rateLimiterInitAttempted = false
let missingUpstashWarningPrinted = false

function getRedisRateLimiter(windowMs: number, limit: number): Ratelimit | null {
  if (redisRateLimiter) return redisRateLimiter
  if (rateLimiterInitAttempted) return null

  rateLimiterInitAttempted = true
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    if (process.env.NODE_ENV === 'production' && !missingUpstashWarningPrinted) {
      process.stderr.write('[WARN] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set; using in-memory rate limiting fallback.\n')
      missingUpstashWarningPrinted = true
    }
    return null
  }

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const redis = new Redis({ url, token })
  redisRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: 'po-project:ratelimit',
  })

  return redisRateLimiter
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  return 'unknown'
}

export async function assertRateLimit(request: Request, options: RateLimitOptions): Promise<RateLimitResult> {
  const redisLimiter = getRedisRateLimiter(options.windowMs, options.limit)
  const ip = getClientIp(request)
  const bucketKey = `${options.key}:${ip}`

  if (redisLimiter) {
    const result = await redisLimiter.limit(bucketKey)
    return {
      allowed: result.success,
      remaining: Math.max(result.remaining, 0),
      retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    }
  }

  const now = Date.now()
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs })
    return {
      allowed: true,
      remaining: Math.max(options.limit - 1, 0),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    }
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  buckets.set(bucketKey, existing)

  return {
    allowed: true,
    remaining: Math.max(options.limit - existing.count, 0),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  }
}
