"use client";

import { useEffect, useMemo, useState } from "react";
import { getProducts, type Product } from "@/data/products";
import { AppIcon } from "@/components/AppIcon";
import {
  DEFAULT_GITHUB,
  defaultVisibility,
  fetchVisibilityConfig,
  githubGetFile,
  githubPutFile,
  resolveVisibility,
  type GitHubSettings,
  type VisibilityConfig,
} from "@/lib/visibilityConfig";

const STORAGE_KEY = "vf-admin-gh";

type Status =
  | { type: "idle" }
  | { type: "saving"; message: string }
  | { type: "saved"; message: string }
  | { type: "error"; message: string };

// Catalog used for the admin list (names/categories are the same in both
// languages; zh is the source of truth for display here).
const CATALOG: Product[] = getProducts("zh");
const BASE = process.env.NEXT_PUBLIC_BASEPATH ?? "";

export default function AdminPage() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() =>
    defaultVisibility(CATALOG),
  );
  const [gh, setGh] = useState<GitHubSettings>({ ...DEFAULT_GITHUB, token: "" });
  const [status, setStatus] = useState<Status>({ type: "idle" });

  // Restore GitHub settings (incl. token) from localStorage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setGh({ ...DEFAULT_GITHUB, token: "", ...JSON.parse(raw) });
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  // Load what the live storefront currently sees.
  useEffect(() => {
    fetchVisibilityConfig().then((config) => {
      setVisibility(resolveVisibility(CATALOG, config));
    });
  }, []);

  const visibleCount = useMemo(
    () => CATALOG.filter((product) => visibility[product.id] !== false).length,
    [visibility],
  );

  function persistGh(next: GitHubSettings) {
    setGh(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable in private mode */
    }
  }

  function toggle(id: string) {
    setStatus({ type: "idle" });
    setVisibility((current) => ({ ...current, [id]: !current[id] }));
  }

  function resetDefaults() {
    setStatus({ type: "idle" });
    setVisibility(defaultVisibility(CATALOG));
  }

  async function save() {
    if (!gh.token.trim()) {
      setStatus({ type: "error", message: "请先填写 GitHub Personal Access Token。" });
      return;
    }
    setStatus({ type: "saving", message: "正在读取仓库中的配置文件…" });
    try {
      const config: VisibilityConfig = { version: 1, visibility };
      const { sha } = await githubGetFile(gh);
      setStatus({ type: "saving", message: "正在提交更改到仓库…" });
      await githubPutFile(gh, sha, config, "chore(portal): update app visibility via /admin");
      setStatus({
        type: "saved",
        message:
          "已提交。Cloudflare Pages 会在约 1–2 分钟内自动重建并生效；GitHub Pages 在下次部署后生效。",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <div className="vf-page">
      <style>{ADMIN_STYLES}</style>

      <header className="vf-header">
        <div className="vf-header-row">
          <div>
            <p className="vf-eyebrow">VibeForge · Portal</p>
            <h1>应用展示管理</h1>
          </div>
          <a className="vf-link" href={`${BASE}/`}>
            ← 返回前台
          </a>
        </div>
        <p className="vf-sub">
          在这里勾选要在门户展示的应用。保存会将 <code>public/config/visibility.json</code> 提交到仓库，前台运行时读取该文件决定展示。
        </p>
      </header>

      <section className="vf-card">
        <h2 className="vf-card-title">应用可见性</h2>
        <p className="vf-card-sub">
          当前 <strong>{visibleCount}</strong> / {CATALOG.length} 个应用展示中。
        </p>

        <ul className="vf-list">
          {CATALOG.map((product) => {
            const on = visibility[product.id] !== false;
            return (
              <li key={product.id} className={`vf-row${on ? "" : " is-off"}`}>
                <AppIcon
                  icon={product.icon}
                  gradient={product.accent}
                  iconSrc={product.iconSrc}
                  size={44}
                />
                <div className="vf-row-text">
                  <div className="vf-row-name">
                    {product.name}
                    {product.draft && <span className="vf-badge">草稿</span>}
                  </div>
                  <div className="vf-row-cat">{product.category}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${on ? "隐藏" : "展示"} ${product.name}`}
                  className={`vf-switch${on ? " is-on" : ""}`}
                  onClick={() => toggle(product.id)}
                >
                  <span className="vf-switch-knob" />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="vf-actions">
          <button type="button" className="vf-btn vf-btn--ghost" onClick={resetDefaults}>
            恢复默认
          </button>
          <button
            type="button"
            className="vf-btn vf-btn--primary"
            onClick={save}
            disabled={status.type === "saving"}
          >
            {status.type === "saving" ? "保存中…" : "保存到仓库"}
          </button>
        </div>

        {status.type !== "idle" && (
          <p className={`vf-status vf-status--${status.type}`}>{status.message}</p>
        )}
      </section>

      <section className="vf-card">
        <h2 className="vf-card-title">GitHub 配置</h2>
        <p className="vf-card-sub">
          保存即通过 GitHub Contents API 改写文件并触发重建。建议使用 <strong>fine-grained</strong> token，仅授权本仓库的 Contents 读写权限，并设置较短有效期。
        </p>

        <div className="vf-grid">
          <label className="vf-field">
            <span>Owner</span>
            <input
              value={gh.owner}
              onChange={(event) => persistGh({ ...gh, owner: event.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="vf-field">
            <span>Repo</span>
            <input
              value={gh.repo}
              onChange={(event) => persistGh({ ...gh, repo: event.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="vf-field">
            <span>Branch</span>
            <input
              value={gh.branch}
              onChange={(event) => persistGh({ ...gh, branch: event.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="vf-field">
            <span>文件路径</span>
            <input
              value={gh.path}
              onChange={(event) => persistGh({ ...gh, path: event.target.value })}
              autoComplete="off"
            />
          </label>
          <label className="vf-field vf-field--full">
            <span>Personal Access Token（仅存在本机浏览器）</span>
            <input
              type="password"
              value={gh.token}
              onChange={(event) => persistGh({ ...gh, token: event.target.value })}
              placeholder="github_pat_…"
              autoComplete="off"
            />
          </label>
        </div>
      </section>

      <p className="vf-foot">
        Token 仅保存在当前浏览器的 localStorage，不会发送到除 GitHub API 以外的任何地方。
      </p>
    </div>
  );
}

const ADMIN_STYLES = `
.vf-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 56px 20px 80px;
  color: #e8e8ee;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.vf-header h1 { margin: 4px 0 0; font-size: 1.8rem; letter-spacing: -0.01em; }
.vf-eyebrow { margin: 0; font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: #8a8a99; }
.vf-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.vf-sub { margin: 14px 0 0; color: #9a9aa8; font-size: 0.92rem; line-height: 1.6; }
.vf-sub code { background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 6px; font-size: 0.82em; }
.vf-link { color: #6ea8ff; text-decoration: none; font-size: 0.88rem; white-space: nowrap; }
.vf-link:hover { text-decoration: underline; }

.vf-card {
  margin-top: 28px;
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 18px;
  padding: 22px 22px 20px;
}
.vf-card-title { margin: 0; font-size: 1.05rem; }
.vf-card-sub { margin: 6px 0 16px; color: #9a9aa8; font-size: 0.84rem; }

.vf-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.vf-row {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 12px; border-radius: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  transition: opacity 0.18s ease;
}
.vf-row.is-off { opacity: 0.5; }
.vf-row-text { flex: 1; min-width: 0; }
.vf-row-name { font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px; }
.vf-row-cat { color: #8e8e9c; font-size: 0.8rem; margin-top: 2px; }
.vf-badge {
  font-size: 0.64rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: #ffd9a8; background: rgba(255,159,10,0.16);
  padding: 2px 7px; border-radius: 999px;
}

.vf-switch {
  position: relative; width: 46px; height: 28px; border-radius: 999px;
  border: none; cursor: pointer; flex-shrink: 0;
  background: rgba(255,255,255,0.16);
  transition: background 0.2s ease;
}
.vf-switch.is-on { background: #34c759; }
.vf-switch-knob {
  position: absolute; top: 3px; left: 3px;
  width: 22px; height: 22px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: transform 0.2s ease;
}
.vf-switch.is-on .vf-switch-knob { transform: translateX(18px); }

.vf-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
.vf-btn {
  border-radius: 10px; padding: 9px 16px; font-size: 0.88rem; cursor: pointer;
  border: 1px solid transparent; transition: transform 0.12s ease, opacity 0.12s ease;
}
.vf-btn:active { transform: scale(0.97); }
.vf-btn:disabled { opacity: 0.55; cursor: default; }
.vf-btn--ghost { background: rgba(255,255,255,0.06); color: #d6d6e0; border-color: rgba(255,255,255,0.12); }
.vf-btn--primary { background: #0a84ff; color: #fff; }

.vf-status { margin: 14px 0 0; font-size: 0.84rem; line-height: 1.5; }
.vf-status--saving { color: #9a9aa8; }
.vf-status--saved { color: #34c759; }
.vf-status--error { color: #ff6b6b; white-space: pre-wrap; }

.vf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.vf-field { display: flex; flex-direction: column; gap: 5px; font-size: 0.78rem; color: #9a9aa8; }
.vf-field--full { grid-column: 1 / -1; }
.vf-field input {
  background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9px; padding: 9px 11px; color: #e8e8ee; font-size: 0.88rem;
  outline: none;
}
.vf-field input:focus { border-color: #0a84ff; }

.vf-foot { margin: 22px 0 0; color: #6f6f7e; font-size: 0.76rem; line-height: 1.5; }

@media (max-width: 560px) {
  .vf-grid { grid-template-columns: 1fr; }
}
`;
