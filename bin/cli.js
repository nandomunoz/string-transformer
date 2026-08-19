#!/usr/bin/env node
import { strTo, transformers } from "../src/js/core.js";
import msg from "../src/js/data/msg.js";

function printUsage() {
  console.error("Usage:");
  console.error('  string-transformer <mode> "text"');
  console.error('  echo "text" | string-transformer <mode>');
  console.error("  string-transformer --list");
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").replace(/\n$/, "");
}

async function main() {
  const [, , mode, ...rest] = process.argv;

  if (!mode || mode === "--help" || mode === "-h") {
    printUsage();
    process.exitCode = mode ? 0 : 1;
    return;
  }

  if (mode === "--list") {
    Object.keys(transformers)
      .sort()
      .forEach((id) => console.log(`${id}\t${(msg[id] || {}).title || ""}`));
    return;
  }

  if (typeof transformers[mode] !== "function") {
    console.error(`Unknown mode "${mode}". Run with --list to see all modes.`);
    process.exitCode = 1;
    return;
  }

  let text;
  if (rest.length > 0) {
    text = rest.join(" ");
  } else if (process.stdin.isTTY) {
    console.error("No input text given (pass it as an argument or pipe it via stdin).");
    printUsage();
    process.exitCode = 1;
    return;
  } else {
    text = await readStdin();
  }

  const result = await strTo({ mode, str: text, transformers });

  if (!result.ok) {
    console.error(result.error || `Could not run "${mode}" on the given input.`);
    process.exitCode = 1;
    return;
  }

  console.log(result.value);
}

main();
