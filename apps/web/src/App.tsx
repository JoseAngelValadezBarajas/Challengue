import { Copy, FileLock2, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { redactDocument, type RedactionResponse, unredactDocument } from "./api.js";

type Mode = "redact" | "unredact";

export function App() {
  const [mode, setMode] = useState<Mode>("redact");

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

        {mode === "redact" ? <RedactPanel /> : <UnredactPanel />}
      </section>
    </main>
  );
}

function RedactPanel() {
  const [terms, setTerms] = useState('Hello world "Boston Red Sox", beer');
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
      />
    </form>
  );
}

function UnredactPanel() {
  const [key, setKey] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [unredactedText, setUnredactedText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
}: {
  title: string;
  emptyText: string;
  resultText?: string | undefined;
  keyText?: string | undefined;
  footer?: string | undefined;
}) {
  return (
    <aside className="result-panel">
      <div className="result-header">
        <h2>{title}</h2>
        {resultText ? (
          <button className="icon-button" onClick={() => void navigator.clipboard.writeText(resultText)} type="button">
            <Copy size={18} aria-hidden="true" />
            <span className="sr-only">Copy result</span>
          </button>
        ) : null}
      </div>

      {resultText ? <pre>{resultText}</pre> : <p className="empty-state">{emptyText}</p>}

      {keyText ? (
        <div className="key-block">
          <div className="result-header">
            <h3>Key</h3>
            <button className="icon-button" onClick={() => void navigator.clipboard.writeText(keyText)} type="button">
              <Copy size={18} aria-hidden="true" />
              <span className="sr-only">Copy key</span>
            </button>
          </div>
          <code>{keyText}</code>
        </div>
      ) : null}

      {footer ? <p className="result-footer">{footer}</p> : null}
    </aside>
  );
}
