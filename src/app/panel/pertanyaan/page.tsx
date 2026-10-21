// "Pertanyaan warga": what residents ask in Tanya, for operators and BPD (read-only).
// The desa learns from it: unanswered questions point to missing data or Info desa.

import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/features/auth/server/auth-session";
import { getQuestionPanel, PERIOD_DAYS } from "@/features/qa/server/question-panel.service";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Pertanyaan warga" };

const STATUS_LABEL = {
  ANSWERED: { text: "Terjawab", className: "bg-stamp/10 text-stamp" },
  NOT_FOUND: { text: "Belum ada datanya", className: "bg-kunyit-soft text-kunyit-ink" },
  REFUSED: { text: "Ditolak", className: "bg-line text-muted" },
  ERROR: { text: "Gagal", className: "bg-line text-muted" },
} as const;

function formatDateTime(date: Date) {
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

const rate = (value: number | null) => (value === null ? "–" : formatPercent(value * 100, 0));

export default async function PanelQuestionsPage() {
  const user = await requireUser();
  const { stats, recent, unanswered, mostAsked } = await getQuestionPanel(user);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Pertanyaan warga</h1>
        <p className="mt-1 text-muted">
          Disimpan tanpa identitas penanya. Pakai untuk tahu apa yang ingin diketahui warga, dan data apa yang
          perlu dilengkapi.
        </p>
      </div>

      <section aria-labelledby="ringkasan-heading" className="space-y-3">
        <h2 id="ringkasan-heading" className="text-lg font-extrabold">
          {PERIOD_DAYS} hari terakhir
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Pertanyaan" value={String(stats.total)} />
          <StatTile label="Terjawab" value={rate(stats.answeredRate)} note={`${stats.answered} pertanyaan`} />
          <StatTile label="Belum ada datanya" value={String(stats.notFound)} note="lihat daftar di bawah" />
          <StatTile
            label="Dinilai membantu"
            value={rate(stats.helpfulRate)}
            note={stats.rated === 0 ? "belum ada penilaian" : `dari ${stats.rated} penilaian`}
          />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="belum-heading" className="space-y-3 rounded-2xl bg-surface p-5">
          <h2 id="belum-heading" className="font-extrabold">
            Belum bisa dijawab
          </h2>
          <p className="text-sm text-muted">
            Kalau ini informasi layanan, tambahkan lewat{" "}
            <Link href="/panel/info" className="font-semibold text-stamp underline">
              Info desa
            </Link>
            . Kalau kegiatan, pertimbangkan saat menyusun APBDes berikutnya.
          </p>
          {unanswered.length === 0 ? (
            <p className="text-sm text-muted">Tidak ada. Semua pertanyaan bisa dijawab.</p>
          ) : (
            <ul className="divide-y divide-line">
              {unanswered.map((question) => (
                <li key={question.id} className="flex justify-between gap-4 py-2.5 text-sm">
                  <span className="font-semibold">{question.text}</span>
                  <span className="shrink-0 text-muted">{formatDateTime(question.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="sering-heading" className="space-y-3 rounded-2xl bg-surface p-5">
          <h2 id="sering-heading" className="font-extrabold">
            Kegiatan paling sering ditanyakan
          </h2>
          <p className="text-sm text-muted">Kegiatan yang sering ditanya layak diberi keterangan lebih lengkap di Excel.</p>
          {mostAsked.length === 0 ? (
            <p className="text-sm text-muted">Belum ada data.</p>
          ) : (
            <ol className="space-y-2">
              {mostAsked.map((item) => (
                <li key={item.accountCode} className="flex items-baseline gap-3 text-sm">
                  <span className="shrink-0 rounded-md bg-stamp/10 px-2 py-0.5 font-bold text-stamp">{item.accountCode}</span>
                  <span className="flex-1">{item.description}</span>
                  <b>{item.count}×</b>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="terbaru-heading" className="space-y-3">
        <h2 id="terbaru-heading" className="text-lg font-extrabold">
          Pertanyaan terbaru
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-xl bg-surface px-4 py-3 text-muted">Belum ada pertanyaan.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl bg-surface px-5">
            {recent.map((question) => {
              const label = STATUS_LABEL[question.status];
              return (
                <li key={question.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                  <span className="min-w-0 flex-1 font-semibold">{question.text}</span>
                  <span className="flex shrink-0 items-center gap-2 text-sm">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${label.className}`}>{label.text}</span>
                    {question.isHelpful !== null && (
                      <span className="text-muted">{question.isHelpful ? "Membantu" : "Kurang membantu"}</span>
                    )}
                    <span className="text-muted">{formatDateTime(question.createdAt)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl bg-surface p-4">
      <dt className="text-sm text-muted">
        {label}
        {note && <span className="block text-xs">{note}</span>}
      </dt>
      <dd className="text-3xl font-extrabold">{value}</dd>
    </div>
  );
}
