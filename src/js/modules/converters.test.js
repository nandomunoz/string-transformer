import { test } from "node:test";
import assert from "node:assert/strict";
import {
  binary2Utf8,
  utf82binary,
  base64ToASCII,
  ASCIIToBase64,
  text2Morse,
  morse2Text,
  escapeHtml2String,
  escapeString2Html,
} from "./converters.js";
import { FormatError } from "./errors.js";

test("utf82binary -> binary2Utf8 round-trips plain ASCII", () => {
  const original = "Hello";
  assert.equal(binary2Utf8(utf82binary(original)), original);
});

test("utf82binary -> binary2Utf8 round-trips multi-byte UTF-8 (accented and emoji)", () => {
  const original = "Café €5 🚀";
  assert.equal(binary2Utf8(utf82binary(original)), original);
});

test("binary2Utf8 throws FormatError on invalid input", () => {
  assert.throws(() => binary2Utf8("not binary"), FormatError);
  assert.throws(() => binary2Utf8("0100"), FormatError); // not a multiple of 8
});

test("ASCIIToBase64 -> base64ToASCII round-trips multi-byte UTF-8", () => {
  const original = "Café €5 🚀 ñandú";
  assert.equal(base64ToASCII(ASCIIToBase64(original)), original);
});

test("base64ToASCII throws FormatError on invalid input", () => {
  assert.throws(() => base64ToASCII("not-valid-base64!!"), FormatError);
});

test("text2Morse -> morse2Text round-trips words", () => {
  const original = "HELLO WORLD";
  assert.equal(morse2Text(text2Morse(original)), original);
});

test("morse2Text throws FormatError on invalid input", () => {
  assert.throws(() => morse2Text("not morse at all"), FormatError);
});

test("escapeHtml2String <-> escapeString2Html round-trip", () => {
  const original = `<div class="x">Tom & Jerry's "quote"</div>`;
  const escaped = escapeHtml2String(original);
  assert.equal(escapeString2Html(escaped), original);
});

test("escapeString2Html unescapes &amp; last to avoid double-decoding", () => {
  // A literal "&lt;" that was itself escaped should come back as "&lt;", not "<"
  assert.equal(escapeString2Html("&amp;lt;"), "&lt;");
});
