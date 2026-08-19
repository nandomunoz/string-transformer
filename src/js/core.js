import { FormatError } from "./modules/errors.js";

/**
 * Transform a string through a named transformer.
 * Always resolves (never rejects/throws) with:
 *   { ok: true,  value: string, error: null }
 *   { ok: false, value: "",     error: string|null }
 * `error` carries a user-facing message when the input didn't match the
 * expected format (FormatError); it's null for an unknown/missing mode.
 * Async because some transformers (hashing) rely on crypto.subtle.
 * @param {{mode:string, str:string, transformers:object}} params
 * @returns {Promise<{ok:boolean, value:string, error:string|null}>}
 */
const strTo = async ({ mode, str, transformers }) => {
  if (
    typeof str !== "string" ||
    !transformers ||
    typeof transformers[mode] !== "function"
  ) {
    return { ok: false, value: "", error: null };
  }
  try {
    const value = await transformers[mode](str.trim());
    return { ok: true, value, error: null };
  } catch (err) {
    return {
      ok: false,
      value: "",
      error: err instanceof FormatError ? err.message : "Unexpected error",
    };
  }
};

/**
 * JSON Rules for transformer functions:
 * - Receive the input already trimmed (strTo does it once)
 * - Always return a string (or a Promise<string>)
 * - Throw FormatError for invalid input formats, never return an error string
 */

import basic from "../js/modules/basic.js";
import naming from "./modules/naming.js";
import { converters } from "../js/modules/converters.js";
import { fun } from "../js/modules/fun.js";
import { encoding } from "./modules/encoding.js";
import { hashing } from "./modules/hashing.js";
import { dev } from "./modules/dev.js";
import { ciphers } from "./modules/ciphers.js";
import { textTools } from "./modules/textTools.js";

// Full Transformer
const transformers = {
  ...basic,
  ...naming,
  ...converters,
  ...fun,
  ...encoding,
  ...hashing,
  ...dev,
  ...ciphers,
  ...textTools,
};

export { strTo, transformers, FormatError };
