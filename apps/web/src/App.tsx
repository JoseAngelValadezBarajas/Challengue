import { Database, FileLock2, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { RedactionResponse } from "./api.js";
import { DocumentsPanel } from "./components/DocumentsPanel.js";
import { RedactPanel } from "./components/RedactPanel.js";
import { UnredactPanel } from "./components/UnredactPanel.js";

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
