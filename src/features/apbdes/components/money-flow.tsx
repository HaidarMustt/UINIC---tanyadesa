import { formatRupiah } from "@/lib/format";
import type { BalanceResult } from "../lib/check-balance";

interface MoneyFlowProps {
  balance: BalanceResult;
}

// Reads like a sentence: money in, plus financing, equals money out.
export function MoneyFlow({ balance }: MoneyFlowProps) {
  const rows = [
    { label: "Uang masuk (pendapatan)", value: balance.totalRevenue, sign: "" },
    { label: "Pembiayaan bersih", value: balance.netFinancing, sign: "+" },
    { label: "Uang keluar (belanja)", value: balance.totalExpenditure, sign: "=" },
  ];

  return (
    <section aria-labelledby="flow-heading" className="rounded-2xl bg-surface p-5 sm:p-6">
      <h2 id="flow-heading" className="font-bold">
        Neraca singkat
      </h2>
      <dl className="mt-3 divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-muted">
              <span aria-hidden="true" className="inline-block w-4 font-bold text-ink">
                {row.sign}
              </span>
              {row.label}
            </dt>
            <dd className="font-semibold">{formatRupiah(row.value)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">
        {balance.isBalanced
          ? "Seimbang: semua uang keluar tercatat sumbernya."
          : `Belum seimbang, selisih ${formatRupiah(balance.difference)}.`}
      </p>
    </section>
  );
}
