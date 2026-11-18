#!/usr/bin/env node
// Generates one static, crawlable landing page per transformer (t/<slug>/),
// a hub page listing them all (t/), sitemap.xml and robots.txt.
//
// Why: a single-page app with an in-JS menu has nothing for search engines to
// index per keyword ("camel case converter", "base64 decode online"...). This
// script produces real, unique HTML per transformer while reusing the exact
// same app shell/JS/CSS, so every page is also a fully working tool.
//
// Vanilla Node only, no dependencies, no bundler.
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { transformers, strTo } from "../src/js/core.js";
import msg from "../src/js/data/msg.js";
import { findOppositeId } from "../src/js/data/opposites.js";
import { base64UrlEncode } from "../src/js/modules/encoding.js";
import { escapeHtml2String } from "../src/js/modules/converters.js";
import { toWords } from "../src/js/modules/text.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "t");

// Relative paths (not a hardcoded absolute prefix) so the generated pages work
// under any subpath/domain and can be tested with a plain static server.
const BASE_URL = "https://nandovejer.github.io/string-transformer/";
const DEFAULT_SAMPLE = "Hello World";

const esc = (str) => escapeHtml2String(String(str));

const idToSlug = (id) =>
  toWords(id)
    .join("-")
    .toLowerCase();

async function getSample(id) {
  if (id === "jwtDecode") {
    const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = base64UrlEncode(
      JSON.stringify({ sub: "1234567890", name: "Ada Lovelace" })
    );
    return `${header}.${payload}.signature`;
  }

  const oppositeId = findOppositeId(id);
  if (oppositeId && oppositeId !== id) {
    const directTry = await strTo({ mode: id, str: DEFAULT_SAMPLE, transformers });
    if (!directTry.ok) {
      const encoded = await strTo({ mode: oppositeId, str: DEFAULT_SAMPLE, transformers });
      if (encoded.ok) return encoded.value;
    }
  }
  return DEFAULT_SAMPLE;
}

function buildFaq({ id, entry, oppositeId }) {
  const reversibility =
    oppositeId == null
      ? "Not directly — this transformation is one-way, so the exact original text can't always be reconstructed from the output alone."
      : oppositeId === id
      ? `Yes — run ${entry.title} on the result again and you'll get the original text back.`
      : `Yes — use "${(msg[oppositeId] || {}).title || oppositeId}" to convert the output back to the original text.`;

  return [
    { q: `Is ${entry.title.toLowerCase()} reversible?`, a: reversibility },
    {
      q: "Does it handle accented letters and emoji correctly?",
      a: "Yes. It encodes and decodes real UTF-8 bytes, so characters like á, ñ, €, and emoji work correctly — not just plain ASCII.",
    },
    {
      q: "Is my text uploaded anywhere?",
      a: "No. Everything runs locally in your browser in vanilla JavaScript — nothing you type ever leaves your device.",
    },
  ];
}

function renderFaqHtml(faqs) {
  return faqs
    .map(
      (faq) => `        <details>
          <summary>${esc(faq.q)}</summary>
          <p>${esc(faq.a)}</p>
        </details>`
    )
    .join("\n");
}

function renderJsonLd({ id, entry, slug, faqs }) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: `${entry.title} — String Transformer`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        url: `${BASE_URL}t/${slug}/`,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: entry.description,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };
  return JSON.stringify(data, null, 2);
}

function renderRelatedLinks({ id, entry, pagesById }) {
  const related = Object.values(pagesById)
    .filter((page) => page.entry.category === entry.category && page.id !== id)
    .slice(0, 6);
  if (related.length === 0) return "";
  const items = related
    .map(
      (page) =>
        `          <li><a href="../${page.slug}/">${esc(page.entry.title)}</a></li>`
    )
    .join("\n");
  return `      <h2>Related transformers</h2>
      <ul>
${items}
      </ul>
`;
}

/**
 * Pulls a marked block out of index.html. The app shell (form, theme
 * bootstrap) lives in exactly one place — the real page — instead of being
 * copy-pasted here, which is how the two used to drift apart.
 * @param {string} html contents of index.html
 * @param {string} name marker name, e.g. "app" for <!-- st:app -->
 * @returns {string}
 */
function extractMarkedBlock(html, name) {
  const open = `<!-- st:${name} -->`;
  const close = `<!-- /st:${name} -->`;
  const start = html.indexOf(open);
  const end = html.indexOf(close);
  if (start === -1 || end === -1) {
    throw new Error(`index.html is missing the ${open} ... ${close} markers`);
  }
  return html.slice(start + open.length, end).trim();
}

/** Re-indents an extracted block so the generated HTML stays readable. */
function indentBlock(block, spaces) {
  const pad = " ".repeat(spaces);
  return block
    .split("\n")
    .map((line) => (line.trim() === "" ? line : pad + line))
    .join("\n");
}

function renderHeader(prefix) {
  return `    <header class="st-appbar">
      <div class="st-appbar-inner container">
        <p class="st-brand"><a href="${prefix}">String Transformer</a></p>
        <p class="st-tagline">50+ text formats, converted as you type</p>
        <nav id="stMenu" aria-label="Transformer selector"></nav>
        <div class="st-appbar-actions">
          <button
            id="themeToggleBtn"
            type="button"
            class="st-icon-btn"
            aria-label="Toggle light/dark theme"
          >
            <span aria-hidden="true">\u{1F313}</span>
            <span class="st-icon-btn-label">Theme</span>
          </button>
        </div>
      </div>
    </header>`;
}

function renderFooter(browseHref) {
  const browseLink = browseHref
    ? `\n        \u00B7 <a href="${browseHref}">Browse all transformers</a>`
    : "";
  return `    <footer class="container">
      <small
        >Project by
        <a title="Author Site" href="https://github.com/nandomunoz">Nando Mu\u00F1oz</a>
        \u00B7 Code licensed <a title="MIT License" href="https://opensource.org/licenses/MIT">MIT</a>${browseLink}</small
      >
    </footer>`;
}

function renderTransformerPage({
  id,
  entry,
  slug,
  sample,
  output,
  faqs,
  pagesById,
  shell,
}) {
  const pageTitle = `${entry.title} — Free Online Converter`;
  const metaDescription = `${entry.description}. Free, instant, and works offline — nothing leaves your browser.`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="color-scheme" content="dark light" />
    <title>${esc(pageTitle)} | String Transformer</title>
    <meta name="description" content="${esc(metaDescription)}" />
    <link rel="canonical" href="${BASE_URL}t/${slug}/" />
    <meta name="theme-color" content="#161b22" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <link rel="icon" type="image/svg+xml" href="../../favicon.svg" />
    <link rel="manifest" href="../../manifest.json" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(pageTitle)}" />
    <meta property="og:description" content="${esc(metaDescription)}" />
    <meta property="og:url" content="${BASE_URL}t/${slug}/" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${esc(pageTitle)}" />
    <meta name="twitter:description" content="${esc(metaDescription)}" />

    <link rel="stylesheet" href="../../src/css/vendor/pico.min.css" />
    <link rel="stylesheet" href="../../style.css" />
${indentBlock(shell.themeBootstrap, 4)}
    <script>
      if (!location.hash) location.hash = "#${id}";
    </script>
    <script type="module" src="../../index.js"></script>
    <script type="application/ld+json">
${renderJsonLd({ id, entry, slug, faqs })}
    </script>
  </head>
  <body>
    <a class="st-skip-link" href="#input">Skip to the converter</a>
${renderHeader("../../")}
    <main class="container">
      <article class="st-seo-content">
        <h1>${esc(pageTitle)}</h1>
        <p>${esc(entry.description)}. Type or paste your text in the tool below to convert it instantly.</p>
        <div class="st-table-scroll">
          <table>
            <thead>
              <tr><th scope="col">Input</th><th scope="col">Output</th></tr>
            </thead>
            <tbody>
              <tr><td><code>${esc(sample)}</code></td><td><code>${esc(output)}</code></td></tr>
            </tbody>
          </table>
        </div>
        <h2>Frequently asked questions</h2>
${renderFaqHtml(faqs)}
${renderRelatedLinks({ id, entry, pagesById })}
      </article>
${indentBlock(shell.app, 6)}
    </main>
${renderFooter("../")}
  </body>
</html>
`;
}

function renderHubPage(pagesById, shell) {
  const byCategory = new Map();
  Object.values(pagesById).forEach((page) => {
    const category = page.entry.category || "Other";
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(page);
  });

  const sections = Array.from(byCategory.entries())
    .map(([category, pages]) => {
      const items = pages
        .map(
          (page) => `            <li><a href="${page.slug}/">${esc(page.entry.title)}</a></li>`
        )
        .join("\n");
      return `        <section>
          <h2>${esc(category)}</h2>
          <ul class="st-seo-links">
${items}
          </ul>
        </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="color-scheme" content="dark light" />
    <title>All Text Transformers — String Transformer</title>
    <meta
      name="description"
      content="Browse every text transformer: case conversion, encoding, ciphers, hashing, dev tools and text utilities. Free, instant, works offline."
    />
    <link rel="canonical" href="${BASE_URL}t/" />
    <meta name="theme-color" content="#161b22" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
    <link rel="icon" type="image/svg+xml" href="../favicon.svg" />
    <link rel="manifest" href="../manifest.json" />
    <link rel="stylesheet" href="../src/css/vendor/pico.min.css" />
    <link rel="stylesheet" href="../style.css" />
${indentBlock(shell.themeBootstrap, 4)}
  </head>
  <body>
    <header class="st-appbar">
      <div class="st-appbar-inner container">
        <p class="st-brand"><a href="../">String Transformer</a></p>
      </div>
    </header>
    <main class="container">
      <article class="st-seo-content">
        <h1>All transformers</h1>
        <p>Every text transformation String Transformer supports, grouped by category.</p>
${sections}
      </article>
    </main>
${renderFooter(null)}
  </body>
</html>
`;
}

function renderSitemap(pagesById) {
  const urls = [
    `${BASE_URL}`,
    `${BASE_URL}t/`,
    ...Object.values(pagesById).map((page) => `${BASE_URL}t/${page.slug}/`),
  ];
  const entries = urls
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function renderRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}sitemap.xml\n`;
}

async function main() {
  const indexHtml = await readFile(path.join(ROOT_DIR, "index.html"), "utf8");
  const shell = {
    app: extractMarkedBlock(indexHtml, "app"),
    themeBootstrap: extractMarkedBlock(indexHtml, "theme-bootstrap"),
  };

  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const ids = Object.keys(transformers);
  const pagesById = {};
  ids.forEach((id) => {
    const entry = msg[id] || msg.defaultConverter;
    pagesById[id] = { id, slug: idToSlug(id), entry };
  });

  for (const id of ids) {
    const { slug, entry } = pagesById[id];
    const sample = await getSample(id);
    const result = await strTo({ mode: id, str: sample, transformers });
    const output = result.ok ? result.value : "";
    const oppositeId = findOppositeId(id);
    const faqs = buildFaq({ id, entry, oppositeId });

    const html = renderTransformerPage({
      id,
      entry,
      slug,
      sample,
      output,
      faqs,
      pagesById,
      shell,
    });

    const pageDir = path.join(OUTPUT_DIR, slug);
    await mkdir(pageDir, { recursive: true });
    await writeFile(path.join(pageDir, "index.html"), html, "utf8");
  }

  await writeFile(path.join(OUTPUT_DIR, "index.html"), renderHubPage(pagesById, shell), "utf8");
  await writeFile(path.join(ROOT_DIR, "sitemap.xml"), renderSitemap(pagesById), "utf8");
  await writeFile(path.join(ROOT_DIR, "robots.txt"), renderRobots(), "utf8");

  console.log(`Generated ${ids.length} transformer pages + hub + sitemap.xml + robots.txt`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
