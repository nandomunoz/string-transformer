import { test } from "node:test";
import assert from "node:assert/strict";
import checker from "./checker.js";

test("isBinary accepts space-separated bytes (round-trip output shape)", () => {
  assert.equal(checker.isBinary("01001000 01101001"), true);
  assert.equal(checker.isBinary("0100100001101001"), true);
});

test("isBinary rejects non-binary or misaligned strings", () => {
  assert.equal(checker.isBinary(""), false);
  assert.equal(checker.isBinary("0100"), false); // not a multiple of 8
  assert.equal(checker.isBinary("hello"), false);
});

test("isBase64 validates real Base64 strings", () => {
  assert.equal(checker.isBase64(btoa("hello")), true);
  assert.equal(checker.isBase64("not base64!!"), false);
});

test("isMorse accepts dots, dashes, spaces and slashes", () => {
  assert.equal(checker.isMorse(".... .. / - .... . .-. ."), true);
});
