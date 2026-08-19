// Cryptographically secure password generator, adapted from a standalone
// generate_password.js utility into pure functions for this codebase.
// Uses crypto.getRandomValues() exclusively, with rejection sampling to
// avoid modulo bias (never `randomValue % max` directly).

const CHAR_SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.?",
  extendedSymbols: "~`§±€£¥©®™°∞≠≈¡¿",
};

const SIMILAR_CHARACTERS = new Set(["l", "1", "I", "o", "O", "0"]);
const AMBIGUOUS_CHARACTERS = new Set([
  "{", "}", "[", "]", "(", ")", "/", "\\", "'", '"', "`", "~", ",", ";", ":", ".",
]);

const UINT32_RANGE = 0x1_0000_0000; // 2^32

const DEFAULT_OPTIONS = {
  length: 20,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  extendedSymbols: false,
  excludeSimilar: false,
  excludeAmbiguous: false,
  ensureAllTypes: true,
};

/** Uniform random integer in [0, max) via rejection sampling. */
function randomInt(max) {
  if (max === 1) return 0;
  const buffer = new Uint32Array(1);
  const limit = Math.floor(UINT32_RANGE / max) * max;
  let value;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function isExcluded(char, config) {
  if (config.excludeSimilar && SIMILAR_CHARACTERS.has(char)) return true;
  if (config.excludeAmbiguous && AMBIGUOUS_CHARACTERS.has(char)) return true;
  return false;
}

function buildActiveSets(config) {
  return Object.keys(CHAR_SETS)
    .filter((key) => config[key])
    .map((key) => [...new Set([...CHAR_SETS[key]].filter((char) => !isExcluded(char, config)))])
    .filter((set) => set.length > 0);
}

/** log2 of a BigInt without overflowing to Infinity for very large values. */
function log2BigInt(value) {
  if (value <= 0n) return Number.NEGATIVE_INFINITY;
  const binaryLength = value.toString(2).length;
  if (binaryLength <= 53) return Math.log2(Number(value));
  const shift = binaryLength - 53;
  const mostSignificantBits = Number(value >> BigInt(shift));
  return Math.log2(mostSignificantBits) + shift;
}

/**
 * Exact count of passwords satisfying the config, via inclusion-exclusion
 * when ensureAllTypes is on (only counting passwords containing every type).
 */
function searchSpaceSize({ activeSets, charsetSize, length, ensureAllTypes }) {
  const lengthBig = BigInt(length);
  if (!ensureAllTypes) return BigInt(charsetSize) ** lengthBig;

  const numberOfSets = activeSets.length;
  let validPasswords = 0n;
  for (let mask = 0; mask < 1 << numberOfSets; mask++) {
    const excluded = new Set();
    let excludedSetCount = 0;
    for (let i = 0; i < numberOfSets; i++) {
      if ((mask & (1 << i)) !== 0) {
        excludedSetCount += 1;
        activeSets[i].forEach((char) => excluded.add(char));
      }
    }
    const allowed = BigInt(charsetSize - excluded.size) ** lengthBig;
    validPasswords += excludedSetCount % 2 === 0 ? allowed : -allowed;
  }
  return validPasswords;
}

/**
 * Generates a cryptographically secure password.
 * @param {Partial<typeof DEFAULT_OPTIONS>} options
 * @returns {{ password: string, entropyBits: number, charsetSize: number }}
 */
function generatePassword(options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!Number.isSafeInteger(config.length) || config.length < 1) {
    throw new Error("length must be a positive integer");
  }

  const activeSets = buildActiveSets(config);
  if (activeSets.length === 0) {
    throw new Error("Select at least one character type");
  }

  if (config.ensureAllTypes && config.length < activeSets.length) {
    throw new Error(
      `Length must be at least ${activeSets.length} to include every selected character type`
    );
  }

  const charset = [...new Set(activeSets.flat())];
  const setLookups = activeSets.map((set) => new Set(set));
  const requiredMask = (1 << activeSets.length) - 1;

  let characters;
  let presentMask;
  do {
    characters = new Array(config.length);
    presentMask = 0;
    for (let i = 0; i < config.length; i++) {
      const char = charset[randomInt(charset.length)];
      characters[i] = char;
      if (config.ensureAllTypes) {
        setLookups.forEach((set, index) => {
          if (set.has(char)) presentMask |= 1 << index;
        });
      }
    }
  } while (config.ensureAllTypes && presentMask !== requiredMask);

  const searchSpace = searchSpaceSize({
    activeSets: setLookups,
    charsetSize: charset.length,
    length: config.length,
    ensureAllTypes: config.ensureAllTypes,
  });

  return {
    password: characters.join(""),
    entropyBits: Math.round(log2BigInt(searchSpace) * 100) / 100,
    charsetSize: charset.length,
  };
}

// Assumed attacker speed for the brute-force estimate: a fast offline attack
// (e.g. a GPU/ASIC cluster hashing quickly) rather than a rate-limited login
// form. Stated explicitly wherever the estimate is shown, since the real
// number depends entirely on how the password is stored/checked.
const ASSUMED_GUESSES_PER_SECOND = 1e10;
const ASSUMED_GUESSES_PER_SECOND_LABEL = "10 billion guesses/sec (fast offline attack)";

const SECONDS_PER = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2629800, // average month (30.44 days)
  year: 31557600, // average year (365.25 days)
};

const roundScaled = (value) => (value >= 10 ? Math.round(value) : Math.round(value * 10) / 10);

const formatUnit = (value, singular, plural = `${singular}s`) => {
  const rounded = roundScaled(value);
  return `${rounded.toLocaleString("en-US")} ${rounded === 1 ? singular : plural}`;
};

// Plain-English names for "how many times bigger" — everyday words most
// people already have a feel for (national debt headlines, etc). Beyond
// trillion we stop trying to name it; the exact multiple stops being
// meaningful to a general reader anyway.
const NAMED_MULTIPLIERS = [
  { value: 1e12, name: "trillion" },
  { value: 1e9, name: "billion" },
  { value: 1e6, name: "million" },
  { value: 1e3, name: "thousand" },
];

const describeRatio = (ratio) => {
  if (ratio < 1.5) return "roughly";
  // Beyond ~1000 trillion, naming the multiple stops being meaningful to a
  // general reader — just say it's uncountably bigger instead.
  if (ratio >= 1e15) return "countless times more than";
  for (const { value, name } of NAMED_MULTIPLIERS) {
    if (ratio >= value) return `about ${roundScaled(ratio / value).toLocaleString("en-US")} ${name} times`;
  }
  return `about ${roundScaled(ratio).toLocaleString("en-US")} times`;
};

// Widely-known "unimaginably large number" reference points, used instead of
// scientific notation so the result reads in plain language. Sorted ascending.
const BIG_NUMBER_METAPHORS = [
  { value: 1.38e10, phrase: "how long the universe has existed" },
  { value: 7.5e18, phrase: "the number of grains of sand on every beach on Earth" },
  { value: 1e24, phrase: "the number of stars in the observable universe" },
  { value: 7e27, phrase: "the number of atoms in your entire body" },
  { value: 1e50, phrase: "the number of atoms in planet Earth" },
  { value: 1e80, phrase: "the number of atoms in the entire observable universe" },
];

function describeMagnitude(years) {
  let best = BIG_NUMBER_METAPHORS[0];
  for (const metaphor of BIG_NUMBER_METAPHORS) {
    if (metaphor.value <= years) best = metaphor;
    else break; // list is sorted ascending, nothing bigger will fit either
  }
  const ratio = years / best.value;
  if (ratio < 0.01) return `a tiny fraction of ${best.phrase}`;
  if (ratio < 1) return `a fraction of ${best.phrase}`;
  return `${describeRatio(ratio)} ${best.phrase}`;
}

/**
 * Human-readable brute-force time estimate for a given entropy, e.g.
 * "3.2 days" or, for absurdly large ones, a plain-language comparison like
 * "about 94 times the number of grains of sand on every beach on Earth"
 * instead of scientific notation. Not a security guarantee — it assumes the
 * attacker can try `guessesPerSecond` candidates per second against this
 * exact charset/length with no lockouts, rate limits or hash slowdown.
 * @param {number} entropyBits
 * @param {number} [guessesPerSecond]
 * @returns {string}
 */
function estimateCrackTime(entropyBits, guessesPerSecond = ASSUMED_GUESSES_PER_SECOND) {
  if (!Number.isFinite(entropyBits)) return "an incalculable amount of time";

  // Average case: an attacker guessing randomly finds it after searching
  // about half the keyspace, not the full space.
  const seconds = Math.pow(2, entropyBits) / 2 / guessesPerSecond;

  if (!Number.isFinite(seconds) || seconds < 0) return "longer than anyone can imagine";
  if (seconds < 1) return "less than a second";
  if (seconds < SECONDS_PER.minute) return formatUnit(seconds, "second");
  if (seconds < SECONDS_PER.hour) return formatUnit(seconds / SECONDS_PER.minute, "minute");
  if (seconds < SECONDS_PER.day) return formatUnit(seconds / SECONDS_PER.hour, "hour");
  if (seconds < SECONDS_PER.week) return formatUnit(seconds / SECONDS_PER.day, "day");
  if (seconds < SECONDS_PER.month) return formatUnit(seconds / SECONDS_PER.week, "week");
  if (seconds < SECONDS_PER.year) return formatUnit(seconds / SECONDS_PER.month, "month");

  const years = seconds / SECONDS_PER.year;
  if (years < 100) return formatUnit(years, "year");
  if (years < 10_000) return formatUnit(years / 100, "century", "centuries");
  if (years < 1_000_000) return formatUnit(years / 1000, "millennium", "millennia");

  return `so long it stops making sense to count in years — ${describeMagnitude(years)}`;
}

export {
  generatePassword,
  estimateCrackTime,
  ASSUMED_GUESSES_PER_SECOND,
  ASSUMED_GUESSES_PER_SECOND_LABEL,
};
