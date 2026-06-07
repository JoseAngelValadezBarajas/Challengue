import type { RedactionResponse } from "../api.js";
import type { RestorationBundle } from "../interfaces/restorationBundleInterfaces.js";

const BUNDLE_HEADER = "MELTWATER_RESTORATION_BUNDLE_V1";
const CREATED_AT_PREFIX = "CREATED_AT: ";
const KEY_SECTION = "KEY:";
const REDACTED_TEXT_SECTION = "REDACTED_TEXT:";

export function createRestorationBundle(result: Pick<RedactionResponse, "key" | "redactedText">): RestorationBundle {
  return {
    version: 1,
    redactedText: result.redactedText,
    key: result.key,
    createdAt: new Date().toISOString(),
  };
}

export function serializeRestorationBundle(result: Pick<RedactionResponse, "key" | "redactedText">): string {
  const bundle = createRestorationBundle(result);

  return [
    BUNDLE_HEADER,
    `${CREATED_AT_PREFIX}${bundle.createdAt}`,
    KEY_SECTION,
    bundle.key,
    REDACTED_TEXT_SECTION,
    bundle.redactedText,
  ].join("\n");
}

export function parseRestorationBundle(raw: string): RestorationBundle | null {
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0] !== BUNDLE_HEADER) {
    return null;
  }

  const keySectionIndex = lines.indexOf(KEY_SECTION);
  const redactedTextSectionIndex = lines.indexOf(REDACTED_TEXT_SECTION);

  if (keySectionIndex < 0 || redactedTextSectionIndex < 0 || redactedTextSectionIndex <= keySectionIndex) {
    return null;
  }

  const key = lines.slice(keySectionIndex + 1, redactedTextSectionIndex).join("\n").trim();
  const redactedText = lines.slice(redactedTextSectionIndex + 1).join("\n");

  if (!key || !redactedText) {
    return null;
  }

  return {
    version: 1,
    redactedText,
    key,
    createdAt: lines.find((line) => line.startsWith(CREATED_AT_PREFIX))?.slice(CREATED_AT_PREFIX.length) ?? "",
  };
}
