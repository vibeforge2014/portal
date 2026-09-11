"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ManagedProduct, SiteContent } from "@/lib/content-schema";
import { BrandMark } from "@/components/SiteShell";

type Asset = { id: string; name: string; kind: "logo" | "product-icon"; preset: boolean; builtin: boolean; width: number | null; height: number | null };
type Session = { username: string; mustChangePassword: boolean };
type Tab = "overview" | "brand" | "content" | "products" | "media" | "seo" | "publish" | "security";

const tabs: Array<[Tab, string]> = [["overview", "概览"], ["brand", "品牌 Logo"], ["content", "页面内容"], ["products", "产品"], ["media", "媒体库"], ["seo", "SEO"], ["publish", "发布"], ["security", "安全"]];
const copyLabels: Record<string, string> = {
  navLabel: "导航辅助名称", homeLabel: "首页辅助名称", apps: "应用导航", principles: "理念导航", language: "语言按钮", languageLabel: "语言按钮辅助名称",
  studio: "工作室标签", headlinePlain: "主标题上半句", headlineAccent: "主标题强调句", heroDescription: "Hero 描述", browseApps: "浏览应用按钮", about: "了解品牌按钮",
  overviewLabel: "概览辅助名称", onSale: "在售产品标签", nativeApps: "原生应用标签", tracking: "追踪标签", toolkit: "工具集标题",
  productMatrix: "产品区标签", productTitle: "产品区标题", productIntro: "产品区介绍", principleLabel: "理念区标签", principleTitle: "理念区标题",
  companyLabel: "公司区标签", companyTitle: "公司区标题", companyDescription: "公司介绍", companyLocation: "公司所在地", companyFocus: "公司业务方向", companyPrinciple: "公司价值主张",
  principleDescription: "理念区描述", footer: "页脚文案", companyName: "公司名称",
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

function assetUrl(asset: Asset) { return asset.builtin ? null : `/api/media/${encodeURIComponent(asset.id)}`; }

function Login({ onLogin }: { onLogin: (session: Session, csrf: string) => void }) {
  const [username, setUsername] = useState("admin"); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const data = await requestJson<{ user: Session; csrfToken: string }>("/api/admin/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) }); onLogin(data.user, data.csrfToken); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "登录失败"); } finally { setBusy(false); }
  }
  return <main className="admin-login"><form onSubmit={submit} className="login-card"><div className="login-mark"><BrandMark compact /><span>ZenSoft</span></div><p className="eyebrow">CONTENT STUDIO</p><h1>登录管理后台</h1><p>管理品牌、产品和网站内容。</p><label>用户名<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} /></label><label>密码<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <div className="admin-error">{error}</div>}<button className="admin-primary" disabled={busy}>{busy ? "正在登录…" : "登录"}</button></form></main>;
}

export function AdminApp() {
  const [session, setSession] = useState<Session | null>(null); const [csrf, setCsrf] = useState(""); const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<SiteContent | null>(null); const [published, setPublished] = useState<SiteContent | null>(null); const [assets, setAssets] = useState<Asset[]>([]);
  const [status, setStatus] = useState<{ updatedAt: string; publishedAt: string; canRollback: boolean } | null>(null); const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    const [contentData, assetData] = await Promise.all([
      requestJson<{ draft: SiteContent; published: SiteContent; status: { updatedAt: string; publishedAt: string; canRollback: boolean } }>("/api/admin/content"),
      requestJson<{ assets: Asset[] }>("/api/admin/assets"),
    ]);
    setContent(contentData.draft); setPublished(contentData.published); setStatus(contentData.status); setAssets(assetData.assets);
  }, []);

  useEffect(() => { requestJson<{ user: Session; csrfToken: string }>("/api/admin/session").then(async (data) => { setSession(data.user); setCsrf(data.csrfToken); await loadData(); }).catch(() => {}).finally(() => setLoading(false)); }, [loadData]);
  useEffect(() => { if (session?.mustChangePassword) setTab("security"); }, [session]);
  const dirty = useMemo(() => content && published ? JSON.stringify(content) !== JSON.stringify(published) : false, [content, published]);
  function flash(message: string) { setNotice(message); setError(""); window.setTimeout(() => setNotice(""), 3500); }
  function fail(reason: unknown) { setError(reason instanceof Error ? reason.message : "操作失败"); setNotice(""); }
  async function saveDraft() { if (!content) return; setBusy(true); try { const data = await requestJson<{ draft: SiteContent; status: typeof status }>("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify(content) }); setContent(data.draft); setStatus(data.status); flash("草稿已保存"); } catch (reason) { fail(reason); } finally { setBusy(false); } }
  async function publish() { if (!content) return; setBusy(true); try { await requestJson("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify(content) }); const data = await requestJson<{ published: SiteContent; status: typeof status }>("/api/admin/publish", { method: "POST", headers: { "x-csrf-token": csrf } }); setContent(data.published); setPublished(data.published); setStatus(data.status); flash("网站已发布"); } catch (reason) { fail(reason); } finally { setBusy(false); } }
  async function rollback() { if (!window.confirm("确认恢复上一版？当前线上版本会成为可再次恢复的上一版。")) return; setBusy(true); try { const data = await requestJson<{ published: SiteContent; status: typeof status }>("/api/admin/rollback", { method: "POST", headers: { "x-csrf-token": csrf } }); setContent(data.published); setPublished(data.published); setStatus(data.status); flash("已恢复上一版"); } catch (reason) { fail(reason); } finally { setBusy(false); } }
  async function logout() { await requestJson("/api/admin/session", { method: "DELETE", headers: { "x-csrf-token": csrf } }).catch(() => {}); location.reload(); }

  if (loading) return <div className="admin-loading">正在加载 ZenSoft Studio…</div>;
  if (!session) return <Login onLogin={async (next, token) => { setSession(next); setCsrf(token); if (next.mustChangePassword) setTab("security"); setLoading(true); try { await loadData(); } finally { setLoading(false); } }} />;
  if (!content) return <div className="admin-loading">内容加载失败，请刷新页面。</div>;

  const logoAssets = assets.filter((asset) => asset.kind === "logo"); const iconAssets = assets.filter((asset) => asset.kind === "product-icon");
  return <div className="admin-shell">
    <aside className="admin-sidebar"><div className="admin-brand"><BrandMark compact /><div><strong>ZenSoft</strong><span>Content Studio</span></div></div><nav>{tabs.filter(([id]) => !session.mustChangePassword || id === "security").map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}{id === "publish" && dirty && <i />}</button>)}</nav><div className="admin-user"><span>{session.username}</span><button onClick={logout}>退出</button></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div><p className="eyebrow">ZENSoft CMS</p><h1>{tabs.find(([id]) => id === tab)?.[1]}</h1></div>{!session.mustChangePassword && <div className="admin-actions">{dirty && <span className="dirty-badge">有未发布更改</span>}<button onClick={saveDraft} disabled={busy}>保存草稿</button><button className="admin-primary" onClick={publish} disabled={busy}>发布网站</button></div>}</header>
      {notice && <div className="admin-notice">{notice}</div>}{error && <div className="admin-error banner">{error}</div>}
      {tab === "overview" && <Overview content={content} status={status} assets={assets} dirty={dirty} />}
      {tab === "brand" && <BrandEditor content={content} setContent={setContent} logos={logoAssets} />}
      {tab === "content" && <ContentEditor content={content} setContent={setContent} />}
      {tab === "products" && <ProductsEditor content={content} setContent={setContent} iconAssets={iconAssets} />}
      {tab === "media" && <MediaEditor assets={assets} csrf={csrf} reload={loadData} fail={fail} flash={flash} />}
      {tab === "seo" && <SeoEditor content={content} setContent={setContent} />}
      {tab === "publish" && <PublishPanel content={content} published={published} status={status} dirty={dirty} publish={publish} rollback={rollback} busy={busy} />}
      {tab === "security" && <SecurityPanel csrf={csrf} mustChange={session.mustChangePassword} />}
    </main>
  </div>;
}

function Overview({ content, status, assets, dirty }: { content: SiteContent; status: { updatedAt: string; publishedAt: string; canRollback: boolean } | null; assets: Asset[]; dirty: boolean }) {
  return <section className="admin-grid"><article className="metric"><span>公开产品</span><strong>{content.products.filter((p) => p.visible).length}</strong><small>共 {content.products.length} 款</small></article><article className="metric"><span>Logo 方案</span><strong>{assets.filter((a) => a.kind === "logo").length}</strong><small>含当前与预设</small></article><article className="metric"><span>内容状态</span><strong>{dirty ? "草稿" : "已同步"}</strong><small>{status ? `发布于 ${new Date(status.publishedAt).toLocaleString()}` : "—"}</small></article><article className="admin-card wide"><h2>快捷检查</h2><ul className="check-list"><li><b>中英文内容</b><span>完整管理</span></li><li><b>当前 Logo</b><span>{content.brand.activeLogoId}</span></li><li><b>上一版回滚</b><span>{status?.canRollback ? "可用" : "首次发布后可用"}</span></li></ul></article></section>;
}

function BrandEditor({ content, setContent, logos }: { content: SiteContent; setContent: React.Dispatch<React.SetStateAction<SiteContent | null>>; logos: Asset[] }) {
  const selected = logos.find((asset) => asset.id === content.brand.activeLogoId); const src = selected ? assetUrl(selected) : null;
  return <section className="admin-stack"><article className="admin-card"><div className="card-heading"><div><h2>Logo 方案</h2><p>选择只会修改草稿，发布后才影响访客。</p></div><span>{logos.length} 个方案</span></div><div className="logo-grid">{logos.map((asset) => <button key={asset.id} className={`logo-choice ${content.brand.activeLogoId === asset.id ? "selected" : ""}`} onClick={() => setContent({ ...content, brand: { ...content.brand, activeLogoId: asset.id } })}><div className="logo-canvas">{asset.builtin ? <BrandMark /> : <img src={assetUrl(asset)!} alt="" />}</div><strong>{asset.name}</strong><span>{asset.preset ? "预设" : "上传"}</span></button>)}</div></article><article className="admin-card"><h2>实时场景对比</h2><div className="brand-previews"><div className="preview-nav light"><BrandMark compact logoUrl={src} /><strong>{content.brand.name}</strong><span>应用　理念</span></div><div className="preview-nav dark"><BrandMark compact logoUrl={src} /><strong>{content.brand.name}</strong><span>应用　理念</span></div><div className="preview-hero"><BrandMark logoUrl={src} /><div><span>ZENSoft / DIGITAL STUDIO</span><strong>{content.copy.zh.headlinePlain}<em>{content.copy.zh.headlineAccent}</em></strong></div></div><div className="favicon-preview"><div><BrandMark logoUrl={src} /></div><p><strong>浏览器标签</strong><span>{content.seo.title}</span></p></div></div><label className="field">品牌名称<input value={content.brand.name} onChange={(e) => setContent({ ...content, brand: { ...content.brand, name: e.target.value } })} /></label></article></section>;
}

function ContentEditor({ content, setContent }: { content: SiteContent; setContent: React.Dispatch<React.SetStateAction<SiteContent | null>> }) {
  const [language, setLanguage] = useState<"zh" | "en">("zh"); const copy = content.copy[language];
  function update(key: string, value: string) { setContent({ ...content, copy: { ...content.copy, [language]: { ...copy, [key]: value } } }); }
  return <section className="admin-stack"><div className="segment"><button className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")}>中文</button><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button></div><article className="admin-card"><h2>页面文案</h2><div className="form-grid">{Object.entries(copy).filter(([key, value]) => key !== "principlesList" && typeof value === "string").map(([key, value]) => <label className={`field ${String(value).length > 70 || String(value).includes("\n") ? "wide" : ""}`} key={key}>{copyLabels[key] || key}{String(value).length > 70 || String(value).includes("\n") ? <textarea rows={3} value={String(value)} onChange={(e) => update(key, e.target.value)} /> : <input value={String(value)} onChange={(e) => update(key, e.target.value)} />}</label>)}</div></article><article className="admin-card"><div className="card-heading"><div><h2>理念条目</h2><p>最多 8 条，可分别编辑双语内容。</p></div><button onClick={() => setContent({ ...content, copy: { ...content.copy, [language]: { ...copy, principlesList: [...copy.principlesList, { title: "新理念", description: "请输入描述" }] } } })}>添加</button></div><div className="principle-editor">{copy.principlesList.map((item, index) => <div key={index}><span>{String(index + 1).padStart(2, "0")}</span><input value={item.title} onChange={(e) => { const list = [...copy.principlesList]; list[index] = { ...item, title: e.target.value }; setContent({ ...content, copy: { ...content.copy, [language]: { ...copy, principlesList: list } } }); }} /><textarea value={item.description} onChange={(e) => { const list = [...copy.principlesList]; list[index] = { ...item, description: e.target.value }; setContent({ ...content, copy: { ...content.copy, [language]: { ...copy, principlesList: list } } }); }} /><button aria-label="删除" onClick={() => setContent({ ...content, copy: { ...content.copy, [language]: { ...copy, principlesList: copy.principlesList.filter((_, i) => i !== index) } } })}>×</button></div>)}</div></article></section>;
}

function ProductsEditor({ content, setContent, iconAssets }: { content: SiteContent; setContent: React.Dispatch<React.SetStateAction<SiteContent | null>>; iconAssets: Asset[] }) {
  const [expanded, setExpanded] = useState(content.products[0]?.id || ""); const [dragged, setDragged] = useState<string | null>(null);
  function updateProduct(id: string, update: (product: ManagedProduct) => ManagedProduct) { setContent({ ...content, products: content.products.map((product) => product.id === id ? update(product) : product) }); }
  function reorder(target: string) { if (!dragged || dragged === target) return; const list = [...content.products]; const from = list.findIndex((p) => p.id === dragged); const to = list.findIndex((p) => p.id === target); const [item] = list.splice(from, 1); list.splice(to, 0, item); setContent({ ...content, products: list.map((product, order) => ({ ...product, order })) }); setDragged(null); }
  function addProduct() { const id = `app-${Date.now()}`; const product: ManagedProduct = { id, visible: false, draft: true, order: content.products.length, url: "https://example.com/", platforms: ["iOS"], accentFrom: "#0A84FF", accentTo: "#5E5CE6", glyph: "code", iconAssetId: iconAssets[0]?.id || "icon-chargepilot", copy: { zh: { name: "新应用", category: "应用类别", tagline: "应用标语", description: "应用描述", features: [] }, en: { name: "New App", category: "App category", tagline: "App tagline", description: "App description", features: [] } } }; setContent({ ...content, products: [...content.products, product] }); setExpanded(id); }
  return <section className="admin-stack"><div className="list-toolbar"><p>拖动卡片调整顺序；隐藏产品不会出现在前台。</p><button className="admin-primary" onClick={addProduct}>添加产品</button></div><div className="product-editor-list">{[...content.products].sort((a, b) => a.order - b.order).map((product) => <article key={product.id} className="product-editor" draggable onDragStart={() => setDragged(product.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => reorder(product.id)}><header onClick={() => setExpanded(expanded === product.id ? "" : product.id)}><span className="drag-handle">⠿</span><img src={`/api/media/${encodeURIComponent(product.iconAssetId)}`} alt="" /><div><strong>{product.copy.zh.name}</strong><span>{product.copy.zh.category}</span></div><label onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={product.visible} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, visible: e.target.checked }))} />公开</label><button>{expanded === product.id ? "收起" : "编辑"}</button></header>{expanded === product.id && <div className="product-form"><div className="form-grid"><label className="field">产品 ID<input value={product.id} disabled /></label><label className="field">产品地址<input type="url" value={product.url} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, url: e.target.value }))} /></label><label className="field">产品图标<select value={product.iconAssetId} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, iconAssetId: e.target.value }))}>{iconAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><label className="field inline">准备中<input type="checkbox" checked={product.draft} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, draft: e.target.checked }))} /></label><label className="field">起始色<input type="color" value={product.accentFrom} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, accentFrom: e.target.value }))} /></label><label className="field">结束色<input type="color" value={product.accentTo} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, accentTo: e.target.value }))} /></label><fieldset className="field wide"><legend>平台</legend><div className="checkboxes">{(["macOS", "iOS", "Apple TV", "Web"] as const).map((platform) => <label key={platform}><input type="checkbox" checked={product.platforms.includes(platform)} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, platforms: e.target.checked ? [...p.platforms, platform] : p.platforms.filter((item) => item !== platform) }))} />{platform}</label>)}</div></fieldset></div>{(["zh", "en"] as const).map((language) => <div className="localized-product" key={language}><h3>{language === "zh" ? "中文" : "English"}</h3><div className="form-grid">{(["name", "category", "tagline", "description"] as const).map((key) => <label className={`field ${key === "description" ? "wide" : ""}`} key={key}>{key}{key === "description" ? <textarea value={product.copy[language][key]} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, copy: { ...p.copy, [language]: { ...p.copy[language], [key]: e.target.value } } }))} /> : <input value={product.copy[language][key]} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, copy: { ...p.copy, [language]: { ...p.copy[language], [key]: e.target.value } } }))} />}</label>)}<label className="field wide">功能列表（每行一项）<textarea value={product.copy[language].features.join("\n")} onChange={(e) => updateProduct(product.id, (p) => ({ ...p, copy: { ...p.copy, [language]: { ...p.copy[language], features: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) } } }))} /></label></div></div>)}<button className="danger" onClick={() => { if (confirm(`删除 ${product.copy.zh.name}？`)) setContent({ ...content, products: content.products.filter((p) => p.id !== product.id).map((p, order) => ({ ...p, order })) }); }}>删除产品</button></div>}</article>)}</div></section>;
}

function MediaEditor({ assets, csrf, reload, fail, flash }: { assets: Asset[]; csrf: string; reload: () => Promise<void>; fail: (error: unknown) => void; flash: (message: string) => void }) {
  const [kind, setKind] = useState<"logo" | "product-icon">("logo"); const [name, setName] = useState(""); const [file, setFile] = useState<File | null>(null);
  async function upload(event: React.FormEvent) { event.preventDefault(); if (!file) return; const form = new FormData(); form.set("file", file); form.set("kind", kind); form.set("name", name || file.name); try { await requestJson("/api/admin/assets", { method: "POST", headers: { "x-csrf-token": csrf }, body: form }); await reload(); setFile(null); setName(""); flash("图片已上传"); } catch (reason) { fail(reason); } }
  async function archive(id: string) { if (!confirm("归档这张图片？")) return; try { await requestJson(`/api/admin/assets?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-csrf-token": csrf } }); await reload(); flash("图片已归档"); } catch (reason) { fail(reason); } }
  return <section className="admin-stack"><article className="admin-card"><h2>上传图片</h2><form className="upload-form" onSubmit={upload}><label className="field">名称<input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：新 Logo" /></label><label className="field">用途<select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="logo">Logo</option><option value="product-icon">产品图标</option></select></label><label className="file-picker"><input type="file" accept="image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} /><span>{file ? file.name : "选择 PNG / WebP"}</span></label><button className="admin-primary" disabled={!file}>上传</button></form><p className="hint">最大 10MB，边长 128–4096px。系统会重新编码并生成缩略图。</p></article><article className="admin-card"><h2>全部资源</h2><div className="media-grid">{assets.map((asset) => <div key={asset.id} className="media-item"><div>{asset.builtin ? <BrandMark /> : <img src={assetUrl(asset)!} alt="" />}</div><strong>{asset.name}</strong><span>{asset.kind === "logo" ? "Logo" : "产品图标"}{asset.width ? ` · ${asset.width}×${asset.height}` : ""}</span>{!asset.preset && <button onClick={() => archive(asset.id)}>归档</button>}</div>)}</div></article></section>;
}

function SeoEditor({ content, setContent }: { content: SiteContent; setContent: React.Dispatch<React.SetStateAction<SiteContent | null>> }) {
  return <article className="admin-card"><h2>搜索与分享信息</h2><div className="form-grid">{Object.entries(content.seo).map(([key, value]) => <label key={key} className="field wide">{key}<textarea value={value} onChange={(e) => setContent({ ...content, seo: { ...content.seo, [key]: e.target.value } })} /></label>)}</div><div className="search-preview"><span>{content.brand.name}</span><h3>{content.seo.title}</h3><p>{content.seo.description}</p></div></article>;
}

function PublishPanel({ content, published, status, dirty, publish, rollback, busy }: { content: SiteContent; published: SiteContent | null; status: { updatedAt: string; publishedAt: string; canRollback: boolean } | null; dirty: boolean; publish: () => void; rollback: () => void; busy: boolean }) {
  const changes = published ? [content.brand.activeLogoId !== published.brand.activeLogoId && "Logo", JSON.stringify(content.copy) !== JSON.stringify(published.copy) && "页面文案", JSON.stringify(content.products) !== JSON.stringify(published.products) && "产品", JSON.stringify(content.seo) !== JSON.stringify(published.seo) && "SEO"].filter(Boolean) : ["全部内容"];
  return <section className="admin-grid"><article className="admin-card wide"><h2>发布检查</h2><p>{dirty ? "以下草稿内容尚未公开：" : "草稿与线上版本一致。"}</p><div className="change-tags">{changes.map((change) => <span key={String(change)}>{change}</span>)}</div><div className="publish-actions"><a href="/" target="_blank" rel="noreferrer">查看线上网站 ↗</a><button className="admin-primary" onClick={publish} disabled={busy || !dirty}>确认发布</button></div></article><article className="admin-card"><h2>线上版本</h2><p>{status ? new Date(status.publishedAt).toLocaleString() : "尚未发布"}</p></article><article className="admin-card"><h2>恢复上一版</h2><p>仅保留最近一次发布前的完整内容。</p><button onClick={rollback} disabled={busy || !status?.canRollback}>恢复上一版</button></article></section>;
}

function SecurityPanel({ csrf, mustChange }: { csrf: string; mustChange: boolean }) {
  const [currentPassword, setCurrent] = useState(""); const [newPassword, setNext] = useState(""); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); try { await requestJson("/api/admin/session", { method: "PATCH", headers: { "content-type": "application/json", "x-csrf-token": csrf }, body: JSON.stringify({ currentPassword, newPassword }) }); setMessage("密码已修改，请重新登录。"); setTimeout(() => location.reload(), 1200); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "修改失败"); } }
  return <article className="admin-card security-card">{mustChange && <div className="admin-warning">首次登录必须修改初始密码。</div>}<h2>修改管理员密码</h2><form onSubmit={submit}><label className="field">当前密码<input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} /></label><label className="field">新密码<input type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={(e) => setNext(e.target.value)} /></label><p className="hint">至少 12 个字符。修改后所有会话都会退出。</p>{message && <p>{message}</p>}<button className="admin-primary">修改密码</button></form></article>;
}
