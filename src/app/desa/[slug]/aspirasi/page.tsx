import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SimulationNotice } from "@/features/apbdes/components/simulation-notice";
import { DesaSlugSchema } from "@/features/apbdes/schemas";
import { AspirationForm } from "@/features/aspiration/components/aspiration-form";
import { getAspirationFormData } from "@/features/aspiration/server/aspiration.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadDesa(slug: string) {
  const parsed = DesaSlugSchema.safeParse(slug);
  if (!parsed.success) notFound();
  const desa = await getAspirationFormData(parsed.data);
  if (!desa) notFound();
  return desa;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const desa = await loadDesa(slug);
  return { title: `Aspirasi untuk ${desa.name}` };
}

export default async function AspirationPage({ params }: PageProps) {
  const { slug } = await params;
  const desa = await loadDesa(slug);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12 sm:px-6">
      <SiteHeader desaName={desa.name} slug={desa.slug} current="aspiration" />

      <main className="space-y-8 pt-4">
        {desa.isSimulation && <SimulationNotice />}

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Sampaikan ke desa</h1>
          <p className="text-muted">
            Usulan, keluhan, atau pertanyaan soal kegiatan desa. Aspirasimu diteruskan ke perangkat desa atau
            BPD, dan kamu mendapat tautan untuk melihat tanggapannya.
          </p>
        </div>

        <AspirationForm
          slug={desa.slug}
          dusuns={desa.dusuns.map(({ name, rts }) => ({ name, rts }))}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null}
        />
      </main>
    </div>
  );
}
