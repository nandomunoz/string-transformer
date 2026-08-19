// Accessible, searchable, categorized replacement for the old flat <select>.
// Follows the ARIA combobox-with-listbox pattern closely enough for screen
// readers and full keyboard support, without pulling in a UI framework.
//
// One component, two presentations: a dropdown on desktop, and a full-screen
// search overlay on phones (where an on-screen keyboard would otherwise cover
// a dropdown anchored to the top of the page). The switch is done in CSS via
// the `is-open` class; the JS here only adds the behaviour the overlay needs —
// scroll locking, an explicit close affordance and autofocus.

// Keep in sync with the breakpoint in command-menu.css.
const OVERLAY_QUERY = "(width < 48em)";

const isOverlayMode = () => window.matchMedia(OVERLAY_QUERY).matches;

function groupByCategory(transformers, msg) {
  const groups = new Map();
  Object.keys(transformers).forEach((id) => {
    const entry = msg[id] || msg.defaultConverter;
    const category = entry.category || "Other";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({ id, title: entry.title, category });
  });
  return groups;
}

function createCommandMenu({ container, transformers, msg, onSelect }) {
  if (!container) return null;

  const groups = groupByCategory(transformers, msg);

  const wrapper = document.createElement("div");
  wrapper.className = "command-menu";

  const panel = document.createElement("div");
  panel.className = "command-menu-panel";

  const field = document.createElement("div");
  field.className = "command-menu-field";

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search a transformer…";
  search.autocomplete = "off";
  search.setAttribute("role", "combobox");
  search.setAttribute("aria-expanded", "false");
  search.setAttribute("aria-controls", "transformerListbox");
  search.setAttribute("aria-autocomplete", "list");
  search.id = "transformerSearch";

  const labelEl = document.createElement("label");
  labelEl.htmlFor = "transformerSearch";
  labelEl.className = "sr-only";
  labelEl.textContent = "Search a transformer";

  // Purely visual affordance so the control reads as "a dropdown" at a glance,
  // not just a plain search box, before the user interacts with it.
  const chevron = document.createElement("span");
  chevron.className = "command-menu-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "▾";

  // Escape and tapping outside aren't discoverable on touch, so the overlay
  // gets a visible way out. CSS hides it outside overlay mode.
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "command-menu-close";
  closeBtn.textContent = "Cancel";

  const listbox = document.createElement("ul");
  listbox.id = "transformerListbox";
  listbox.className = "command-menu-list";
  listbox.setAttribute("role", "listbox");
  listbox.setAttribute("aria-label", "Transformers");
  listbox.hidden = true;

  field.append(search, chevron, closeBtn);
  panel.append(labelEl, field, listbox);
  wrapper.append(panel);
  container.appendChild(wrapper);

  let activeOptionEl = null;
  let activeId = null;

  const activeTitle = () => (activeId && msg[activeId] ? msg[activeId].title : "");

  function renderOptions(filter) {
    listbox.innerHTML = "";
    const needle = filter.trim().toLowerCase();
    let firstMatch = null;
    let matchCount = 0;

    groups.forEach((items, category) => {
      // Matching the category name too means "encoding" surfaces the whole
      // group, which is how people actually search this list.
      const categoryMatches = category.toLowerCase().includes(needle);
      const matches = items.filter(
        (item) =>
          categoryMatches ||
          item.title.toLowerCase().includes(needle) ||
          item.id.toLowerCase().includes(needle)
      );
      if (matches.length === 0) return;

      const heading = document.createElement("li");
      heading.className = "command-menu-category";
      heading.setAttribute("role", "presentation");
      heading.textContent = category;
      listbox.appendChild(heading);

      matches.forEach((item) => {
        matchCount += 1;
        const option = document.createElement("li");
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(item.id === activeId));
        option.id = `st-option-${item.id}`;
        option.dataset.id = item.id;
        option.className = "command-menu-option";
        option.textContent = item.title;
        // mousedown (not click) so the selection lands before the input's
        // blur handler can close the list out from under the pointer.
        option.addEventListener("mousedown", (event) => {
          event.preventDefault();
          selectOption(item.id);
        });
        listbox.appendChild(option);
        if (!firstMatch) firstMatch = option;
      });
    });

    if (matchCount === 0) {
      const empty = document.createElement("li");
      empty.className = "command-menu-empty";
      empty.setAttribute("role", "presentation");
      empty.textContent = "No transformer matches your search.";
      listbox.appendChild(empty);
    }

    return firstMatch;
  }

  function lockBodyScroll(locked) {
    document.body.style.overflow = locked ? "hidden" : "";
  }

  function openList() {
    if (!listbox.hidden) return;
    listbox.hidden = false;
    wrapper.classList.add("is-open");
    search.setAttribute("aria-expanded", "true");
    if (isOverlayMode()) {
      lockBodyScroll(true);
      // The overlay covers the page, so the field must own the caret.
      search.focus();
    }
  }

  function closeList({ restoreLabel = true } = {}) {
    if (listbox.hidden) return;
    listbox.hidden = true;
    wrapper.classList.remove("is-open");
    search.setAttribute("aria-expanded", "false");
    setActiveOption(null);
    lockBodyScroll(false);
    // Leaving a half-typed query in the box would misreport which transformer
    // is loaded, so an abandoned search snaps back to the active one.
    if (restoreLabel && activeId) search.value = activeTitle();
  }

  function setActiveOption(optionEl) {
    if (activeOptionEl) activeOptionEl.classList.remove("is-active");
    activeOptionEl = optionEl;
    if (activeOptionEl) {
      activeOptionEl.classList.add("is-active");
      search.setAttribute("aria-activedescendant", activeOptionEl.id);
      activeOptionEl.scrollIntoView({ block: "nearest" });
    } else {
      search.removeAttribute("aria-activedescendant");
    }
  }

  function selectOption(id) {
    activeId = id;
    search.value = activeTitle();
    closeList({ restoreLabel: false });
    search.blur();
    onSelect(id);
  }

  function moveActive(direction) {
    const options = Array.from(listbox.querySelectorAll('[role="option"]'));
    if (options.length === 0) return;
    const currentIndex = activeOptionEl ? options.indexOf(activeOptionEl) : -1;
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = options.length - 1;
    if (nextIndex >= options.length) nextIndex = 0;
    setActiveOption(options[nextIndex]);
  }

  // While the box just shows the active transformer's name (untouched by the
  // user), opening it should list everything rather than filter down to that
  // one name.
  const effectiveFilter = () => (search.value === activeTitle() ? "" : search.value);

  search.addEventListener("input", () => {
    renderOptions(search.value);
    openList();
    setActiveOption(null);
  });

  search.addEventListener("focus", () => {
    renderOptions(effectiveFilter());
    openList();
    // Typing then replaces the transformer name instead of appending to it.
    if (search.value === activeTitle()) search.select();
  });

  search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (listbox.hidden) {
        renderOptions(effectiveFilter());
        openList();
      }
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeOptionEl) selectOption(activeOptionEl.dataset.id);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeList();
      search.blur();
    }
  });

  closeBtn.addEventListener("click", () => {
    closeList();
    search.blur();
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) closeList();
  });

  document.addEventListener("keydown", (event) => {
    // event.key is undefined for a few synthetic/IME events; guard before
    // calling into it so the shortcut never throws on an unrelated keypress.
    if (typeof event.key !== "string") return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      search.focus();
      search.select();
    }
  });

  // Rotating a phone mid-search would otherwise leave the body scroll-locked
  // by an overlay that CSS has already turned back into a dropdown.
  window.matchMedia(OVERLAY_QUERY).addEventListener("change", () => closeList());

  return {
    setActive(id) {
      activeId = id;
      search.value = activeTitle();
      search.dataset.activeId = id;
    },
  };
}

export { createCommandMenu };
