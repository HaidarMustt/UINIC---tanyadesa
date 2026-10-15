"use client";

import { useState } from "react";

// Copies the current page address, so the resident can save their tracking link.
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} className="rounded-full bg-surface px-4 py-2 text-sm font-extrabold text-stamp">
      <span aria-live="polite">{copied ? "Tersalin" : "Salin tautan"}</span>
    </button>
  );
}
