// Guards for the hand-written parts of index.html: the counters, the menu and
// footer links and the promo bar are typed by hand, so these tests keep them
// in step with the transformer registry.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { transformers } from "./src/js/core.js";
import msg from "./src/js/data/msg.js";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
const ids = Object.keys(transformers);
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

test("the whole site is one page: no link leaves index.html for another page", () => {
  const body = html.slice(html.indexOf("<body>"));
  const internal = [...body.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)]
    .map((m) => m[1])
    .filter((href) => !/^[a-z][a-z0-9+.-]*:/i.test(href));
  assert.ok(internal.length > 0);
  internal.forEach((href) => assert.match(href, /^#/, `link to another page: ${href}`));
});

test("every in-page link is a section of the page or a real transformer id", () => {
  const sectionIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const linked = [...html.matchAll(/<a\b[^>]*\shref="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(linked.length > 0);
  linked.forEach((anchor) =>
    assert.ok(
      sectionIds.has(anchor) || transformers[anchor],
      `#${anchor} is neither a section nor a transformer`
    )
  );
});

test("the directory section exists and counts the same transformers", () => {
  assert.match(html, /id="directory"/);
  assert.match(html, /<label[^>]*for="dirSearch"/);
  assert.match(html, /id="dirSearch"/);
  assert.match(html, new RegExp(`All <em>${ids.length} formats</em>`));
  assert.match(html, new RegExp(`All ${ids.length} \u2192`));
});

test("the FAQ section sits last, before the footer, and matches its JSON-LD", () => {
  const faqAt = html.indexOf('id="faq"');
  assert.ok(faqAt > html.indexOf('aria-label="In numbers"'), "FAQ must come after the tally");
  assert.ok(faqAt < html.indexOf("<!-- st:footer -->"), "FAQ must come before the footer");

  const shown = [...html.matchAll(/<summary class="luz-faq__question">([^<]+)<\/summary>/g)].map((m) =>
    m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  );
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .find((data) => data["@type"] === "FAQPage");
  assert.ok(ld, "FAQPage JSON-LD not found");
  assert.deepEqual(
    ld.mainEntity.map((q) => q.name),
    shown
  );
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
