import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "serendib_admin_session";
const SESSION_DURATION_SECONDS = 2 * 60 * 60; // 2 hours

export interface AdminSessionPayload {
  sub: string;
  email: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

export async function signAdminToken(email: string): Promise<string> {
  const secret = getJwtSecretBytes();
  return new SignJWT({
    email: email.toLowerCase(),
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(email.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

export async function verifyAdminToken(
  token: string
): Promise<AdminSessionPayload | null> {
  try {
    const secret = getJwtSecretBytes();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      payload.role !== "admin" ||
      typeof payload.email !== "string" ||
      typeof payload.sub !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: "admin",
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * Defense-in-depth RBAC guard. Must be called inside every Admin Server Action
 * and Admin API Route handler. Never rely solely on middleware.
 */
export async function requireAdmin(): Promise<AdminSessionPayload> {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") {
    throw new Error("UNAUTHORIZED_ADMIN_ACCESS");
  }
  return session;
}

export function getAdminCookieOptions() {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}
