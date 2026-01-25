import * as React from "react";

type OutputActionsOptions = {
  output: string;
  onClear: () => void;
};

type OutputActionsState = {
  copied: boolean;
  onCopy: () => Promise<void>;
  onExport: () => void;
  onClear: () => void;
};

export function useOutputActions({ output, onClear }: OutputActionsOptions): OutputActionsState {
  const [copied, setCopied] = React.useState(false);

  const onCopy = React.useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, [output]);

  const onExport = React.useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `copilot-output-${Date.now()}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [output]);

  const handleClear = React.useCallback(() => {
    onClear();
  }, [onClear]);

  return { copied, onCopy, onExport, onClear: handleClear };
}
