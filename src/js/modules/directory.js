// The "All formats" directory on the home page: every transformer, grouped by
// category, each linking to its deep link (#id). Built from the same registry
// and msg.js as the picker, so it can never list a transformer that does not
// exist or miss a new one. Links are plain anchors; app.js turns a click into
// "load this transformer and bring the tool into view".
//
// An optional filter box (#dirSearch) narrows it as you type: it matches the
// title, the id and the category name, so "encoding" shows the whole group.

// Keep in sync with the 40.0625em breakpoint in site.css.
const WIDE_QUERY = "(width >= 40.0625em)";

function createDirectory({ container, transformers, msg }) {
  if (!container) return;

  const searchInput = document.querySelector("#dirSearch");
  const status = document.querySelector("#dirStatus") ?? { textContent: "" };

  const groups = new Map();
  Object.keys(transformers).forEach((id) => {
    const entry = msg[id] || msg.defaultConverter;
    const category = entry.category || "Other";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({ id, title: entry.title });
  });

  // Every group is open on a wide screen and folded on a phone, where 58 links
  // would otherwise make the page endless.
  const openByDefault = window.matchMedia(WIDE_QUERY).matches;
  const fragment = document.createDocumentFragment();
  // One record per group, so filtering never has to query the DOM again.
  const rendered = [];

  groups.forEach((items, category) => {
    const details = document.createElement("details");
    details.open = openByDefault;

    const summary = document.createElement("summary");
    const name = document.createElement("span");
    name.textContent = category;
    const count = document.createElement("span");
    count.className = "dir-count";
    count.textContent = String(items.length);
    summary.append(name, count);

    const list = document.createElement("ul");
    const entries = items.map(({ id, title }) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${encodeURIComponent(id)}`;
      link.textContent = title;
      item.appendChild(link);
      list.appendChild(item);
      return { id, title, item };
    });

    details.append(summary, list);
    fragment.appendChild(details);
    rendered.push({ category, details, count, entries });
  });

  container.replaceChildren(fragment);

  if (!searchInput) return;

  function applyFilter() {
    const needle = searchInput.value.trim().toLowerCase();
    let total = 0;

    rendered.forEach((group) => {
      // Matching the category name too means "encoding" shows the whole group.
      const categoryMatches = needle !== "" && group.category.toLowerCase().includes(needle);
      let visible = 0;
      group.entries.forEach(({ id, title, item }) => {
        const match =
          needle === "" ||
          categoryMatches ||
          title.toLowerCase().includes(needle) ||
          id.toLowerCase().includes(needle);
        item.hidden = !match;
        if (match) visible += 1;
      });

      total += visible;
      group.details.hidden = visible === 0;
      group.count.textContent = String(visible);
      // While filtering, every group with a hit is open so the hits are seen;
      // clearing the box goes back to the layout's default.
      group.details.open = needle === "" ? openByDefault : visible > 0;
    });

    if (needle === "") {
      status.textContent = "";
    } else if (total === 0) {
      status.textContent = "No format matches your search.";
    } else {
      status.textContent = `${total} ${total === 1 ? "format" : "formats"} found`;
    }
  }

  searchInput.addEventListener("input", applyFilter);
}

export { createDirectory };
