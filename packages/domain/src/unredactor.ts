import { REDACTION_ERROR_CODES, REDACTION_MASK } from "./constants/redactionConstants.js";
import { RedactionError } from "./errors/RedactionError.js";
import type { UnredactionResult } from "./interfaces/redactionInterfaces.js";
import { decodeRedactionKey } from "./keyCodec.js";

export function unredactDocument(key: string, documentText: string): UnredactionResult {
  const values = decodeRedactionKey(key);
  let replacementIndex = 0;

  const unredactedText = documentText.replaceAll(REDACTION_MASK, () => {
    const replacement = values[replacementIndex];

    if (replacement === undefined) {
      throw new RedactionError(
        "The document has more redaction placeholders than the key can restore.",
        REDACTION_ERROR_CODES.PLACEHOLDER_MISMATCH
      );
    }

    replacementIndex += 1;
    return replacement;
  });

  if (replacementIndex !== values.length) {
    throw new RedactionError(
      "The key contains more redactions than the document has placeholders.",
      REDACTION_ERROR_CODES.PLACEHOLDER_MISMATCH
    );
  }

  return { unredactedText };
}
