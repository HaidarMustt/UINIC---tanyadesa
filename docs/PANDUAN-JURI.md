# Panduan mencoba TanyaDesa

Panduan singkat untuk mencoba semua fitur dalam sekitar 10 menit. Semua data Desa Sukamaju adalah **simulasi**.

Alamat: https://uinic-tanyadesa.vercel.app

## 1. Sebagai warga (tanpa akun)

**Halaman sambutan** (`/desa/sukamaju`): tiga pilihan utama dan contoh tanya jawab sungguhan.

**Tanya** (`/desa/sukamaju/tanya`). Coba pertanyaan berikut, berurutan:

| Coba tanyakan | Yang diperhatikan |
|---|---|
| Dana buat jalan RT 3 berapa? | Angka dihitung dari APBDes, kode rekening sumber tampil di bawah |
| lalu: yang sudah terpakai berapa? | Pertanyaan lanjutan dipahami dari konteks |
| Berapa total belanja Dusun Ngemplak? lalu: kalau di Krajan? | Pertanyaan lanjutan dengan dusun lain |
| Apa itu SiLPA? | Penjelasan istilah yang ditulis manusia, berlabel "Penjelasan istilah" |
| Kapan jadwal posyandu di Tegalsari? | Dijawab dari Info desa yang ditulis perangkat desa |
| Syarat bikin paspor apa? | Jujur bahwa infonya belum ada, tidak mengarang |
| Siapa saja nama penerima BLT? | Nama penerima tidak ditampilkan untuk melindungi privasi |
| Besok hujan nggak? | Topik di luar desa ditolak dengan sopan |

Setelah setiap jawaban, coba tombol **"Tanya lanjutan"** dan penilaian **👍 / 👎**.

**Ringkasan** (`/desa/sukamaju/ringkasan`): ringkasan dengan bahasa sehari-hari; buka **"Lihat rincian angka lengkap"** untuk tabel lengkapnya.

**Aspirasi** (`/desa/sukamaju/aspirasi`): kirim satu usulan (boleh tanpa nama). Simpan **kode lacaknya** untuk melihat tanggapan.

## 2. Sebagai petugas desa

Masuk di `/masuk`. Alamat email dan password akun demo **tercantum di proposal**, tidak ditulis di repositori publik.

| Akun | Coba |
|---|---|
| Operator | **Pertanyaan warga**: apa yang ditanyakan dan seberapa membantu jawabannya. **Info desa**: tambah atau ubah info, lalu tanyakan di halaman Tanya. **Aspirasi**: lihat aspirasi yang tadi dikirim, ubah kategori, beri tanggapan, lalu cek di halaman lacak warga. **APBDes**: unggah [file contoh](contoh/APBDes_Simulasi_Desa_Sukamaju_2026_v2.xlsx), periksa hasil baca, lalu batalkan atau terbitkan. |
| BPD | Membaca dan menanggapi aspirasi. Info desa dan Pertanyaan warga hanya bisa dibaca; tombol ubah tidak muncul. |

## 3. Data terbuka (API)

- Spesifikasi OpenAPI: https://uinic-tanyadesa.vercel.app/openapi.json
- Ringkasan APBDes: https://uinic-tanyadesa.vercel.app/api/v1/desa/sukamaju/apbdes/summary
- Info desa: https://uinic-tanyadesa.vercel.app/api/v1/desa/sukamaju/info
- Unduh CSV: https://uinic-tanyadesa.vercel.app/api/v1/desa/sukamaju/apbdes?format=csv
- Kesehatan sistem: https://uinic-tanyadesa.vercel.app/api/health
- Riwayat uptime: https://stats.uptimerobot.com/ZMe0W6btlv

Rincian setiap endpoint ada di [API.md](API.md).

## Catatan

- Layanan AI memakai kuota gratis. Jika muncul "Layanan tanya jawab sedang sibuk", tunggu sekitar satu menit lalu coba lagi.
- Setelah sesi penilaian, data demo dikembalikan ke kondisi awal dengan `scripts/reset-demo.ts`.
