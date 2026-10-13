import assert from "node:assert/strict";
import test from "node:test";
import { generateLicenseKey, licenseKeyPattern, type LicenseProduct } from "../src/lib/license-key";

test("license keys match per-product patterns", () => {
  for (const product of ["chargepilot", "minuteflow"] as LicenseProduct[]) {
    for (let i = 0; i < 100; i += 1) assert.match(generateLicenseKey(product), licenseKeyPattern(product));
  }
});

test("license keys are unique, uppercase-safe and product-prefixed", () => {
  const keys = new Set(Array.from({ length: 500 }, () => generateLicenseKey()));
  assert.equal(keys.size, 500);
  const key = generateLicenseKey();
  assert.equal(key, key.toUpperCase());
  assert.ok(key.startsWith("CP-"));
  assert.ok(generateLicenseKey("minuteflow").startsWith("MF-"));
  assert.doesNotMatch(generateLicenseKey("minuteflow"), licenseKeyPattern("chargepilot"));
});
