// Guards for the hand-written parts of index.html: the counters, the menu and
// footer links and the promo bar are typed by hand, so these tests keep them
// in step with the transformer registry.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { transformers } from "./src/js/core.js";
import msg from "./src/js/data/msg.js";
import { toWords } from "./src/js/modules/text.js";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const ids = Object.keys(transformers);
const slugs = new Set(ids.map((id) => toWords(id).join("-").toLowerCase()));
const groups = new Set(ids.map((id) => msg[id].category));

test("the counters match the registry", () => {
  const counter = html.match(
    /<p class="counter"><strong>(\d+)<\/strong> transformers in <strong>(\d+)<\/strong> groups/
  );
  assert.ok(counter, "counter line not found");
  assert.equal(Number(counter[1]), ids.length);
  assert.equal(Number(counter[2]), groups.size);

  const tally = [...html.matchAll(/<dt>(Transformers|Groups)<\/dt><dd>(\d+)<\/dd>/g)];
  assert.deepEqual(Object.fromEntries(tally.map(([, label, value]) => [label, Number(value)])), {
    Transformers: ids.length,
    Groups: groups.size,
  });
});

test("every t/<slug>/ link points at a real transformer page", () => {
  const links = [...html.matchAll(/href="t\/([^"/]+)\/"/g)].map((m) => m[1]);
  assert.ok(links.length > 0);
  links.forEach((slug) => assert.ok(slugs.has(slug), `unknown transformer page: t/${slug}/`));
});

test("every promo link deep-links to a real transformer id", () => {
  const promo = html.match(/<nav class="promo"[\s\S]*?<\/nav>/)[0];
  const linked = [...promo.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(linked.length > 0);
  linked.forEach((id) => assert.ok(transformers[id], `unknown transformer id: #${id}`));
});

test("LUZ is the only design system: no Pico left in the app", async () => {
  const files = ["index.html", "sw.js", "style.css", "scripts/build-seo-pages.mjs"];
  for (const dir of ["src/css", "src/js/modules", "src/js/app"]) {
    for (const name of await readdir(new URL(`./${dir}/`, import.meta.url))) {
      if (/\.(css|js)$/.test(name)) files.push(`${dir}/${name}`);
    }
  }
  for (const file of files) {
    const text = await readFile(new URL(`./${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(text, /pico/i, `${file} still mentions Pico`);
  }
});
