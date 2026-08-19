import checker from "./checker.js";
import msg from "../data/msg.js";
import { FormatError } from "./errors.js";
import { MAP_ASCII_TO_MORSE, MAP_MORSE_TO_ASCII } from "../data/dictionary.js";

function binary2Utf8(str) {
  if (!checker.isBinary(str)) throw new FormatError(msg.binary2Utf8.format);
  const byteStrings = str.replace(/\s+/g, "").match(/.{1,8}/g);
  const bytes = Uint8Array.from(byteStrings.map((byte) => parseInt(byte, 2)));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new FormatError(msg.binary2Utf8.format);
  }
}

function utf82binary(str) {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join(" ");
}

function base64ToASCII(str) {
  if (!checker.isBase64(str)) throw new FormatError(msg.base64ToASCII.format);
  const binary = atob(str);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new FormatError(msg.base64ToASCII.format);
  }
}

function ASCIIToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary);
}

function text2Morse(str) {
  return str
    .toUpperCase()
    .split("")
    .map((char) => MAP_ASCII_TO_MORSE[char] || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function morse2Text(str) {
  if (!checker.isMorse(str)) throw new FormatError(msg.morse2Text.format);
  const morseWords = str.trim().split(" / ");
  const asciiWords = morseWords.map((word) => {
    const morseChars = word.trim().split(/\s+/);
    const asciiChars = morseChars.map((char) => MAP_MORSE_TO_ASCII[char] || "");
    return asciiChars.join("");
  });
  return asciiWords.join(" ");
}

function escapeHtml2String(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeString2Html(str) {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

const converters = {
  binary2Utf8,
  utf82binary,
  base64ToASCII,
  ASCIIToBase64,
  text2Morse,
  morse2Text,
  escapeHtml2String,
  escapeString2Html,
};

export {
  binary2Utf8,
  utf82binary,
  base64ToASCII,
  ASCIIToBase64,
  text2Morse,
  morse2Text,
  escapeHtml2String,
  escapeString2Html,
  converters,
};
