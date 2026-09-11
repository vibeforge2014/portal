import { NextResponse } from "next/server";

export function apiError(error: unknown, fallback = "Request failed") {
  const message = error instanceof Error ? error.message : fallback;
  const status = message === "Unauthorized" ? 401
    : message.includes("CSRF") || message === "Password change required" ? 403
    : message.includes("login attempts") ? 429
    : 400;
  return NextResponse.json({ error: message }, { status });
}
