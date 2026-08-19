// Async because crypto.subtle.digest is Promise-based; strTo (core.js) awaits
// every transformer result, sync or not.
async function digest(algorithm, str) {
  const bytes = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

const sha1 = (str) => digest("SHA-1", str);
const sha256 = (str) => digest("SHA-256", str);
const sha512 = (str) => digest("SHA-512", str);

const hashing = { sha1, sha256, sha512 };

export { sha1, sha256, sha512, hashing };
