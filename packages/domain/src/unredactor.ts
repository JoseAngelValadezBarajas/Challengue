import { decodeRedactionKey } from "./keyCodec.js";
import { RedactionError, type UnredactionResult } from "./types.js";

const MASK = "XXXX";

export function unredactDocument(key: string, documentText: string): UnredactionResult {
  const values = decodeRedactionKey(key);
  let replacementIndex = 0;

  const unredactedText = documentText.replaceAll(MASK, () => {
    const replacement = values[replacementIndex];

    if (replacement === undefined) {
      throw new RedactionError(
        "The document has more redaction placeholders than the key can restore.",
        "PLACEHOLDER_MISMATCH"
      );
    }

    replacementIndex += 1;
    return replacement;
  });

  if (replacementIndex !== values.length) {
    throw new RedactionError(
      "The key contains more redactions than the document has placeholders.",
      "PLACEHOLDER_MISMATCH"
    );
  }

  return { unredactedText };
}
