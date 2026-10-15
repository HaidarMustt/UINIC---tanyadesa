// The resident's tracking page. Whoever has the code can see the aspiration,
// so it never shows the sender's name or contact.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { CopyLinkButton } from "@/features/aspiration/components/copy-link-button";
import { STATUS_FOR_RESIDENTS } from "@/features/aspiration/constants";
import { TrackingCodeSchema } from "@/features/aspiration/schemas";
import {
  getAspirationForResident,
  getAspirationFormData,
} from "@/features/aspiration/server/aspiration.service";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Status aspirasi", robots: { index: false } };

interface PageProps {
  params: Promise<{ slug: string; code: string }>;
  searchParams: Promise<{ baru?: string }>;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

const STEPS = ["NEW", "FORWARDED", "RESPONDED", "RESOLVED"] as const;

export default async function TrackAspirationPage({ params, searchParams }: PageProps) {
  const { slug, code } = await params;
  const { baru } = await searchParams;

  const parsedSlug = DesaSlugSchema.safeParse(slug);
  const parsedCode = TrackingCodeSchema.safeParse(code);
  if (!parsedSlug.success || !parsedCode.success) notFound();

  const [desa, aspiration] = await Promise.all([
    getAspirationFormData(parsedSlug.data),
    getAspirationForResident(parsedSlug.data, parsedCode.data),
  ]);
  if (!desa || !aspiration) notFound();

  const reached = aspiration.status === "REJECTED" ? 0 : STEPS.indexOf(aspiration.status);
  const location = aspiration.dusun
    ? `${aspiration.dusun.name}${aspiration.rt ? ` RT ${aspiration.rt}` : ""}`
    : "Seluruh desa";
  const item = aspiration.relatedBudgetItem;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12 sm:px-6">
      <SiteHeader desaName={desa.name} slug={desa.slug} current="aspiration" />

      <main className="space-y-7 pt-4">
        {baru && (
          <section className="space-y-3 rounded-2xl bg-stamp p-5 text-surface">
            <h1 className="text-2xl font-extrabold">Aspirasi terkirim</h1>
            <p className="text-sm opacity-85">
              Simpan tautan halaman ini untuk melihat tanggapan desa. Tanpa tautan ini, aspirasi tanpa nama
              tidak bisa dicari lagi.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface/15 px-3 py-2">
              <span className="font-bold tracking-wide">Kode: {code}</span>
              <CopyLinkButton />
            </div>
          </section>
        )}
        {!baru && <h1 className="text-3xl font-extrabold tracking-tight">Status aspirasi</h1>}

        <section className="space-y-3 rounded-2xl bg-surface p-5">
          <h2 className="font-bold">Isi aspirasi</h2>
          <p className="whitespace-pre-line">&ldquo;{aspiration.content}&rdquo;</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Lokasi</dt>
              <dd className="font-bold">{location}</dd>
            </div>
            <div>
              <dt className="text-muted">Kategori</dt>
              <dd className="font-bold">{aspiration.category?.name ?? "Sedang dipilah"}</dd>
            </div>
          </dl>
          {item && (
            <div className="space-y-1 rounded-xl bg-paper p-3 text-sm">
              <p className="font-bold">Ternyata sudah ada di APBDes</p>
              <p className="flex gap-2">
                <span className="shrink-0 rounded-md bg-stamp/10 px-2 font-bold text-stamp">{item.accountCode}</span>
                <span className="text-muted">
                  {item.description}, {formatRupiah(item.budget)}
                  {item.note ? `. ${item.note}` : ""}
                </span>
              </p>
            </div>
          )}
        </section>

        <section aria-labelledby="journey-heading">
          <h2 id="journey-heading" className="mb-3 font-bold">
            Perjalanan aspirasimu
          </h2>
          {aspiration.status === "REJECTED" ? (
            <p className="rounded-xl bg-kunyit-soft p-4 text-kunyit-ink">
              Aspirasi ini tidak diproses, misalnya karena berisi iklan atau melanggar aturan.
            </p>
          ) : (
            <ol className="space-y-0">
              {STEPS.map((step, index) => {
                const done = index <= reached;
                return (
                  <li key={step} className="flex gap-3.5">
                    <span className="flex flex-col items-center" aria-hidden="true">
                      <span className={`size-3.5 rounded-full ${done ? "bg-stamp" : "border-2 border-line bg-paper"}`} />
                      {index < STEPS.length - 1 && <span className={`w-0.5 flex-1 ${index < reached ? "bg-stamp" : "bg-line"}`} />}
                    </span>
                    <div className={`pb-5 ${done ? "" : "text-muted"}`}>
                      <p className="font-bold">
                        {step === "FORWARDED" && aspiration.forwardedTo
                          ? `Diteruskan ke ${aspiration.forwardedTo}`
                          : STATUS_FOR_RESIDENTS[step]}
                        <span className="sr-only">{done ? " (sudah)" : " (belum)"}</span>
                      </p>
                      {step === "NEW" && <p className="text-sm text-muted">{formatDateTime(aspiration.createdAt)}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {aspiration.responses.length > 0 && (
          <section aria-labelledby="responses-heading" className="space-y-3">
            <h2 id="responses-heading" className="font-bold">
              Tanggapan desa
            </h2>
            {aspiration.responses.map((response) => (
              <div key={response.createdAt.toISOString()} className="space-y-1 rounded-2xl bg-surface p-4">
                <p className="text-sm text-muted">
                  {response.user.name}, {response.user.role === "BPD" ? "BPD" : "perangkat desa"}.{" "}
                  {formatDateTime(response.createdAt)}
                </p>
                <p className="whitespace-pre-line">{response.content}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
