// -15000000 -> "-Rp15.000.000" (the minus sign goes before "Rp", not after it)
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return sign + "Rp" + Math.abs(rounded).toLocaleString("id-ID");
}

export function formatPercent(value: number, decimals = 1): string {
  return (
    value.toLocaleString("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "%"
  );
}

// 30 September 2026 (always in WIB, so server and browser agree)
export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}
