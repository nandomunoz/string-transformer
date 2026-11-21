// The "All formats" directory on the home page: every transformer, grouped by
// category, each linking to its deep link (#id). Built from the same registry
// and msg.js as the picker, so it can never list a transformer that does not
// exist or miss a new one. Links are plain anchors; app.js turns a click into
// "load this transformer and bring the tool into view".

// Keep in sync with the 40.0625em breakpoint in site.css.
const WIDE_QUERY = "(width >= 40.0625em)";

function createDirectory({ container, transformers, msg }) {
  if (!container) return;

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
    items.forEach(({ id, title }) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${encodeURIComponent(id)}`;
      link.textContent = title;
      item.appendChild(link);
      list.appendChild(item);
    });

    details.append(summary, list);
    fragment.appendChild(details);
  });

  container.replaceChildren(fragment);
}

export { createDirectory };
