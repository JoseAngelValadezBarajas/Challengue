#!/usr/bin/env node
import { redactDocument, RedactionError, unredactDocument } from "@meltwater-redaction/domain";
import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { CLI_ERROR_CODE, CLI_USAGE, REDACT_USAGE, TXT_EXTENSION, UNREDACT_USAGE } from "./constants/cliConstants.js";
import type { CliOptions } from "./interfaces/cliInterfaces.js";

function main(argv: string[]) {
  const options = parseArgs(argv);

  try {
    if (options.command === "redact") {
      const documentText = resolveDocumentText(options);

      if (!options.terms || documentText === undefined) {
        throw new Error(REDACT_USAGE);
      }

      const result = redactDocument(options.terms, documentText);
      print(options.json, result, [
        ["Redacted text", result.redactedText],
        ["Key", result.key],
        ["Redactions", String(result.redactions.length)],
      ]);
      return;
    }

    if (options.command === "unredact") {
      const documentText = resolveDocumentText(options);

      if (!options.key || documentText === undefined) {
        throw new Error(UNREDACT_USAGE);
      }

      const result = unredactDocument(options.key, documentText);
      print(options.json, result, [["Unredacted text", result.unredactedText]]);
      return;
    }

    throw new Error(CLI_USAGE);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CLI error.";
    const code = error instanceof RedactionError ? error.code : CLI_ERROR_CODE;

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

    if (arg === "--file") {
      options.file = readOptionValue(rest, index, arg);
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

function resolveDocumentText(options: CliOptions): string | undefined {
  if (options.text !== undefined && options.file !== undefined) {
    throw new Error("Use either --text or --file, not both.");
  }

  if (options.file === undefined) {
    return options.text;
  }

  if (!options.file.toLowerCase().endsWith(TXT_EXTENSION)) {
    throw new Error("Only .txt files are supported.");
  }

  return readFileSync(resolveFilePath(options.file), "utf8");
}

function resolveFilePath(filePath: string): string {
  if (isAbsolute(filePath)) {
    return filePath;
  }

  return resolve(process.env.INIT_CWD ?? process.cwd(), filePath);
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
