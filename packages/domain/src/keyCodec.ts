import { RedactionError } from "./types.js";

interface EncodedKey {
  version: 1;
  values: string[];
}

export function encodeRedactionKey(values: string[]): string {
  const payload: EncodedKey = {
    version: 1,
    values,
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeRedactionKey(key: string): string[] {
  try {
    const decoded = Buffer.from(key, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as Partial<EncodedKey>;

    if (
      payload.version !== 1 ||
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
