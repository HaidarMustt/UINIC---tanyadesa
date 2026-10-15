import type { Metadata } from "next";
import { getPublishedSummary } from "@/features/apbdes/server/apbdes.service";
import { requireUser } from "@/features/auth/server/auth-session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Beranda panel" };

interface PageProps {
  searchParams: Promise<{ akses?: string }>;
}

export default async function PanelHomePage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { akses } = await searchParams;
  const summary = user.desa ? await getPublishedSummary(user.desa.slug) : null;

  return (
    <div className="max-w-4xl space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Beranda</h1>
        <p className="mt-1 text-muted">Halo, {user.name}.</p>
      </div>

      {akses === "ditolak" && (
        <p role="alert" className="rounded-xl bg-kunyit-soft px-4 py-3 text-kunyit-ink">
          Halaman tadi tidak bisa dibuka dengan peranmu.
        </p>
      )}

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-surface p-6">
        {summary ? (
          <div className="space-y-1">
            <span className="inline-block rounded-full bg-stamp/10 px-2.5 py-0.5 text-xs font-extrabold text-stamp">
              Terbit
            </span>
            <p className="text-lg font-extrabold">
              {summary.document.title} versi {summary.document.version}
            </p>
            <p className="text-sm text-muted">
              {summary.document.publishedAt && <>Diterbitkan {formatDate(summary.document.publishedAt)}. </>}
              {summary.document.realizedAsOf && <>Realisasi per {formatDate(summary.document.realizedAsOf)}.</>}
            </p>
          </div>
        ) : (
          <p className="text-muted">Belum ada APBDes yang diterbitkan.</p>
        )}
        <span className="rounded-full border border-line px-5 py-2.5 text-sm font-bold text-muted">
          Unggah versi baru (pelajaran 8b)
        </span>
      </section>
    </div>
  );
}
