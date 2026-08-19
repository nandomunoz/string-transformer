import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rot13,
  atbash,
  rot47,
  textToNato,
  natoToText,
  textToLeet,
  smallCaps,
  fullwidthText,
  zalgoText,
} from "./ciphers.js";

test("rot13 is self-inverse", () => {
  const original = "Hello, World!";
  assert.equal(rot13(rot13(original)), original);
  assert.notEqual(rot13(original), original);
});

test("atbash is self-inverse", () => {
  const original = "Hello, World!";
  assert.equal(atbash(atbash(original)), original);
  assert.equal(atbash("abc"), "zyx");
});

test("rot47 is self-inverse", () => {
  const original = "Hello, World! 123";
  assert.equal(rot47(rot47(original)), original);
});

test("textToNato <-> natoToText round-trips letters/digits", () => {
  const original = "SOS 911";
  assert.equal(natoToText(textToNato(original)), original);
});

test("textToLeet substitutes common letters", () => {
  assert.equal(textToLeet("leet"), "1337");
});

test("smallCaps maps letters with real small-cap glyphs and leaves others untouched", () => {
  assert.equal(smallCaps("abcqsx"), "ᴀʙᴄqsx");
});

test("fullwidthText converts printable ASCII and spaces", () => {
  assert.equal(fullwidthText("Hi").length, 2);
  assert.notEqual(fullwidthText("Hi"), "Hi");
});

test("zalgoText preserves the base characters and only adds marks", () => {
  const result = zalgoText("hi");
  assert.equal(result.normalize("NFD").replace(/[^a-z]/gi, ""), "hi");
});
