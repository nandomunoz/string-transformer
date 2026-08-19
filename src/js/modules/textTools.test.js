import { test } from "node:test";
import assert from "node:assert/strict";
import {
  removeExtraSpaces,
  removeEmptyLines,
  sortLines,
  sortLinesDesc,
  dedupeLines,
  reverseLines,
} from "./textTools.js";

test("removeExtraSpaces collapses repeated spaces/tabs per line", () => {
  assert.equal(removeExtraSpaces("hello   world\n foo\tbar "), "hello world\nfoo bar");
});

test("removeEmptyLines drops blank lines", () => {
  assert.equal(removeEmptyLines("a\n\nb\n   \nc"), "a\nb\nc");
});

test("sortLines / sortLinesDesc", () => {
  assert.equal(sortLines("banana\napple\ncherry"), "apple\nbanana\ncherry");
  assert.equal(sortLinesDesc("banana\napple\ncherry"), "cherry\nbanana\napple");
});

test("dedupeLines keeps first occurrence only", () => {
  assert.equal(dedupeLines("a\nb\na\nc\nb"), "a\nb\nc");
});

test("reverseLines reverses line order", () => {
  assert.equal(reverseLines("a\nb\nc"), "c\nb\na");
});
