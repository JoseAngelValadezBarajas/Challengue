import { Download, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { unredactDocument } from "../api.js";
import { DOWNLOAD_FILENAMES, MIME_TYPES, UI_MESSAGES } from "../constants/webConstants.js";
import { downloadTextFile } from "../utils/downloadUtils.js";
import { RestorationBundleInput } from "./RestorationBundleInput.js";
import { ResultPanel } from "./ResultPanel.js";

interface UnredactPanelProps {
  draft: {
    key: string;
    documentText: string;
  };
}

export function UnredactPanel({ draft }: UnredactPanelProps) {
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
      setError(requestError instanceof Error ? requestError.message : UI_MESSAGES.UNREDACT_FAILED);
    } finally {
      setLoading(false);
    }
  }

  function handleBundleLoaded(bundle: { key: string; redactedText: string }) {
    setKey(bundle.key);
    setDocumentText(bundle.redactedText);
    setUnredactedText("");
  }

  return (
    <form className="panel-grid" onSubmit={handleSubmit}>
      <div className="input-column">
        <label>
          <span className="label-row">
            Restoration key
            <RestorationBundleInput onBundleLoaded={handleBundleLoaded} onError={setError} />
          </span>
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
        emptyText={UI_MESSAGES.UNREDACT_EMPTY}
        resultText={unredactedText}
        action={
          unredactedText ? (
            <button
              className="secondary-action"
              onClick={() => downloadTextFile(DOWNLOAD_FILENAMES.UNREDACTED_DOCUMENT, unredactedText, MIME_TYPES.TEXT)}
              type="button"
            >
              <Download size={18} aria-hidden="true" />
              Download .txt
            </button>
          ) : null
        }
      />
    </form>
  );
}
