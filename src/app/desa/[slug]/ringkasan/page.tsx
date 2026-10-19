// Summary of one desa's APBDes (/desa/{slug}/ringkasan), in everyday language first.
// Sentences and a few bars come first; the exact tables sit in "Lihat rincian angka lengkap".
// Every number is computed from the published APBDes, nothing is written by hand.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { BreakdownList } from "@/features/apbdes/components/breakdown-list";
import { MoneyFlow } from "@/features/apbdes/components/money-flow";
import { SimulationNotice } from "@/features/apbdes/components/simulation-notice";
import { FUND_SOURCE_PLAIN, SECTOR_PLAIN } from "@/features/apbdes/plain-language";
import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { getPublishedSummary } from "@/features/apbdes/server/apbdes.service";
import type { FundSource } from "@/features/apbdes/types";
import { formatDate, formatPercent } from "@/lib/format";
import { formatRupiahShort } from "@/lib/format-short";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadSummary(slug: string) {
  const parsed = DesaSlugSchema.safeParse(slug);
  if (!parsed.success) notFound();

  const summary = await getPublishedSummary(parsed.data);
  if (!summary) notFound();
  return summary;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const summary = await loadSummary(slug);
  return { title: `Ringkasan APBDes ${summary.document.fiscalYear} ${summary.desa.name}` };
}

export default async function DesaSummaryPage({ params }: PageProps) {
  const { slug } = await params;
  const { desa, document, balance, bySector, byDusun, byFundSource, progress } = await loadSummary(slug);

  const totalSpending = balance.totalExpenditure;
  const realizedSpending = bySector.reduce((sum, group) => sum + group.realized, 0);
  const realizedRate = totalSpending === 0 ? 0 : realizedSpending / totalSpending;
  const sectors = [...bySector].sort((a, b) => b.budget - a.budget);
  const sources = [...byFundSource].sort((a, b) => b.budget - a.budget);
  const [mainSource, secondSource] = sources;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <SiteHeader desaName={desa.name} slug={desa.slug} current="summary" />

      <main className="space-y-10 pt-4">
        {desa.isSimulation && <SimulationNotice />}

        <section className="space-y-2">
          <p className="font-semibold text-muted">
            APBDes {desa.name} {document.fiscalYear}
          </p>
          <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            Tahun ini desa mengelola <span className="text-stamp">{formatRupiahShort(totalSpending)}</span> untuk{" "}
            {progress.total} kegiatan
          </h1>
        </section>

        <section aria-labelledby="terpakai" className="space-y-3 rounded-2xl bg-surface p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="terpakai" className="font-extrabold">
              Sudah terpakai
            </h2>
            <span className="text-2xl font-extrabold text-stamp">{formatPercent(realizedRate * 100, 0)}</span>
          </div>
          <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-stamp/15">
            <div className="h-full rounded-full bg-stamp" style={{ width: `${Math.min(realizedRate, 1) * 100}%` }} />
          </div>
          <p className="text-sm text-muted">
            {formatRupiahShort(realizedSpending)} dari {formatRupiahShort(totalSpending)}
            {document.realizedAsOf && <>, dihitung sampai {formatDate(document.realizedAsOf)}</>}.
          </p>
        </section>

        <section aria-labelledby="untuk-apa" className="space-y-3">
          <h2 id="untuk-apa" className="text-xl font-extrabold">
            Paling banyak untuk apa?
          </h2>
          <ul className="space-y-4 rounded-2xl bg-surface p-5 sm:p-6">
            {sectors.map((group) => {
              const plain = SECTOR_PLAIN[Number(group.key)];
              return (
                <li key={group.key} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block font-bold">{plain?.name ?? group.label}</span>
                      {plain && <span className="block text-sm text-muted">{plain.examples}</span>}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-bold">{formatRupiahShort(group.budget)}</span>
                      <span className="block text-sm text-muted">{formatPercent(group.share * 100, 0)}</span>
                    </span>
                  </div>
                  <div aria-hidden="true" className="h-2 rounded-full bg-line/60">
                    <div className="h-full rounded-full bg-stamp" style={{ width: `${group.share * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="kabar" className="space-y-3">
          <h2 id="kabar" className="text-xl font-extrabold">
            Kabar kegiatan
          </h2>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <ProgressTile value={progress.completed} label="selesai" />
            <ProgressTile value={progress.inProgress} label="berjalan" />
            <ProgressTile value={progress.notStarted} label="belum dimulai" />
          </dl>
          {progress.notStartedItems.length > 0 && (
            <div className="space-y-2 rounded-2xl bg-kunyit-soft p-5 text-sm text-kunyit-ink">
              <h3 className="font-bold">Yang belum dimulai</h3>
              <ul className="space-y-1.5">
                {progress.notStartedItems.map((item) => (
                  <li key={item.accountCode}>
                    {item.description} · {formatRupiahShort(item.budget)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {mainSource && (
          <section aria-labelledby="dari-mana" className="space-y-2">
            <h2 id="dari-mana" className="text-xl font-extrabold">
              Dari mana uangnya?
            </h2>
            <p>
              Sebagian besar dari <b>{plainSource(mainSource.key)}</b>, {formatRupiahShort(mainSource.budget)} (
              {formatPercent(mainSource.share * 100, 0)}).
              {secondSource && (
                <>
                  {" "}
                  Lalu <b>{plainSource(secondSource.key)}</b>, {formatRupiahShort(secondSource.budget)} (
                  {formatPercent(secondSource.share * 100, 0)}).
                </>
              )}
              {sources.length > 2 && <> Sisanya dari sumber lain.</>}
            </p>
          </section>
        )}

        <details className="group rounded-2xl border border-line bg-surface">
          <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-bold [&::-webkit-details-marker]:hidden">
            Lihat rincian angka lengkap
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0 transition-transform group-open:rotate-180"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <div className="space-y-8 px-5 pb-6">
            <MoneyFlow balance={balance} />
            <BreakdownList
              id="sector-heading"
              title="Belanja per bidang"
              description="Nama resmi bidang belanja desa."
              groups={bySector}
              realizedLabel="terpakai"
            />
            <BreakdownList
              id="dusun-heading"
              title="Belanja per dusun"
              description="Kegiatan yang lokasinya di satu dusun, plus kegiatan untuk seluruh desa."
              groups={byDusun}
              realizedLabel="terpakai"
            />
            <BreakdownList
              id="source-heading"
              title="Pendapatan per sumber dana"
              description="Pendapatan desa menurut sumber dana."
              groups={byFundSource}
              realizedLabel="diterima"
            />
            <p className="border-t border-line pt-6 text-sm text-muted">
              Data ini terbuka. Unduh rinciannya sebagai{" "}
              <a className="font-medium text-stamp underline" href={`/api/v1/desa/${desa.slug}/apbdes?format=csv`}>
                CSV
              </a>{" "}
              atau{" "}
              <a className="font-medium text-stamp underline" href={`/api/v1/desa/${desa.slug}/apbdes`}>
                JSON
              </a>
              .
            </p>
          </div>
        </details>

        <Link
          href={`/desa/${desa.slug}/tanya`}
          className="flex items-center justify-between gap-4 rounded-2xl bg-stamp p-5 text-surface hover:opacity-95 sm:p-6"
        >
          <span>
            <span className="block text-lg font-bold">Masih penasaran?</span>
            <span className="block text-sm opacity-85">Tanyakan kegiatan di dusun atau RT-mu.</span>
          </span>
          <span className="shrink-0 rounded-full bg-surface px-4 py-2 text-sm font-bold text-stamp">Tanya</span>
        </Link>

        <footer className="border-t border-line pt-6 text-sm text-muted">
          {document.title} versi {document.version}
          {document.publishedAt && <>, diterbitkan {formatDate(document.publishedAt)}</>}.
        </footer>
      </main>
    </div>
  );
}

function ProgressTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl bg-surface px-2 py-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-3xl font-extrabold">{value}</dd>
    </div>
  );
}

function plainSource(key: string): string {
  return FUND_SOURCE_PLAIN[key as FundSource] ?? key;
}
