import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CONTENT } from "../src/data/default-content";
import { parseSiteContent } from "../src/lib/content-schema";

test("seed content validates and includes all nine products", () => {
  const content = parseSiteContent(DEFAULT_CONTENT);
  assert.equal(content.schemaVersion, 3);
  assert.equal(content.products.length, 9);
  assert.ok(content.products.some((product) => product.id === "lattice" && new URL(product.url).hostname === "lattice-dks.pages.dev"));
  assert.ok(content.products.some((product) => product.id === "visto" && new URL(product.url).hostname === "vibeforge2014.github.io"));
  assert.ok(content.copy.zh.heroTitle);
  assert.ok(content.copy.en.heroTitle);
  assert.equal(content.copy.zh.companyLocation, "浙江省绍兴市");
  assert.equal(content.copy.zh.scopeList.length, 3);
});

test("migrates version 1 content through v2 to v3 with company defaults", () => {
  const legacy = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, unknown>;
  legacy.schemaVersion = 1;
  const copy = legacy.copy as Record<"zh" | "en", Record<string, unknown>>;
  for (const language of ["zh", "en"] as const) {
    for (const key of ["companyLabel", "companyTitle", "companyDescription", "companyLocation"]) delete copy[language][key];
  }
  const migrated = parseSiteContent(legacy);
  assert.equal(migrated.schemaVersion, 3);
  // v1→v2 补回公司区块文案，v2→v3 将旧默认值重映射为新定位。
  assert.equal(migrated.copy.zh.companyTitle, "从真实需求出发，\n持续开发，长期维护。");
  assert.equal(migrated.copy.zh.companyDescription.includes("各类平台"), true);
  assert.equal(migrated.copy.zh.companyLocation, "浙江省绍兴市");
  // v2→v3 注入的业务范围默认值。
  assert.equal(migrated.copy.zh.scopeList.length, 3);
  assert.equal(migrated.copy.zh.productsLabel, "软件产品");
  assert.equal(migrated.copy.en.productsLabel, "Products");
});

test("migrates version 2 content by remapping old default copy to the new positioning", () => {
  const legacy = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, unknown>;
  legacy.schemaVersion = 2;
  const copy = legacy.copy as Record<"zh" | "en", Record<string, unknown>>;
  copy.zh = { ...copy.zh, headlinePlain: "专注 Apple 平台，打造", headlineAccent: "清晰、可靠的原生应用。", heroDescription: "ZenSoft 面向 macOS、iOS 与 Apple TV 提供原生应用，关注实际使用场景、产品稳定性与数据隐私。", companyDescription: "旧的公司介绍。", footer: "面向 Apple 平台的原生应用与软件服务。" } as Record<string, unknown>;
  copy.en = { ...copy.en, headlinePlain: "Native applications for", headlineAccent: "Apple platforms." } as Record<string, unknown>;
  const migrated = parseSiteContent(legacy);
  assert.equal(migrated.schemaVersion, 3);
  // 旧默认标题（拼接结果）与旧默认描述/页脚 → 新定位。
  assert.equal(migrated.copy.zh.heroTitle, "打造小而美的原生应用。");
  assert.equal(migrated.copy.en.heroTitle, "Well-crafted native apps,\nsmall by design.");
  assert.equal(migrated.copy.zh.heroDescription.includes("各类平台"), true);
  assert.equal(migrated.copy.zh.footer, "原生应用与软件服务。");
  // 后台自定义值原样保留。
  assert.equal(migrated.copy.zh.companyDescription, "旧的公司介绍。");
});

test("v2 migration replaces old default SEO but keeps customized values", () => {
  const legacy = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, unknown>;
  legacy.schemaVersion = 2;
  legacy.seo = {
    title: "ZenSoft — Apple 平台原生应用",
    description: "自定义描述，不能被覆盖。",
    openGraphTitle: "ZenSoft — Apple 平台原生应用",
    openGraphDescription: "绍兴市臻书科技有限公司面向 macOS、iOS 与 Apple TV 开发和维护原生应用。",
  };
  const migrated = parseSiteContent(legacy);
  assert.equal(migrated.seo.title, "ZenSoft 臻书科技");
  assert.equal(migrated.seo.openGraphTitle, "ZenSoft 臻书科技");
  assert.equal(migrated.seo.openGraphDescription.includes("在线工具服务"), true);
  assert.equal(migrated.seo.description, "自定义描述，不能被覆盖。");
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
