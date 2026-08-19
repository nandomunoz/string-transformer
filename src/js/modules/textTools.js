// # MULTILINE TEXT TOOLS
function removeExtraSpaces(str) {
  return str
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
}

function removeEmptyLines(str) {
  return str.split("\n").filter((line) => line.trim() !== "").join("\n");
}

function sortLines(str) {
  return str.split("\n").sort((a, b) => a.localeCompare(b)).join("\n");
}

function sortLinesDesc(str) {
  return str.split("\n").sort((a, b) => b.localeCompare(a)).join("\n");
}

function dedupeLines(str) {
  return [...new Set(str.split("\n"))].join("\n");
}

function reverseLines(str) {
  return str.split("\n").reverse().join("\n");
}

const textTools = {
  removeExtraSpaces,
  removeEmptyLines,
  sortLines,
  sortLinesDesc,
  dedupeLines,
  reverseLines,
};

export {
  removeExtraSpaces,
  removeEmptyLines,
  sortLines,
  sortLinesDesc,
  dedupeLines,
  reverseLines,
  textTools,
};
