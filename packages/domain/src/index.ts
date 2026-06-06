export { decodeRedactionKey, encodeRedactionKey } from "./keyCodec.js";
export { redactDocument } from "./redactor.js";
export { parseTerms } from "./termParser.js";
export { RedactionError } from "./errors/RedactionError.js";
export type {
  RedactionEntry,
  RedactionErrorCode,
  RedactionResult,
  RedactionTerm,
  UnredactionResult,
} from "./interfaces/redactionInterfaces.js";
export { unredactDocument } from "./unredactor.js";
