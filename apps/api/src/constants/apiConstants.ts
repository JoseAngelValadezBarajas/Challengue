export const API_SERVICE_NAME = "redaction-api";

export const API_VERSION = "1.0.0";

export const API_STORAGE_ENGINE = "sqlite";

export const DEFAULT_API_PORT = 4000;

export const API_ROUTES = {
  HEALTH: "/health",
  REDACTIONS: "/redactions",
  UNREDACTIONS: "/unredactions",
  DOCUMENTS: "/documents",
} as const;

export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DOCUMENT_NOT_FOUND: "DOCUMENT_NOT_FOUND",
  CLI_ERROR: "CLI_ERROR",
} as const;

export const API_ERROR_MESSAGES = {
  VALIDATION_ERROR: "Request payload is invalid.",
  INTERNAL_SERVER_ERROR: "An unexpected error occurred.",
  DOCUMENT_NOT_FOUND: "Document was not found.",
} as const;
