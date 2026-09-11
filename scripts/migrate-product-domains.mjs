import Database from "better-sqlite3";

const databasePath = process.env.ZENSOFT_DB_PATH;
if (!databasePath) throw new Error("ZENSOFT_DB_PATH is required");

const productDomains = new Map([
  ["chargepilot", "https://chargepilot.zensoft.top/"],
  ["minuteflow", "https://minuteflow.zensoft.top/"],
  ["serverhub", "https://serverhub.zensoft.top/"],
  ["tellyra", "https://tellyra.zensoft.top/"],
  ["tivon", "https://tivon.zensoft.top/"],
  ["tunesync", "https://tunesync.zensoft.top/"],
  ["tailtalk", "https://tailtalk.zensoft.top/"],
]);

function migrateSnapshot(value, column) {
  if (value == null) return null;
  const content = JSON.parse(value);
  if (!Array.isArray(content.products)) throw new Error(`${column} has no products array`);
  const seen = new Set();
  for (const product of content.products) {
    const nextUrl = productDomains.get(product.id);
    if (!nextUrl) continue;
    product.url = nextUrl;
    seen.add(product.id);
  }
  if (seen.size !== productDomains.size) {
    const missing = [...productDomains.keys()].filter((id) => !seen.has(id));
    throw new Error(`${column} is missing products: ${missing.join(", ")}`);
  }
  return JSON.stringify(content);
}

const database = new Database(databasePath);
database.pragma("busy_timeout = 10000");
const migrate = database.transaction(() => {
  const row = database.prepare("SELECT draft_json, current_json, previous_json FROM content_state WHERE id = 1").get();
  if (!row) throw new Error("content_state row is missing");
  const draft = migrateSnapshot(row.draft_json, "draft_json");
  const current = migrateSnapshot(row.current_json, "current_json");
  const previous = migrateSnapshot(row.previous_json, "previous_json");
  database.prepare(`
    UPDATE content_state
    SET draft_json = ?, current_json = ?, previous_json = ?,
        updated_at = CURRENT_TIMESTAMP, published_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(draft, current, previous);
});

migrate();
const current = JSON.parse(database.prepare("SELECT current_json FROM content_state WHERE id = 1").pluck().get());
database.close();
process.stdout.write(`${current.products.map(({ id, url }) => `${id}=${url}`).join("\n")}\n`);
