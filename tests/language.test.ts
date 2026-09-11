import test from "node:test";
import assert from "node:assert/strict";
import { matchAcceptLanguage, normalizeLanguage } from "../src/lib/language";

test("normalizes supported language tags", () => {
  assert.equal(normalizeLanguage("zh-CN"), "zh");
  assert.equal(normalizeLanguage("en-US"), "en");
  assert.equal(normalizeLanguage("fr-FR"), null);
});

test("matches the highest-priority supported browser language", () => {
  assert.equal(matchAcceptLanguage("en-US,en;q=0.9,zh-CN;q=0.8"), "en");
  assert.equal(matchAcceptLanguage("ja-JP,zh-CN;q=0.9,en;q=0.8"), "zh");
  assert.equal(matchAcceptLanguage("fr-FR,fr;q=0.9"), "zh");
});
