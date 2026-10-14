import Link from "next/link";

export default function DesaNotFound() {
  return (
    <main className="mx-auto max-w-3xl space-y-3 px-4 py-16">
      <h1 className="text-2xl font-bold">Desa tidak ditemukan</h1>
      <p className="text-muted">
        Desa ini belum terdaftar, atau APBDes-nya belum diterbitkan oleh perangkat desa.
      </p>
      <Link href="/desa/sukamaju" className="inline-block font-medium text-stamp underline">
        Lihat contoh: Desa Sukamaju
      </Link>
    </main>
  );
}
