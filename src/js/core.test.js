import { test } from "node:test";
import assert from "node:assert/strict";
import { strTo, transformers } from "./core.js";
import msg from "./data/msg.js";

test("strTo resolves { ok: true, value } for a valid transform", async () => {
  const result = await strTo({ mode: "upperCase", str: "hello", transformers });
  assert.deepEqual(result, { ok: true, value: "HELLO", error: null });
});

test("strTo resolves { ok: false, error } for invalid input (FormatError)", async () => {
  const result = await strTo({ mode: "morse2Text", str: "not morse", transformers });
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, "string");
});

test("strTo resolves { ok: false } without throwing for an unknown mode", async () => {
  const result = await strTo({ mode: "doesNotExist", str: "hello", transformers });
  assert.equal(result.ok, false);
});

test("strTo trims the input once before passing it to the transformer", async () => {
  const result = await strTo({ mode: "upperCase", str: "  hi  ", transformers });
  assert.equal(result.value, "HI");
});

test("strTo awaits async transformers (hashing)", async () => {
  const result = await strTo({ mode: "sha256", str: "abc", transformers });
  assert.equal(result.ok, true);
  assert.equal(result.value.length, 64);
});

test("every registered transformer has a matching msg entry (menu would crash otherwise)", () => {
  const missing = Object.keys(transformers).filter((id) => !msg[id]);
  assert.deepEqual(missing, []);
});

test("every transformer is callable on an empty string without throwing an unhandled error", async () => {
  for (const mode of Object.keys(transformers)) {
    await strTo({ mode, str: "", transformers });
  }
});
