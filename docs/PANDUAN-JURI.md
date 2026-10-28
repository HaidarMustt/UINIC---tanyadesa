# Panduan mencoba TanyaDesa

Panduan singkat untuk mencoba semua fitur dalam sekitar 10 menit, sebaiknya lewat HP atau mode HP di peramban. Semua data Desa Sukamaju adalah **simulasi**.

Alamat awal: https://uinic-tanyadesa.vercel.app/desa/sukamaju

## A. Sebagai warga (tanpa akun)

| No | Langkah | Yang ditunjukkan |
|---|---|---|
| 1 | Buka alamat awal di atas. | Halaman sambutan, label data simulasi, dan tombol **Mulai bertanya**. |
| 2 | Tekan **Mulai bertanya**, lalu ketik: *Dana buat jalan RT 3 berapa?* | Angka dihitung kode dari APBDes, bukan dikarang AI. Kode rekening sumber (2.1.01) tampil di bawah jawaban. |
| 3 | Tekan saran **Yang sudah terpakai berapa?** | Pertanyaan lanjutan dipahami dari konteks sebelumnya. |
| 4 | Tanyakan: *Apa itu SiLPA?* | Penjelasan istilah yang ditulis manusia, berlabel "Penjelasan istilah". |
| 5 | Tanyakan: *Kapan jadwal posyandu di Tegalsari?* | Jawaban dari Info desa yang ditulis perangkat desa. |
| 6 | Tanyakan: *Siapa saja nama penerima BLT?* | Data pribadi tidak ditampilkan untuk melindungi privasi warga. |
| 7 | Tanyakan: *Besok hujan nggak?* | Topik di luar desa ditolak dengan sopan; TanyaDesa bukan chatbot umum. |
| 8 | Nilai salah satu jawaban dengan **Ya** atau **Kurang**. | Penilaian warga yang nanti terlihat di panel petugas. |
| 9 | Buka **Ringkasan**, lalu tekan **Lihat rincian angka lengkap**. | Ringkasan APBDes dalam kalimat sehari-hari, dengan tabel lengkap yang bisa dibuka. |
| 10 | Buka **Aspirasi**, kirim satu usulan (boleh tanpa nama), lalu simpan **kode lacak**. | Kanal aspirasi yang tercatat dan bisa dipantau warga. |

## B. Sebagai petugas desa

Masuk di https://uinic-tanyadesa.vercel.app/masuk. Email dan password akun demo **tercantum di proposal**, tidak ditulis di repositori publik.

| No | Langkah | Yang ditunjukkan |
|---|---|---|
| 11 | Akun Operator: buka **Pertanyaan warga**. | Jumlah pertanyaan, persentase terjawab dan dinilai membantu, pertanyaan yang belum terjawab, dan kegiatan yang paling sering ditanyakan. |
| 12 | Buka **Info desa**, tambah satu info, lalu tanyakan info itu di halaman Tanya. | Info yang ditulis petugas langsung bisa dijawab untuk warga. |
| 13 | Buka **Aspirasi**, tanggapi aspirasi dari langkah 10, lalu buka halaman lacak dengan kode lacaknya. | Alur aspirasi dari warga ke petugas dan kembali ke warga. |
| 14 | Buka **APBDes**, unggah [file contoh](contoh/APBDes_Simulasi_Desa_Sukamaju_2026_v2.xlsx), periksa hasil baca, lalu tekan **Batalkan**. | Pembaca Excel dengan pemeriksaan per baris sebelum data terlihat warga. |
| 15 | Keluar, lalu masuk dengan akun BPD. | BPD dapat membaca dan menanggapi aspirasi, tetapi tombol ubah Info desa tidak muncul (hak akses per peran). |

## C. Data terbuka dan keandalan

- Spesifikasi OpenAPI 3.1: https://uinic-tanyadesa.vercel.app/openapi.json
- Ringkasan APBDes (JSON): https://uinic-tanyadesa.vercel.app/api/v1/desa/sukamaju/apbdes/summary
- Baris APBDes (CSV): https://uinic-tanyadesa.vercel.app/api/v1/desa/sukamaju/apbdes?format=csv
- Kesehatan sistem: https://uinic-tanyadesa.vercel.app/api/health
- Riwayat uptime: https://stats.uptimerobot.com/ZMe0W6btlv

Rincian setiap endpoint ada di [API.md](API.md).

## Catatan

- Layanan AI memakai kuota gratis. Jika muncul "Layanan tanya jawab sedang sibuk", tunggu sekitar satu menit lalu coba lagi.
- Setelah sesi penilaian, data demo dikembalikan ke kondisi awal dengan `scripts/reset-demo.ts`.
