# Fitur Halaqah/Kelompok Design Spec

**Tanggal:** 2026-04-14  
**Status:** Approved (user approved approach and sections)  
**Ruang lingkup:** Dashboard TPQ (web React + Supabase)

## 1. Latar Belakang
Saat ini ustadz mengelola santri, absensi, dan nilai tanpa pembagian kelompok. Akibatnya, saat input nilai, semua santri aktif muncul dalam satu daftar. Kebutuhan baru adalah menambahkan fitur halaqah/kelompok agar:
- Ustadz dapat membuat dan mengelola kelompok.
- Setiap santri hanya berada di satu kelompok.
- Penilaian dilakukan per kelompok, sehingga santri yang bisa dinilai hanya anggota kelompok yang dipilih.

## 2. Tujuan
- Menyediakan struktur data kelompok yang terpisah dan rapi.
- Memungkinkan assign kelompok untuk setiap santri (maksimal satu kelompok per santri).
- Menyediakan tab khusus `Kelompok` untuk alur penilaian per kelompok.
- Mencegah input nilai lintas kelompok (baik dari UI maupun validasi sebelum insert).

## 3. Non-Tujuan
- Tidak menambahkan histori perpindahan kelompok.
- Tidak menambahkan multi-kelompok per santri.
- Tidak mengganti histori nilai lama.
- Tidak menambahkan role baru selain pola user/ustadz yang sudah berjalan.

## 4. Desain Data

### 4.1 Tabel Baru: `kelompok`
Kolom:
- `id uuid primary key default gen_random_uuid()`
- `created_by uuid not null references auth.users(id) on delete cascade`
- `nama_kelompok text not null`
- `deskripsi text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Aturan:
- `unique (created_by, nama_kelompok)` untuk mencegah duplikasi nama kelompok pada user yang sama.
- Index: `(created_by)`, `(created_by, nama_kelompok)`.

### 4.2 Perubahan Tabel `santri`
Tambah kolom:
- `kelompok_id uuid null references public.kelompok(id) on delete set null`

Aturan:
- Satu santri hanya memiliki satu `kelompok_id` (secara model kolom tunggal sudah memenuhi).
- Index baru: `santri_kelompok_id_idx` pada `(kelompok_id)`.

### 4.3 RLS & Policy
- `kelompok`: select/insert/update/delete hanya untuk baris milik `auth.uid()`.
- Update `santri` tetap mengikuti policy existing `created_by = auth.uid()`.
- Dengan FK + policy existing, user hanya dapat assign santri yang dimilikinya.

## 5. Desain UI/UX

### 5.1 Sidebar
Tambah item tab baru:
- `Kelompok`

### 5.2 Tab `Data Santri`
Tambahkan kemampuan assign kelompok ke santri:
- Tampilkan kolom/badge kelompok saat ini.
- Aksi edit kelompok per santri (dropdown daftar kelompok + opsi kosongkan kelompok).
- Feedback sukses/gagal update kelompok.

### 5.3 Tab `Kelompok` (Baru)
Komponen baru menampilkan dua area utama:
1. **Manajemen Kelompok**
- Form tambah kelompok (`nama_kelompok`, `deskripsi` opsional).
- List kelompok milik user.

2. **Anggota & Penilaian Per Kelompok**
- Pilih kelompok aktif.
- Tampilkan daftar santri aktif dalam kelompok tersebut.
- Form input nilai hanya untuk anggota kelompok terpilih:
  - `santri`
  - `tanggal`
  - `penilaian` (L/KL/TL)
  - `materi` (opsional)
  - `catatan` (opsional)

### 5.4 Dashboard Quick Action
Aksi cepat `Input Nilai` di halaman dashboard utama diarahkan ke tab `Kelompok` agar alur konsisten per kelompok.

## 6. Data Flow

### 6.1 Assign Kelompok
1. User membuka Data Santri.
2. User pilih kelompok untuk seorang santri.
3. App melakukan `update santri set kelompok_id = ...`.
4. UI refresh data santri dan notifikasi tampil.

### 6.2 Input Nilai Per Kelompok
1. User buka tab Kelompok.
2. User pilih kelompok.
3. App fetch santri dengan filter:
   - `created_by = user.id`
   - `status = 'Aktif'`
   - `kelompok_id = selectedKelompokId`
4. Form nilai hanya menampilkan hasil filter tersebut.
5. Saat submit, app validasi wajib isi dan cek keanggotaan santri terhadap kelompok terpilih.
6. Jika valid, insert ke `nilai_ngaji`.

## 7. Validasi dan Error Handling
- Jika belum ada kelompok: tampilkan empty state dan CTA buat kelompok.
- Jika kelompok belum punya santri aktif: disable simpan nilai, tampilkan info.
- Jika santri berpindah kelompok saat form terbuka: submit ditolak dengan pesan jelas (re-check membership sebelum insert).
- Pesan error menggunakan pola `getSupabaseErrorMessage` yang sudah digunakan di codebase.

## 8. Dampak ke Komponen
- `database/santri.sql`: tambah migration SQL untuk `kelompok` + alter `santri`.
- `src/pages/DashboardPage.jsx`:
  - tambah tab `Kelompok`
  - integrasi aksi cepat input nilai ke tab kelompok
  - shared state ringan jika diperlukan untuk refresh setelah assign kelompok
- `src/components/dashboard/DataSantriView.jsx`:
  - load daftar kelompok
  - UI assign kelompok per santri
- `src/components/dashboard/KelompokView.jsx` (baru):
  - manajemen kelompok
  - input nilai berbasis kelompok
- `src/components/dashboard/NilaiView.jsx`:
  - opsional filter kelompok untuk histori nilai

## 9. Testing Manual
1. Buat 2 kelompok berbeda.
2. Assign santri A ke kelompok 1, santri B ke kelompok 2.
3. Di tab Kelompok, pilih kelompok 1: hanya santri A muncul.
4. Simpan nilai untuk santri A: sukses.
5. Coba manipulasi UI agar santri B terkirim saat kelompok 1 dipilih: harus ditolak oleh validasi membership app.
6. Cek tab Nilai: nilai baru tampil normal.
7. Ubah status santri jadi Nonaktif: santri tidak muncul di input nilai kelompok.

## 10. Risiko dan Mitigasi
- **Risiko:** Data lama belum punya kelompok.  
  **Mitigasi:** `kelompok_id` nullable + empty state jelas.
- **Risiko:** Duplikasi nama kelompok membingungkan.  
  **Mitigasi:** unique `(created_by, nama_kelompok)`.
- **Risiko:** Logic nilai lama bentrok dengan flow baru.  
  **Mitigasi:** pusatkan input nilai ke tab Kelompok, histori tetap kompatibel.

## 11. Kriteria Selesai (Acceptance Criteria)
- Ustadz bisa CRUD minimum kelompok (create + list; update/delete bisa ditambah bertahap).
- Satu santri hanya bisa diset ke satu kelompok lewat `kelompok_id`.
- Input nilai dilakukan di tab Kelompok dan santri yang tersedia hanya anggota kelompok aktif.
- Sistem menolak submit nilai jika santri bukan anggota kelompok terpilih.
- Tidak ada regresi pada fitur Data Santri, Absensi, dan Histori Nilai.
