import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { RedactionEntry } from "@meltwater-redaction/domain";
import { normalizeRedactedTerm } from "./normalization.js";
import type { AuditEvent, DocumentMetadata, DocumentSearchResult, StoredDocument, StoredDocumentWithKey } from "./types.js";

interface DocumentRow {
  id: string;
  title: string | null;
  classification: string | null;
  owner_id: string | null;
  redacted_text: string;
  restoration_key: string;
  created_at: string;
  updated_at: string;
}

interface RedactionRow {
  redaction_index: number;
  start_offset: number;
  end_offset: number;
  term: string;
  original: string;
}

interface AuditRow {
  id: string;
  document_id: string | null;
  action: string;
  metadata: string;
  created_at: string;
}

export class SqliteDocumentRepository {
  private readonly db: Database.Database;

  constructor(databasePath: string) {
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }

    this.db = new Database(databasePath);
    this.db.pragma("journal_mode = WAL");
    this.migrate();
  }

  createDocument(input: {
    redactedText: string;
    key: string;
    redactions: RedactionEntry[];
    metadata?: DocumentMetadata;
  }): StoredDocumentWithKey {
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

      this.recordAuditEvent("DOCUMENT_REDACTED", id, {
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

    this.recordAuditEvent("DOCUMENT_READ", id, {});
    return mapDocument(row);
  }

  getDocumentRedactions(id: string): RedactionEntry[] | null {
    const exists = this.db.prepare("SELECT id FROM documents WHERE id = ?").get(id);

    if (!exists) {
      return null;
    }

    const rows = this.db
      .prepare("SELECT * FROM document_redactions WHERE document_id = ? ORDER BY redaction_index ASC")
      .all(id) as RedactionRow[];

    this.recordAuditEvent("DOCUMENT_REDACTIONS_READ", id, {});
    return rows.map((row) => ({
      index: row.redaction_index,
      start: row.start_offset,
      end: row.end_offset,
      term: row.term,
      original: row.original,
    }));
  }

  searchDocuments(redactedTerm?: string): DocumentSearchResult {
    if (!redactedTerm) {
      const rows = this.db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all() as DocumentRow[];
      this.recordAuditEvent("DOCUMENT_SEARCHED", null, { redactedTerm: null, resultCount: rows.length });
      return { documents: rows.map(mapDocument) };
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

    this.recordAuditEvent("DOCUMENT_SEARCHED", null, { redactedTerm: normalizedTerm, resultCount: rows.length });
    return { documents: rows.map(mapDocument) };
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

    return rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      action: row.action,
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      createdAt: row.created_at,
    }));
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

function mapDocument(row: DocumentRow): StoredDocument {
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
