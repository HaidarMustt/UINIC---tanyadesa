// Every page under /panel goes through this layout, so this is where we check login.
// (Server actions still check again themselves: a layout does not protect them.)

import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/server/auth-session";

const ROLE_NAMES = { OPERATOR: "Operator desa", BPD: "Anggota BPD", ADMIN: "Admin" } as const;

const MENU = [
  { href: "/panel", label: "Beranda" },
  { href: "/panel/apbdes", label: "APBDes" },
  { href: "/panel/pertanyaan", label: "Pertanyaan warga" },
  { href: "/panel/info", label: "Info desa" },
  { href: "/panel/aspirasi", label: "Aspirasi" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-wrap">
      <aside className="flex max-w-full flex-[1_1_240px] flex-col gap-7 border-r border-line bg-surface px-5 py-7">
        <div>
          <span className="text-lg font-extrabold tracking-tight">
            Tanya<span className="text-stamp">Desa</span>
          </span>
          <br />
          <span className="text-sm text-muted">Panel {user.desa?.name ?? "admin"}</span>
        </div>

        <nav aria-label="Menu panel" className="flex flex-col gap-1 font-semibold">
          {MENU.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl px-3.5 py-2.5 hover:bg-paper">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-1 border-t border-line pt-4 text-sm">
          <p className="font-bold">{user.name}</p>
          <p className="text-muted">{ROLE_NAMES[user.role]}</p>
          <form action={logoutAction}>
            <button type="submit" className="font-semibold text-stamp underline">
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-[999_1_560px] px-4 py-8 sm:px-12">{children}</main>
    </div>
  );
}
