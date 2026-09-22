import "server-only";

//
// 订单中心服务端逻辑：用 Supabase service key 直连查询/管理支付订单与激活码。
// 数据仍在 Supabase Postgres（支付回调 alipay-notify/wechat-notify 在那边履约），
// 这里只做管理面：列表/汇总/详情/吊销/恢复/补发邮件/手动建码/解绑设备。
// 查询逻辑移植自 chargepilot 仓库 orders-admin 边缘函数，邮件部分移植自 _shared/licenses.ts。
//
// 环境变量：SUPABASE_URL / SUPABASE_SERVICE_KEY（service role，仅服务端持有）。
//

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendDirectMail } from "@/lib/directmail";
import { generateLicenseKey } from "@/lib/license-key";

export const DEVICE_LIMIT = 3;
const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const UUID_PATTERN = /^[0-9a-f-]{36}$/i;

/// 管理员操作失误级别的错误（400 返回给界面），其余异常一律按服务端故障隐藏细节。
export class OrderAdminError extends Error {}

export interface LicenseRow {
  id: string;
  license_key: string;
  product: string;
  email: string;
  plan: "annual" | "lifetime";
  amount_fen: number | null;
  source_type: "alipay" | "wechat" | "paddle" | "manual";
  source_order_table: string | null;
  source_order_id: string | null;
  status: "active" | "revoked";
  valid_until: string | null;
  email_sent_at: string | null;
  created_at: string;
}

export interface DeviceRow {
  id: string;
  license_id: string;
  device_id: string;
  device_name: string | null;
  app_version: string | null;
  activated_at: string;
  last_seen_at: string | null;
  revoked_at: string | null;
}

export interface UnifiedOrder {
  id: string;
  channel: "alipay" | "wechat";
  product: string;
  outTradeNo: string;
  email: string;
  plan: string;
  amountFen: number;
  status: string;
  tradeId: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface StatsRow {
  channel: string;
  status: string;
  plan: string;
  order_count: number;
  paid_amount_fen: number | null;
}

export interface OrderFilters {
  status?: string | null;
  plan?: string | null;
  channel?: string | null;
  email?: string | null;
  page?: number;
  pageSize?: number;
}

let client: SupabaseClient | null = null;

/// 懒初始化：本地构建/开发环境可能没有配置 Supabase，模块加载时不能抛错。
function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("Missing environment variable: SUPABASE_URL / SUPABASE_SERVICE_KEY");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

function stringFilter(value: unknown, key: string, allowed?: string[]): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (allowed && !allowed.includes(trimmed)) throw new OrderAdminError(`非法的 ${key} 取值。`);
  return trimmed;
}

function licenseIdFrom(value: unknown, label = "激活码编号"): string {
  const id = typeof value === "string" ? value.trim() : "";
  if (!UUID_PATTERN.test(id)) throw new OrderAdminError(`${label}无效。`);
  return id;
}

// ---------------------------------------------------------------------------
// 订单列表：两渠道合并 + 关联激活码与设备数
// ---------------------------------------------------------------------------

export async function listOrders(filters: OrderFilters) {
  const status = stringFilter(filters.status, "status", ["created", "paid", "closed", "refunded"]);
  const plan = stringFilter(filters.plan, "plan", ["annual", "lifetime"]);
  const channel = stringFilter(filters.channel, "channel", ["alipay", "wechat"]);
  const email = stringFilter(filters.email, "email")?.toLowerCase() ?? null;
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(filters.pageSize) || PAGE_SIZE));

  const channels: Array<"alipay" | "wechat"> = channel ? [channel as "alipay" | "wechat"] : ["alipay", "wechat"];
  const orders: UnifiedOrder[] = [];
  let total = 0;

  for (const name of channels) {
    const table = name === "alipay" ? "alipay_orders" : "wechat_orders";
    const tradeColumn = name === "alipay" ? "trade_no" : "transaction_id";
    let query = db().from(table).select(`id, out_trade_no, email, plan, amount_fen, status, ${tradeColumn}, paid_at, created_at`);
    let countQuery = db().from(table).select("id", { count: "exact", head: true });
    if (status) { query = query.eq("status", status); countQuery = countQuery.eq("status", status); }
    if (plan) { query = query.eq("plan", plan); countQuery = countQuery.eq("plan", plan); }
    if (email) { query = query.eq("email", email); countQuery = countQuery.eq("email", email); }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;
    total += count ?? 0;

    const { data, error } = await query.order("created_at", { ascending: false }).limit(pageSize * page);
    if (error) throw error;
    for (const row of data ?? []) {
      orders.push({
        id: row.id,
        channel: name,
        product: "chargepilot",
        outTradeNo: row.out_trade_no,
        email: row.email,
        plan: row.plan,
        amountFen: row.amount_fen,
        status: row.status,
        tradeId: ((row as Record<string, unknown>)[tradeColumn] as string | null) ?? null,
        createdAt: row.created_at,
        paidAt: row.paid_at ?? null
      });
    }
  }

  orders.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const start = (page - 1) * pageSize;
  const pageOrders = orders.slice(start, start + pageSize);

  // 关联激活码与设备占用
  const orderIds = pageOrders.map((order) => order.id);
  const licenseByOrderId = new Map<string, LicenseRow>();
  const deviceCounts = new Map<string, number>();
  if (orderIds.length) {
    for (const name of channels) {
      const { data: licenses } = await db()
        .from("licenses")
        .select("*")
        .eq("source_type", name)
        .in("source_order_id", orderIds);
      for (const license of (licenses ?? []) as LicenseRow[]) {
        licenseByOrderId.set(license.source_order_id ?? "", license);
      }
    }
    const licenseIds = Array.from(licenseByOrderId.values()).map((license) => license.id);
    if (licenseIds.length) {
      const { data: activations } = await db()
        .from("device_activations")
        .select("license_id")
        .in("license_id", licenseIds)
        .is("revoked_at", null);
      for (const activation of activations ?? []) {
        deviceCounts.set(activation.license_id, (deviceCounts.get(activation.license_id) ?? 0) + 1);
      }
    }
  }

  return {
    total,
    page,
    pageSize,
    orders: pageOrders.map((order) => {
      const license = licenseByOrderId.get(order.id);
      return {
        ...order,
        license: license
          ? {
              id: license.id,
              licenseKey: license.license_key,
              status: license.status,
              validUntil: license.valid_until,
              emailSentAt: license.email_sent_at,
              devicesUsed: deviceCounts.get(license.id) ?? 0
            }
          : null
      };
    })
  };
}

export async function getStats(): Promise<StatsRow[]> {
  const { data, error } = await db().rpc("orders_admin_stats");
  if (error) throw error;
  return (data ?? []) as StatsRow[];
}

// ---------------------------------------------------------------------------
// 激活码详情 / 管理操作
// ---------------------------------------------------------------------------

export async function getLicenseDetail(licenseId: string) {
  const id = licenseIdFrom(licenseId);
  const { data, error } = await db().from("licenses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new OrderAdminError("激活码不存在。");
  const { data: devices, error: deviceError } = await db()
    .from("device_activations")
    .select("*")
    .eq("license_id", id)
    .order("activated_at", { ascending: false });
  if (deviceError) throw deviceError;
  return { license: data as LicenseRow, devices: (devices ?? []) as DeviceRow[] };
}

export async function setLicenseStatus(licenseId: string, status: "active" | "revoked") {
  const id = licenseIdFrom(licenseId);
  const { error } = await db()
    .from("licenses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return { ok: true, status };
}

export async function resendLicenseEmail(licenseId: string) {
  const id = licenseIdFrom(licenseId);
  await sendLicenseEmail(id);
  return { ok: true, sentAt: new Date().toISOString() };
}

/// 手动创建激活码（补偿发放，source_type=manual，不限期）。
export async function createLicense(input: { email?: unknown; plan?: unknown; sendEmail?: unknown }) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OrderAdminError("邮箱无效。");
  const plan = input.plan === "lifetime" ? "lifetime" : "annual";
  const sendEmail = input.sendEmail !== false;
  const { data, error } = await db()
    .from("licenses")
    .insert({
      license_key: generateLicenseKey(),
      email,
      plan,
      source_type: "manual",
      status: "active",
      valid_until: null
    })
    .select("id, license_key, plan, valid_until")
    .single();
  if (error) throw error;
  let emailSentAt: string | null = null;
  if (sendEmail) {
    await sendLicenseEmail(data.id);
    emailSentAt = new Date().toISOString();
  }
  return { license: { id: data.id, licenseKey: data.license_key, plan: data.plan, validUntil: data.valid_until, emailSentAt } };
}

export async function revokeDevice(activationId: string) {
  const id = licenseIdFrom(activationId, "设备记录编号");
  const now = new Date().toISOString();
  const { error } = await db()
    .from("device_activations")
    .update({ revoked_at: now, updated_at: now })
    .eq("id", id)
    .is("revoked_at", null);
  if (error) throw error;
  return { ok: true };
}

// ---------------------------------------------------------------------------
// 确认邮件（重发/手动建码共用）。模板与 chargepilot 仓库 _shared/licenses.ts
// 的 purchaseEmailHtml 保持一致，改动时两处同步。
// ---------------------------------------------------------------------------

async function sendLicenseEmail(licenseId: string): Promise<void> {
  const { data, error } = await db().from("licenses").select("*").eq("id", licenseId).single();
  if (error) throw error;
  const license = data as LicenseRow;
  await sendDirectMail({
    to: license.email,
    subject: `【ChargePilot】购买成功，这是你的激活码（${license.license_key}）`,
    html: purchaseEmailHtml(license)
  });
  const { error: updateError } = await db()
    .from("licenses")
    .update({ email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", licenseId);
  if (updateError) throw updateError;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatYuan(amountFen: number): string {
  return `¥${Math.floor(amountFen / 100)}.${String(amountFen % 100).padStart(2, "0")}`;
}

function formatBeijingTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function purchaseEmailHtml(license: LicenseRow): string {
  const planName = license.plan === "lifetime" ? "永久授权" : "年度授权（1 年）";
  const amountLine = license.amount_fen != null
    ? `<tr><td class="label">支付金额</td><td>${formatYuan(license.amount_fen)}</td></tr>`
    : "";
  const validLine = license.plan === "annual" && license.valid_until
    ? `<tr><td class="label">有效期至</td><td>${formatBeijingTime(license.valid_until)}</td></tr>`
    : "";
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,'PingFang SC','Helvetica Neue',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6eaee;">
        <tr>
          <td style="padding:26px 32px 10px;">
            <div style="font-size:17px;font-weight:700;color:#173024;">⚡ ChargePilot Pro</div>
            <div style="font-size:13px;color:#8a959e;margin-top:4px;">macOS 电池与充电管理</div>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 32px 4px;">
            <h1 style="margin:0;font-size:20px;color:#173024;">购买成功，感谢支持！</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#4a5560;line-height:1.7;">
              你的 ChargePilot Pro 授权已开通。请保存下方激活码，在 App 中完成激活。
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#4a5560;">
              <tr><td class="label" style="padding:4px 0;color:#8a959e;width:96px;">授权方案</td><td style="padding:4px 0;">ChargePilot Pro ${escapeHtml(planName)}</td></tr>
              ${amountLine}
              <tr><td class="label" style="padding:4px 0;color:#8a959e;">购买时间</td><td style="padding:4px 0;">${formatBeijingTime(license.created_at)}</td></tr>
              ${validLine}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="font-size:13px;color:#8a959e;margin-bottom:8px;">你的激活码</div>
            <div style="background:#f0f7f2;border:1px dashed #9fc7ab;border-radius:10px;padding:16px;text-align:center;">
              <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:1px;color:#173024;">${escapeHtml(license.license_key)}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="font-size:13px;color:#8a959e;margin-bottom:8px;">激活步骤</div>
            <ol style="margin:0;padding-left:20px;font-size:14px;color:#4a5560;line-height:1.9;">
              <li>下载并安装 ChargePilot：<a href="https://zensoft.top/chargepilot/" style="color:#1a7f4b;">zensoft.top/chargepilot</a></li>
              <li>打开 App，进入 Pro 激活界面（设置 → 版本方案 → 了解 Pro）</li>
              <li>粘贴上方激活码，点击「激活」即可解锁全部功能</li>
            </ol>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbfc;border-radius:10px;padding:14px 16px;border:1px solid #edf0f3;">
              <tr><td style="font-size:13px;color:#4a5560;line-height:1.8;">
                <strong style="color:#173024;">设备说明</strong>：一个激活码最多同时激活 3 台 Mac。
                需要更换设备时，在 App 的「设置 → 版本方案」中点击「反激活此设备」即可释放名额，再到新设备上激活。
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 32px 30px;">
            <p style="margin:0;font-size:12px;color:#8a959e;line-height:1.8;">
              首次购买适用 14 天退款政策。订单或激活问题请联系：
              <a href="mailto:support@zensoft.top" style="color:#1a7f4b;">support@zensoft.top</a><br>
              本邮件由系统自动发送，请勿直接回复。
            </p>
          </td>
        </tr>
      </table>
      <div style="max-width:560px;margin:14px auto 0;font-size:11px;color:#aab3ba;text-align:center;">
        绍兴市臻书科技有限公司 · ChargePilot
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}
