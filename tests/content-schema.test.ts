import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CONTENT } from "../src/data/default-content";
import { parseSiteContent } from "../src/lib/content-schema";

test("seed content validates and includes all nine products", () => {
  const content = parseSiteContent(DEFAULT_CONTENT);
  assert.equal(content.schemaVersion, 2);
  assert.equal(content.products.length, 9);
  assert.ok(content.products.some((product) => product.id === "lattice" && new URL(product.url).hostname === "lattice-dks.pages.dev"));
  assert.ok(content.products.some((product) => product.id === "visto" && new URL(product.url).hostname === "vibeforge2014.github.io"));
  assert.ok(content.copy.zh.headlinePlain);
  assert.ok(content.copy.en.headlinePlain);
});

test("migrates version 1 content with bilingual company defaults", () => {
  const legacy = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, unknown>;
  legacy.schemaVersion = 1;
  const copy = legacy.copy as Record<"zh" | "en", Record<string, unknown>>;
  for (const language of ["zh", "en"] as const) {
    for (const key of ["companyLabel", "companyTitle", "companyDescription", "companyLocation", "companyFocus", "companyPrinciple"]) delete copy[language][key];
  }
  copy.zh.studio = "独立软件工作室";
  copy.zh.about = "了解 ZenSoft";
  copy.en.studio = "Independent software studio";
  copy.en.about = "About ZenSoft";
  const migrated = parseSiteContent(legacy);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.copy.zh.studio, "绍兴市臻书科技有限公司");
  assert.equal(migrated.copy.en.about, "About Zhenshu Technology");
  assert.equal(migrated.copy.zh.companyLocation, "浙江绍兴 · 中国");
});

test("rejects non-HTTPS/HTTP product URLs", () => {
  const content = structuredClone(DEFAULT_CONTENT);
  content.products[0].url = "javascript:alert(1)";
  assert.throws(() => parseSiteContent(content));
});

test("rejects missing bilingual copy", () => {
  const content = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, unknown>;
  const copy = content.copy as Record<string, unknown>;
  delete copy.en;
  assert.throws(() => parseSiteContent(content));
});
