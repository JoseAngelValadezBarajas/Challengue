export interface RedactionEntry {
  index: number;
  start: number;
  end: number;
  term: string;
  original: string;
}

export interface RedactionResponse {
  redactedText: string;
  key: string;
  redactions: RedactionEntry[];
}

export interface UnredactionResponse {
  unredactedText: string;
}

export interface StoredDocument {
  id: string;
  title: string | null;
  classification: string | null;
  ownerId: string | null;
  redactedText: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDocumentWithKey extends StoredDocument {
  key: string;
  redactions: RedactionEntry[];
}

export interface StoreRedactedDocumentInput {
  terms: string;
  documentText: string;
  metadata: {
    title?: string;
    classification?: string;
    ownerId?: string;
  };
}
