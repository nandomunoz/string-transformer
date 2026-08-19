const FEEDBACK_MS = 2000;

const copyValue = ({ btn, outputCopy }) => {
  if (!btn || !outputCopy) return;

  const originalLabel = btn.textContent;
  let feedbackTimeoutId;

  const showFeedback = (label) => {
    clearTimeout(feedbackTimeoutId);
    btn.textContent = label;
    feedbackTimeoutId = setTimeout(() => {
      btn.textContent = originalLabel;
    }, FEEDBACK_MS);
  };

  const copyToClipboard = (event) => {
    event.preventDefault();
    const outputValue = outputCopy.value;
    if (!outputValue) return;

    navigator.clipboard
      .writeText(outputValue)
      .then(() => showFeedback("Copied ✓"))
      .catch((err) => {
        console.error("Error clipboard: ", err);
        showFeedback("Copy failed");
      });
  };

  btn.addEventListener("click", copyToClipboard);
};

const resetInput = ({ btn, inputReset, outputReset }) => {
  if (!btn || !inputReset || !outputReset) return;

  const reset = (event) => {
    event.preventDefault();
    inputReset.value = "";
    outputReset.value = "";
    inputReset.dispatchEvent(new Event("input"));
    inputReset.focus();
  };

  btn.addEventListener("click", reset);
};

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export { copyValue, resetInput, debounce };
