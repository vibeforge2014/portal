import assert from "node:assert/strict";
import test from "node:test";
import { LICENSE_KEY_PATTERN, generateLicenseKey } from "../src/lib/license-key";

test("license key matches CP-XXXXX-XXXXX-XXXXX-XXXXX", () => {
  for (let i = 0; i < 100; i += 1) assert.match(generateLicenseKey(), LICENSE_KEY_PATTERN);
});

test("license keys are unique and uppercase-safe", () => {
  const keys = new Set(Array.from({ length: 500 }, generateLicenseKey));
  assert.equal(keys.size, 500);
  const key = generateLicenseKey();
  assert.equal(key, key.toUpperCase());
});
