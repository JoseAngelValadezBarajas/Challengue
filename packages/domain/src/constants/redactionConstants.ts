export const REDACTION_MASK = "XXXX";

export const REDACTION_KEY_VERSION = 1;

export const REDACTION_ERROR_CODES = {
  INVALID_TERMS: "INVALID_TERMS",
  INVALID_KEY: "INVALID_KEY",
  PLACEHOLDER_MISMATCH: "PLACEHOLDER_MISMATCH",
} as const;

export const QUOTE_PAIRS = new Map([
  ['"', '"'],
  ["'", "'"],
  ["\u201c", "\u201d"],
  ["\u2018", "\u2019"],
]);
