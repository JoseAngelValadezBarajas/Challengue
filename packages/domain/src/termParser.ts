import { QUOTE_PAIRS } from "./constants/redactionConstants.js";
import { RedactionError } from "./errors/RedactionError.js";
import type { RedactionTerm } from "./interfaces/redactionInterfaces.js";

export function parseTerms(input: string): RedactionTerm[] {
  const terms: RedactionTerm[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    cursor = skipSeparators(input, cursor);

    if (cursor >= input.length) {
      break;
    }

    const char = input[cursor];
    const closingQuote = QUOTE_PAIRS.get(char ?? "");
    if (closingQuote) {
      const parsed = readQuotedTerm(input, cursor, closingQuote);
      terms.push({ value: parsed.value, kind: "phrase" });
      cursor = parsed.next;
      continue;
    }

    const parsed = readBareTerm(input, cursor);
    terms.push({ value: parsed.value, kind: "keyword" });
    cursor = parsed.next;
  }

  return dedupeTerms(terms);
}

function skipSeparators(input: string, cursor: number): number {
  while (cursor < input.length && /[\s,]/u.test(input[cursor] ?? "")) {
    cursor += 1;
  }

  return cursor;
}

function readQuotedTerm(input: string, cursor: number, closingQuote: string) {
  let next = cursor + 1;
  let value = "";

  while (next < input.length) {
    const char = input[next];

    if (char === closingQuote) {
      const trimmed = value.trim();
      if (!trimmed) {
        throw new RedactionError("Quoted terms cannot be empty.", "INVALID_TERMS");
      }

      return { value: trimmed, next: next + 1 };
    }

    value += char;
    next += 1;
  }

  throw new RedactionError("Quoted term is missing a closing quote.", "INVALID_TERMS");
}

function readBareTerm(input: string, cursor: number) {
  let next = cursor;
  let value = "";

  while (next < input.length && !/[\s,]/u.test(input[next] ?? "")) {
    value += input[next];
    next += 1;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new RedactionError("Terms cannot be empty.", "INVALID_TERMS");
  }

  return { value: trimmed, next };
}

function dedupeTerms(terms: RedactionTerm[]): RedactionTerm[] {
  const seen = new Set<string>();

  return terms.filter((term) => {
    if (seen.has(term.value)) {
      return false;
    }

    seen.add(term.value);
    return true;
  });
}
