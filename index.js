import app from "./src/js/app/app.js";
import { initSite } from "./src/js/modules/site.js";
import { initEasterEgg } from "./src/js/modules/easterEgg.js";

document.addEventListener("DOMContentLoaded", () => {
  initSite();
  // The hub page has the header and footer but no tool.
  if (document.querySelector("#formApp")) app();
  initEasterEgg();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Resolve against this module's own URL (not the page's), so the SEO
    // landing pages under /t/<slug>/ still find the root-level sw.js.
    const swUrl = new URL("./sw.js", import.meta.url);
    // No explicit `scope`: it defaults to swUrl's own directory (the site
    // root), which is what we want regardless of which page registers it.
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
