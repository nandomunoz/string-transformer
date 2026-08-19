import checker from "./checker.js";

const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;
const HEX_REGEX = /^[0-9a-fA-F\s]+$/;
const URL_ENCODED_REGEX = /%[0-9a-fA-F]{2}/;

/**
 * Best-effort guess of what format the raw input looks like, to power the
 * "This looks like X, switch?" suggestion. Order matters: more specific/
 * stricter checks run first so they aren't shadowed by looser ones.
 * @param {string} str
 * @returns {{id:string, label:string}|null}
 */
const detectFormat = (str) => {
  const trimmed = str.trim();
  if (!trimmed) return null;

  if (trimmed.split(".").length === 3 && JWT_REGEX.test(trimmed)) {
    return { id: "jwtDecode", label: "a JWT" };
  }
  if (checker.isBinary(trimmed)) {
    return { id: "binary2Utf8", label: "binary" };
  }
  if (/[.-]/.test(trimmed) && checker.isMorse(trimmed)) {
    return { id: "morse2Text", label: "Morse code" };
  }
  if (trimmed.length >= 8 && checker.isBase64(trimmed)) {
    return { id: "base64ToASCII", label: "Base64" };
  }
  if (
    HEX_REGEX.test(trimmed) &&
    trimmed.replace(/\s+/g, "").length >= 4 &&
    trimmed.replace(/\s+/g, "").length % 2 === 0
  ) {
    return { id: "hexDecode", label: "hexadecimal" };
  }
  if (URL_ENCODED_REGEX.test(trimmed)) {
    return { id: "urlDecode", label: "a URL-encoded string" };
  }
  return null;
};

export { detectFormat };
