# API TanyaDesa

Semua endpoint ada di bawah `https://uinic-tanyadesa.vercel.app`. Respons berformat JSON (UTF-8), kecuali jika diminta CSV.

| Metode | Endpoint | Kegunaan | Terbuka untuk situs lain (CORS) |
|---|---|---|---|
| GET | `/api/v1/desa` | Daftar desa yang sudah menerbitkan APBDes | Ya |
| GET | `/api/v1/desa/{slug}/apbdes` | Baris APBDes, bisa disaring, JSON atau CSV | Ya |
| GET | `/api/v1/desa/{slug}/apbdes/summary` | Ringkasan per bidang, dusun, sumber dana | Ya |
| POST | `/api/v1/desa/{slug}/questions` | Bertanya tentang APBDes | Tidak |
| POST | `/api/v1/desa/{slug}/aspirations` | Mengirim aspirasi | Tidak |
| GET | `/api/health` | Cek kesehatan server dan database | Tidak |

## Aturan umum

- **`{slug}`** adalah nama desa di URL: huruf kecil, angka, dan tanda minus. Contoh: `sukamaju`.
- **Data terbuka** (tiga endpoint GET pertama) mengirim `Access-Control-Allow-Origin: *`, jadi bisa dipanggil dari situs mana pun, dan di-cache: `Cache-Control: public, max-age=300, s-maxage=3600`.
- **Nilai uang** dalam rupiah, berupa bilangan bulat.
- **Error** selalu berbentuk:

  ```json
  { "error": "Pesan yang bisa dibaca manusia." }
  ```

| Kode | Arti |
|---|---|
| 400 | Input tidak valid (pesan menyebut bagian yang salah) |
| 404 | Desa belum punya APBDes yang diterbitkan |
| 429 | Batas kiriman tercapai |
| 503 | Database atau layanan AI sedang tidak bisa dihubungi |
| 500 | Kesalahan lain di server (detail hanya di log server) |

### Nilai kode

| Kolom | Nilai |
|---|---|
| `entryType` | `REVENUE` (pendapatan), `EXPENDITURE` (belanja), `FINANCING_RECEIPT` (pembiayaan penerimaan), `FINANCING_EXPENDITURE` (pembiayaan pengeluaran) |
| `sectorCode` | 1 Pemerintahan, 2 Pembangunan, 3 Pembinaan Kemasyarakatan, 4 Pemberdayaan Masyarakat, 5 Bencana dan Mendesak; `null` untuk selain belanja |
| `fundSource` | `DD` Dana Desa, `ADD` Alokasi Dana Desa, `PADES` Pendapatan Asli Desa, `BHP` Bagi Hasil Pajak, `BANKEU_KAB`, `BANKEU_PROV`, `SILPA`, `OTHER` |
| `status` | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED` (kegiatan); `PARTIALLY_RECEIVED`, `RECEIVED` (pendapatan/pembiayaan) |
| `dusun` | Nama dusun, atau `null` jika untuk seluruh desa |

---

## GET `/api/v1/desa`

Daftar desa yang sudah menerbitkan APBDes.

```
curl https://uinic-tanyadesa.vercel.app/api/v1/desa
```

```json
{
  "count": 1,
  "data": [
    {
      "slug": "sukamaju",
      "name": "Desa Sukamaju",
      "district": "Kecamatan Contoh",
      "regency": "Kabupaten Simulasi",
      "province": null,
      "isSimulation": true,
      "fiscalYears": [2026]
    }
  ]
}
```

## GET `/api/v1/desa/{slug}/apbdes`

Baris-baris APBDes versi yang sedang diterbitkan.

| Parameter (query) | Wajib | Contoh | Keterangan |
|---|---|---|---|
| `entryType` | Tidak | `EXPENDITURE` | Saring per jenis |
| `sector` | Tidak | `2` | Saring per bidang (1 sampai 5) |
| `dusun` | Tidak | `Ngemplak` | Saring per dusun, huruf besar-kecil diabaikan |
| `format` | Tidak | `csv` | `json` (bawaan) atau `csv` |

```
curl "https://uinic-tanyadesa.vercel.app/api/v1/desa/sukamaju/apbdes?entryType=EXPENDITURE&sector=2&dusun=Ngemplak"
```

```json
{
  "desa": { "slug": "sukamaju", "name": "Desa Sukamaju", "isSimulation": true },
  "document": {
    "title": "APBDes 2026",
    "fiscalYear": 2026,
    "version": 2,
    "realizedAsOf": "...",
    "publishedAt": "..."
  },
  "count": 2,
  "items": [
    {
      "accountCode": "2.1.04",
      "entryType": "EXPENDITURE",
      "sectorCode": 2,
      "sectorName": "Pelaksanaan Pembangunan Desa",
      "description": "Pembangunan saluran drainase Dusun Ngemplak RT 08",
      "dusun": "Ngemplak",
      "rt": "08",
      "fundSource": "DD",
      "fundSourceName": "Dana Desa",
      "budget": 74000000,
      "realized": 66600000,
      "realizationRate": 0.9,
      "status": "IN_PROGRESS",
      "note": "Progres fisik sekitar 90%"
    }
  ]
}
```

*Contoh diambil dari APBDes simulasi versi 2; daftar `items` dipersingkat menjadi satu baris. Panggil endpoint-nya untuk data lengkap.*

Dengan `format=csv`, respons berupa file unduhan `apbdes-{slug}-{tahun}.csv` dengan kolom `kode_rekening, jenis, bidang, uraian, dusun, rt, sumber_dana, anggaran, realisasi, status, keterangan`. File diawali penanda UTF-8 agar teks Indonesia tampil benar di Excel.

## GET `/api/v1/desa/{slug}/apbdes/summary`

Ringkasan yang dihitung kode dari seluruh baris APBDes.

```
curl https://uinic-tanyadesa.vercel.app/api/v1/desa/sukamaju/apbdes/summary
```

Bentuk respons:

```json
{
  "desa": { "slug": "sukamaju", "name": "Desa Sukamaju", "isSimulation": true },
  "document": { "title": "APBDes 2026", "fiscalYear": 2026, "version": 2, "realizedAsOf": "...", "publishedAt": "..." },
  "balance": {
    "totalRevenue": 0,
    "totalExpenditure": 0,
    "netFinancing": 0,
    "difference": 0,
    "isBalanced": true
  },
  "bySector": [
    { "key": "2", "label": "Pelaksanaan Pembangunan Desa", "budget": 0, "realized": 0, "realizationRate": 0.0, "share": 0.0 }
  ],
  "byDusun": [ { "key": "Ngemplak", "label": "Ngemplak", "budget": 0, "realized": 0, "realizationRate": 0.0, "share": 0.0 } ],
  "byFundSource": [ { "key": "DD", "label": "Dana Desa", "budget": 0, "realized": 0, "realizationRate": 0.0, "share": 0.0 } ]
}
```

- `balance.difference` = pendapatan + pembiayaan netto − belanja. Nol berarti seimbang.
- `realizationRate` dan `share` bernilai 0 sampai 1.
- Kegiatan tanpa dusun dikelompokkan sebagai "Seluruh desa".

## POST `/api/v1/desa/{slug}/questions`

Bertanya tentang APBDes dengan bahasa sehari-hari.

```
curl -X POST https://uinic-tanyadesa.vercel.app/api/v1/desa/sukamaju/questions \
  -H "Content-Type: application/json" \
  -d '{"question": "Dana buat jalan RT 3 berapa?"}'
```

| Isi (body) | Wajib | Keterangan |
|---|---|---|
| `question` | Ya | 3 sampai 500 karakter |

```json
{
  "id": "cm...",
  "status": "ANSWERED",
  "answer": "Pengaspalan jalan lingkungan Dusun Krajan RT 03 (panjang 250 m) anggarannya Rp185.000.000, bersumber dari Dana Desa. Statusnya sudah selesai, dengan realisasi Rp185.000.000 (100%). Keterangan: Selesai Juli 2026.",
  "sources": [
    { "accountCode": "2.1.01", "description": "Pengaspalan jalan lingkungan Dusun Krajan RT 03 (panjang 250 m)" }
  ],
  "isSimulation": true
}
```

| `status` | Arti |
|---|---|
| `ANSWERED` | Terjawab dari APBDes; `sources` berisi baris yang dipakai |
| `NOT_FOUND` | Tidak ada di APBDes, atau penjelasan istilahnya belum tersedia |
| `REFUSED` | Ditolak: data pribadi, di luar APBDes, atau pertanyaan tidak bisa dipahami |

Batas: 20 pertanyaan per sesi browser per jam, 500 per desa per hari (kode 429). Sesi dikenali lewat cookie anonim yang dibuat otomatis.

## POST `/api/v1/desa/{slug}/aspirations`

Mengirim aspirasi warga.

| Isi (body) | Wajib | Keterangan |
|---|---|---|
| `content` | Ya | 10 sampai 1000 karakter |
| `dusun` | Tidak | Nama dusun |
| `rt` | Tidak | Nomor RT |
| `senderName` | Tidak | Boleh kosong (anonim) |
| `contact` | Tidak | Hanya terlihat oleh petugas desa dan BPD |
| `turnstileToken` | Ya, jika Turnstile aktif | Token dari widget Cloudflare Turnstile di halaman |

```json
{ "trackingCode": "k7m2p9qa", "status": "NEW" }
```

Kode respons `201`. Isi yang dikirim warga tidak dikembalikan. Status dan tanggapan bisa dilihat di `/desa/{slug}/aspirasi/{trackingCode}`.

Jika Turnstile aktif, permintaan tanpa token yang sah ditolak dengan `400` dan pesan "Verifikasi keamanan gagal". Batas: 5 per sesi per jam, 15 per IP per jam, 200 per desa per hari.

## GET `/api/health`

```
curl https://uinic-tanyadesa.vercel.app/api/health
```

```json
{
  "status": "ok",
  "database": "ok",
  "databaseLatencyMs": 42,
  "checkedAt": "2026-10-17T08:00:00.000Z"
}
```

Kode `200` jika sehat. Kode `503` dengan `"status": "degraded"` dan `"database": "unreachable"` jika database tidak terjangkau. Tidak pernah di-cache.
