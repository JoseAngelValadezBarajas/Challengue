#!/usr/bin/env node
import { redactDocument, RedactionError, unredactDocument } from "@meltwater-redaction/domain";

type Command = "redact" | "unredact";

interface CliOptions {
  command?: Command;
  terms?: string;
  text?: string;
  key?: string;
  json: boolean;
}

function main(argv: string[]) {
  const options = parseArgs(argv);

  try {
    if (options.command === "redact") {
      if (!options.terms || options.text === undefined) {
        throw new Error("Usage: redact --terms <terms> --text <document> [--json]");
      }

      const result = redactDocument(options.terms, options.text);
      print(options.json, result, [
        ["Redacted text", result.redactedText],
        ["Key", result.key],
        ["Redactions", String(result.redactions.length)],
      ]);
      return;
    }

    if (options.command === "unredact") {
      if (!options.key || options.text === undefined) {
        throw new Error("Usage: unredact --key <key> --text <document> [--json]");
      }

      const result = unredactDocument(options.key, options.text);
      print(options.json, result, [["Unredacted text", result.unredactedText]]);
      return;
    }

    throw new Error("Usage: redaction <redact|unredact> [options]");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CLI error.";
    const code = error instanceof RedactionError ? error.code : "CLI_ERROR";

    if (options.json) {
      console.error(JSON.stringify({ error: { code, message } }, null, 2));
    } else {
      console.error(`${code}: ${message}`);
    }

    process.exitCode = 1;
  }
}

function parseArgs(argv: string[]): CliOptions {
  const [commandCandidate, ...rest] = argv;
  const command = commandCandidate === "redact" || commandCandidate === "unredact" ? commandCandidate : undefined;
  const options: CliOptions = { json: false };

  if (command) {
    options.command = command;
  }

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--terms") {
      options.terms = readOptionValue(rest, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--text") {
      options.text = readOptionValue(rest, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--key") {
      options.key = readOptionValue(rest, index, arg);
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg ?? ""}`);
  }

  return options;
}

function readOptionValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];

  if (value === undefined || value.startsWith("--")) {
    throw new Error(`Missing value for ${option}.`);
  }

  return value;
}

function print(json: boolean, payload: unknown, lines: Array<[string, string]>) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  for (const [label, value] of lines) {
    console.log(`${label}: ${value}`);
  }
}

main(process.argv.slice(2));
