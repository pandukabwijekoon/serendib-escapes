interface ValidatedEnv {
  MONGODB_URI: string;
  JWT_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD_HASH: string;
  SEED_SECRET: string;
  IP_HASH_SALT: string;
}

function getRequiredEnv(name: keyof ValidatedEnv): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[ENV_CONFIG_ERROR] Missing required environment variable: ${name}. Check .env.local against .env.example.`
    );
  }
  return value.trim();
}

export function getServerEnv(): ValidatedEnv {
  const jwtSecret = getRequiredEnv("JWT_SECRET");
  if (jwtSecret.length < 32) {
    throw new Error(
      "[ENV_CONFIG_ERROR] JWT_SECRET must be at least 32 characters long."
    );
  }

  return {
    MONGODB_URI: getRequiredEnv("MONGODB_URI"),
    JWT_SECRET: jwtSecret,
    ADMIN_EMAIL: getRequiredEnv("ADMIN_EMAIL").toLowerCase(),
    ADMIN_PASSWORD_HASH: getRequiredEnv("ADMIN_PASSWORD_HASH"),
    SEED_SECRET: getRequiredEnv("SEED_SECRET"),
    IP_HASH_SALT:
      process.env.IP_HASH_SALT?.trim() || "serendib-escapes-default-salt",
  };
}

export function getJwtSecretBytes(): Uint8Array {
  const secret = getRequiredEnv("JWT_SECRET");
  if (secret.length < 32) {
    throw new Error(
      "[ENV_CONFIG_ERROR] JWT_SECRET must be at least 32 characters long."
    );
  }
  return new TextEncoder().encode(secret);
}

export function getUsdToLkrRate(): number {
  const raw = Number(process.env.NEXT_PUBLIC_USD_TO_LKR ?? "300");
  return Number.isFinite(raw) && raw > 0 ? raw : 300;
}
