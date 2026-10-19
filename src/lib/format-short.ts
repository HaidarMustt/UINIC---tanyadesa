// Short rupiah for sentences residents read: "Rp1,49 miliar", "Rp790 juta", "Rp66,6 juta".
// Exact numbers stay in the detail sections and in every Q&A answer.
export function formatRupiahShort(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const value = Math.abs(amount);
  const number = (n: number, digits: number) =>
    n.toLocaleString("id-ID", { maximumFractionDigits: digits });

  if (value >= 1_000_000_000) return `${sign}Rp${number(value / 1_000_000_000, 2)} miliar`;
  if (value >= 1_000_000) return `${sign}Rp${number(value / 1_000_000, 1)} juta`;
  return `${sign}Rp${Math.round(value).toLocaleString("id-ID")}`;
}
