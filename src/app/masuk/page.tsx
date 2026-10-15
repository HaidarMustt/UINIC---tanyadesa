import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/features/auth/server/auth-session";

export const metadata: Metadata = { title: "Masuk panel desa" };

export default async function LoginPage() {
  // Already logged in? Go straight to the panel.
  if (await getCurrentUser()) redirect("/panel");

  return (
    <div className="flex min-h-screen flex-wrap">
      <section className="flex flex-[1_1_420px] flex-col justify-between gap-10 bg-stamp p-8 text-surface sm:p-14">
        <span className="text-xl font-extrabold tracking-tight">
          TanyaDesa <span className="font-medium opacity-75">Panel desa</span>
        </span>
        <div className="max-w-md space-y-4">
          <p className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            Yang diterbitkan di sini langsung bisa dibaca dan ditanyakan warga.
          </p>
          <p className="opacity-85">Khusus operator desa dan anggota BPD.</p>
        </div>
        <span className="text-sm opacity-75">Desa Sukamaju (simulasi)</span>
      </section>

      <main className="flex flex-[999_1_480px] flex-col items-center justify-center gap-6 px-6 py-14">
        <LoginForm />
        <Link href="/desa/sukamaju" className="text-sm font-semibold text-stamp underline">
          Kembali ke halaman warga
        </Link>
      </main>
    </div>
  );
}
