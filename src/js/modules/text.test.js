import { test } from "node:test";
import assert from "node:assert/strict";
import { toWords } from "./text.js";

test("toWords splits on spaces, dashes and underscores", () => {
  assert.deepEqual(toWords("hello world"), ["hello", "world"]);
  assert.deepEqual(toWords("hello-world"), ["hello", "world"]);
  assert.deepEqual(toWords("hello_world"), ["hello", "world"]);
});

test("toWords splits camelCase and PascalCase boundaries", () => {
  assert.deepEqual(toWords("helloWorld"), ["hello", "World"]);
  assert.deepEqual(toWords("HelloWorld"), ["Hello", "World"]);
});

test("toWords splits acronym runs (XMLParser -> XML, Parser)", () => {
  assert.deepEqual(toWords("XMLParser"), ["XML", "Parser"]);
});

test("toWords collapses repeated whitespace and trims", () => {
  assert.deepEqual(toWords("  hello   world  "), ["hello", "world"]);
});

test("toWords on empty string returns an empty array", () => {
  assert.deepEqual(toWords(""), []);
});
