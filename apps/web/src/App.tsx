import { ArrowRight, Check, Copy, Database, FileLock2, KeyRound, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  getStoredDocumentRedactions,
  redactDocument,
  searchStoredDocuments,
  storeRedactedDocument,
  type RedactionResponse,
  type StoredDocument,
  type StoredDocumentWithKey,
  unredactDocument,
  unredactStoredDocument,
} from "./api.js";

type Mode = "redact" | "unredact" | "documents";

export function App() {
  const [mode, setMode] = useState<Mode>("redact");
  const [restoreDraft, setRestoreDraft] = useState({ key: "", documentText: "" });

  function moveToUnredact(result: RedactionResponse) {
    setRestoreDraft({ key: result.key, documentText: result.redactedText });
    setMode("unredact");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Meltwater Technical Exercise</p>
          <h1>Redaction Console</h1>
        </div>
        <div className="status-pill">
          <ShieldCheck size={18} aria-hidden="true" />
          Case-sensitive engine
        </div>
      </header>

      <section className="workspace" aria-label="Redaction workspace">
        <nav className="tabs" aria-label="Workspace mode">
          <button className={mode === "redact" ? "active" : ""} onClick={() => setMode("redact")} type="button">
            <FileLock2 size={18} aria-hidden="true" />
            Redact
          </button>
          <button className={mode === "unredact" ? "active" : ""} onClick={() => setMode("unredact")} type="button">
            <KeyRound size={18} aria-hidden="true" />
            Unredact
          </button>
          <button className={mode === "documents" ? "active" : ""} onClick={() => setMode("documents")} type="button">
            <Database size={18} aria-hidden="true" />
            Documents
          </button>
        </nav>

        {mode === "redact" ? (
          <RedactPanel onMoveToUnredact={moveToUnredact} />
        ) : mode === "unredact" ? (
          <UnredactPanel draft={restoreDraft} />
        ) : (
          <DocumentsPanel onMoveToUnredact={moveToUnredact} />
        )}
      </section>
    </main>
  );
}

function RedactPanel({ onMoveToUnredact }: { onMoveToUnredact: (result: RedactionResponse) => void }) {
  const [terms, setTerms] = useState("Hello world \u201cBoston Red Sox\u201d, beer");
  const [documentText, setDocumentText] = useState("Hello world met the Boston Red Sox and ordered beer.");
  const [result, setResult] = useState<RedactionResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      setResult(await redactDocument(terms, documentText));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to redact document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel-grid" onSubmit={handleSubmit}>
      <div className="input-column">
        <label>
          Keywords and phrases
          <input value={terms} onChange={(event) => setTerms(event.target.value)} />
        </label>
        <label>
          Document text
          <textarea value={documentText} onChange={(event) => setDocumentText(event.target.value)} rows={12} />
        </label>
        <button className="primary-action" disabled={loading} type="submit">
          <FileLock2 size={18} aria-hidden="true" />
          {loading ? "Redacting..." : "Redact document"}
        </button>
        {error ? <p className="error-message">{error}</p> : null}
      </div>

      <ResultPanel
        title="Redacted output"
        emptyText="Run a redaction to see the masked document and restoration key."
        resultText={result?.redactedText}
        keyText={result?.key}
        footer={result ? `${result.redactions.length} redaction${result.redactions.length === 1 ? "" : "s"} applied` : ""}
        action={
          result ? (
            <button className="secondary-action" onClick={() => onMoveToUnredact(result)} type="button">
              <ArrowRight size={18} aria-hidden="true" />
              Send to unredact
            </button>
          ) : null
        }
      />
      {result?.redactions.length ? <RedactionTable redactions={result.redactions} /> : null}
    </form>
  );
}

function UnredactPanel({ draft }: { draft: { key: string; documentText: string } }) {
  const [key, setKey] = useState(draft.key);
  const [documentText, setDocumentText] = useState(draft.documentText);
  const [unredactedText, setUnredactedText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setKey(draft.key);
    setDocumentText(draft.documentText);
  }, [draft]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await unredactDocument(key, documentText);
      setUnredactedText(result.unredactedText);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to unredact document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel-grid" onSubmit={handleSubmit}>
      <div className="input-column">
        <label>
          Restoration key
          <input value={key} onChange={(event) => setKey(event.target.value)} />
        </label>
        <label>
          Redacted document text
          <textarea value={documentText} onChange={(event) => setDocumentText(event.target.value)} rows={12} />
        </label>
        <button className="primary-action" disabled={loading} type="submit">
          <RotateCcw size={18} aria-hidden="true" />
          {loading ? "Restoring..." : "Unredact document"}
        </button>
        {error ? <p className="error-message">{error}</p> : null}
      </div>

      <ResultPanel
        title="Unredacted output"
        emptyText="Paste a key and redacted text to restore the original document."
        resultText={unredactedText}
      />
    </form>
  );
}

function DocumentsPanel({ onMoveToUnredact }: { onMoveToUnredact: (result: RedactionResponse) => void }) {
  const [terms, setTerms] = useState('"Boston Red Sox", beer');
  const [documentText, setDocumentText] = useState("The Boston Red Sox ordered beer.");
  const [title, setTitle] = useState("Stored briefing");
  const [classification, setClassification] = useState("secret");
  const [ownerId, setOwnerId] = useState("demo-user");
  const [searchTerm, setSearchTerm] = useState("beer");
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
      setError(requestError instanceof Error ? requestError.message : "Unable to store document.");
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
      setError(requestError instanceof Error ? requestError.message : "Unable to search documents.");
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
      setError(requestError instanceof Error ? requestError.message : "Unable to load redactions.");
    }
  }

  async function handleStoredUnredact() {
    if (!selected?.key) {
      setError("The restoration key is only returned when a document is first stored in this demo.");
      return;
    }

    setError("");

    try {
      const result = await unredactStoredDocument(selected.id, selected.key);
      setStoredRestore(result.unredactedText);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to restore stored document.");
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
            <p className="empty-state compact">Store or search documents to inspect the SQLite prototype.</p>
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
          <p className="empty-state">Select a stored document to inspect redactions and restoration behavior.</p>
        )}
      </section>
    </div>
  );
}

function ResultPanel({
  title,
  emptyText,
  resultText,
  keyText,
  footer,
  action,
}: {
  title: string;
  emptyText: string;
  resultText?: string | undefined;
  keyText?: string | undefined;
  footer?: string | undefined;
  action?: ReactNode;
}) {
  const [copied, setCopied] = useState<"key" | "result" | "">("");

  async function copy(value: string, kind: "key" | "result") {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(""), 1500);
  }

  return (
    <aside className="result-panel">
      <div className="result-header">
        <h2>{title}</h2>
        {resultText ? (
          <button className="icon-button" onClick={() => void copy(resultText, "result")} type="button">
            {copied === "result" ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            <span className="sr-only">Copy result</span>
          </button>
        ) : null}
      </div>

      {resultText ? <pre>{resultText}</pre> : <p className="empty-state">{emptyText}</p>}

      {keyText ? (
        <div className="key-block">
          <div className="result-header">
            <h3>Key</h3>
            <button className="icon-button" onClick={() => void copy(keyText, "key")} type="button">
              {copied === "key" ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              <span className="sr-only">Copy key</span>
            </button>
          </div>
          <code>{keyText}</code>
        </div>
      ) : null}

      {footer ? <p className="result-footer">{footer}</p> : null}
      {action}
    </aside>
  );
}

function RedactionTable({ redactions }: { redactions: RedactionResponse["redactions"] }) {
  return (
    <section className="redaction-table" aria-label="Applied redactions">
      <h2>Applied redactions</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Term</th>
              <th>Original</th>
              <th>Range</th>
            </tr>
          </thead>
          <tbody>
            {redactions.map((redaction) => (
              <tr key={`${redaction.index}-${redaction.start}`}>
                <td>{redaction.index + 1}</td>
                <td>{redaction.term}</td>
                <td>{redaction.original}</td>
                <td>
                  {redaction.start}-{redaction.end}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
