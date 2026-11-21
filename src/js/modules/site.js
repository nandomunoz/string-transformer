// Site chrome behaviour shared by every page (home, generated landing pages,
// the hub): the colour theme, the Convert menu and the Install buttons. It
// touches only the header/footer markup, never the tool, so a page without the
// form (the hub) still gets a working header.

const THEME_STORAGE_KEY = "st-theme";
const TOAST_MS = 6000;

// --- Theme -----------------------------------------------------------------

const applyTheme = (button, theme) => {
  document.documentElement.dataset.theme = theme;
  if (!button) return;
  button.setAttribute("aria-pressed", String(theme === "light"));
  button.setAttribute(
    "aria-label",
    theme === "light" ? "Switch to dark theme" : "Switch to light theme"
  );
};

const readStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Private mode / storage disabled: fall back to the system preference.
    return null;
  }
};

function initTheme() {
  const button = document.querySelector("#themeToggleBtn");
  // The inline bootstrap in <head> already painted the right theme; this only
  // takes ownership of it and falls back to the OS preference on first visit.
  const systemTheme = window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
  applyTheme(button, readStoredTheme() || document.documentElement.dataset.theme || systemTheme);

  button?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(button, next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Nothing to do: the theme still applies for this session.
    }
  });
}

// --- Convert menu ----------------------------------------------------------

// The menu is a native <details>, so it opens with no script; this only closes
// it on an outside click or Escape.
function initMegaMenu() {
  const mega = document.querySelector(".mega");
  if (!mega) return;

  document.addEventListener("click", (event) => {
    if (mega.open && !mega.contains(event.target)) mega.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mega.open) {
      mega.open = false;
      mega.querySelector("summary")?.focus();
    }
  });
}

// --- Install as an app -------------------------------------------------------

let toastTimeoutId;

const say = (message) => {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("p");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.hidden = false;
  toast.textContent = message;
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toast.hidden = true;
  }, TOAST_MS);
};

// Chrome and Edge fire beforeinstallprompt once the manifest and the service
// worker qualify; elsewhere the buttons explain how to install by hand.
function initInstall() {
  const buttons = document.querySelectorAll("[data-install]");
  if (buttons.length === 0) return;

  let deferred = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
  });
  window.addEventListener("appinstalled", () =>
    say("Installed. Open it from your dock or home screen.")
  );

  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isFirefox = /Firefox\//.test(ua);
  const isSafari = /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (isStandalone()) return say("It is already installed: you are using the app.");
      if (deferred) {
        deferred.prompt();
        const { outcome } = await deferred.userChoice;
        deferred = null;
        return say(
          outcome === "accepted"
            ? "Installing…"
            : "No problem. You can install it later from here."
        );
      }
      if (isIOS) return say("On iPhone or iPad: tap Share, then Add to Home Screen.");
      if (isFirefox)
        return say(
          "Firefox on desktop cannot install web apps. Open this page in Chrome or Edge to install it."
        );
      if (isSafari) return say("In Safari on Mac: File, then Add to Dock.");
      say("Use the install icon in the address bar, or the browser menu, to install the app.");
    });
  });
}

export function initSite() {
  initTheme();
  initMegaMenu();
  initInstall();
}
