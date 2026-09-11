import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash, verify } from "argon2";
import type { NextRequest, NextResponse } from "next/server";
import { ensureBootstrapAdmin, getDb } from "@/lib/db";

export const SESSION_COOKIE = "zensoft_session";
export const CSRF_COOKIE = "zensoft_csrf";
const SESSION_HOURS = 8;
const failures = new Map<string, { count: number; firstAt: number; blockedUntil: number }>();

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function secureCookies() { return process.env.ZENSOFT_SECURE_COOKIES !== "false" && process.env.NODE_ENV === "production"; }

export type AdminSession = { adminId: number; username: string; mustChangePassword: boolean; expiresAt: string };

export async function login(username: string, password: string, ip: string) {
  await ensureBootstrapAdmin();
  const now = Date.now();
  const attempt = failures.get(ip);
  if (attempt?.blockedUntil && attempt.blockedUntil > now) throw new Error("Too many login attempts. Try again later.");
  const row = getDb().prepare("SELECT id, username, password_hash, must_change_password FROM admins WHERE username = ?").get(username) as { id: number; username: string; password_hash: string; must_change_password: number } | undefined;
  const valid = row ? await verify(row.password_hash, password) : false;
  if (!valid || !row) {
    const next = !attempt || now - attempt.firstAt > 15 * 60_000 ? { count: 1, firstAt: now, blockedUntil: 0 } : { ...attempt, count: attempt.count + 1 };
    if (next.count >= 5) next.blockedUntil = now + 15 * 60_000;
    failures.set(ip, next);
    throw new Error("Invalid username or password");
  }
  failures.delete(ip);
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP").run();
  const token = randomBytes(32).toString("base64url");
  const csrf = randomBytes(24).toString("base64url");
  const expiresAt = new Date(now + SESSION_HOURS * 60 * 60_000).toISOString();
  getDb().prepare("INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)").run(digest(token), row.id, expiresAt);
  return { token, csrf, expiresAt, user: { username: row.username, mustChangePassword: Boolean(row.must_change_password) } };
}

export function setAuthCookies(response: NextResponse, token: string, csrf: string, expiresAt: string) {
  const common = { secure: secureCookies(), sameSite: "strict" as const, path: "/", expires: new Date(expiresAt) };
  response.cookies.set(SESSION_COOKIE, token, { ...common, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, csrf, { ...common, httpOnly: false });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { path: "/", expires: new Date(0) });
  response.cookies.set(CSRF_COOKIE, "", { path: "/", expires: new Date(0) });
}

export function sessionFromRequest(request: NextRequest): AdminSession | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb().prepare(`
    SELECT a.id AS adminId, a.username, a.must_change_password AS mustChangePassword, s.expires_at AS expiresAt
    FROM sessions s JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
  `).get(digest(token)) as { adminId: number; username: string; mustChangePassword: number; expiresAt: string } | undefined;
  return row ? { ...row, mustChangePassword: Boolean(row.mustChangePassword) } : null;
}

export function requireSession(request: NextRequest) {
  const session = sessionFromRequest(request);
  if (!session) throw new Error("Unauthorized");
  return session;
}

export function requireWritableSession(request: NextRequest) {
  const session = requireSession(request);
  if (session.mustChangePassword) throw new Error("Password change required");
  return session;
}

export function requireCsrf(request: NextRequest) {
  const header = request.headers.get("x-csrf-token") || "";
  const cookie = request.cookies.get(CSRF_COOKIE)?.value || "";
  if (!header || header.length !== cookie.length || !timingSafeEqual(Buffer.from(header), Buffer.from(cookie))) throw new Error("Invalid CSRF token");
}

export function logoutToken(token?: string) {
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(digest(token));
}

export async function changePassword(adminId: number, currentPassword: string, nextPassword: string) {
  if (nextPassword.length < 12 || nextPassword.length > 128) throw new Error("New password must be 12–128 characters");
  const row = getDb().prepare("SELECT password_hash FROM admins WHERE id = ?").get(adminId) as { password_hash: string };
  if (!(await verify(row.password_hash, currentPassword))) throw new Error("Current password is incorrect");
  const passwordHash = await hash(nextPassword, { type: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const transaction = getDb().transaction(() => {
    getDb().prepare("UPDATE admins SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(passwordHash, adminId);
    getDb().prepare("DELETE FROM sessions WHERE admin_id = ?").run(adminId);
  });
  transaction();
}
