import { MAP_NATO, MAP_SMALL_CAPS } from "../data/dictionary.js";

const MAP_NATO_REVERSE = Object.fromEntries(
  Object.entries(MAP_NATO).map(([letter, word]) => [word.toUpperCase(), letter])
);

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= "Z" ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function atbash(str) {
  return str.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= "Z" ? 65 : 97;
    return String.fromCharCode(base + (25 - (char.charCodeAt(0) - base)));
  });
}

function rot47(str) {
  return str.replace(/[!-~]/g, (char) => {
    const code = char.charCodeAt(0);
    return String.fromCharCode(33 + ((code - 33 + 47) % 94));
  });
}

function textToNato(str) {
  return str
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split("")
        .map((char) => MAP_NATO[char] || char)
        .join(" ")
    )
    .join(" / ");
}

function natoToText(str) {
  return str
    .split("/")
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => MAP_NATO_REVERSE[token.toUpperCase()] || "")
        .join("")
    )
    .join(" ");
}

const LEET_MAP = { a: "4", e: "3", g: "9", i: "1", l: "1", o: "0", s: "5", t: "7" };

function textToLeet(str) {
  return str
    .split("")
    .map((char) => LEET_MAP[char.toLowerCase()] || char)
    .join("");
}

function smallCaps(str) {
  return str
    .split("")
    .map((char) => MAP_SMALL_CAPS[char.toLowerCase()] || char)
    .join("");
}

const FULLWIDTH_OFFSET = 0xfee0;
const FULLWIDTH_SPACE_CODE = 0x3000;

function fullwidthText(str) {
  return str
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (char === " ") return String.fromCharCode(FULLWIDTH_SPACE_CODE);
      if (code >= 0x21 && code <= 0x7e) return String.fromCharCode(code + FULLWIDTH_OFFSET);
      return char;
    })
    .join("");
}

const ZALGO_ABOVE = [0x0301, 0x0308, 0x030a, 0x0303, 0x0302, 0x0304, 0x0307, 0x030c].map(
  (code) => String.fromCharCode(code)
);
const ZALGO_BELOW = [0x0316, 0x0317, 0x0318, 0x0319, 0x0323, 0x0325].map((code) =>
  String.fromCharCode(code)
);

function zalgoText(str) {
  return str
    .split("")
    .map((char) => {
      if (char === " " || char === "\n") return char;
      const aboveCount = 1 + Math.floor(Math.random() * 3);
      const belowCount = Math.floor(Math.random() * 2);
      const marks = [];
      for (let i = 0; i < aboveCount; i++) {
        marks.push(ZALGO_ABOVE[Math.floor(Math.random() * ZALGO_ABOVE.length)]);
      }
      for (let i = 0; i < belowCount; i++) {
        marks.push(ZALGO_BELOW[Math.floor(Math.random() * ZALGO_BELOW.length)]);
      }
      return char + marks.join("");
    })
    .join("");
}

const ciphers = {
  rot13,
  atbash,
  rot47,
  textToNato,
  natoToText,
  textToLeet,
  smallCaps,
  fullwidthText,
  zalgoText,
};

export {
  rot13,
  atbash,
  rot47,
  textToNato,
  natoToText,
  textToLeet,
  smallCaps,
  fullwidthText,
  zalgoText,
  ciphers,
};
