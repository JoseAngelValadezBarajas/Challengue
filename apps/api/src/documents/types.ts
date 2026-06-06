import type { RedactionEntry } from "@meltwater-redaction/domain";

export interface DocumentMetadata {
  title?: string | undefined;
  classification?: string | undefined;
  ownerId?: string | undefined;
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

export interface DocumentSearchResult {
  documents: StoredDocument[];
}

export interface AuditEvent {
  id: string;
  documentId: string | null;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
