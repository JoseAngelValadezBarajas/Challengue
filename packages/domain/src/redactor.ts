import { REDACTION_MASK } from "./constants/redactionConstants.js";
import { encodeRedactionKey } from "./keyCodec.js";
import { parseTerms } from "./termParser.js";
import type { RedactionEntry, RedactionResult } from "./interfaces/redactionInterfaces.js";

interface Match {
  start: number;
  end: number;
  term: string;
  original: string;
}

export function redactDocument(termsInput: string, documentText: string): RedactionResult {
  const terms = parseTerms(termsInput);
  const matches = findMatches(
    documentText,
    terms.map((term) => term.value).sort((left, right) => right.length - left.length)
  );

  const redactions: RedactionEntry[] = matches.map((match, index) => ({
    index,
    start: match.start,
    end: match.end,
    term: match.term,
    original: match.original,
  }));

  return {
    redactedText: applyMatches(documentText, matches),
    key: encodeRedactionKey(redactions.map((redaction) => redaction.original)),
    redactions,
  };
}

function findMatches(documentText: string, terms: string[]): Match[] {
  const matches: Match[] = [];
  let cursor = 0;

  while (cursor < documentText.length) {
    const match = terms.find((term) => documentText.startsWith(term, cursor));

    if (!match) {
      cursor += 1;
      continue;
    }

    matches.push({
      start: cursor,
      end: cursor + match.length,
      term: match,
      original: documentText.slice(cursor, cursor + match.length),
    });
    cursor += match.length;
  }

  return matches;
}

function applyMatches(documentText: string, matches: Match[]): string {
  if (matches.length === 0) {
    return documentText;
  }

  let redactedText = "";
  let cursor = 0;

  for (const match of matches) {
    redactedText += documentText.slice(cursor, match.start);
    redactedText += REDACTION_MASK;
    cursor = match.end;
  }

  return redactedText + documentText.slice(cursor);
}
