import { test } from "node:test";
import assert from "node:assert/strict";
import {
  urlEncode,
  urlDecode,
  hexEncode,
  hexDecode,
  base64UrlEncode,
  base64UrlDecode,
  unicodeEscape,
  unicodeUnescape,
  jsonEscape,
  jsonUnescape,
  slugify,
} from "./encoding.js";
import { FormatError } from "./errors.js";

test("urlEncode <-> urlDecode round-trip", () => {
  const original = "a b&c=d?e€";
  assert.equal(urlDecode(urlEncode(original)), original);
});

test("urlDecode throws FormatError on malformed percent-encoding", () => {
  assert.throws(() => urlDecode("%E0%A4%A"), FormatError);
});

test("hexEncode <-> hexDecode round-trip with multi-byte UTF-8", () => {
  const original = "Café €5";
  assert.equal(hexDecode(hexEncode(original)), original);
});

test("hexDecode throws FormatError on invalid input", () => {
  assert.throws(() => hexDecode("zz"), FormatError);
  assert.throws(() => hexDecode("abc"), FormatError); // odd length
});

test("base64UrlEncode <-> base64UrlDecode round-trip, no padding or +/", () => {
  const original = "subjects?a=1&b=2";
  const encoded = base64UrlEncode(original);
  assert.equal(/[+/=]/.test(encoded), false);
  assert.equal(base64UrlDecode(encoded), original);
});

test("unicodeEscape <-> unicodeUnescape round-trip, ASCII untouched", () => {
  const original = "héllo wörld";
  const escaped = unicodeEscape(original);
  assert.equal(escaped, "h\\u00e9llo w\\u00f6rld");
  assert.equal(unicodeUnescape(escaped), original);
});

test("jsonEscape <-> jsonUnescape round-trip", () => {
  const original = 'line1\nline2\t"quoted"';
  assert.equal(jsonUnescape(jsonEscape(original)), original);
});

test("jsonUnescape throws FormatError on invalid escape sequence", () => {
  assert.throws(() => jsonUnescape("unterminated \\"), FormatError);
});

test("slugify strips diacritics and non-alphanumerics", () => {
  assert.equal(slugify("Café crème brûlée!"), "cafe-creme-brulee");
  assert.equal(slugify("  Hello, World!  "), "hello-world");
});
