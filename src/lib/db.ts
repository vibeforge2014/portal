import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { hash } from "argon2";
import { DEFAULT_CONTENT, PRESET_ASSETS } from "@/data/default-content";
import { parseSiteContent, type SiteContent } from "@/lib/content-schema";

export type AssetRecord = {
  id: string;
  name: string;
  kind: "logo" | "product-icon";
  url: string | null;
  filePath: string | null;
  thumbPath: string | null;
  mime: string | null;
  width: number | null;
  height: number | null;
  preset: boolean;
  builtin: boolean;
  archived: boolean;
  createdAt: string;
};

const dataRoot = process.env.ZENSOFT_DATA_DIR || path.join(process.cwd(), ".data");
export const uploadRoot = process.env.ZENSOFT_UPLOAD_DIR || path.join(dataRoot, "uploads");
const databasePath = process.env.ZENSOFT_DB_PATH || path.join(dataRoot, "zensoft.db");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
fs.mkdirSync(uploadRoot, { recursive: true });

const db = new Database(databasePath);
db.pragma("busy_timeout = 10000");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    must_change_password INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS content_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    draft_json TEXT NOT NULL,
    current_json TEXT NOT NULL,
    previous_json TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('logo', 'product-icon')),
    url TEXT,
    file_path TEXT,
    thumb_path TEXT,
    mime TEXT,
    width INTEGER,
    height INTEGER,
    preset INTEGER NOT NULL DEFAULT 0,
    builtin INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const seedJson = JSON.stringify(DEFAULT_CONTENT);
db.prepare(`INSERT OR IGNORE INTO content_state (id, draft_json, current_json) VALUES (1, ?, ?)`).run(seedJson, seedJson);
const insertPreset = db.prepare(`
  INSERT OR IGNORE INTO assets (id, name, kind, url, preset, builtin)
  VALUES (@id, @name, @kind, @url, 1, @builtin)
`);
const seedAssets = db.transaction(() => {
  for (const asset of PRESET_ASSETS) insertPreset.run({ ...asset, builtin: asset.builtin ? 1 : 0 });
});
seedAssets();

let adminInitialization: Promise<string | null> | null = null;

export function getDb() {
  return db;
}

export async function ensureBootstrapAdmin(): Promise<string | null> {
  if (!adminInitialization) {
    adminInitialization = (async () => {
      const existing = db.prepare("SELECT id FROM admins LIMIT 1").get();
      if (existing) return null;
      const username = process.env.ZENSOFT_ADMIN_USERNAME || "admin";
      const password = process.env.ZENSOFT_BOOTSTRAP_PASSWORD;
      if (!password || password.length < 12) {
        throw new Error("ZENSOFT_BOOTSTRAP_PASSWORD must be set to at least 12 characters before first start");
      }
      const passwordHash = await hash(password, { type: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
      db.prepare("INSERT INTO admins (username, password_hash, must_change_password) VALUES (?, ?, 1)").run(username, passwordHash);
      return username;
    })();
  }
  return adminInitialization;
}

function readContent(column: "draft_json" | "current_json" | "previous_json"): SiteContent | null {
  const row = db.prepare(`SELECT ${column} AS value FROM content_state WHERE id = 1`).get() as { value: string | null };
  return row.value ? parseSiteContent(JSON.parse(row.value)) : null;
}

export function getDraftContent() { return readContent("draft_json")!; }
export function getPublishedContent() { return readContent("current_json")!; }
export function getPreviousContent() { return readContent("previous_json"); }

export function saveDraft(content: SiteContent) {
  const parsed = parseSiteContent(content);
  db.prepare("UPDATE content_state SET draft_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1").run(JSON.stringify(parsed));
  return parsed;
}

export const publishDraft = db.transaction(() => {
  const row = db.prepare("SELECT draft_json, current_json FROM content_state WHERE id = 1").get() as { draft_json: string; current_json: string };
  parseSiteContent(JSON.parse(row.draft_json));
  db.prepare(`
    UPDATE content_state SET previous_json = current_json, current_json = draft_json,
      published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = 1
  `).run();
  return parseSiteContent(JSON.parse(row.draft_json));
});

export const rollbackPublication = db.transaction(() => {
  const row = db.prepare("SELECT current_json, previous_json FROM content_state WHERE id = 1").get() as { current_json: string; previous_json: string | null };
  if (!row.previous_json) throw new Error("No previous publication is available");
  parseSiteContent(JSON.parse(row.previous_json));
  db.prepare(`
    UPDATE content_state SET current_json = previous_json, previous_json = current_json,
      draft_json = previous_json, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = 1
  `).run();
  return parseSiteContent(JSON.parse(row.previous_json));
});

export function listAssets(includeArchived = false): AssetRecord[] {
  const rows = db.prepare(`SELECT id, name, kind, url, file_path, thumb_path, mime, width, height, preset, builtin, archived, created_at FROM assets ${includeArchived ? "" : "WHERE archived = 0"} ORDER BY preset DESC, created_at DESC`).all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id), name: String(row.name), kind: row.kind as AssetRecord["kind"], url: row.url ? String(row.url) : null,
    filePath: row.file_path ? String(row.file_path) : null, thumbPath: row.thumb_path ? String(row.thumb_path) : null,
    mime: row.mime ? String(row.mime) : null, width: row.width == null ? null : Number(row.width), height: row.height == null ? null : Number(row.height),
    preset: Boolean(row.preset), builtin: Boolean(row.builtin), archived: Boolean(row.archived), createdAt: String(row.created_at),
  }));
}

export function getAsset(id: string): AssetRecord | null {
  return listAssets(true).find((asset) => asset.id === id) || null;
}

export function assetPublicUrl(id: string): string | null {
  const asset = getAsset(id);
  if (!asset) return null;
  if (asset.builtin) return `/api/media/${encodeURIComponent(asset.id)}`;
  return asset.url || `/api/media/${encodeURIComponent(asset.id)}`;
}

export function insertAsset(asset: Omit<AssetRecord, "preset" | "builtin" | "archived" | "createdAt" | "url">) {
  db.prepare(`INSERT INTO assets (id, name, kind, file_path, thumb_path, mime, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
    asset.id, asset.name, asset.kind, asset.filePath, asset.thumbPath, asset.mime, asset.width, asset.height,
  );
  return getAsset(asset.id)!;
}

export function archiveAsset(id: string) {
  const asset = getAsset(id);
  if (!asset || asset.preset) throw new Error("Preset assets cannot be archived");
  const references = JSON.stringify({ draft: getDraftContent(), current: getPublishedContent() });
  if (references.includes(`\"${id}\"`)) throw new Error("This asset is still referenced by site content");
  db.prepare("UPDATE assets SET archived = 1 WHERE id = ?").run(id);
}

export function contentStatus() {
  return db.prepare("SELECT updated_at AS updatedAt, published_at AS publishedAt, previous_json IS NOT NULL AS canRollback FROM content_state WHERE id = 1").get() as { updatedAt: string; publishedAt: string; canRollback: number };
}
