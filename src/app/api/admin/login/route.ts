import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerEnv } from "@/lib/env";
import { getAdminCookieOptions, signAdminToken } from "@/lib/auth";
import {
  checkLoginLockout,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from "@/lib/rateLimit";
import {
  containsMongoOperators,
  extractClientIp,
  hashClientIp,
  stripMongoOperators,
  toSafeErrorMessage,
} from "@/lib/security";
import { adminLoginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    if (containsMongoOperators(rawBody)) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const clientIp = extractClientIp(req.headers);
    const ipHash = hashClientIp(clientIp);
    const rateKey = `admin-login:${ipHash}`;

    const lockout = checkLoginLockout(rateKey);
    if (!lockout.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Try again in ${lockout.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(lockout.retryAfterSeconds) },
        }
      );
    }

    const parsed = adminLoginSchema.safeParse(stripMongoOperators(rawBody));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid email and password." },
        { status: 400 }
      );
    }

    const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH } = getServerEnv();
    const submittedEmail = parsed.data.email.toLowerCase();

    const emailMatches = submittedEmail === ADMIN_EMAIL;
    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      ADMIN_PASSWORD_HASH
    );

    if (!emailMatches || !passwordMatches) {
      const failure = recordFailedLoginAttempt(rateKey);
      const status = failure.retryAfterSeconds > 0 ? 429 : 401;
      return NextResponse.json(
        {
          error:
            failure.retryAfterSeconds > 0
              ? `Account temporarily locked. Retry in ${failure.retryAfterSeconds} seconds.`
              : "Invalid administrator credentials.",
        },
        { status }
      );
    }

    resetLoginAttempts(rateKey);
    const token = await signAdminToken(ADMIN_EMAIL);
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set({
      ...getAdminCookieOptions(),
      value: token,
    });
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: toSafeErrorMessage(err, "Authentication failed.") },
      { status: 500 }
    );
  }
}
