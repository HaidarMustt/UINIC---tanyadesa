import { formatRupiah } from "@/lib/format";
import { discardApbdesAction, publishApbdesAction } from "../actions";
import type { DraftReview as DraftReviewData } from "../server/apbdes-panel.service";

interface DraftReviewProps {
  review: DraftReviewData;
  canPublish: boolean;
}

// The draft that is waiting for a decision. Forms post straight to server actions,
// so the buttons work even before JavaScript has loaded.
export function DraftReview({ review, canPublish }: DraftReviewProps) {
  const { balance, warnings } = review;

  return (
    <section aria-labelledby="draft-heading" className="space-y-5 rounded-2xl border-2 border-stamp bg-surface p-6">
      <div className="space-y-1">
        <span className="inline-block rounded-full bg-kunyit-soft px-2.5 py-0.5 text-xs font-extrabold text-kunyit-ink">
          Menunggu ditinjau
        </span>
        <h2 id="draft-heading" className="text-lg font-extrabold">
          {review.title} versi {review.version}
        </h2>
        <p className="text-sm text-muted">
          {review.fileName}, {review.itemCount} baris anggaran terbaca.
        </p>
      </div>

      {balance && (
        <p className={balance.isBalanced ? "font-semibold" : "font-semibold text-kunyit-ink"}>
          {balance.isBalanced
            ? `Seimbang: pendapatan ${formatRupiah(balance.totalRevenue)} + pembiayaan ${formatRupiah(balance.netFinancing)} = belanja ${formatRupiah(balance.totalExpenditure)}.`
            : `Tidak seimbang, selisih ${formatRupiah(balance.difference)}.`}
        </p>
      )}

      {warnings.length > 0 ? (
        <div className="space-y-2 rounded-xl bg-kunyit-soft p-4 text-kunyit-ink">
          <p className="font-bold">{warnings.length} hal perlu dicek sebelum terbit</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted">Tidak ada peringatan dari pemeriksaan otomatis.</p>
      )}

      {canPublish ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className="text-sm text-muted">Versi terbit sebelumnya akan diarsipkan, tidak dihapus.</span>
          <form action={discardApbdesAction}>
            <input type="hidden" name="documentId" value={review.id} />
            <button type="submit" className="rounded-full border border-line px-5 py-2.5 font-bold">
              Batalkan unggahan
            </button>
          </form>
          <form action={publishApbdesAction}>
            <input type="hidden" name="documentId" value={review.id} />
            <button type="submit" className="rounded-full bg-stamp px-6 py-2.5 font-extrabold text-surface">
              Terbitkan versi {review.version}
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted">Hanya operator desa yang bisa menerbitkan.</p>
      )}
    </section>
  );
}
