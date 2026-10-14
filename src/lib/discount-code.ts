export type DiscountType = "percent" | "fixed";
export type DiscountStatus = "active" | "disabled";
export interface DiscountCode {
  id: string; code: string; product: string; plan: "annual" | "lifetime" | null;
  discount_type: DiscountType; discount_value: number; status: DiscountStatus;
  expires_at: string | null; created_by: string; created_at: string;
  paidCount: number; pendingCount: number;
}
export class DiscountAdminError extends Error {}

export function normalizeDiscountCode(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value !== "string") throw new DiscountAdminError("折扣码格式无效。");
  const code = value.trim().toUpperCase();
  if (code && !/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(code)) {
    throw new DiscountAdminError("折扣码需为 4–32 位英文字母、数字、连字符或下划线。");
  }
  return code;
}

export function parseDiscountInput(input: Record<string, unknown>, products: string[], now = Date.now()) {
  const product = typeof input.product === "string" ? input.product : "";
  if (!products.includes(product)) throw new DiscountAdminError("请选择有效的产品。");
  const plan = input.plan == null || input.plan === "" ? null : input.plan;
  if (plan !== null && plan !== "annual" && plan !== "lifetime") throw new DiscountAdminError("授权方案无效。");
  if (product === "minuteflow" && plan === "annual") throw new DiscountAdminError("MinuteFlow 仅支持永久授权，请选择永久授权或所有方案。");
  const type = input.discountType;
  if (type !== "percent" && type !== "fixed") throw new DiscountAdminError("优惠方式无效。");
  const raw = typeof input.value === "string" || typeof input.value === "number" ? String(input.value).trim() : "";
  let value: number;
  if (type === "percent") {
    value = Number(raw);
    if (!/^\d{1,2}$/.test(raw) || !Number.isInteger(value) || value < 1 || value > 99) {
      throw new DiscountAdminError("支付比例须为 1–99 的整数，80 表示八折。");
    }
  } else {
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(raw)) throw new DiscountAdminError("减免金额须为正数，最多两位小数。");
    const [yuan, fraction = ""] = raw.split(".");
    value = Number(yuan) * 100 + Number(fraction.padEnd(2, "0"));
    if (!Number.isSafeInteger(value) || value < 1 || value > 100000000) throw new DiscountAdminError("减免金额须在 0.01–1,000,000 元之间。");
  }
  let expiresAt: string | null = null;
  if (input.expiresAt != null && input.expiresAt !== "") {
    if (typeof input.expiresAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(input.expiresAt)) throw new DiscountAdminError("到期时间无效。");
    const datePart = input.expiresAt.slice(0, 10);
    const calendarDate = new Date(datePart + "T00:00:00Z");
    if (!Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== datePart) throw new DiscountAdminError("到期时间无效。");
    const time = Date.parse(input.expiresAt);
    if (!Number.isFinite(time) || time <= now) throw new DiscountAdminError("到期时间须晚于当前时间。");
    expiresAt = new Date(time).toISOString();
  }
  return { code: normalizeDiscountCode(input.code), product, plan, discount_type: type,
    discount_value: value, expires_at: expiresAt };
}

export function discountDescription(code: Pick<DiscountCode, "discount_type" | "discount_value">) {
  return code.discount_type === "percent"
    ? `${code.discount_value / 10} 折（实付 ${code.discount_value}%）`
    : `减 ¥${(code.discount_value / 100).toFixed(2)}`;
}
