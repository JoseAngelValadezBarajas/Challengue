import { ArrowRight, Check, Copy, FileLock2, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { redactDocument, type RedactionResponse, unredactDocument } from "./api.js";

type Mode = "redact" | "unredact";

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
        </nav>

        {mode === "redact" ? (
          <RedactPanel onMoveToUnredact={moveToUnredact} />
        ) : (
          <UnredactPanel draft={restoreDraft} />
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
