import { FormatError } from "./errors.js";
import msg from "../data/msg.js";
import { base64UrlToBytes } from "./encoding.js";

function jwtDecode(str) {
  const parts = str.trim().split(".");
  if (parts.length < 2) throw new FormatError(msg.jwtDecode.format);
  try {
    const bytes = base64UrlToBytes(parts[1]);
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    throw new FormatError(msg.jwtDecode.format);
  }
}

function countStats(str) {
  const characters = str.length;
  const words = str === "" ? 0 : str.split(/\s+/).filter(Boolean).length;
  const lines = str === "" ? 0 : str.split(/\r\n|\r|\n/).length;
  const bytes = new TextEncoder().encode(str).length;
  return `Characters: ${characters}\nWords: ${words}\nLines: ${lines}\nBytes (UTF-8): ${bytes}`;
}

const dev = { jwtDecode, countStats };

export { jwtDecode, countStats, dev };
