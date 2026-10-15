import type { Metadata } from "next";
import { DraftReview } from "@/features/apbdes/components/draft-review";
import { UploadForm } from "@/features/apbdes/components/upload-form";
import { getPanelDocuments } from "@/features/apbdes/server/apbdes-panel.service";
import { requireUser } from "@/features/auth/server/auth-session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "APBDes" };

const STATUS_NAMES: Record<string, string> = {
  UPLOADED: "Diunggah",
  PROCESSING: "Diproses",
  IN_REVIEW: "Ditinjau",
  PUBLISHED: "Terbit",
  FAILED: "Gagal",
  ARCHIVED: "Diarsipkan",
};

const NOTICES: Record<string, string> = {
  terbit: "APBDes diterbitkan. Warga sekarang melihat versi terbaru.",
  dibatalkan: "Unggahan dibatalkan dan drafnya dihapus.",
  gagal: "Aksi tadi tidak bisa dijalankan. Muat ulang halaman, lalu coba lagi.",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function PanelApbdesPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { status } = await searchParams;
  const { documents, review } = await getPanelDocuments(user);
  const isOperator = user.role === "OPERATOR";
  const latestYear = documents[0]?.fiscalYear ?? new Date().getFullYear();

  return (
    <div className="max-w-4xl space-y-7">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">APBDes</h1>
        <p className="mt-1 text-muted">Unggah Excel, periksa hasil bacaannya, lalu terbitkan untuk warga.</p>
      </div>

      {status && NOTICES[status] && (
        <p role="status" className="rounded-xl bg-stamp/10 px-4 py-3 font-semibold text-stamp">
          {NOTICES[status]}
        </p>
      )}

      {review && <DraftReview review={review} canPublish={isOperator} />}
      {!review && isOperator && <UploadForm defaultYear={latestYear} />}
      {!review && !isOperator && (
        <p className="rounded-2xl bg-surface p-6 text-muted">Hanya operator desa yang bisa mengunggah APBDes.</p>
      )}

      <section aria-labelledby="history-heading" className="space-y-3 rounded-2xl bg-surface p-6">
        <h2 id="history-heading" className="text-lg font-extrabold">
          Riwayat versi
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="border-b border-line py-2 pr-4">Dokumen</th>
                <th className="border-b border-line py-2 pr-4">Status</th>
                <th className="border-b border-line py-2 pr-4">Baris</th>
                <th className="border-b border-line py-2 pr-4">Diunggah</th>
                <th className="border-b border-line py-2">Terbit</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="border-b border-line/60 py-2.5 pr-4 font-semibold">
                    {document.title} v{document.version}
                  </td>
                  <td className="border-b border-line/60 py-2.5 pr-4">{STATUS_NAMES[document.status]}</td>
                  <td className="border-b border-line/60 py-2.5 pr-4">{document._count.items}</td>
                  <td className="border-b border-line/60 py-2.5 pr-4">
                    {formatDate(document.createdAt)}, {document.uploader.name}
                  </td>
                  <td className="border-b border-line/60 py-2.5">
                    {document.publishedAt ? formatDate(document.publishedAt) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
