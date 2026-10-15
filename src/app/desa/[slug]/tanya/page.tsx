// Tanya page. The page itself is a Server Component (it reads the database);
// only <AskPanel> runs in the browser.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SimulationNotice } from "@/features/apbdes/components/simulation-notice";
import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { getPublishedSummary } from "@/features/apbdes/server/apbdes.service";
import { AskPanel } from "@/features/qa/components/ask-panel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadDesa(slug: string) {
  const parsed = DesaSlugSchema.safeParse(slug);
  if (!parsed.success) notFound();

  const summary = await getPublishedSummary(parsed.data);
  if (!summary) notFound();
  return summary;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { desa } = await loadDesa(slug);
  return { title: `Tanya anggaran ${desa.name}` };
}

export default async function AskPage({ params }: PageProps) {
  const { slug } = await params;
  const { desa, document } = await loadDesa(slug);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 sm:px-6">
      <SiteHeader desaName={desa.name} slug={desa.slug} current="ask" />

      <main className="space-y-8 pt-4">
        {desa.isSimulation && <SimulationNotice />}

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tanya anggaran {desa.name}
          </h1>
          <p className="text-muted">
            Tulis pertanyaan dengan bahasa sehari-hari. Jawaban dihitung langsung dari APBDes{" "}
            {document.fiscalYear}, dan setiap jawaban menyebut kode rekening sumbernya supaya bisa
            kamu cek sendiri.
          </p>
        </div>

        <AskPanel slug={desa.slug} />

        <p className="text-xs text-muted">
          Pertanyaan disimpan tanpa nama untuk perbaikan layanan. Jangan menulis data pribadi
          seperti NIK atau nomor HP.
        </p>
      </main>
    </div>
  );
}
