import Database from "better-sqlite3";
import { DEFAULT_CONTENT } from "../src/data/default-content";
import { parseSiteContent, type SiteContent } from "../src/lib/content-schema";

const databasePath = process.argv[2];
if (!databasePath) throw new Error("Usage: tsx scripts/publish-corporate-copy.ts <database-path>");

function applyCorporateCopy(content: SiteContent): SiteContent {
  const productCopy = new Map(DEFAULT_CONTENT.products.map((product) => [product.id, product.copy]));
  return parseSiteContent({
    ...content,
    copy: structuredClone(DEFAULT_CONTENT.copy),
    products: content.products.map((product) => ({
      ...product,
      copy: structuredClone(productCopy.get(product.id) ?? product.copy),
    })),
    seo: structuredClone(DEFAULT_CONTENT.seo),
  });
}

const database = new Database(databasePath);
database.pragma("busy_timeout = 10000");
database.pragma("journal_mode = WAL");

const publish = database.transaction(() => {
  const row = database.prepare("SELECT current_json FROM content_state WHERE id = 1").get() as { current_json: string } | undefined;
  if (!row) throw new Error("Content state is not initialized");
  const current = parseSiteContent(JSON.parse(row.current_json));
  const updated = applyCorporateCopy(current);
  const updatedJson = JSON.stringify(updated);
  database.prepare(`
    UPDATE content_state
    SET previous_json = current_json,
        current_json = ?,
        draft_json = ?,
        published_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(updatedJson, updatedJson);
  return updated;
});

const published = publish();
database.close();
console.log(JSON.stringify({ schemaVersion: published.schemaVersion, products: published.products.length, title: published.seo.title }));
