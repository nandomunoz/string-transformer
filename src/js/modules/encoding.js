import { FormatError } from "./errors.js";
import msg from "../data/msg.js";

function urlEncode(str) {
  return encodeURIComponent(str);
}

function urlDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    throw new FormatError(msg.urlDecode.format);
  }
}

function hexEncode(str) {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(" ");
}

function hexDecode(str) {
  const cleaned = str.replace(/\s+/g, "");
  if (cleaned.length === 0 || cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new FormatError(msg.hexDecode.format);
  }
  const bytes = Uint8Array.from(cleaned.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new FormatError(msg.hexDecode.format);
  }
}

function bytesToBase64Url(bytes) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str) {
  const normalized = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlEncode(str) {
  return bytesToBase64Url(new TextEncoder().encode(str));
}

function base64UrlDecode(str) {
  if (!/^[A-Za-z0-9_-]+$/.test(str)) throw new FormatError(msg.base64UrlDecode.format);
  try {
    const bytes = base64UrlToBytes(str);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new FormatError(msg.base64UrlDecode.format);
  }
}

function unicodeEscape(str) {
  return str
    .split("")
    .map((char) =>
      char.charCodeAt(0) > 127
        ? "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0")
        : char
    )
    .join("");
}

function unicodeUnescape(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function jsonEscape(str) {
  return JSON.stringify(str).slice(1, -1);
}

function jsonUnescape(str) {
  try {
    return JSON.parse(`"${str}"`);
  } catch {
    throw new FormatError(msg.jsonUnescape.format);
  }
}

function slugify(str) {
  // Strip NFD combining diacritical marks (codepoints 0x0300-0x036F) by
  // numeric range instead of a unicode-escape regex, to keep this file plain ASCII.
  const withoutDiacritics = Array.from(str.normalize("NFD"))
    .filter((char) => {
      const code = char.codePointAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join("");
  return withoutDiacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const encoding = {
  urlEncode,
  urlDecode,
  hexEncode,
  hexDecode,
  base64UrlEncode,
  base64UrlDecode,
  unicodeEscape,
  unicodeUnescape,
  jsonEscape,
  jsonUnescape,
  slugify,
};

export {
  urlEncode,
  urlDecode,
  hexEncode,
  hexDecode,
  base64UrlEncode,
  base64UrlDecode,
  base64UrlToBytes,
  unicodeEscape,
  unicodeUnescape,
  jsonEscape,
  jsonUnescape,
  slugify,
  encoding,
};
