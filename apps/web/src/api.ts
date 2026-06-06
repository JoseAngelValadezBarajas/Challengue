import type {
  RedactionResponse,
  StoreRedactedDocumentInput,
  StoredDocument,
  StoredDocumentWithKey,
  UnredactionResponse,
} from "./interfaces/apiInterfaces.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type {
  RedactionEntry,
  RedactionResponse,
  StoredDocument,
  StoredDocumentWithKey,
  UnredactionResponse,
} from "./interfaces/apiInterfaces.js";

export async function redactDocument(terms: string, documentText: string): Promise<RedactionResponse> {
  return postJson("/redactions", { terms, documentText });
}

export async function unredactDocument(key: string, documentText: string): Promise<UnredactionResponse> {
  return postJson("/unredactions", { key, documentText });
}

export async function storeRedactedDocument(input: StoreRedactedDocumentInput): Promise<StoredDocumentWithKey> {
  return postJson("/documents/redactions", input);
}

export async function searchStoredDocuments(redactedTerm: string): Promise<{ documents: StoredDocument[] }> {
  const searchParams = new URLSearchParams();

  if (redactedTerm.trim()) {
    searchParams.set("redactedTerm", redactedTerm.trim());
  }

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return getJson(`/documents${suffix}`);
}

export async function getStoredDocumentRedactions(documentId: string): Promise<{ redactions: RedactionResponse["redactions"] }> {
  return getJson(`/documents/${documentId}/redactions`);
}

export async function unredactStoredDocument(documentId: string, key: string): Promise<UnredactionResponse> {
  return postJson(`/documents/${documentId}/unredactions`, { key });
}

async function getJson<TResponse extends object>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = (await response.json()) as TResponse | { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(("error" in payload && payload.error?.message) || "Request failed.");
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
    throw new Error(("error" in payload && payload.error?.message) || "Request failed.");
  }

  return payload as TResponse;
}
