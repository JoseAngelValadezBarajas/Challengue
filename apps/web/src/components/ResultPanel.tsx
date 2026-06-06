import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";

interface ResultPanelProps {
  title: string;
  emptyText: string;
  resultText?: string | undefined;
  keyText?: string | undefined;
  footer?: string | undefined;
  action?: ReactNode;
}

export function ResultPanel({ title, emptyText, resultText, keyText, footer, action }: ResultPanelProps) {
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
