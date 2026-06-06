import type { RedactionEntry } from "@meltwater-redaction/domain";
import type { AuditEvent, StoredDocument } from "../interfaces/documentInterfaces.js";
import type { AuditRow, DocumentRow, RedactionRow } from "../models/sqliteRows.js";

export function mapDocumentRow(row: DocumentRow): StoredDocument {
  return {
    id: row.id,
    title: row.title,
    classification: row.classification,
    ownerId: row.owner_id,
    redactedText: row.redacted_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRedactionRow(row: RedactionRow): RedactionEntry {
  return {
    index: row.redaction_index,
    start: row.start_offset,
    end: row.end_offset,
    term: row.term,
    original: row.original,
  };
}

export function mapAuditRow(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    documentId: row.document_id,
    action: row.action,
    metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}
