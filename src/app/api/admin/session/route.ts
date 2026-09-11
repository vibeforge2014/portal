import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { changePassword, clearAuthCookies, CSRF_COOKIE, login, logoutToken, requireCsrf, requireSession, SESSION_COOKIE, sessionFromRequest, setAuthCookies } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = sessionFromRequest(request);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user: { username: session.username, mustChangePassword: session.mustChangePassword }, csrfToken: request.cookies.get(CSRF_COOKIE)?.value || "" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: string; password?: string };
    if (!body.username || !body.password || body.username.length > 80 || body.password.length > 128) throw new Error("Invalid credentials");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const result = await login(body.username, body.password, ip);
    const response = NextResponse.json({ authenticated: true, user: result.user, csrfToken: result.csrf });
    setAuthCookies(response, result.token, result.csrf, result.expiresAt);
    return response;
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = requireSession(request);
    requireCsrf(request);
    const body = await request.json() as { currentPassword?: string; newPassword?: string };
    if (!body.currentPassword || !body.newPassword) throw new Error("Both passwords are required");
    await changePassword(session.adminId, body.currentPassword, body.newPassword);
    const response = NextResponse.json({ ok: true, signedOut: true });
    clearAuthCookies(response);
    return response;
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    requireCsrf(request);
    logoutToken(request.cookies.get(SESSION_COOKIE)?.value);
    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);
    return response;
  } catch (error) { return apiError(error); }
}
