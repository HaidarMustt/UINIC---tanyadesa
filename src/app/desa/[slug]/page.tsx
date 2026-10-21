// Welcome page of one desa (/desa/{slug}): greets residents and offers three clear choices,
// instead of opening with a wall of numbers. The numbers live on /desa/{slug}/ringkasan.

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SimulationNotice } from "@/features/apbdes/components/simulation-notice";
import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { getPublishedDataset } from "@/features/apbdes/server/apbdes.service";
import { ExampleAnswer } from "@/features/home/components/example-answer";
import { pickExample } from "@/features/home/lib/pick-example";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadDataset(slug: string) {
  const parsed = DesaSlugSchema.safeParse(slug);
  if (!parsed.success) notFound();

  const dataset = await getPublishedDataset(parsed.data);
  if (!dataset) notFound();
  return { slug: parsed.data, ...dataset };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { desaName } = await loadDataset(slug);
  return {
    title: `Tanya anggaran ${desaName}`,
    description: `Tanya APBDes ${desaName} dengan bahasa sehari-hari. Angka dihitung dari data resmi dan selalu disertai kode rekening sumbernya.`,
  };
}

const STEPS = [
  {
    title: "Tulis seperti ngobrol biasa",
    text: "AI hanya bertugas memahami maksud pertanyaanmu.",
  },
  {
    title: "Angkanya dihitung, bukan dikarang",
    text: "Jumlah dan persentase dihitung langsung dari data APBDes.",
  },
  {
    title: "Selalu ada sumbernya",
    text: "Setiap jawaban menyebut kode rekening, jadi bisa dicocokkan dengan dokumen asli.",
  },
];

export default async function DesaWelcomePage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const { slug, desaName, isSimulation, fiscalYear, items, dusuns } = await loadDataset(rawSlug);
  const example = pickExample(items, dusuns, desaName);
  const shortName = desaName.replace(/^Desa\s+/i, "");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <SiteHeader desaName={desaName} slug={slug} current="home" />

      <main className="space-y-12 pt-4 sm:space-y-16">
        {isSimulation && <SimulationNotice />}

        <section className="flex flex-wrap items-center gap-x-12 gap-y-8">
          <div className="min-w-0 flex-[1_1_420px] space-y-5">
            <p className="font-semibold text-muted">Selamat datang, warga {shortName}</p>
            <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              Mau tahu uang desa dipakai untuk apa? Tanyakan saja.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Tulis pertanyaan dengan bahasa sehari-hari. Jawabannya diambil dari APBDes resmi tahun {fiscalYear}.
            </p>
            <Link
              href={`/desa/${slug}/tanya`}
              className="flex max-w-xl items-center justify-between gap-3 rounded-full border border-line bg-surface py-2 pr-2 pl-5 text-muted hover:border-stamp"
            >
              <span>Contoh: dana jalan RT 3 berapa?</span>
              <span className="shrink-0 rounded-full bg-stamp px-5 py-2.5 font-extrabold text-surface">Tanya</span>
            </Link>
          </div>

          {example && (
            <div className="hidden min-w-0 flex-[1_1_360px] md:block">
              <ExampleAnswer example={example} />
            </div>
          )}
        </section>

        <section aria-label="Pilihan" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <Link
            href={`/desa/${slug}/tanya`}
            className="hidden flex-col gap-2 rounded-2xl bg-surface p-5 hover:ring-2 hover:ring-stamp/30 sm:flex sm:p-6"
          >
            <IconBubble />
            <span className="text-lg font-extrabold">Tanya anggaran</span>
            <span className="text-sm text-muted">Dana di dusun atau RT-mu, kegiatan yang sudah selesai, arti istilah APBDes.</span>
          </Link>
          <Link
            href={`/desa/${slug}/ringkasan`}
            className="flex flex-col gap-2 rounded-2xl bg-surface p-4 hover:ring-2 hover:ring-stamp/30 sm:p-6"
          >
            <IconClock />
            <span className="font-extrabold sm:text-lg">Lihat ke mana uangnya</span>
            <span className="text-sm text-muted">Ringkasan singkat dengan bahasa sehari-hari.</span>
          </Link>
          <Link
            href={`/desa/${slug}/aspirasi`}
            className="flex flex-col gap-2 rounded-2xl bg-surface p-4 hover:ring-2 hover:ring-stamp/30 sm:p-6"
          >
            <IconMessage />
            <span className="font-extrabold sm:text-lg">Sampaikan usulan</span>
            <span className="text-sm text-muted">Boleh tanpa nama, dan tanggapannya bisa dipantau.</span>
          </Link>
        </section>

        <section aria-labelledby="cara-kerja" className="space-y-6 rounded-3xl bg-ink p-6 text-paper sm:p-8">
          <h2 id="cara-kerja" className="text-xl font-extrabold sm:text-2xl">
            Cara kerjanya
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-kunyit text-sm font-extrabold text-ink">
                  {index + 1}
                </span>
                <span className="space-y-1">
                  <span className="block font-bold">{step.title}</span>
                  <span className="block text-sm opacity-80">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-line pt-6 text-sm text-muted">
          <span>
            Perangkat desa?{" "}
            <Link href="/masuk" className="font-semibold text-stamp underline">
              Masuk ke panel
            </Link>
          </span>
          <span>
            Data terbuka:{" "}
            <a href={`/api/v1/desa/${slug}/apbdes`} className="font-semibold text-stamp underline">
              API APBDes
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}

function IconFrame({ tone, children }: { tone: "stamp" | "kunyit"; children: ReactNode }) {
  const colors = tone === "stamp" ? "bg-stamp/10 text-stamp" : "bg-kunyit-soft text-kunyit-ink";
  return (
    <span className={`flex size-10 items-center justify-center rounded-xl ${colors}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

function IconBubble() {
  return (
    <IconFrame tone="stamp">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </IconFrame>
  );
}

function IconClock() {
  return (
    <IconFrame tone="stamp">
      <path d="M12 3v9l6.5 3.8" />
      <circle cx="12" cy="12" r="9" />
    </IconFrame>
  );
}

function IconMessage() {
  return (
    <IconFrame tone="kunyit">
      <path d="M4 4h16v12H8l-4 4z" />
      <path d="M8 9h8M8 12h5" />
    </IconFrame>
  );
}
