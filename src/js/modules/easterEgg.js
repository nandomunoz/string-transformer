import {
  generatePassword,
  estimateCrackTime,
  ASSUMED_GUESSES_PER_SECOND_LABEL,
} from "./passwordGenerator.js";

// Static markup, no user data interpolated — safe to build with innerHTML.
const DIALOG_HTML = `
  <article>
    <header>
      <button aria-label="Close" class="close" type="button"></button>
      <h3 id="pwdDialogTitle">🔐 Secure password generator</h3>
    </header>
    <p>Generated locally with <code>crypto.getRandomValues()</code> — nothing ever leaves your browser.</p>

    <div class="st-pwd-output">
      <input type="text" id="pwdOutput" readonly aria-label="Generated password" />
      <button type="button" id="pwdCopyBtn" class="outline">Copy</button>
    </div>
    <p class="st-pwd-meta" id="pwdMeta"></p>
    <p class="st-pwd-crack-time" id="pwdCrackTime" hidden></p>

    <fieldset>
      <label for="pwdLength">Length: <output id="pwdLengthValue">20</output></label>
      <input type="range" id="pwdLength" min="12" max="64" value="20" />
    </fieldset>

    <fieldset class="st-pwd-grid">
      <label><input type="checkbox" id="pwdLowercase" checked /> Lowercase (a-z)</label>
      <label><input type="checkbox" id="pwdUppercase" checked /> Uppercase (A-Z)</label>
      <label><input type="checkbox" id="pwdNumbers" checked /> Numbers (0-9)</label>
      <label><input type="checkbox" id="pwdSymbols" checked /> Symbols (!@#$...)</label>
      <label><input type="checkbox" id="pwdExtendedSymbols" /> Extended symbols (€£¥...)</label>
      <label><input type="checkbox" id="pwdExcludeSimilar" /> Exclude similar (l 1 I o O 0)</label>
      <label><input type="checkbox" id="pwdExcludeAmbiguous" /> Exclude ambiguous ({ } [ ] ( ) ...)</label>
      <label><input type="checkbox" id="pwdEnsureAllTypes" checked /> Include every selected type</label>
    </fieldset>

    <footer>
      <button type="button" id="pwdGenerateBtn">🎲 Generate another</button>
    </footer>
  </article>
`;

const CHECKBOX_OPTION_IDS = {
  lowercase: "pwdLowercase",
  uppercase: "pwdUppercase",
  numbers: "pwdNumbers",
  symbols: "pwdSymbols",
  extendedSymbols: "pwdExtendedSymbols",
  excludeSimilar: "pwdExcludeSimilar",
  excludeAmbiguous: "pwdExcludeAmbiguous",
  ensureAllTypes: "pwdEnsureAllTypes",
};

const MODAL_ANIMATION_MS = 200;

function strengthLabel(bits) {
  if (bits < 50) return "Weak";
  if (bits < 80) return "Fair";
  if (bits < 100) return "Strong";
  return "Very strong";
}

function buildTriggerButton() {
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.id = "easterEggBtn";
  trigger.className = "st-easter-egg";
  trigger.setAttribute("aria-label", "Psst... generate a secure password");
  trigger.textContent = "✦";
  return trigger;
}

function buildDialog() {
  const dialog = document.createElement("dialog");
  dialog.id = "pwdDialog";
  dialog.setAttribute("aria-labelledby", "pwdDialogTitle");
  dialog.innerHTML = DIALOG_HTML;
  return dialog;
}

function wireDialog(dialog) {
  const lengthInput = dialog.querySelector("#pwdLength");
  const lengthValue = dialog.querySelector("#pwdLengthValue");
  const output = dialog.querySelector("#pwdOutput");
  const meta = dialog.querySelector("#pwdMeta");
  const crackTime = dialog.querySelector("#pwdCrackTime");
  const copyBtn = dialog.querySelector("#pwdCopyBtn");
  const generateBtn = dialog.querySelector("#pwdGenerateBtn");
  const closeBtn = dialog.querySelector(".close");
  const checkboxes = Object.fromEntries(
    Object.entries(CHECKBOX_OPTION_IDS).map(([key, id]) => [key, dialog.querySelector(`#${id}`)])
  );

  const readOptions = () => {
    const options = { length: Number(lengthInput.value) };
    Object.entries(checkboxes).forEach(([key, el]) => {
      options[key] = el.checked;
    });
    return options;
  };

  const regenerate = () => {
    try {
      const { password, entropyBits, charsetSize } = generatePassword(readOptions());
      output.value = password;
      meta.textContent = `${strengthLabel(entropyBits)} · ~${entropyBits} bits of entropy · ${charsetSize} possible characters`;
      meta.classList.remove("st-pwd-error");
      crackTime.textContent = `🛡️ Brute-force estimate: ${estimateCrackTime(entropyBits)} ⓘ`;
      crackTime.title = `Assumes ${ASSUMED_GUESSES_PER_SECOND_LABEL}`;
      crackTime.hidden = false;
    } catch (err) {
      output.value = "";
      meta.textContent = err.message;
      meta.classList.add("st-pwd-error");
      crackTime.textContent = "";
      crackTime.hidden = true;
    }
  };

  lengthInput.addEventListener("input", () => {
    lengthValue.textContent = lengthInput.value;
    regenerate();
  });
  Object.values(checkboxes).forEach((el) => el.addEventListener("change", regenerate));
  generateBtn.addEventListener("click", regenerate);

  const copyLabel = copyBtn.textContent;
  let copyFeedbackTimeoutId;
  copyBtn.addEventListener("click", () => {
    if (!output.value) return;
    navigator.clipboard
      .writeText(output.value)
      .then(() => {
        clearTimeout(copyFeedbackTimeoutId);
        copyBtn.textContent = "Copied ✓";
        copyFeedbackTimeoutId = setTimeout(() => (copyBtn.textContent = copyLabel), 2000);
      })
      .catch(() => {
        clearTimeout(copyFeedbackTimeoutId);
        copyBtn.textContent = "Copy failed";
        copyFeedbackTimeoutId = setTimeout(() => (copyBtn.textContent = copyLabel), 2000);
      });
  });

  const openModal = () => {
    document.documentElement.classList.add("modal-is-open", "modal-is-opening");
    dialog.showModal();
    regenerate();
    setTimeout(() => document.documentElement.classList.remove("modal-is-opening"), MODAL_ANIMATION_MS * 2);
  };

  const closeModal = () => {
    document.documentElement.classList.add("modal-is-closing");
    setTimeout(() => dialog.close(), MODAL_ANIMATION_MS);
  };

  // Native "close" fires for every close path (Escape, .close(), backdrop),
  // so class cleanup lives in one place regardless of how it was triggered.
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("modal-is-open", "modal-is-opening", "modal-is-closing");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeModal();
  });
  closeBtn.addEventListener("click", closeModal);

  return { openModal };
}

function initEasterEgg() {
  const footerText = document.querySelector("footer small");
  if (!footerText) return;

  const trigger = buildTriggerButton();
  const dialog = buildDialog();
  footerText.appendChild(trigger);
  document.body.appendChild(dialog);

  const { openModal } = wireDialog(dialog);
  trigger.addEventListener("click", openModal);
}

export { initEasterEgg };
