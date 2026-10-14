import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDiscountCode, parseDiscountInput } from "../src/lib/discount-code";

const input = { product: "chargepilot", plan: "", code: " vip80 ", discountType: "percent", value: "80", expiresAt: null };
test("percentage code normalizes input and keeps eight-fold payment semantics", () => {
  assert.deepEqual(parseDiscountInput(input, ["chargepilot"]), {
    product: "chargepilot", plan: null, code: "VIP80", discount_type: "percent", discount_value: 80, expires_at: null
  });
});
test("fixed discount converts exact decimal yuan to integer fen", () => {
  for (const [value, expected] of [["0.29", 29], ["10.01", 1001], ["10", 1000], ["0.01", 1]] as const) {
    assert.equal(parseDiscountInput({ ...input, discountType: "fixed", value }, ["chargepilot"]).discount_value, expected);
  }
});
test("invalid discounts cannot create a free or negative-price campaign", () => {
  for (const value of ["0", "100", "80.5", "1e1", "-20", null]) assert.throws(() => parseDiscountInput({ ...input, value }, ["chargepilot"]));
  for (const value of ["0", "-1", "1.005", "1e2", "Infinity", "1000000.01"]) assert.throws(() => parseDiscountInput({ ...input, discountType: "fixed", value }, ["chargepilot"]));
});
test("product, plan, expiry and code validation reject unsupported input", () => {
  assert.throws(() => parseDiscountInput(input, ["minuteflow"]));
  assert.throws(() => parseDiscountInput({ ...input, product: "minuteflow", plan: "annual" }, ["minuteflow"]));
  assert.throws(() => parseDiscountInput({ ...input, expiresAt: "2099-02-31T00:00:00Z" }, ["chargepilot"]));
  assert.throws(() => parseDiscountInput({ ...input, plan: "monthly" }, ["chargepilot"]));
  assert.throws(() => parseDiscountInput({ ...input, expiresAt: "2000-01-01T00:00:00Z" }, ["chargepilot"]));
  for (const code of ["A", "VIP 80", "中文优惠", "A".repeat(33), 12345]) assert.throws(() => normalizeDiscountCode(code));
  assert.equal(normalizeDiscountCode(""), "");
});
