# Skema Database TanyaDesa

PostgreSQL (Supabase), dikelola dengan Prisma. Sumber lengkap: [prisma/schema.prisma](../prisma/schema.prisma).

```mermaid
erDiagram
    DESA ||--o{ DUSUN : "punya"
    DESA ||--o{ USERS : "punya petugas"
    DESA ||--o{ APBDES_DOCUMENTS : "menerbitkan"
    DESA ||--o{ ASPIRATION_CATEGORIES : "punya"
    DESA ||--o{ ASPIRATIONS : "menerima"
    DESA ||--o{ QUESTIONS : "menerima"

    APBDES_DOCUMENTS ||--o{ BUDGET_ITEMS : "berisi"
    USERS ||--o{ APBDES_DOCUMENTS : "mengunggah / menerbitkan"
    SECTORS ||--o{ BUDGET_ITEMS : "mengelompokkan"
    DUSUN ||--o{ BUDGET_ITEMS : "lokasi"

    APBDES_DOCUMENTS ||--o{ QUESTIONS : "dipakai menjawab"
    QUESTIONS ||--o{ ANSWER_SOURCES : "bersumber dari"
    BUDGET_ITEMS ||--o{ ANSWER_SOURCES : "dikutip di"

    ASPIRATION_CATEGORIES ||--o{ ASPIRATIONS : "mengelompokkan"
    DUSUN ||--o{ ASPIRATIONS : "asal"
    BUDGET_ITEMS ||--o{ ASPIRATIONS : "terkait kegiatan"
    ASPIRATIONS ||--o{ ASPIRATION_RESPONSES : "ditanggapi"
    USERS ||--o{ ASPIRATION_RESPONSES : "menulis"

    USERS ||--o{ ACTIVITY_LOGS : "tercatat"

    DESA ||--o{ VILLAGE_INFOS : "menulis"
    DUSUN ||--o{ VILLAGE_INFOS : "berlaku di"
    USERS ||--o{ VILLAGE_INFOS : "memperbarui"

    DESA {
        string id PK
        string slug UK "dipakai di URL"
        string name
        string district
        string regency
        boolean isSimulation
    }
    DUSUN {
        string id PK
        string desaId FK
        string name
        string_array rts
    }
    USERS {
        string id PK
        string desaId FK "null untuk ADMIN"
        string email UK
        string passwordHash "bcrypt"
        enum role "OPERATOR, BPD, ADMIN"
        boolean isActive
    }
    APBDES_DOCUMENTS {
        string id PK
        string desaId FK
        int fiscalYear
        int version
        enum status "IN_REVIEW, PUBLISHED, ARCHIVED, ..."
        datetime realizedAsOf
        string uploaderId FK
        string publisherId FK
    }
    SECTORS {
        int code PK "1 sampai 5"
        string name
    }
    BUDGET_ITEMS {
        string id PK
        string documentId FK
        string accountCode "kode rekening"
        enum entryType
        int sectorCode FK
        string description
        string dusunId FK "null = seluruh desa"
        string rt
        enum fundSource
        bigint budget
        bigint realized
        enum status
    }
    QUESTIONS {
        string id PK
        string desaId FK
        string documentId FK
        string sessionId "anonim"
        string text
        json intent "pemahaman AI"
        string intentVersion "sidik jari prompt"
        enum status
        boolean isHelpful "penilaian warga"
    }
    ANSWER_SOURCES {
        string questionId PK
        string budgetItemId PK
    }
    ASPIRATION_CATEGORIES {
        string id PK
        string desaId FK
        string name
    }
    ASPIRATIONS {
        string id PK
        string desaId FK
        string content
        string senderName "opsional"
        string contact "hanya petugas"
        string categoryId FK
        float aiConfidence
        string aiFlag "SPAM, KASAR, ANCAMAN"
        string trackingCode UK
        string ipHash "bukan IP asli"
        enum status
    }
    ASPIRATION_RESPONSES {
        string id PK
        string aspirationId FK
        string userId FK
        string content
        boolean isPublic
    }
    VILLAGE_INFOS {
        string id PK
        string desaId FK
        enum category "SCHEDULE, SERVICE, ANNOUNCEMENT, CONTACT"
        string title
        string content
        string dusunId FK "null = seluruh desa"
        datetime validUntil "pengumuman"
        boolean isPublished
        string updatedById FK
    }
    ACTIVITY_LOGS {
        string id PK
        string userId FK
        string action
        string entity
        string entityId
        json details
    }
```

## Penjelasan tabel

| Tabel | Isi |
|---|---|
| `desa` | Data desa. `isSimulation` menampilkan label "Simulasi" di halaman warga. |
| `dusun` | Dusun dan daftar RT per desa. Dipakai untuk memeriksa nama dusun di Excel. |
| `users` | Akun petugas (Operator, BPD, Admin). Warga tidak perlu akun. |
| `apbdes_documents` | Satu baris per versi APBDes yang diunggah. Hanya satu versi berstatus `PUBLISHED` per desa dan tahun; versi lama menjadi `ARCHIVED`. |
| `sectors` | Lima bidang belanja desa. |
| `budget_items` | Baris anggaran hasil baca Excel. Kode rekening unik per dokumen. |
| `questions` | Pertanyaan warga, pemahaman AI, status jawaban, dan penilaian warga (`isHelpful`). Dipakai juga untuk batas kiriman, cache pemahaman, dan halaman "Pertanyaan warga". |
| `answer_sources` | Baris anggaran yang dikutip oleh setiap jawaban (banyak ke banyak). |
| `aspiration_categories` | Kategori aspirasi per desa. |
| `aspirations` | Aspirasi warga beserta kategori dan tanda dari AI, kode lacak, dan statusnya. |
| `aspiration_responses` | Tanggapan petugas. `isPublic = false` untuk catatan internal. |
| `village_infos` | Info desa yang ditulis perangkat desa: jadwal, syarat layanan, pengumuman, kontak kantor. Disembunyikan, bukan dihapus. Judul unik per desa. |
| `activity_logs` | Jejak audit: siapa melakukan apa, terhadap data apa, dan kapan. |

## Indeks penting

| Tabel | Indeks | Untuk |
|---|---|---|
| `budget_items` | `(documentId, accountCode)` unik | Mencegah kode rekening ganda |
| `budget_items` | `(documentId, entryType)`, `(documentId, sectorCode)`, `(documentId, dusunId)` | Penyaringan cepat saat menjawab |
| `questions` | `(sessionId, createdAt)`, `(desaId, createdAt)` | Menghitung batas kiriman |
| `questions` | `(documentId, intentVersion)` | Mencari pemahaman yang bisa dipakai ulang |
| `aspirations` | `(sessionId, createdAt)`, `(ipHash, createdAt)` | Menghitung batas kiriman |
| `aspirations` | `trackingCode` unik | Halaman lacak warga |
| `village_infos` | `(desaId, title)` unik, `(desaId, category)` | Mencegah judul ganda, menyaring per kategori |
