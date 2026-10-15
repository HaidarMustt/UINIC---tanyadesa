import { formatPercent, formatRupiah } from "@/lib/format";
import type { GroupTotal } from "../lib/summarize";
import { SECTOR_SHORT_NAMES, sectorColor } from "./sector-style";

type LabeledGroup = GroupTotal & { label: string };

interface BudgetHeroProps {
  desaName: string;
  fiscalYear: number;
  totalExpenditure: number;
  sectors: LabeledGroup[];
}

// The first thing a resident sees: how much the desa spends this year,
// and one ribbon showing how that money is split across the 5 sectors.
export function BudgetHero({ desaName, fiscalYear, totalExpenditure, sectors }: BudgetHeroProps) {
  const sorted = [...sectors].sort((a, b) => Number(a.key) - Number(b.key));
  const realized = sorted.reduce((total, sector) => total + sector.realized, 0);
  const realizationRate = totalExpenditure === 0 ? 0 : realized / totalExpenditure;

  return (
    <section aria-labelledby="hero-heading" className="space-y-6">
      <div className="space-y-2">
        <h1 id="hero-heading" className="text-muted text-lg font-semibold sm:text-xl">
          Tahun {fiscalYear}, {desaName} membelanjakan
        </h1>
        <p className="text-stamp text-[2.5rem] leading-none font-extrabold tracking-tight sm:text-6xl">
          {formatRupiah(totalExpenditure)}
        </p>
        <p className="text-muted">
          Sejauh ini sudah terpakai <strong className="text-ink">{formatRupiah(realized)}</strong> (
          {formatPercent(realizationRate * 100)}).
        </p>
      </div>

      {/* Decorative: the legend below repeats every number as text. */}
      <div aria-hidden="true" className="ribbon-fill flex h-5 overflow-hidden rounded-full sm:h-6">
        {sorted.map((sector) => (
          <div
            key={sector.key}
            style={{ width: `${sector.share * 100}%`, background: sectorColor(sector.key) }}
            className="border-paper h-full border-r-2 last:border-r-0"
          />
        ))}
      </div>

      <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {sorted.map((sector) => (
          <li key={sector.key} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-1.5 size-3 shrink-0 rounded-sm"
              style={{ background: sectorColor(sector.key) }}
            />
            <div className="min-w-0">
              <p className="font-semibold">
                <span className="sr-only">
                  Bidang {sector.key}, {sector.label}:{" "}
                </span>
                <span aria-hidden="true">{SECTOR_SHORT_NAMES[sector.key] ?? sector.label}</span>
              </p>
              <p className="text-muted text-sm">
                {formatRupiah(sector.budget)}, {formatPercent(sector.share * 100)} dari belanja
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
