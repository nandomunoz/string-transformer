// Pairs of transformer ids that undo each other, used by the Swap (⇄) button.
// Self-inverse ciphers (rot13, atbash, rot47) list the same id on both sides:
// applying the transform again to its own output restores the original text.
const opposites = {
  utf8_binary: ["utf82binary", "binary2Utf8"],
  ascii_base64: ["ASCIIToBase64", "base64ToASCII"],
  base64_url_safe: ["base64UrlEncode", "base64UrlDecode"],
  url_encoding: ["urlEncode", "urlDecode"],
  hex: ["hexEncode", "hexDecode"],
  morse: ["text2Morse", "morse2Text"],
  html_entities: ["escapeString2Html", "escapeHtml2String"],
  unicode_escape: ["unicodeEscape", "unicodeUnescape"],
  json_escape: ["jsonEscape", "jsonUnescape"],
  nato_alphabet: ["textToNato", "natoToText"],
  rot13: ["rot13", "rot13"],
  atbash: ["atbash", "atbash"],
  rot47: ["rot47", "rot47"],
};

/**
 * @param {string} id
 * @returns {string|null} the id that reverses `id`, or null if it has none
 */
const findOppositeId = (id) => {
  for (const pair of Object.values(opposites)) {
    if (pair[0] === id) return pair[1];
    if (pair[1] === id) return pair[0];
  }
  return null;
};

export { opposites, findOppositeId };
