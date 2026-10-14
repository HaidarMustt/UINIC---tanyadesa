// Shown on every page with simulation data, so nobody mistakes it for a real desa.
// Styled like a "CONTOH" stamp on a sample document.
export function SimulationNotice() {
  return (
    <p
      role="note"
      className="inline-flex max-w-full items-start gap-3 rounded-md border-2 border-dashed border-kunyit bg-kunyit-soft px-3 py-2 text-sm text-kunyit-ink"
    >
      <span className="shrink-0 -rotate-3 rounded border-2 border-current px-1.5 font-extrabold">
        Contoh
      </span>
      <span>Desa dan angka di halaman ini adalah simulasi untuk demonstrasi.</span>
    </p>
  );
}
