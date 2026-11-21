import { strTo, transformers } from "../core.js";
import msg from "../data/msg.js";
import { findOppositeId } from "../data/opposites.js";
import { copyValue, resetInput, debounce } from "../modules/utils.js";
import { createCommandMenu } from "../modules/commandMenu.js";
import { detectFormat } from "../modules/detect.js";

const form = document.querySelector("#formApp");
const title = form?.querySelector(".js-st-titleSelected");
const description = form?.querySelector(".js-st-descriptionSelected");
const inputLabel = form?.querySelector("label[for=input]");
const inputTextarea = form?.querySelector("#input");
const outputLabel = form?.querySelector("label[for=output]");
const outputTextarea = form?.querySelector("#output");
const copyOutputBtn = form?.querySelector("#copyOutputBtn");
const resetInputBtn = form?.querySelector("#resetInputBtn");
const swapBtn = form?.querySelector("#swapBtn");
const formatAlert = form?.querySelector("#formatAlert");
const formatSuggestion = form?.querySelector("#formatSuggestion");
const actionsBar = form?.querySelector(".st-actions");
const inputCount = form?.querySelector("#inputCount");
const outputCount = form?.querySelector("#outputCount");
const menuContainer = document.querySelector("#stMenu");

const transformerStatus = {
  set: (value = null) => (window.transformerId = value),
  get: () => window.transformerId,
};

const idFromHash = () => {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  return transformers[id] ? id : null;
};

const setHash = (id) => {
  if (window.location.hash === `#${id}`) return;
  history.replaceState(null, "", `#${id}`);
};

// Transformers are async (hashes await crypto.subtle), so a fast one started
// later can resolve before a slow one started earlier and the stale result
// would win. Every run takes a ticket; only the newest one may paint.
let runToken = 0;

const executeConverter = async ({ mode, str, transformers, outputTextarea }) => {
  const token = (runToken += 1);
  const result = await strTo({ mode, str, transformers });
  if (token !== runToken) return result;

  outputTextarea.value = result.ok ? result.value : "";
  updateFormatAlert(result.error);
  updateCharCounts();
  return result;
};

const updateFormatAlert = (error) => {
  if (!formatAlert) return;
  formatAlert.textContent = error || "";
  formatAlert.hidden = !error;
};

const updateCharCounts = () => {
  if (inputCount && inputTextarea) {
    inputCount.textContent = `${inputTextarea.value.length} characters`;
  }
  if (outputCount && outputTextarea) {
    outputCount.textContent = `${outputTextarea.value.length} characters`;
  }
};

const updateSwapButton = (transformerId) => {
  if (!swapBtn) return;
  const oppositeId = findOppositeId(transformerId);
  swapBtn.hidden = !oppositeId;
  swapBtn.dataset.oppositeId = oppositeId || "";
  if (oppositeId) {
    const oppositeTitle = (msg[oppositeId] || {}).title || oppositeId;
    swapBtn.title = `Switch to ${oppositeTitle} and move the result to the input`;
  }
};

const updateFormatSuggestion = (inputValue, transformerId) => {
  if (!formatSuggestion) return;
  const guess = detectFormat(inputValue);
  if (!guess || guess.id === transformerId) {
    formatSuggestion.hidden = true;
    formatSuggestion.textContent = "";
    return;
  }
  formatSuggestion.hidden = false;
  formatSuggestion.textContent = "";
  const text = document.createElement("span");
  text.textContent = `This looks like ${guess.label}.`;
  const switchBtn = document.createElement("button");
  switchBtn.type = "button";
  switchBtn.className = "outline";
  switchBtn.textContent = `Switch to ${msg[guess.id].title}`;
  switchBtn.addEventListener("click", () => selectTransformer(guess.id));
  formatSuggestion.append(text, switchBtn);
};

const updateFormMessage = ({ transformerId, title, description, inputLabel, outputLabel }) => {
  const entry = msg[transformerId] || msg.defaultConverter;
  title.textContent = entry.title;
  description.textContent = entry.description;
  inputLabel.textContent = entry.inputLabel;
  outputLabel.textContent = entry.outputLabel;
};

const updateForm = async ({ inputValue }) => {
  const transformerId = transformerStatus.get();
  if (
    !transformerId ||
    !form ||
    !title ||
    !inputTextarea ||
    !outputTextarea ||
    !inputLabel ||
    !outputLabel
  )
    return;

  updateFormMessage({ transformerId, title, description, inputLabel, outputLabel });
  updateSwapButton(transformerId);
  updateFormatSuggestion(inputValue, transformerId);

  await executeConverter({
    mode: transformerId,
    str: inputValue,
    transformers,
    outputTextarea,
  });
};

const selectTransformer = (id) => {
  transformerStatus.set(id);
  menu?.setActive(id);
  setHash(id);
  updateForm({ inputValue: inputTextarea?.value ?? "" });
};

const swapDirection = () => {
  const oppositeId = swapBtn?.dataset.oppositeId;
  if (!oppositeId || !inputTextarea || !outputTextarea) return;
  inputTextarea.value = outputTextarea.value;
  selectTransformer(oppositeId);
};

// On phones the action bar is pinned to the bottom of the screen (thumb zone).
// The SEO landing pages put a long article above the tool, so pin it only while
// the tool is actually on screen instead of floating it over the prose.
const initPinnedActions = () => {
  if (!actionsBar || !form) return;
  if (typeof IntersectionObserver !== "function") {
    // No observer: pinning it always is the safe fallback, since the home page
    // (where the form fills the viewport) is the common case.
    actionsBar.classList.add("is-pinned");
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => actionsBar.classList.toggle("is-pinned", entry.isIntersecting),
    // rootMargin only accepts px or %: rem throws a SyntaxError and takes the
    // rest of app() down with it.
    { rootMargin: "0px 0px -48px 0px" }
  );
  observer.observe(form);
};

const initEvents = () => {
  const submitForm = (event) => {
    event.preventDefault();
    updateForm({ inputValue: inputTextarea?.value ?? "" });
  };

  const debouncedUpdate = debounce((value) => updateForm({ inputValue: value }), 150);

  copyValue({ btn: copyOutputBtn, outputCopy: outputTextarea });
  resetInput({ btn: resetInputBtn, inputReset: inputTextarea, outputReset: outputTextarea });

  swapBtn?.addEventListener("click", swapDirection);
  form?.addEventListener("submit", submitForm);
  inputTextarea?.addEventListener("input", (event) => debouncedUpdate(event.target.value));
};

let menu;

function app() {
  menu = createCommandMenu({
    container: menuContainer,
    transformers,
    msg,
    onSelect: (id) => selectTransformer(id),
  });

  const initialId = idFromHash() || Object.keys(transformers)[0];
  transformerStatus.set(initialId);
  menu?.setActive(initialId);
  updateForm({ inputValue: inputTextarea?.value ?? "" });
  initEvents();
  initPinnedActions();

  window.addEventListener("hashchange", () => {
    const id = idFromHash();
    if (id && id !== transformerStatus.get()) selectTransformer(id);
  });
}

export default app;
