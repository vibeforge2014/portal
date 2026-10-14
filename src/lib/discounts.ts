import "server-only";
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DiscountAdminError, parseDiscountInput, type DiscountCode, type DiscountStatus } from "@/lib/discount-code";

let client: SupabaseClient | null = null;
function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("Missing Supabase configuration");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export async function listDiscountCodes(product: string | null, page = 1) {
  const currentPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const pageSize = 20;
  let query = db().from("discount_codes").select("*", { count: "exact" });
  if (product) query = query.eq("product", product);
  const { data, count, error } = await query.order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
  if (error) throw error;
  const rows = (data ?? []) as DiscountCode[];
  const usage = new Map<string, { paid_count: number; pending_count: number }>();
  if (rows.length) {
    const { data: counts, error: usageError } = await db().rpc("discount_code_usage", { p_ids: rows.map(row => row.id) });
    if (usageError) throw usageError;
    for (const row of counts ?? []) usage.set(row.discount_code_id, row);
  }
  return { total: count ?? 0, page: currentPage, pageSize,
    codes: rows.map(row => ({ ...row, paidCount: Number(usage.get(row.id)?.paid_count ?? 0),
      pendingCount: Number(usage.get(row.id)?.pending_count ?? 0) })) };
}

export async function createDiscountCode(input: Record<string, unknown>, products: string[], username: string) {
  const parsed = parseDiscountInput(input, products);
  const code = parsed.code || `ZS-${randomBytes(8).toString("hex").toUpperCase()}`;
  const { data, error } = await db().from("discount_codes")
    .insert({ ...parsed, code, created_by: username }).select("*").single();
  if (error?.code === "23505") throw new DiscountAdminError("折扣码已存在，请换一个。");
  if (error) throw error;
  return { code: { ...data, paidCount: 0, pendingCount: 0 } as DiscountCode };
}

export async function setDiscountStatus(id: unknown, status: unknown) {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new DiscountAdminError("折扣码编号无效。");
  }
  if (status !== "active" && status !== "disabled") throw new DiscountAdminError("折扣码状态无效。");
  const { data, error } = await db().from("discount_codes")
    .update({ status: status as DiscountStatus, updated_at: new Date().toISOString() })
    .eq("id", id).select("id, status").maybeSingle();
  if (error) throw error;
  if (!data) throw new DiscountAdminError("折扣码不存在。");
  return { ok: true, ...data };
}
