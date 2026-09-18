import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireCsrf, requireSession, requireWritableSession } from "@/lib/auth";
import { OrderAdminError, createLicense, getLicenseDetail, getStats, listOrders, resendLicenseEmail, revokeDevice, setLicenseStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// GET：订单列表（含统计汇总）；带 licenseId 时返回激活码与设备详情。
export async function GET(request: NextRequest) {
  try {
    requireSession(request);
    const params = request.nextUrl.searchParams;
    const licenseId = params.get("licenseId");
    if (licenseId) return NextResponse.json(await getLicenseDetail(licenseId));
    const [list, stats] = await Promise.all([
      listOrders({
        channel: params.get("channel"),
        status: params.get("status"),
        plan: params.get("plan"),
        email: params.get("email"),
        page: Number(params.get("page")) || 1,
        pageSize: Number(params.get("pageSize")) || 20
      }),
      getStats()
    ]);
    return NextResponse.json({ ...list, stats });
  } catch (error) { return orderAdminError(error); }
}

/// POST：管理操作（吊销/恢复/补发邮件/手动建码/远程解绑）。
export async function POST(request: NextRequest) {
  try {
    requireWritableSession(request);
    requireCsrf(request);
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    switch (body.action) {
      case "license.revoke": return NextResponse.json(await setLicenseStatus(String(body.licenseId), "revoked"));
      case "license.restore": return NextResponse.json(await setLicenseStatus(String(body.licenseId), "active"));
      case "license.resendEmail": return NextResponse.json(await resendLicenseEmail(String(body.licenseId)));
      case "license.create": return NextResponse.json(await createLicense(body));
      case "device.revoke": return NextResponse.json(await revokeDevice(String(body.activationId)));
      default: throw new OrderAdminError("未知操作。");
    }
  } catch (error) { return orderAdminError(error); }
}

/// 鉴权/CSRF/管理员误操作返回原有语义；其余（含 Supabase/邮件故障）一律 500 隐藏细节。
function orderAdminError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (error instanceof OrderAdminError || ["Unauthorized", "Password change required", "Invalid CSRF token"].includes(message) || message.includes("login attempts")) return apiError(error);
  console.error("orders admin failed:", error);
  return NextResponse.json({ error: "后台服务暂时不可用。" }, { status: 500 });
}
