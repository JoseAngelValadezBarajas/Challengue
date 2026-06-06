const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface RedactionResponse {
  redactedText: string;
  key: string;
  redactions: Array<{
    index: number;
    start: number;
    end: number;
    term: string;
    original: string;
  }>;
}

export interface UnredactionResponse {
  unredactedText: string;
}

export async function redactDocument(terms: string, documentText: string): Promise<RedactionResponse> {
  return postJson("/redactions", { terms, documentText });
}

export async function unredactDocument(key: string, documentText: string): Promise<UnredactionResponse> {
  return postJson("/unredactions", { key, documentText });
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
