import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DOCUMENT_AUDIT_ACTIONS, MEMORY_SQLITE_PATH } from "../constants/documentConstants.js";
import type {
  AuditEvent,
  CreateStoredDocumentInput,
  DocumentSearchResult,
  StoredDocument,
  StoredDocumentWithKey,
} from "../interfaces/documentInterfaces.js";
import { mapAuditRow, mapDocumentRow, mapRedactionRow } from "../mappers/documentMappers.js";
import type { AuditRow, DocumentRow, RedactionRow } from "../models/sqliteRows.js";
import { normalizeRedactedTerm } from "../normalization.js";

export class SqliteDocumentRepository {
  private readonly db: Database.Database;

  constructor(databasePath: string) {
    if (databasePath !== MEMORY_SQLITE_PATH) {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.db = new Database(databasePath);
    this.db.pragma("journal_mode = WAL");
    this.migrate();
  }

  createDocument(input: CreateStoredDocumentInput): StoredDocumentWithKey {
    const now = new Date().toISOString();
    const id = randomUUID();
    const insertDocument = this.db.prepare(`
      INSERT INTO documents (id, title, classification, owner_id, redacted_text, restoration_key, created_at, updated_at)
      VALUES (@id, @title, @classification, @ownerId, @redactedText, @key, @createdAt, @updatedAt)
    `);
    const insertRedaction = this.db.prepare(`
      INSERT INTO document_redactions (
        id, document_id, redaction_index, term, normalized_term, original, start_offset, end_offset, created_at
      )
      VALUES (@id, @documentId, @redactionIndex, @term, @normalizedTerm, @original, @startOffset, @endOffset, @createdAt)
    `);

    const transaction = this.db.transaction(() => {
      insertDocument.run({
        id,
        title: input.metadata?.title ?? null,
        classification: input.metadata?.classification ?? null,
        ownerId: input.metadata?.ownerId ?? null,
        redactedText: input.redactedText,
        key: input.key,
        createdAt: now,
        updatedAt: now,
      });

      for (const redaction of input.redactions) {
        insertRedaction.run({
          id: randomUUID(),
          documentId: id,
          redactionIndex: redaction.index,
          term: redaction.term,
          normalizedTerm: normalizeRedactedTerm(redaction.term),
          original: redaction.original,
          startOffset: redaction.start,
          endOffset: redaction.end,
          createdAt: now,
        });
      }

      this.recordAuditEvent(DOCUMENT_AUDIT_ACTIONS.REDACTED, id, {
        redactionCount: input.redactions.length,
        classification: input.metadata?.classification ?? null,
      });
    });

    transaction();
    return {
      id,
      title: input.metadata?.title ?? null,
      classification: input.metadata?.classification ?? null,
      ownerId: input.metadata?.ownerId ?? null,
      redactedText: input.redactedText,
      key: input.key,
      redactions: input.redactions,
      createdAt: now,
      updatedAt: now,
    };
  }

  getDocument(id: string): StoredDocument | null {
    const row = this.db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as DocumentRow | undefined;

    if (!row) {
      return null;
    }

    this.recordAuditEvent(DOCUMENT_AUDIT_ACTIONS.READ, id, {});
    return mapDocumentRow(row);
  }

  getDocumentRedactions(id: string) {
    const exists = this.db.prepare("SELECT id FROM documents WHERE id = ?").get(id);

    if (!exists) {
      return null;
    }

    const rows = this.db
      .prepare("SELECT * FROM document_redactions WHERE document_id = ? ORDER BY redaction_index ASC")
      .all(id) as RedactionRow[];

    this.recordAuditEvent(DOCUMENT_AUDIT_ACTIONS.REDACTIONS_READ, id, {});
    return rows.map(mapRedactionRow);
  }

  searchDocuments(redactedTerm?: string): DocumentSearchResult {
    if (!redactedTerm) {
      const rows = this.db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all() as DocumentRow[];
      this.recordAuditEvent(DOCUMENT_AUDIT_ACTIONS.SEARCHED, null, { redactedTerm: null, resultCount: rows.length });
      return { documents: rows.map(mapDocumentRow) };
    }

    const normalizedTerm = normalizeRedactedTerm(redactedTerm);
    const rows = this.db
      .prepare(`
        SELECT DISTINCT documents.*
        FROM documents
        INNER JOIN document_redactions ON document_redactions.document_id = documents.id
        WHERE document_redactions.normalized_term = ?
        ORDER BY documents.created_at DESC
      `)
      .all(normalizedTerm) as DocumentRow[];

    this.recordAuditEvent(DOCUMENT_AUDIT_ACTIONS.SEARCHED, null, { redactedTerm: normalizedTerm, resultCount: rows.length });
    return { documents: rows.map(mapDocumentRow) };
  }

  getStoredRedactedText(id: string): string | null {
    const row = this.db.prepare("SELECT redacted_text FROM documents WHERE id = ?").get(id) as
      | { redacted_text: string }
      | undefined;

    return row?.redacted_text ?? null;
  }

  recordAuditEvent(action: string, documentId: string | null, metadata: Record<string, unknown>): AuditEvent {
    const event: AuditEvent = {
      id: randomUUID(),
      documentId,
      action,
      metadata,
      createdAt: new Date().toISOString(),
    };

    this.db
      .prepare("INSERT INTO document_audit_events (id, document_id, action, metadata, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(event.id, event.documentId, event.action, JSON.stringify(event.metadata), event.createdAt);

    return event;
  }

  listAuditEvents(documentId: string): AuditEvent[] {
    const rows = this.db
      .prepare("SELECT * FROM document_audit_events WHERE document_id = ? ORDER BY created_at ASC")
      .all(documentId) as AuditRow[];

    return rows.map(mapAuditRow);
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT,
        classification TEXT,
        owner_id TEXT,
        redacted_text TEXT NOT NULL,
        restoration_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS document_redactions (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        redaction_index INTEGER NOT NULL,
        term TEXT NOT NULL,
        normalized_term TEXT NOT NULL,
        original TEXT NOT NULL,
        start_offset INTEGER NOT NULL,
        end_offset INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS document_audit_events (
        id TEXT PRIMARY KEY,
        document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        metadata TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_document_redactions_normalized_term
        ON document_redactions(normalized_term);

      CREATE INDEX IF NOT EXISTS idx_document_redactions_document_id
        ON document_redactions(document_id);

      CREATE INDEX IF NOT EXISTS idx_document_audit_events_document_id
        ON document_audit_events(document_id);
    `);
  }
}
