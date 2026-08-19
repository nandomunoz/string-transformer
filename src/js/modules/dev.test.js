import { test } from "node:test";
import assert from "node:assert/strict";
import { jwtDecode, countStats } from "./dev.js";
import { base64UrlEncode } from "./encoding.js";
import { FormatError } from "./errors.js";

test("jwtDecode reads the payload without verifying the signature", () => {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ sub: "1234", name: "Ada" }));
  const token = `${header}.${payload}.fakesignature`;
  assert.equal(jwtDecode(token), JSON.stringify({ sub: "1234", name: "Ada" }, null, 2));
});

test("jwtDecode throws FormatError on malformed input", () => {
  assert.throws(() => jwtDecode("not-a-jwt"), FormatError);
  assert.throws(() => jwtDecode("a.b.c"), FormatError); // valid shape, invalid base64/json
});

test("countStats reports characters, words, lines and UTF-8 bytes", () => {
  const stats = countStats("Café\nhello world");
  assert.match(stats, /Characters: 16/);
  assert.match(stats, /Words: 3/);
  assert.match(stats, /Lines: 2/);
  assert.match(stats, /Bytes \(UTF-8\): 17/);
});
