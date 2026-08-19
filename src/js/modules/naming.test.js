import { test } from "node:test";
import assert from "node:assert/strict";
import naming from "./naming.js";

test("camelCase lowercases the first word", () => {
  assert.equal(naming.camelCase("Hello World"), "helloWorld");
  assert.equal(naming.camelCase("hello world"), "helloWorld");
});

test("pascalCase capitalizes every word", () => {
  assert.equal(naming.pascalCase("hello world"), "HelloWorld");
});

test("snakeCase / screamingSnakeCase", () => {
  assert.equal(naming.snakeCase("Hello World"), "hello_world");
  assert.equal(naming.screamingSnakeCase("Hello World"), "HELLO_WORLD");
});

test("kebabCase / screamingKebabCase", () => {
  assert.equal(naming.kebabCase("Hello World"), "hello-world");
  assert.equal(naming.screamingKebabCase("Hello World"), "HELLO-WORLD");
});

test("trainCase", () => {
  assert.equal(naming.trainCase("hello world"), "Hello-World");
});

test("camelSnakeCase", () => {
  assert.equal(naming.camelSnakeCase("hello world"), "hello_World");
});

test("case converters understand existing separators (kebab/snake -> camel)", () => {
  assert.equal(naming.camelCase("hello-world"), "helloWorld");
  assert.equal(naming.camelCase("hello_world"), "helloWorld");
  assert.equal(naming.camelCase("HelloWorld"), "helloWorld");
});

test("titleCase keeps small words lowercase except first/last", () => {
  assert.equal(naming.titleCase("the lord of the rings"), "The Lord of the Rings");
});

test("sentenceCase capitalizes only the first letter", () => {
  assert.equal(naming.sentenceCase("HELLO world FOO"), "Hello world foo");
});

test("dotCase / pathCase", () => {
  assert.equal(naming.dotCase("Hello World"), "hello.world");
  assert.equal(naming.pathCase("Hello World"), "hello/world");
});

test("spongebobCase alternates case by character index", () => {
  assert.equal(naming.spongebobCase("hello"), "hElLo");
});

test("randomCase preserves length and only changes casing", () => {
  const input = "hello world";
  const result = naming.randomCase(input);
  assert.equal(result.length, input.length);
  assert.equal(result.toLowerCase(), input.toLowerCase());
});

test("empty string is handled without throwing", () => {
  assert.equal(naming.camelCase(""), "");
  assert.equal(naming.pascalCase(""), "");
  assert.equal(naming.snakeCase(""), "");
});
