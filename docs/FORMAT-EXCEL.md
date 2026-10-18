# Format Excel APBDes

Panduan untuk operator desa yang mengunggah APBDes ke TanyaDesa.

**Contoh file yang benar:** [contoh/APBDes_Simulasi_Desa_Sukamaju_2026_v2.xlsx](contoh/APBDes_Simulasi_Desa_Sukamaju_2026_v2.xlsx). Cara termudah adalah menyalin file ini lalu mengganti isinya.

## Ketentuan file

- Format `.xlsx` (Excel 2007 ke atas), ukuran maksimal **1 MB**.
- Jika ada beberapa sheet, yang dibaca adalah sheet yang namanya mengandung kata **"APBDes"**. Jika tidak ada, sheet pertama yang dibaca.

## Kolom

TanyaDesa mencari kolom berdasarkan **judul kolomnya**, bukan posisinya. Judul cukup **diawali** kata di bawah ini (huruf besar-kecil bebas). Misalnya "Anggaran (Rp)" dikenali sebagai Anggaran.

| Judul kolom | Wajib | Isi | Contoh |
|---|---|---|---|
| Kode Rekening | **Ya** | Kode bertitik | `2.1.01` |
| Jenis | **Ya** | Diawali `Pendapatan` atau `Belanja`, atau mengandung `Pembiayaan` + `Penerimaan` / `Pengeluaran` | `Belanja` |
| Uraian | **Ya** | Nama kegiatan atau pendapatan | `Pengaspalan jalan Dusun Krajan RT 03` |
| Sumber Dana | **Ya** | Lihat tabel sumber dana | `DD` |
| Anggaran | **Ya** | Angka rupiah, boleh angka biasa atau teks `Rp185.000.000` | `185000000` |
| Bidang | Wajib untuk baris belanja | Diawali angka 1 sampai 5 | `2. Pelaksanaan Pembangunan Desa` |
| Dusun | Tidak | Nama dusun, boleh diawali "Dusun". Kosong, `-`, atau "Seluruh desa" berarti seluruh desa | `Krajan` |
| RT | Tidak | Nomor RT, boleh rentang | `03`, `RT 03`, `10-12` |
| Realisasi | Tidak | Angka rupiah yang sudah terpakai atau diterima. Kosong dianggap 0 | `150000000` |
| Status | Tidak | Lihat tabel status | `Berjalan` |
| Keterangan | Tidak | Catatan bebas | `Progres fisik 90%` |

Semakin lengkap kolom opsional, semakin banyak pertanyaan warga yang bisa dijawab. Tanpa kolom Dusun, misalnya, pertanyaan "anggaran untuk Dusun Ngemplak berapa?" tidak bisa dijawab.

### Sumber dana

| Tulisan di Excel | Dibaca sebagai |
|---|---|
| `DD` atau `Dana Desa` | Dana Desa |
| `ADD` atau mengandung "Alokasi Dana Desa" | Alokasi Dana Desa |
| `PADes` atau mengandung "Asli Desa" | Pendapatan Asli Desa |
| `BHP` atau mengandung "Bagi Hasil" | Bagi Hasil Pajak dan Retribusi |
| Mengandung "Kabupaten" | Bantuan Keuangan Kabupaten |
| Mengandung "Provinsi" | Bantuan Keuangan Provinsi |
| Mengandung "SiLPA" | SiLPA |
| Lainnya | Lain-lain |

### Status

| Tulisan di Excel mengandung | Dibaca sebagai |
|---|---|
| "belum" | Belum dimulai |
| "berjalan" | Sedang berjalan |
| "selesai" | Selesai |
| "sebagian" | Diterima sebagian (pendapatan/pembiayaan) |
| "diterima" | Sudah diterima (pendapatan/pembiayaan) |
| Kosong | Belanja dianggap sedang berjalan; pendapatan dianggap diterima sebagian |

## Yang dibebaskan

- **Urutan kolom** boleh berbeda.
- **Kop surat atau judul** di atas tabel boleh ada. TanyaDesa mencari sendiri baris yang berisi "Kode Rekening".
- **Baris subjudul dan total** (misalnya "BELANJA", "Jumlah Pendapatan") otomatis dilewati, karena hanya baris yang punya kode rekening yang dibaca.
- Kolom tambahan yang tidak dikenal diabaikan.

## Prosedur unggah

1. Masuk ke panel di `/masuk` dengan akun **Operator**.
2. Buka menu **APBDes**, isi tahun anggaran dan tanggal realisasi, lalu pilih file Excel.
3. TanyaDesa membaca file dan menampilkan hasilnya beserta peringatan, jika ada. **Data belum terlihat warga** pada tahap ini.
4. Periksa hasilnya.
   - Ada yang salah: perbaiki di Excel, klik **Batalkan**, lalu unggah ulang.
   - Sudah benar: klik **Terbitkan**.
5. Versi baru langsung terlihat warga. Versi sebelumnya diarsipkan, tidak dihapus. Unggah, terbit, dan batal tercatat di log aktivitas.

## Pesan yang mungkin muncul

**File ditolak** (tidak bisa dibaca sama sekali):

| Pesan | Perbaikan |
|---|---|
| File harus berformat Excel (.xlsx). | Simpan ulang sebagai `.xlsx` |
| Ukuran file maksimal 1 MB. | Hapus sheet lain atau gambar di dalam file |
| Kolom "Kode Rekening" tidak ditemukan. | Pastikan ada kolom berjudul "Kode Rekening" |
| Kolom wajib tidak ditemukan: ... | Tambahkan kolom yang disebut |

**Peringatan** (file terbaca, tapi perlu dicek sebelum terbit):

| Peringatan | Artinya |
|---|---|
| Baris N (kode): kolom Jenis tidak dikenali. | Isi Jenis tidak diawali Pendapatan/Belanja/Pembiayaan. Baris ini tidak dibaca. |
| Baris N (kode): nilai anggaran tidak valid. | Anggaran kosong, negatif, atau bukan angka. Baris ini tidak dibaca. |
| Baris N (kode): bidang belanja tidak dikenali. | Baris belanja tanpa Bidang yang diawali angka 1 sampai 5. Baris ini tidak dibaca. |
| Baris N: kode rekening X muncul lebih dari sekali. | Kode rekening ganda; setiap kode harus unik. |
| Baris N (kode): realisasi melebihi anggaran. | Periksa kembali angka realisasi. |
| Baris N: dusun "X" tidak terdaftar di desa ini. | Nama dusun salah ketik. Baris ini dihitung sebagai "seluruh desa". |
| Anggaran tidak seimbang: selisih RpX. | Pendapatan + pembiayaan netto tidak sama dengan belanja. |
| Tidak ada baris anggaran yang terbaca. | Tidak ada baris dengan kode rekening yang sah. |

Nomor baris pada pesan sama dengan nomor baris di Excel, jadi mudah dicari.
