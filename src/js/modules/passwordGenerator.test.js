import { test } from "node:test";
import assert from "node:assert/strict";
import { generatePassword, estimateCrackTime } from "./passwordGenerator.js";

test("generates a password of the requested length", () => {
  const { password } = generatePassword({ length: 32 });
  assert.equal(password.length, 32);
});

test("only uses characters from the enabled sets", () => {
  const { password } = generatePassword({
    length: 40,
    lowercase: true,
    uppercase: false,
    numbers: false,
    symbols: false,
    extendedSymbols: false,
    ensureAllTypes: false,
  });
  assert.match(password, /^[a-z]+$/);
});

test("ensureAllTypes guarantees every enabled type is present", () => {
  const { password } = generatePassword({
    length: 12,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    ensureAllTypes: true,
  });
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[!@#$%^&*()_+\-=[\]{}|;:,.?]/);
});

test("excludeSimilar removes visually-confusable characters", () => {
  const { password } = generatePassword({
    length: 200,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: false,
    excludeSimilar: true,
    ensureAllTypes: false,
  });
  assert.equal(/[l1IoO0]/.test(password), false);
});

test("throws when no character type is selected", () => {
  assert.throws(() =>
    generatePassword({
      lowercase: false,
      uppercase: false,
      numbers: false,
      symbols: false,
      extendedSymbols: false,
    })
  );
});

test("throws when length is too short to include every required type", () => {
  assert.throws(() =>
    generatePassword({
      length: 2,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
      ensureAllTypes: true,
    })
  );
});

test("reports positive entropy that grows with length", () => {
  const short = generatePassword({ length: 12 });
  const long = generatePassword({ length: 32 });
  assert.ok(short.entropyBits > 0);
  assert.ok(long.entropyBits > short.entropyBits);
});

test("two generated passwords are (almost certainly) different", () => {
  const a = generatePassword({ length: 24 });
  const b = generatePassword({ length: 24 });
  assert.notEqual(a.password, b.password);
});

test("estimateCrackTime formats low entropy as near-instant", () => {
  assert.equal(estimateCrackTime(1), "less than a second");
  assert.equal(estimateCrackTime(20), "less than a second");
});

test("estimateCrackTime picks the right unit across the range", () => {
  assert.equal(estimateCrackTime(40), "55 seconds");
  assert.equal(estimateCrackTime(64), "29 years");
});

test("estimateCrackTime uses centuries and millennia before going cosmic", () => {
  assert.equal(estimateCrackTime(70), "19 centuries");
  assert.equal(estimateCrackTime(78), "479 millennia");
});

test("estimateCrackTime uses plain-language metaphors instead of scientific notation for huge spans", () => {
  const huge = estimateCrackTime(128);
  assert.doesNotMatch(huge, /[eE][+-]?\d/); // no scientific notation
  assert.doesNotMatch(huge, /[⁰¹²³⁴⁵⁶⁷⁸⁹]/); // no exponent superscripts
  assert.match(huge, /grains of sand/);

  assert.match(estimateCrackTime(256), /atoms in planet Earth/);
  assert.match(estimateCrackTime(420), /countless times more than.*atoms in the entire observable universe/);
});

test("estimateCrackTime respects a custom guesses-per-second rate", () => {
  const fast = estimateCrackTime(40, 1e10);
  const slow = estimateCrackTime(40, 1e3);
  assert.equal(fast, "55 seconds");
  assert.equal(slow, "17 years");
});

test("estimateCrackTime handles non-finite entropy without throwing", () => {
  assert.equal(estimateCrackTime(-Infinity), "an incalculable amount of time");
  assert.equal(estimateCrackTime(NaN), "an incalculable amount of time");
});

test("a full generatePassword() result produces a sane crack-time estimate", () => {
  const { entropyBits } = generatePassword({ length: 20 });
  const estimate = estimateCrackTime(entropyBits);
  assert.equal(typeof estimate, "string");
  assert.ok(estimate.length > 0);
});
