import type {
  RedactionResponse,
  StoreRedactedDocumentInput,
  StoredDocument,
  StoredDocumentWithKey,
  UnredactionResponse,
} from "./interfaces/apiInterfaces.js";
import { API_ENDPOINTS, DEFAULT_API_BASE_URL, UI_MESSAGES } from "./constants/webConstants.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export type {
  RedactionEntry,
  RedactionResponse,
  StoredDocument,
  StoredDocumentWithKey,
  UnredactionResponse,
} from "./interfaces/apiInterfaces.js";

export async function redactDocument(terms: string, documentText: string): Promise<RedactionResponse> {
  return postJson(API_ENDPOINTS.REDACTIONS, { terms, documentText });
}

export async function unredactDocument(key: string, documentText: string): Promise<UnredactionResponse> {
  return postJson(API_ENDPOINTS.UNREDACTIONS, { key, documentText });
}

export async function storeRedactedDocument(input: StoreRedactedDocumentInput): Promise<StoredDocumentWithKey> {
  return postJson(API_ENDPOINTS.DOCUMENT_REDACTIONS, input);
}

export async function searchStoredDocuments(redactedTerm: string): Promise<{ documents: StoredDocument[] }> {
  const searchParams = new URLSearchParams();

  if (redactedTerm.trim()) {
    searchParams.set("redactedTerm", redactedTerm.trim());
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return getJson(`${API_ENDPOINTS.DOCUMENTS}${suffix}`);
}

export async function getStoredDocumentRedactions(documentId: string): Promise<{ redactions: RedactionResponse["redactions"] }> {
  return getJson(API_ENDPOINTS.documentRedactions(documentId));
}

export async function unredactStoredDocument(documentId: string, key: string): Promise<UnredactionResponse> {
  return postJson(API_ENDPOINTS.documentUnredactions(documentId), { key });
}

async function getJson<TResponse extends object>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = (await response.json()) as TResponse | { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(("error" in payload && payload.error?.message) || UI_MESSAGES.REQUEST_FAILED);
  }

  return payload as TResponse;
}

async function postJson<TResponse extends object>(path: string, body: unknown): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as TResponse | { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(("error" in payload && payload.error?.message) || UI_MESSAGES.REQUEST_FAILED);
  }

  return payload as TResponse;
}
