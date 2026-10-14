import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans: designed in Indonesia, reads well on small phone screens.
const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "TanyaDesa", template: "%s | TanyaDesa" },
  description:
    "Tanya anggaran desamu dengan bahasa sehari-hari. Setiap angka bisa dicek ke kode rekening APBDes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${jakartaSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
