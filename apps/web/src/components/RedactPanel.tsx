import { ArrowRight, FileLock2 } from "lucide-react";
import { useState } from "react";
import { redactDocument, type RedactionResponse } from "../api.js";
import { RedactionTable } from "./RedactionTable.js";
import { ResultPanel } from "./ResultPanel.js";

interface RedactPanelProps {
  onMoveToUnredact: (result: RedactionResponse) => void;
}

export function RedactPanel({ onMoveToUnredact }: RedactPanelProps) {
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
