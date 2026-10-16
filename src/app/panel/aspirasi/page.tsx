import type { Metadata } from "next";
import Link from "next/link";
import { finalStatusAction, respondAction, triageAction } from "@/features/aspiration/actions";
import { FLAG_LABELS, FORWARD_TARGETS, STATUS_FOR_OFFICERS, type AiFlag } from "@/features/aspiration/constants";
import { getInbox } from "@/features/aspiration/server/aspiration-panel.service";
import { requireUser } from "@/features/auth/server/auth-session";
import type { AspirationStatus } from "@/generated/prisma/client";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Aspirasi" };

const STATUSES = Object.keys(STATUS_FOR_OFFICERS) as AspirationStatus[];

interface PageProps {
  searchParams: Promise<{ status?: string; id?: string; pesan?: string }>;
}

function formatDateTime(date: Date) {
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function inboxHref(status: AspirationStatus | null, id?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (id) params.set("id", id);
  const query = params.toString();
  return `/panel/aspirasi${query ? `?${query}` : ""}`;
}

export default async function PanelAspirationPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const query = await searchParams;
  const status = STATUSES.includes(query.status as AspirationStatus) ? (query.status as AspirationStatus) : null;
  const { list, countByStatus, categories, selected } = await getInbox(user, status, query.id ?? null);
  const isOperator = user.role === "OPERATOR";

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Aspirasi warga</h1>
        <p className="mt-1 text-muted">
          {isOperator
            ? "Pilah, teruskan ke yang menangani, lalu tanggapi."
            : "Sebagai anggota BPD, kamu bisa membaca semua aspirasi dan menanggapinya."}
        </p>
      </div>

      {query.pesan && (
        <p role="status" className="rounded-xl bg-stamp/10 px-4 py-3 font-semibold text-stamp">
          {query.pesan}
        </p>
      )}

      <nav aria-label="Saring status" className="flex flex-wrap gap-2 text-sm font-bold">
        <Link
          href={inboxHref(null)}
          aria-current={status === null ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 ${status === null ? "bg-stamp text-surface" : "border border-line bg-surface"}`}
        >
          Semua
        </Link>
        {STATUSES.map((item) => (
          <Link
            key={item}
            href={inboxHref(item)}
            aria-current={status === item ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 ${status === item ? "bg-stamp text-surface" : "border border-line bg-surface"}`}
          >
            {STATUS_FOR_OFFICERS[item]} ({countByStatus[item] ?? 0})
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="Daftar aspirasi" className="min-w-0 flex-[2_1_300px] space-y-1.5 rounded-2xl bg-surface p-3">
          {list.length === 0 && <p className="p-4 text-muted">Belum ada aspirasi di sini.</p>}
          {list.map((item) => (
            <Link
              key={item.id}
              href={inboxHref(status, item.id)}
              aria-current={selected?.id === item.id ? "true" : undefined}
              className={`block space-y-1 rounded-xl p-3 ${selected?.id === item.id ? "bg-stamp/10" : "hover:bg-paper"}`}
            >
              <span className="flex flex-wrap gap-x-2 text-xs font-extrabold">
                <span className={item.needsCategoryCheck ? "text-kunyit-ink" : "text-stamp"}>
                  {item.category?.name ?? "Kategori perlu dicek"}
                </span>
                <span className="text-muted">{item.dusun?.name ?? "Seluruh desa"}</span>
              </span>
              <span className="line-clamp-2 block font-semibold">{item.content}</span>
              <span className="flex flex-wrap gap-2 text-xs text-muted">
                <span>{formatDateTime(item.createdAt)}</span>
                <span>{STATUS_FOR_OFFICERS[item.status]}</span>
                {item.canBeContacted && <span className="font-bold text-stamp">Bisa dihubungi</span>}
                {item.aiFlag && <span className="font-bold text-kunyit-ink">{FLAG_LABELS[item.aiFlag as AiFlag]}</span>}
              </span>
            </Link>
          ))}
        </section>

        <section aria-label="Rincian aspirasi" className="min-w-0 flex-[3_1_420px] space-y-5 rounded-2xl bg-surface p-6">
          {!selected ? (
            <p className="text-muted">Pilih aspirasi di daftar untuk melihat rinciannya.</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-muted">
                  {formatDateTime(selected.createdAt)}, {selected.dusun?.name ?? "Seluruh desa"}
                  {selected.rt ? ` RT ${selected.rt}` : ""}. Status: {STATUS_FOR_OFFICERS[selected.status]}
                  {selected.forwardedTo ? `, diteruskan ke ${selected.forwardedTo}` : ""}.
                </p>
                <p className="text-lg font-semibold whitespace-pre-line">&ldquo;{selected.content}&rdquo;</p>
                <p className="text-sm text-muted">
                  Pengirim: {selected.senderName ?? "tanpa nama"}. Kontak: {selected.contact ?? "tidak diisi"}
                  {selected.contact ? " (hanya untuk perangkat desa dan BPD)" : ""}.
                </p>
                {selected.aiFlag && (
                  <p className="rounded-xl bg-kunyit-soft px-3 py-2 text-sm font-semibold text-kunyit-ink">
                    Peringatan AI: {FLAG_LABELS[selected.aiFlag as AiFlag]}. Periksa dulu sebelum ditindaklanjuti.
                  </p>
                )}
              </div>

              {selected.relatedBudgetItem && (
                <div className="space-y-1 rounded-xl bg-paper p-3 text-sm">
                  <p className="font-bold">Terkait kegiatan di APBDes</p>
                  <p className="flex gap-2">
                    <span className="shrink-0 rounded-md bg-stamp/10 px-2 font-bold text-stamp">
                      {selected.relatedBudgetItem.accountCode}
                    </span>
                    <span className="text-muted">
                      {selected.relatedBudgetItem.description}, {formatRupiah(selected.relatedBudgetItem.budget)}
                      {selected.relatedBudgetItem.note ? `. ${selected.relatedBudgetItem.note}` : ""}
                    </span>
                  </p>
                </div>
              )}

              {isOperator && (
                <form action={triageAction} className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
                  <input type="hidden" name="id" value={selected.id} />
                  <div className="flex-[1_1_180px] space-y-1">
                    <label htmlFor="categoryId" className="text-sm font-bold">
                      Kategori
                    </label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      defaultValue={selected.category?.id ?? ""}
                      className="w-full rounded-xl border border-line px-3 py-2.5"
                    >
                      <option value="">Belum dipilih</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {selected.needsCategoryCheck && <p className="text-xs text-kunyit-ink">AI ragu, mohon dicek.</p>}
                  </div>
                  <div className="flex-[1_1_180px] space-y-1">
                    <label htmlFor="forwardedTo" className="text-sm font-bold">
                      Teruskan ke
                    </label>
                    <select
                      id="forwardedTo"
                      name="forwardedTo"
                      defaultValue={selected.forwardedTo ?? ""}
                      className="w-full rounded-xl border border-line px-3 py-2.5"
                    >
                      <option value="">Belum diteruskan</option>
                      {FORWARD_TARGETS.map((target) => (
                        <option key={target} value={target}>
                          {target}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="rounded-full border border-line px-5 py-2.5 font-bold">
                    Simpan
                  </button>
                </form>
              )}

              {selected.responses.length > 0 && (
                <div className="space-y-2 border-t border-line pt-5">
                  <h2 className="font-bold">Riwayat tanggapan</h2>
                  {selected.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`space-y-1 rounded-xl p-3 text-sm ${response.isPublic ? "bg-paper" : "border border-dashed border-line"}`}
                    >
                      <p className="text-muted">
                        {response.user.name}, {formatDateTime(response.createdAt)}
                        {response.isPublic ? "" : ". Catatan internal, tidak terlihat warga"}
                      </p>
                      <p className="whitespace-pre-line">{response.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {selected.status !== "REJECTED" && (
                <form action={respondAction} className="space-y-3 border-t border-line pt-5">
                  <input type="hidden" name="id" value={selected.id} />
                  <label htmlFor="content" className="font-bold">
                    Tanggapan untuk warga
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    rows={4}
                    required
                    maxLength={2000}
                    className="w-full rounded-xl border border-line px-4 py-3"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="internal" className="size-4" />
                      Catatan internal (tidak terlihat warga)
                    </label>
                    <button type="submit" className="rounded-full bg-stamp px-6 py-2.5 font-extrabold text-surface">
                      Kirim
                    </button>
                  </div>
                </form>
              )}

              {isOperator && selected.status !== "REJECTED" && selected.status !== "RESOLVED" && (
                <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5">
                  <form action={finalStatusAction}>
                    <input type="hidden" name="id" value={selected.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button type="submit" className="rounded-full border border-line px-5 py-2.5 font-bold text-kunyit-ink">
                      Tandai tidak diproses
                    </button>
                  </form>
                  <form action={finalStatusAction}>
                    <input type="hidden" name="id" value={selected.id} />
                    <input type="hidden" name="status" value="RESOLVED" />
                    <button type="submit" className="rounded-full border border-stamp px-5 py-2.5 font-bold text-stamp">
                      Tandai selesai
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
