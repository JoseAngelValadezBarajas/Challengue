import { REDACTION_KEY_VERSION } from "./constants/redactionConstants.js";
import { RedactionError } from "./errors/RedactionError.js";

interface EncodedKey {
  version: typeof REDACTION_KEY_VERSION;
  values: string[];
}

export function encodeRedactionKey(values: string[]): string {
  const payload: EncodedKey = {
    version: REDACTION_KEY_VERSION,
    values,
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeRedactionKey(key: string): string[] {
  try {
    const decoded = Buffer.from(key, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as Partial<EncodedKey>;

    if (
      payload.version !== REDACTION_KEY_VERSION ||
      !Array.isArray(payload.values) ||
      !payload.values.every((value) => typeof value === "string")
    ) {
      throw new Error("Invalid key payload.");
    }

    return payload.values;
  } catch {
    throw new RedactionError("The provided key is invalid.", "INVALID_KEY");
  }
}
