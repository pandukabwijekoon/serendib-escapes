interface RateLimitEntry {
  timestamps: number[];
  failedAttempts: number;
  lockedUntil: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const globalForRateLimit = globalThis as unknown as {
  __serendibRateLimitStore?: Map<string, RateLimitEntry>;
};

const store =
  globalForRateLimit.__serendibRateLimitStore ??
  new Map<string, RateLimitEntry>();

if (!globalForRateLimit.__serendibRateLimitStore) {
  globalForRateLimit.__serendibRateLimitStore = store;
}

/**
 * Sliding-window rate limiter (Upstash-ready interface).
 * Default: 5 requests per 15 minutes.
 */
export function checkRateLimit(
  key: string,
  maxRequests = 5,
  windowMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key) ?? {
    timestamps: [],
    failedAttempts: 0,
    lockedUntil: 0,
  };

  if (entry.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    store.set(key, entry);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.timestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Checks whether an admin login key is currently locked out by exponential backoff.
 */
export function checkLoginLockout(key: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    return { allowed: true, remaining: 5, retryAfterSeconds: 0 };
  }

  if (entry.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  const windowStart = now - 15 * 60 * 1000;
  const recent = entry.timestamps.filter((ts) => ts > windowStart);
  return {
    allowed: recent.length < 5,
    remaining: Math.max(0, 5 - recent.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Records a failed login attempt and applies exponential backoff after 5 failures
 * within 15 minutes (30s, 60s, 120s, 240s, up to 15m).
 */
export function recordFailedLoginAttempt(key: string): {
  lockedUntil: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const windowStart = now - 15 * 60 * 1000;
  const entry = store.get(key) ?? {
    timestamps: [],
    failedAttempts: 0,
    lockedUntil: 0,
  };

  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);
  entry.timestamps.push(now);
  entry.failedAttempts += 1;

  if (entry.timestamps.length >= 5) {
    const exponent = Math.min(entry.timestamps.length - 5, 5);
    const backoffMs = Math.min(15 * 60 * 1000, 30_000 * Math.pow(2, exponent));
    entry.lockedUntil = now + backoffMs;
    store.set(key, entry);
    return {
      lockedUntil: entry.lockedUntil,
      retryAfterSeconds: Math.ceil(backoffMs / 1000),
    };
  }

  store.set(key, entry);
  return { lockedUntil: 0, retryAfterSeconds: 0 };
}

export function resetLoginAttempts(key: string): void {
  store.delete(key);
}
