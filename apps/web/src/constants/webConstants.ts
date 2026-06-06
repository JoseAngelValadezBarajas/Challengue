export const DEFAULT_API_BASE_URL = "http://localhost:4000";

export const API_ENDPOINTS = {
  REDACTIONS: "/redactions",
  UNREDACTIONS: "/unredactions",
  DOCUMENT_REDACTIONS: "/documents/redactions",
  DOCUMENTS: "/documents",
  documentRedactions: (documentId: string) => `/documents/${documentId}/redactions`,
  documentUnredactions: (documentId: string) => `/documents/${documentId}/unredactions`,
} as const;

export const REDACT_DEMO_DEFAULTS = {
  TERMS: "Hello world \u201cBoston Red Sox\u201d, beer",
  DOCUMENT_TEXT: "Hello world met the Boston Red Sox and ordered beer.",
} as const;

export const DOCUMENT_DEMO_DEFAULTS = {
  TERMS: '"Boston Red Sox", beer',
  DOCUMENT_TEXT: "The Boston Red Sox ordered beer.",
  TITLE: "Stored briefing",
  CLASSIFICATION: "secret",
  OWNER_ID: "demo-user",
  SEARCH_TERM: "beer",
} as const;

export const UI_MESSAGES = {
  REQUEST_FAILED: "Request failed.",
  REDACT_FAILED: "Unable to redact document.",
  UNREDACT_FAILED: "Unable to unredact document.",
  STORE_FAILED: "Unable to store document.",
  SEARCH_FAILED: "Unable to search documents.",
  LOAD_REDACTIONS_FAILED: "Unable to load redactions.",
  RESTORE_STORED_FAILED: "Unable to restore stored document.",
  STORED_KEY_UNAVAILABLE: "The restoration key is only returned when a document is first stored in this demo.",
  REDACT_EMPTY: "Run a redaction to see the masked document and restoration key.",
  UNREDACT_EMPTY: "Paste a key and redacted text to restore the original document.",
  DOCUMENTS_EMPTY: "Store or search documents to inspect the SQLite prototype.",
  STORED_DETAIL_EMPTY: "Select a stored document to inspect redactions and restoration behavior.",
} as const;
