// Public APBDes summary of one desa. This is a Server Component: it runs on the server,
// reads the database through the service, and sends finished HTML to the browser.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BreakdownList } from "@/features/apbdes/components/breakdown-list";
import { BudgetHero } from "@/features/apbdes/components/budget-hero";
import { MoneyFlow } from "@/features/apbdes/components/money-flow";
import { SimulationNotice } from "@/features/apbdes/components/simulation-notice";
import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { getPublishedSummary } from "@/features/apbdes/server/apbdes.service";
import { formatDate } from "@/lib/format";

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
  return { title: `APBDes ${summary.document.fiscalYear} ${summary.desa.name}` };
}

export default async function DesaSummaryPage({ params }: PageProps) {
  const { slug } = await params;
  const { desa, document, balance, bySector, byDusun, byFundSource } = await loadSummary(slug);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <SiteHeader desaName={desa.name} slug={desa.slug} current="summary" />

      <main className="space-y-10 pt-4">
        {desa.isSimulation && <SimulationNotice />}

        <BudgetHero
          desaName={desa.name}
          fiscalYear={document.fiscalYear}
          totalExpenditure={balance.totalExpenditure}
          sectors={bySector}
        />

        <Link
          href={`/desa/${desa.slug}/tanya`}
          className="flex items-center justify-between gap-4 rounded-2xl bg-stamp p-5 text-surface hover:opacity-95 sm:p-6"
        >
          <span>
            <span className="block text-lg font-bold">Ada yang ingin ditanyakan?</span>
            <span className="block text-sm opacity-85">
              Misalnya &ldquo;Dana jalan RT 3 berapa?&rdquo; Jawabannya lengkap dengan kode rekening.
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-surface px-4 py-2 text-sm font-bold text-stamp">
            Tanya
          </span>
        </Link>

        <MoneyFlow balance={balance} />

        <BreakdownList
          id="dusun-heading"
          title="Belanja per dusun"
          description="Kegiatan yang lokasinya di satu dusun, plus kegiatan untuk seluruh desa."
          groups={byDusun}
          realizedLabel="terpakai"
        />
        <BreakdownList
          id="source-heading"
          title="Dari mana uangnya?"
          description="Pendapatan desa menurut sumber dana."
          groups={byFundSource}
          realizedLabel="diterima"
        />

        <footer className="space-y-2 border-t border-line pt-6 text-sm text-muted">
          <p>
            {document.title} versi {document.version}
            {document.publishedAt && <>, diterbitkan {formatDate(document.publishedAt)}</>}.
            {document.realizedAsOf && <> Realisasi dihitung per {formatDate(document.realizedAsOf)}.</>}
          </p>
          <p>
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
        </footer>
      </main>
    </div>
  );
}
