import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireCsrf, requireSession, requireWritableSession } from "@/lib/auth";
import { getPublishedContent } from "@/lib/db";
import { DiscountAdminError } from "@/lib/discount-code";
import { createDiscountCode, listDiscountCodes, setDiscountStatus } from "@/lib/discounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireSession(request);
    const product = request.nextUrl.searchParams.get("product");
    const page = Number(request.nextUrl.searchParams.get("page")) || 1;
    return NextResponse.json(await listDiscountCodes(product, page));
  } catch (error) { return discountError(error); }
}
export async function POST(request: NextRequest) {
  try {
    const session = requireWritableSession(request);
    requireCsrf(request);
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    switch (body.action) {
      case "create": return NextResponse.json(await createDiscountCode(body, getPublishedContent().products.map(p => p.id), session.username), { status: 201 });
      case "setStatus": return NextResponse.json(await setDiscountStatus(body.id, body.status));
      default: throw new DiscountAdminError("未知操作。");
    }
  } catch (error) { return discountError(error); }
}
function discountError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (error instanceof DiscountAdminError || ["Unauthorized", "Password change required", "Invalid CSRF token"].includes(message)) return apiError(error);
  console.error("discount admin failed:", error);
  return NextResponse.json({ error: "折扣码服务暂时不可用，请稍后重试。" }, { status: 500 });
}
