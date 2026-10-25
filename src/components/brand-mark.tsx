// The TanyaDesa mark: a tiered joglo roof (the village hall) over a speech bubble.
// Colors come from the theme, so it follows light and dark mode.
// Decorative only: the "TanyaDesa" text next to it is what screen readers read.

export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d="M44.0 8 H56.0 Q57.8 16.8 63.0 19 H37.0 Q42.2 16.8 44.0 8Z M35.0 22 H65.0 Q68.5 31.6 79.0 34 H21.0 Q31.5 31.6 35.0 22Z M19.0 37 H81.0 Q84.8 45.8 96.0 48 H4.0 Q15.2 45.8 19.0 37Z" fill="var(--kunyit)" />
      <path d="M22 53 H78 Q85 53 85 60 V79 Q85 86 78 86 H47 L34 96 V86 H22 Q15 86 15 79 V60 Q15 53 22 53Z" fill="var(--stamp)" />
      <circle cx="38" cy="69.5" r="3.6" fill="var(--surface)" />
      <circle cx="50" cy="69.5" r="3.6" fill="var(--surface)" />
      <circle cx="62" cy="69.5" r="3.6" fill="var(--surface)" />
    </svg>
  );
}
