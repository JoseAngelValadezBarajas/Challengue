import { ArrowRight, Database, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import {
  getStoredDocumentRedactions,
  searchStoredDocuments,
  storeRedactedDocument,
  type RedactionResponse,
  type StoredDocument,
  type StoredDocumentWithKey,
  unredactStoredDocument,
} from "../api.js";
import { DOCUMENT_DEMO_DEFAULTS, UI_MESSAGES } from "../constants/webConstants.js";
import { RedactionTable } from "./RedactionTable.js";

interface DocumentsPanelProps {
  onMoveToUnredact: (result: RedactionResponse) => void;
}

export function DocumentsPanel({ onMoveToUnredact }: DocumentsPanelProps) {
  const [terms, setTerms] = useState<string>(DOCUMENT_DEMO_DEFAULTS.TERMS);
  const [documentText, setDocumentText] = useState<string>(DOCUMENT_DEMO_DEFAULTS.DOCUMENT_TEXT);
  const [title, setTitle] = useState<string>(DOCUMENT_DEMO_DEFAULTS.TITLE);
  const [classification, setClassification] = useState<string>(DOCUMENT_DEMO_DEFAULTS.CLASSIFICATION);
  const [ownerId, setOwnerId] = useState<string>(DOCUMENT_DEMO_DEFAULTS.OWNER_ID);
  const [searchTerm, setSearchTerm] = useState<string>(DOCUMENT_DEMO_DEFAULTS.SEARCH_TERM);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [selected, setSelected] = useState<StoredDocumentWithKey | null>(null);
  const [selectedRedactions, setSelectedRedactions] = useState<RedactionResponse["redactions"]>([]);
  const [storedRestore, setStoredRestore] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStore(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const created = await storeRedactedDocument({
        terms,
        documentText,
        metadata: {
          ...(title ? { title } : {}),
          ...(classification ? { classification } : {}),
          ...(ownerId ? { ownerId } : {}),
        },
      });
      setSelected(created);
      setSelectedRedactions(created.redactions);
      setDocuments((current) => [created, ...current.filter((document) => document.id !== created.id)]);
      setStoredRestore("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : UI_MESSAGES.STORE_FAILED);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await searchStoredDocuments(searchTerm);
      setDocuments(result.documents);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : UI_MESSAGES.SEARCH_FAILED);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(document: StoredDocument) {
    setError("");
    setSelected({ ...document, key: selected?.id === document.id ? selected.key : "", redactions: [] });
    setStoredRestore("");

    try {
      const result = await getStoredDocumentRedactions(document.id);
      setSelectedRedactions(result.redactions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : UI_MESSAGES.LOAD_REDACTIONS_FAILED);
    }
  }

  async function handleStoredUnredact() {
    if (!selected?.key) {
      setError(UI_MESSAGES.STORED_KEY_UNAVAILABLE);
      return;
    }

    setError("");

    try {
      const result = await unredactStoredDocument(selected.id, selected.key);
      setStoredRestore(result.unredactedText);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : UI_MESSAGES.RESTORE_STORED_FAILED);
    }
  }

  return (
    <div className="documents-layout">
      <form className="documents-form" onSubmit={handleStore}>
        <label>
          Keywords and phrases
          <input value={terms} onChange={(event) => setTerms(event.target.value)} />
        </label>
        <label>
          Document text
          <textarea value={documentText} onChange={(event) => setDocumentText(event.target.value)} rows={8} />
        </label>
        <div className="metadata-grid">
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Classification
            <input value={classification} onChange={(event) => setClassification(event.target.value)} />
          </label>
          <label>
            Owner
            <input value={ownerId} onChange={(event) => setOwnerId(event.target.value)} />
          </label>
        </div>
        <button className="primary-action" disabled={loading} type="submit">
          <Database size={18} aria-hidden="true" />
          {loading ? "Saving..." : "Store redacted document"}
        </button>
        {error ? <p className="error-message">{error}</p> : null}
      </form>

      <aside className="documents-side">
        <form className="search-row" onSubmit={handleSearch}>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          <button className="secondary-action" disabled={loading} type="submit">
            <Search size={18} aria-hidden="true" />
            Search
          </button>
        </form>
        <div className="document-list">
          {documents.length ? (
            documents.map((document) => (
              <button key={document.id} className="document-row" onClick={() => void handleSelect(document)} type="button">
                <strong>{document.title ?? "Untitled document"}</strong>
                <span>{document.classification ?? "unclassified"}</span>
              </button>
            ))
          ) : (
            <p className="empty-state compact">{UI_MESSAGES.DOCUMENTS_EMPTY}</p>
          )}
        </div>
      </aside>

      <section className="stored-detail">
        {selected ? (
          <>
            <div className="result-header">
              <h2>{selected.title ?? "Stored document"}</h2>
              {selected.key ? (
                <button
                  className="secondary-action"
                  onClick={() => onMoveToUnredact({ redactedText: selected.redactedText, key: selected.key, redactions: selectedRedactions })}
                  type="button"
                >
                  <ArrowRight size={18} aria-hidden="true" />
                  Send to unredact
                </button>
              ) : null}
            </div>
            <pre>{selected.redactedText}</pre>
            <div className="stored-actions">
              <button className="secondary-action" disabled={!selected.key} onClick={() => void handleStoredUnredact()} type="button">
                <RotateCcw size={18} aria-hidden="true" />
                Restore stored document
              </button>
            </div>
            {storedRestore ? <pre>{storedRestore}</pre> : null}
            {selectedRedactions.length ? <RedactionTable redactions={selectedRedactions} /> : null}
          </>
        ) : (
          <p className="empty-state">{UI_MESSAGES.STORED_DETAIL_EMPTY}</p>
        )}
      </section>
    </div>
  );
}
