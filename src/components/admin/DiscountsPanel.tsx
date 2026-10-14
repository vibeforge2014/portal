"use client";

import { useEffect, useState } from "react";
import type { ManagedProduct } from "@/lib/content-schema";
import { discountDescription, type DiscountCode, type DiscountType } from "@/lib/discount-code";

type Listing = { codes: DiscountCode[]; total: number; page: number; pageSize: number };
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "折扣码操作失败。");
  return body as T;
}
function randomCode() {
  return "ZS-" + Array.from(crypto.getRandomValues(new Uint8Array(8)), byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
}
function time(value: string | null) {
  return value ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "长期有效";
}

export function DiscountsPanel({ csrf, products }: { csrf: string; products: ManagedProduct[] }) {
  const [form, setForm] = useState({ product: products.find(p => p.id === "chargepilot")?.id ?? products[0]?.id ?? "", plan: "", code: "", discountType: "percent" as DiscountType, value: "80", expiresAt: "" });
  const [listing, setListing] = useState<Listing>({ codes: [], total: 0, page: 1, pageSize: 20 });
  const [productFilter, setProductFilter] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [created, setCreated] = useState<DiscountCode | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (productFilter) params.set("product", productFilter);
    request<Listing>(`/api/admin/discounts?${params}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setListing(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "加载失败。"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, productFilter, reload]);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request<{ code: DiscountCode }>("/api/admin/discounts", {
        method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ action: "create", ...form, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null })
      });
      setCreated(result.code);
      setForm(current => ({ ...current, code: "" }));
      setPage(1); setProductFilter(""); setReload(current => current + 1);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "创建失败。"); }
    finally { setBusy(false); }
  }
  async function toggle(code: DiscountCode) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await request("/api/admin/discounts", {
        method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ action: "setStatus", id: code.id, status: code.status === "active" ? "disabled" : "active" })
      });
      setReload(current => current + 1);
      setNotice(code.status === "active" ? "折扣码已停用，已创建订单的价格保持有效。" : "折扣码已启用。");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "状态修改失败。"); }
    finally { setBusy(false); }
  }
  async function copy(code: string) {
    try { await navigator.clipboard.writeText(code); setNotice(`已复制 ${code}`); }
    catch { setError("复制失败，请选中折扣码手动复制。"); }
  }

  return <section className="admin-stack discounts-panel">
    {error && <div className="admin-error" role="alert">{error}</div>}
    {notice && <div className="admin-notice" role="status">{notice}</div>}
    <article className="admin-card">
      <div className="card-heading"><div><h2>生成产品折扣码</h2><p>按产品和授权方案设置优惠。ChargePilot 与 MinuteFlow 官网支持微信、支付宝使用折扣码。</p></div></div>
      <form onSubmit={create}>
        <div className="form-grid">
          <label className="field">适用产品<select value={form.product} onChange={event => setForm({ ...form, product: event.target.value, plan: event.target.value === "minuteflow" ? (form.plan === "annual" ? "" : form.plan) : form.plan })}>{products.map(product => <option key={product.id} value={product.id}>{product.copy.zh.name}</option>)}</select></label>
          <label className="field">授权方案<select value={form.plan} onChange={event => setForm({ ...form, plan: event.target.value })}><option value="">所有授权方案</option>{form.product !== "minuteflow" && <option value="annual" disabled={form.product === "minuteflow"}>年度授权</option>}<option value="lifetime">永久授权</option></select></label>
          <label className="field">优惠方式<select value={form.discountType} onChange={event => setForm({ ...form, discountType: event.target.value as DiscountType, value: event.target.value === "percent" ? "80" : "10" })}><option value="percent">百分比折扣</option><option value="fixed">固定金额减免</option></select></label>
          <label className="field">{form.discountType === "percent" ? "支付比例（%，80 表示八折）" : "减免金额（元）"}<input type="number" min={form.discountType === "percent" ? "1" : "0.01"} max={form.discountType === "percent" ? "99" : "1000000"} step={form.discountType === "percent" ? "1" : "0.01"} required value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} /></label>
          <label className="field wide">折扣码<div className="discount-code-input"><input value={form.code} onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="留空自动生成，或填写自定义码" maxLength={32} autoComplete="off" spellCheck={false} /><button type="button" disabled={busy} onClick={() => setForm({ ...form, code: randomCode() })}>生成随机码</button></div><span className="hint">4–32 位英文字母、数字、连字符或下划线，不区分大小写。</span></label>
          <label className="field">到期时间（本地时间）<input type="datetime-local" value={form.expiresAt} onChange={event => setForm({ ...form, expiresAt: event.target.value })} /><span className="hint">留空表示长期有效。</span></label>
        </div>
        {form.product === "minuteflow" && <p className="hint">MinuteFlow 为一次性购买（仅永久授权），建议方案选「永久授权」或「所有授权方案」。</p>}
        {!["chargepilot", "minuteflow"].includes(form.product) && <p className="hint">该产品的购买页暂不支持折扣码，创建的码需在购买页支持后使用；App Store 内购不适用。</p>}
        <div className="discount-actions"><button className="admin-primary" disabled={busy || !form.product}>{busy ? "处理中…" : "创建折扣码"}</button><span className="hint">实付金额至少为 ¥0.01；优惠不可叠加。</span></div>
      </form>
      {created && <div className="discount-created" role="status"><div><strong>已创建折扣码</strong><code>{created.code}</code><span>{discountDescription(created)} · {time(created.expires_at)}</span></div><button type="button" onClick={() => copy(created.code)}>复制新折扣码</button></div>}
    </article>
    <article className="admin-card">
      <div className="card-heading"><div><h2>折扣码列表</h2><p>共 {listing.total} 个。停用只影响后续下单，历史订单保留原价与优惠记录。</p></div><button disabled={loading} onClick={() => { setError(""); setReload(current => current + 1); }}>刷新列表</button></div>
      <label className="field discount-filter">筛选产品<select value={productFilter} onChange={event => { setPage(1); setProductFilter(event.target.value); }}><option value="">全部产品</option>{products.map(product => <option key={product.id} value={product.id}>{product.copy.zh.name}</option>)}</select></label>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>折扣码</th><th>产品 / 方案</th><th>优惠</th><th>到期时间</th><th>成交 / 待付</th><th>状态</th><th>操作</th></tr></thead><tbody>
        {loading ? <tr className="static"><td className="empty" colSpan={7}>正在加载…</td></tr> : listing.codes.length === 0 ? <tr className="static"><td className="empty" colSpan={7}>暂无折扣码，可在上方创建。</td></tr> : listing.codes.map(code => {
          const expired = Boolean(code.expires_at && Date.parse(code.expires_at) <= Date.now());
          return <tr key={code.id} className="static"><td className="mono">{code.code}</td><td>{products.find(product => product.id === code.product)?.copy.zh.name ?? code.product}<br /><small>{code.plan === "annual" ? "年度授权" : code.plan === "lifetime" ? "永久授权" : "所有方案"}</small></td><td>{discountDescription(code)}</td><td>{time(code.expires_at)}</td><td>{code.paidCount} / {code.pendingCount}</td><td><span className={`pill ${code.status === "disabled" || expired ? "closed" : "active"}`}>{code.status === "disabled" ? "已停用" : expired ? "已过期" : "可用"}</span></td><td><div className="discount-row-actions"><button onClick={() => copy(code.code)}>复制</button><button disabled={busy || (expired && code.status === "disabled")} onClick={() => toggle(code)}>{code.status === "active" ? "停用" : "启用"}</button></div></td></tr>;
        })}
      </tbody></table></div>
      <div className="pager"><span>第 {page} 页</span><div className="discount-row-actions"><button disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)}>上一页</button><button disabled={loading || page * listing.pageSize >= listing.total} onClick={() => setPage(current => current + 1)}>下一页</button></div></div>
    </article>
  </section>;
}
