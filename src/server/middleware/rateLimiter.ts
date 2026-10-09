import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store for tracking IP/key request timestamps
const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, max, message = 'Too many requests, please try again later.', keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key: default to client IP or auth user if present
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const clientKey = keyGenerator ? keyGenerator(req) : `${req.baseUrl}${req.path}:${ip}`;

    const now = Date.now();
    const windowStart = now - windowMs;

    let record = rateLimitStore.get(clientKey);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(clientKey, record);
    }

    // Purge timestamps older than the active window
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);

    const currentCount = record.timestamps.length;
    const remaining = Math.max(0, max - currentCount - 1);
    const resetTimeSeconds = Math.ceil((record.timestamps[0] ? record.timestamps[0] + windowMs - now : windowMs) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor((now + windowMs) / 1000));

    if (currentCount >= max) {
      res.setHeader('Retry-After', resetTimeSeconds);
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        limit: max,
        windowSeconds: Math.round(windowMs / 1000),
        retryAfterSeconds: resetTimeSeconds,
      });
    }

    record.timestamps.push(now);
    next();
  };
};

// -----------------------------------------------------------------------------
// SPECIFIED ROUTE LIMITS:
// - Login: 5 requests per 15 minutes per IP
// - Signup: 3 requests per 1 hour per IP
// - Password Reset: 3 requests per 1 hour per IP/Email
// - Paid APIs (Gemini AI / Stripe checkout / PDF batch): 20 requests per minute
// -----------------------------------------------------------------------------

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Access temporarily locked for 15 minutes for your security.',
});

export const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Signup rate limit exceeded. You can only create 3 accounts per hour.',
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Password reset request limit reached. Please wait 1 hour before trying again.',
});

export const paidApiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Paid API rate limit exceeded. You are limited to 20 requests per minute.',
});
