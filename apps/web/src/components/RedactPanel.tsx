import { ArrowRight, Download, FileLock2 } from "lucide-react";
import { useState } from "react";
import { redactDocument, type RedactionResponse } from "../api.js";
import { DOWNLOAD_FILENAMES, MIME_TYPES, REDACT_DEMO_DEFAULTS, UI_MESSAGES } from "../constants/webConstants.js";
import { downloadTextFile } from "../utils/downloadUtils.js";
import { serializeRestorationBundle } from "../utils/restorationBundleUtils.js";
import { RedactionTable } from "./RedactionTable.js";
import { ResultPanel } from "./ResultPanel.js";
import { TxtFileInput } from "./TxtFileInput.js";

interface RedactPanelProps {
  onMoveToUnredact: (result: RedactionResponse) => void;
}

export function RedactPanel({ onMoveToUnredact }: RedactPanelProps) {
  const [terms, setTerms] = useState<string>(REDACT_DEMO_DEFAULTS.TERMS);
  const [documentText, setDocumentText] = useState<string>(REDACT_DEMO_DEFAULTS.DOCUMENT_TEXT);
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
      setError(requestError instanceof Error ? requestError.message : UI_MESSAGES.REDACT_FAILED);
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
          <span className="label-row">
            Document text
            <TxtFileInput onError={setError} onFileLoaded={setDocumentText} />
          </span>
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
        emptyText={UI_MESSAGES.REDACT_EMPTY}
        resultText={result?.redactedText}
        keyText={result?.key}
        footer={result ? `${result.redactions.length} redaction${result.redactions.length === 1 ? "" : "s"} applied` : ""}
        action={
          result ? (
            <div className="action-row">
              <button
                className="secondary-action"
                onClick={() => downloadTextFile(DOWNLOAD_FILENAMES.RESTORATION_BUNDLE, serializeRestorationBundle(result), MIME_TYPES.TEXT)}
                type="button"
              >
                <Download size={18} aria-hidden="true" />
                Download bundle
              </button>
              <button className="secondary-action" onClick={() => onMoveToUnredact(result)} type="button">
                <ArrowRight size={18} aria-hidden="true" />
                Send to unredact
              </button>
            </div>
          ) : null
        }
      />
      {result?.redactions.length ? <RedactionTable redactions={result.redactions} /> : null}
    </form>
  );
}
