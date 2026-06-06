import type { RedactionErrorCode } from "../interfaces/redactionInterfaces.js";

export class RedactionError extends Error {
  constructor(
    message: string,
    public readonly code: RedactionErrorCode
  ) {
    super(message);
    this.name = "RedactionError";
  }
}
