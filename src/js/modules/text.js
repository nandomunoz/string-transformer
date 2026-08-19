// # PURE TEXT HELPERS (shared by naming/encoding transformers)

/**
 * Splits a string into words, understanding spaces, "-", "_",
 * camelCase/PascalCase boundaries and acronym runs (XMLParser -> XML, Parser).
 * @param {string} str
 * @returns {string[]}
 */
const toWords = (str) =>
  str
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean);

const capitalize = (word) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

const lower = (word) => word.toLowerCase();
const upper = (word) => word.toUpperCase();

export { toWords, capitalize, lower, upper };
