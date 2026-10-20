// Info desa in the panel: schedules, service requirements, announcements and contacts.
// Operators add and edit; BPD members can read. Residents see these answers in Tanya.

import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/features/auth/server/auth-session";
import { saveInfoAction, toggleInfoAction } from "@/features/info/actions";
import {
  INFO_CATEGORIES,
  INFO_CATEGORY_LABELS,
  MAX_INFO_CONTENT_LENGTH,
  MAX_INFO_TITLE_LENGTH,
} from "@/features/info/constants";
import { getInfoPanel } from "@/features/info/server/info-panel.service";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Info desa" };

interface PageProps {
  searchParams: Promise<{ id?: string; pesan?: string; baru?: string }>;
}

// "2026-11-01" for <input type="date">, in WIB.
function toDateInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-3 py-2.5 focus:border-stamp focus:outline-none focus:ring-4 focus:ring-stamp/15";

export default async function PanelInfoPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const query = await searchParams;
  const { list, dusuns, selected } = await getInfoPanel(user, query.id ?? null);
  const isOperator = user.role === "OPERATOR";
  const showForm = isOperator && (selected !== null || query.baru === "1");

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Info desa</h1>
          <p className="mt-1 text-muted">
            Jadwal, syarat layanan, pengumuman, dan kontak kantor. Warga bisa menanyakannya di halaman Tanya.
          </p>
        </div>
        {isOperator && !showForm && (
          <Link href="/panel/info?baru=1" className="rounded-full bg-stamp px-5 py-2.5 font-bold text-surface">
            Tambah info
          </Link>
        )}
      </div>

      {query.pesan && (
        <p role="status" className="rounded-xl bg-stamp/10 px-4 py-3 font-semibold text-stamp">
          {query.pesan}
        </p>
      )}

      {showForm && (
        <section aria-labelledby="form-heading" className="space-y-4 rounded-2xl bg-surface p-5 sm:p-6">
          <h2 id="form-heading" className="text-lg font-extrabold">
            {selected ? "Ubah info" : "Tambah info"}
          </h2>
          <form action={saveInfoAction} className="space-y-4">
            <input type="hidden" name="id" value={selected?.id ?? ""} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="category" className="font-semibold">
                  Kategori
                </label>
                <select id="category" name="category" required defaultValue={selected?.category ?? ""} className={fieldClass}>
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  {INFO_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {INFO_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="dusunId" className="font-semibold">
                  Dusun <span className="font-normal text-muted">(kosongkan jika untuk seluruh desa)</span>
                </label>
                <select id="dusunId" name="dusunId" defaultValue={selected?.dusun?.id ?? ""} className={fieldClass}>
                  <option value="">Seluruh desa</option>
                  {dusuns.map((dusun) => (
                    <option key={dusun.id} value={dusun.id}>
                      {dusun.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="title" className="font-semibold">
                Judul
              </label>
              <input
                id="title"
                name="title"
                required
                minLength={3}
                maxLength={MAX_INFO_TITLE_LENGTH}
                defaultValue={selected?.title ?? ""}
                placeholder="Contoh: Posyandu Dusun Krajan"
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="content" className="font-semibold">
                Isi
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={4}
                minLength={10}
                maxLength={MAX_INFO_CONTENT_LENGTH}
                defaultValue={selected?.content ?? ""}
                placeholder="Tulis lengkap: kapan, di mana, apa yang perlu dibawa."
                className={fieldClass}
              />
              <p className="text-sm text-muted">Jangan menulis nomor HP pribadi. Pakai nomor kantor desa.</p>
            </div>

            <div className="space-y-1.5 sm:max-w-xs">
              <label htmlFor="validUntil" className="font-semibold">
                Berlaku sampai <span className="font-normal text-muted">(opsional)</span>
              </label>
              <input
                id="validUntil"
                name="validUntil"
                type="date"
                defaultValue={toDateInput(selected?.validUntil ?? null)}
                className={fieldClass}
              />
              <p className="text-sm text-muted">Untuk pengumuman. Setelah tanggal ini, info tidak dijawab lagi.</p>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Link href="/panel/info" className="rounded-full border border-line px-5 py-2.5 font-bold">
                Batal
              </Link>
              <button type="submit" className="rounded-full bg-stamp px-5 py-2.5 font-bold text-surface">
                Simpan
              </button>
            </div>
          </form>
        </section>
      )}

      {INFO_CATEGORIES.map((category) => {
        const entries = list.filter((entry) => entry.category === category);
        return (
          <section key={category} aria-labelledby={`cat-${category}`} className="space-y-3">
            <h2 id={`cat-${category}`} className="text-lg font-extrabold">
              {INFO_CATEGORY_LABELS[category]} <span className="font-normal text-muted">({entries.length})</span>
            </h2>
            {entries.length === 0 ? (
              <p className="rounded-xl bg-surface px-4 py-3 text-muted">Belum ada info di kategori ini.</p>
            ) : (
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li key={entry.id} className="space-y-2 rounded-xl bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="font-bold">
                          {entry.title}
                          {!entry.isPublished && (
                            <span className="ml-2 rounded-full bg-line px-2 py-0.5 text-xs font-bold text-muted">Disembunyikan</span>
                          )}
                          {entry.isPublished && entry.isExpired && (
                            <span className="ml-2 rounded-full bg-kunyit-soft px-2 py-0.5 text-xs font-bold text-kunyit-ink">
                              Sudah lewat
                            </span>
                          )}
                        </p>
                        <p className="text-sm whitespace-pre-line">{entry.content}</p>
                        <p className="text-xs text-muted">
                          {entry.dusun?.name ?? "Seluruh desa"}
                          {entry.validUntil && <> · berlaku sampai {formatDate(entry.validUntil)}</>} · diperbarui{" "}
                          {formatDate(entry.updatedAt)} oleh {entry.updatedBy.name}
                        </p>
                      </div>
                      {isOperator && (
                        <div className="flex shrink-0 gap-2 text-sm font-bold">
                          <Link href={`/panel/info?id=${entry.id}`} className="rounded-full border border-line px-4 py-1.5">
                            Ubah
                          </Link>
                          <form action={toggleInfoAction}>
                            <input type="hidden" name="id" value={entry.id} />
                            <input type="hidden" name="publish" value={entry.isPublished ? "0" : "1"} />
                            <button type="submit" className="rounded-full border border-line px-4 py-1.5">
                              {entry.isPublished ? "Sembunyikan" : "Tampilkan"}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
