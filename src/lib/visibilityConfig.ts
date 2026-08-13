// Runtime visibility config helpers.
//
// The storefront reads `public/config/visibility.json` (served at
// `${NEXT_PUBLIC_BASEPATH}/config/visibility.json`) to decide which products to
// show. The `/admin/` page edits that same file in the repo through the GitHub
// Contents API. This module holds the shape + helpers shared by both sides so
// they can never drift apart.

import type { Product } from "@/data/products";

export interface VisibilityConfig {
  version?: number;
  visibility?: Record<string, boolean>;
}

/** Path to the config inside the repo (what the admin page commits). */
export const VISIBILITY_FILE_PATH = "public/config/visibility.json";
/** Path the public site fetches at runtime (under the configured basePath). */
const VISIBILITY_CONFIG_PATH = "/config/visibility.json";

export function visibilityConfigUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASEPATH ?? "";
  // Cache-bust so a freshly committed config is picked up after redeploy.
  return `${base}${VISIBILITY_CONFIG_PATH}?t=${Date.now()}`;
}

/** Per-product default visibility derived from the catalog (`visible` field). */
export function defaultVisibility(products: Product[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const product of products) map[product.id] = product.visible !== false;
  return map;
}

/** Merge remote config over catalog defaults; remote wins when present. */
export function resolveVisibility(
  products: Product[],
  config: VisibilityConfig | null,
): Record<string, boolean> {
  const resolved: Record<string, boolean> = {};
  for (const product of products) {
    const fromConfig = config?.visibility?.[product.id];
    resolved[product.id] = fromConfig ?? product.visible !== false;
  }
  return resolved;
}

export function filterVisible(
  products: Product[],
  visibility: Record<string, boolean>,
): Product[] {
  return products.filter((product) => visibility[product.id] !== false);
}

/** Fetch the runtime config. Returns null on any failure so callers fall back
 *  to catalog defaults — the storefront must never break on a missing file. */
export async function fetchVisibilityConfig(): Promise<VisibilityConfig | null> {
  try {
    const res = await fetch(visibilityConfigUrl(), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as VisibilityConfig;
  } catch {
    return null;
  }
}

// --- GitHub Contents API (used by /admin/ to persist changes) -------------

export interface GitHubSettings {
  owner: string;
  repo: string;
  branch: string;
  /** Repo-relative path to the visibility file. */
  path: string;
  token: string;
}

export const DEFAULT_GITHUB: Omit<GitHubSettings, "token"> = {
  owner: "vibeforge2014",
  repo: "portal",
  branch: "main",
  path: VISIBILITY_FILE_PATH,
};

const GITHUB_API = "https://api.github.com";

function contentsUrl(owner: string, repo: string, path: string): string {
  // Path contains no characters that need encoding here; keep slashes literal
  // so GitHub treats it as a nested file path.
  return `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
}

function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
}

export interface GitHubFile {
  sha: string;
  content: VisibilityConfig | null;
}

/** Read the visibility file. A 404 resolves to `{ sha: "", content: null }`
 *  so the caller can create it on the next PUT. */
export async function githubGetFile(
  settings: GitHubSettings,
): Promise<GitHubFile> {
  const res = await fetch(
    `${contentsUrl(settings.owner, settings.repo, settings.path)}?ref=${encodeURIComponent(settings.branch)}`,
    { headers: authHeaders(settings.token) },
  );
  if (res.status === 404) return { sha: "", content: null };
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let content: VisibilityConfig | null = null;
  if (typeof data.content === "string") {
    try {
      content = JSON.parse(decodeBase64Utf8(data.content)) as VisibilityConfig;
    } catch {
      content = null;
    }
  }
  return { sha: data.sha ?? "", content };
}

/** Create or update the visibility file. Pass the sha from `githubGetFile`
 *  (empty string to create). */
export async function githubPutFile(
  settings: GitHubSettings,
  sha: string,
  content: VisibilityConfig,
  message: string,
): Promise<void> {
  const body = {
    message,
    branch: settings.branch,
    sha: sha || undefined,
    content: encodeBase64Utf8(`${JSON.stringify(content, null, 2)}\n`),
  };
  const res = await fetch(contentsUrl(settings.owner, settings.repo, settings.path), {
    method: "PUT",
    headers: { ...authHeaders(settings.token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
}
