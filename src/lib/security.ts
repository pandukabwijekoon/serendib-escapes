import { createHash } from "crypto";

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Recursively strips MongoDB operator keys (starting with `$`) and prototype
 * pollution keys from untrusted payloads.
 */
export function stripMongoOperators<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => stripMongoOperators(item)) as unknown as T;
  }

  if (typeof input === "object" && !(input instanceof Date)) {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (key.startsWith("$") || FORBIDDEN_KEYS.has(key) || key.includes(".")) {
        continue;
      }
      cleanObj[key] = stripMongoOperators(value);
    }
    return cleanObj as T;
  }

  return input;
}

/**
 * Detects if a raw payload contains any MongoDB operator keys so API routes can
 * explicitly reject malicious injection attempts with 400 Bad Request.
 */
export function containsMongoOperators(input: unknown): boolean {
  if (input === null || input === undefined) return false;
  if (Array.isArray(input)) {
    return input.some((item) => containsMongoOperators(item));
  }
  if (typeof input === "object" && !(input instanceof Date)) {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (key.startsWith("$") || FORBIDDEN_KEYS.has(key)) {
        return true;
      }
      if (containsMongoOperators(value)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Sanitizes plain text fields against control characters and angle brackets.
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

/**
 * Escapes user-supplied strings before building a safe RegExp for search queries.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Privacy-preserving deterministic SHA-256 hash of a client IP address.
 */
export function hashClientIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT?.trim() || "serendib-escapes-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Extracts best-effort client IP from Next.js request headers.
 */
export function extractClientIp(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

/**
 * Maps internal errors to safe user-facing messages without leaking stack traces
 * or database internals.
 */
export function toSafeErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    console.error("[SafeError]", error.message);
  }
  return fallback;
}
