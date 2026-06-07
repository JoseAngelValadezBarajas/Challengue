import { Upload } from "lucide-react";
import { TXT_FILE_ACCEPT, UI_MESSAGES } from "../constants/webConstants.js";

interface TxtFileInputProps {
  onFileLoaded: (content: string) => void;
  onError: (message: string) => void;
}

export function TxtFileInput({ onFileLoaded, onError }: TxtFileInputProps) {
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".txt") && file.type !== "text/plain") {
      onError(UI_MESSAGES.TXT_FILE_UNSUPPORTED);
      return;
    }

    try {
      onFileLoaded(await file.text());
      onError("");
    } catch {
      onError(UI_MESSAGES.TXT_FILE_READ_FAILED);
    }
  }

  return (
    <label className="file-upload">
      <Upload size={18} aria-hidden="true" />
      Load .txt
      <input accept={TXT_FILE_ACCEPT} onChange={(event) => void handleFileChange(event)} type="file" />
    </label>
  );
}
