import Link from "next/link";

interface SiteHeaderProps {
  desaName: string;
  slug: string;
  current: "summary" | "ask";
}

// Top bar shared by the public pages of one desa.
export function SiteHeader({ desaName, slug, current }: SiteHeaderProps) {
  const links = [
    { key: "summary", href: `/desa/${slug}`, label: "Ringkasan" },
    { key: "ask", href: `/desa/${slug}/tanya`, label: "Tanya" },
  ] as const;

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
      <div>
        <span className="text-lg font-extrabold tracking-tight">
          Tanya<span className="text-stamp">Desa</span>
        </span>
        <span className="ml-3 text-sm text-muted">{desaName}</span>
      </div>
      <nav aria-label="Halaman desa">
        <ul className="flex gap-1 rounded-full bg-surface p-1 text-sm font-semibold">
          {links.map((link) => {
            const isCurrent = link.key === current;
            return (
              <li key={link.key}>
                <Link
                  href={link.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={
                    isCurrent
                      ? "block rounded-full bg-stamp px-4 py-1.5 text-surface"
                      : "block rounded-full px-4 py-1.5 text-muted hover:text-ink"
                  }
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
