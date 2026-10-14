import { formatPercent, formatRupiah } from "@/lib/format";
import type { GroupTotal } from "../lib/summarize";

type LabeledGroup = GroupTotal & { label: string };

interface BreakdownListProps {
  id: string;
  title: string;
  description: string;
  groups: LabeledGroup[];
  realizedLabel: string; // "terpakai" for spending, "diterima" for income
}

// A plain list instead of a chart library: works without JavaScript, and every number
// is real text, so screen readers and Ctrl+F can find it.
export function BreakdownList({ id, title, description, groups, realizedLabel }: BreakdownListProps) {
  const sorted = [...groups].sort((a, b) => b.budget - a.budget);
  const largest = sorted[0]?.budget ?? 0;

  return (
    <section aria-labelledby={id} className="border-t border-line pt-8">
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      <p className="mt-1 text-muted">{description}</p>

      <ul className="mt-6 space-y-5">
        {sorted.map((group) => (
          <li key={group.key}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="font-semibold">{group.label}</span>
              <span className="font-semibold">{formatRupiah(group.budget)}</span>
            </div>

            {/* Bar length is relative to the largest group; the realized part is filled. */}
            <div aria-hidden="true" className="mt-2 h-2.5 rounded-full bg-line">
              <div
                className="relative h-full rounded-full bg-stamp/25"
                style={{ width: `${largest === 0 ? 0 : (group.budget / largest) * 100}%` }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-stamp"
                  style={{ width: `${Math.min(group.realizationRate, 1) * 100}%` }}
                />
              </div>
            </div>

            <p className="mt-1.5 text-sm text-muted">
              {formatPercent(group.share * 100)} dari total, sudah {realizedLabel}{" "}
              {formatPercent(group.realizationRate * 100)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
