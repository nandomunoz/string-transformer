// # NAMING CONVENTIONS
import { toWords, capitalize, lower, upper } from "./text.js";

const SMALL_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "for",
  "on",
  "at",
  "to",
  "from",
  "by",
  "of",
  "in",
]);

const naming = {
  camelCase: (str) => {
    const words = toWords(str);
    if (words.length === 0) return "";
    return words[0].toLowerCase() + words.slice(1).map(capitalize).join("");
  },
  pascalCase: (str) => toWords(str).map(capitalize).join(""),
  snakeCase: (str) => toWords(str).map(lower).join("_"),
  screamingSnakeCase: (str) => toWords(str).map(upper).join("_"),
  camelSnakeCase: (str) =>
    toWords(str)
      .map((word, index) => (index === 0 ? lower(word) : capitalize(word)))
      .join("_"),
  kebabCase: (str) => toWords(str).map(lower).join("-"),
  screamingKebabCase: (str) => toWords(str).map(upper).join("-"),
  trainCase: (str) => toWords(str).map(capitalize).join("-"),
  spongebobCase: (str) =>
    str
      .split("")
      .map((char, index) =>
        index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      )
      .join(""),
  titleCase: (str) => {
    const words = toWords(str);
    const last = words.length - 1;
    return words
      .map((word, index) =>
        index !== 0 && index !== last && SMALL_WORDS.has(word.toLowerCase())
          ? lower(word)
          : capitalize(word)
      )
      .join(" ");
  },
  sentenceCase: (str) => {
    const words = toWords(str).map(lower);
    const sentence = words.join(" ");
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  },
  dotCase: (str) => toWords(str).map(lower).join("."),
  pathCase: (str) => toWords(str).map(lower).join("/"),
  randomCase: (str) =>
    str
      .split("")
      .map((char) => (Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()))
      .join(""),
};

export default naming;
