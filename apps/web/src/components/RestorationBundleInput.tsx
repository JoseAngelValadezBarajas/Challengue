import { Upload } from "lucide-react";
import { RESTORATION_BUNDLE_ACCEPT, UI_MESSAGES } from "../constants/webConstants.js";
import type { RestorationBundle } from "../interfaces/restorationBundleInterfaces.js";
import { parseRestorationBundle } from "../utils/restorationBundleUtils.js";

interface RestorationBundleInputProps {
  onBundleLoaded: (bundle: RestorationBundle) => void;
  onError: (message: string) => void;
}

export function RestorationBundleInput({ onBundleLoaded, onError }: RestorationBundleInputProps) {
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".txt") && file.type !== "text/plain") {
      onError(UI_MESSAGES.RESTORATION_BUNDLE_UNSUPPORTED);
      return;
    }

    try {
      const bundle = parseRestorationBundle(await file.text());

      if (!bundle) {
        onError(UI_MESSAGES.RESTORATION_BUNDLE_INVALID);
        return;
      }

      onBundleLoaded(bundle);
      onError("");
    } catch {
      onError(UI_MESSAGES.RESTORATION_BUNDLE_READ_FAILED);
    }
  }

  return (
    <label className="file-upload">
      <Upload size={18} aria-hidden="true" />
      Load bundle
      <input accept={RESTORATION_BUNDLE_ACCEPT} onChange={(event) => void handleFileChange(event)} type="file" />
    </label>
  );
}
