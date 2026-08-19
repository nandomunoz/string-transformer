import { test } from "node:test";
import assert from "node:assert/strict";
import { sha1, sha256, sha512 } from "./hashing.js";

// Known test vectors so a broken implementation can't accidentally pass.
test("sha256 matches known vectors", async () => {
  assert.equal(
    await sha256(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  );
  assert.equal(
    await sha256("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
});

test("sha1 matches a known vector", async () => {
  assert.equal(await sha1("abc"), "a9993e364706816aba3e25717850c26c9cd0d89d");
});

test("sha512 produces a 128 hex-char digest", async () => {
  const result = await sha512("abc");
  assert.equal(result.length, 128);
  assert.match(result, /^[0-9a-f]+$/);
});
