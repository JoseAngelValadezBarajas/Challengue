export interface DocumentRow {
  id: string;
  title: string | null;
  classification: string | null;
  owner_id: string | null;
  redacted_text: string;
  restoration_key: string;
  created_at: string;
  updated_at: string;
}

export interface RedactionRow {
  redaction_index: number;
  start_offset: number;
  end_offset: number;
  term: string;
  original: string;
}

export interface AuditRow {
  id: string;
  document_id: string | null;
  action: string;
  metadata: string;
  created_at: string;
}
