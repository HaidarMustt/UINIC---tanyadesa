"use client";

import { useActionState } from "react";
import { uploadApbdesAction, type UploadFormState } from "../actions";

const INITIAL_STATE: UploadFormState = { error: null };

interface UploadFormProps {
  defaultYear: number;
}

export function UploadForm({ defaultYear }: UploadFormProps) {
  const [state, formAction, isPending] = useActionState(uploadApbdesAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl bg-surface p-6">
      <div>
        <h2 className="text-lg font-extrabold">Unggah APBDes</h2>
        <p className="mt-1 text-sm text-muted">
          Hasilnya disimpan sebagai draf. Warga belum melihatnya sampai kamu terbitkan.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="file" className="font-bold">
          File Excel (.xlsx)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="block w-full rounded-xl border border-dashed border-line bg-paper p-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-stamp file:px-4 file:py-2 file:font-bold file:text-surface"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-[1_1_160px] space-y-1.5">
          <label htmlFor="fiscalYear" className="font-bold">
            Tahun anggaran
          </label>
          <input
            id="fiscalYear"
            name="fiscalYear"
            type="number"
            defaultValue={defaultYear}
            required
            className="w-full rounded-xl border border-line px-4 py-2.5"
          />
        </div>
        <div className="flex-[1_1_200px] space-y-1.5">
          <label htmlFor="realizedAsOf" className="font-bold">
            Realisasi dihitung per
          </label>
          <input
            id="realizedAsOf"
            name="realizedAsOf"
            type="date"
            className="w-full rounded-xl border border-line px-4 py-2.5"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-kunyit-soft px-4 py-3 text-sm text-kunyit-ink">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-stamp px-6 py-3 font-extrabold text-surface disabled:opacity-60"
      >
        {isPending ? "Membaca file…" : "Unggah dan periksa"}
      </button>
    </form>
  );
}
