# Fitur Halaqah Kelompok Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur kelompok/halaqah agar ustadz dapat mengelola kelompok, menentukan kelompok setiap santri, dan menginput nilai hanya untuk santri dalam kelompok terpilih.

**Architecture:** Menambahkan tabel `kelompok` dan relasi tunggal `santri.kelompok_id`, lalu membuat `KelompokView` sebagai pusat manajemen kelompok dan input nilai per kelompok. Dashboard mengarahkan alur input nilai ke tab Kelompok dan Data Santri mendapat UI assignment kelompok.

**Tech Stack:** React (Vite), Supabase JS client, PostgreSQL (Supabase), Tailwind CSS.

---

### Task 1: Database Schema dan RLS untuk Kelompok

**Files:**
- Modify: `database/santri.sql`
- Test: Supabase SQL Editor (manual run)

- [ ] **Step 1: Tambahkan tabel `kelompok`, index, trigger, dan RLS policy**

```sql
create table if not exists public.kelompok (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  nama_kelompok text not null,
  deskripsi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, nama_kelompok)
);

create index if not exists kelompok_created_by_idx on public.kelompok (created_by);
create index if not exists kelompok_created_by_nama_idx on public.kelompok (created_by, nama_kelompok);

drop trigger if exists tr_kelompok_set_updated_at on public.kelompok;
create trigger tr_kelompok_set_updated_at
before update on public.kelompok
for each row
execute function public.set_updated_at_timestamp();

alter table public.kelompok enable row level security;

drop policy if exists "kelompok_select_own" on public.kelompok;
create policy "kelompok_select_own"
on public.kelompok
for select
to authenticated
using (auth.uid() = created_by);

drop policy if exists "kelompok_insert_own" on public.kelompok;
create policy "kelompok_insert_own"
on public.kelompok
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "kelompok_update_own" on public.kelompok;
create policy "kelompok_update_own"
on public.kelompok
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "kelompok_delete_own" on public.kelompok;
create policy "kelompok_delete_own"
on public.kelompok
for delete
to authenticated
using (auth.uid() = created_by);
```

- [ ] **Step 2: Tambahkan kolom `kelompok_id` pada tabel `santri`**

```sql
alter table public.santri
add column if not exists kelompok_id uuid references public.kelompok (id) on delete set null;

create index if not exists santri_kelompok_id_idx on public.santri (kelompok_id);
```

- [ ] **Step 3: Jalankan SQL di Supabase SQL Editor**

Run: Salin seluruh isi `database/santri.sql` terbaru ke Supabase SQL Editor lalu execute.  
Expected: Query sukses tanpa error policy/table duplicate.

- [ ] **Step 4: Verifikasi schema berhasil dibuat**

Run:
```sql
select id, nama_kelompok from public.kelompok limit 1;
select id, nama_lengkap, kelompok_id from public.santri limit 1;
```
Expected: Query berhasil (meski hasil bisa kosong).

- [ ] **Step 5: Commit**

```bash
git add database/santri.sql
git commit -m "feat(db): add kelompok table and santri kelompok relation"
```

### Task 2: Buat KelompokView untuk Manajemen Kelompok dan Input Nilai Per Kelompok

**Files:**
- Create: `src/components/dashboard/KelompokView.jsx`
- Test: `npm run build`

- [ ] **Step 1: Buat struktur state dan fetch awal**

```jsx
const [kelompokList, setKelompokList] = useState([]);
const [selectedKelompokId, setSelectedKelompokId] = useState('');
const [anggotaKelompok, setAnggotaKelompok] = useState([]);
const [formKelompok, setFormKelompok] = useState({ namaKelompok: '', deskripsi: '' });
const [formNilai, setFormNilai] = useState({ santriId: '', tanggal: getTodayDateInputValue(), penilaian: 'L', materi: '', catatan: '' });
```

- [ ] **Step 2: Implement fetch daftar kelompok + anggota kelompok aktif**

```jsx
const { data: kelompokData } = await supabase
  .from('kelompok')
  .select('id, nama_kelompok, deskripsi, created_at')
  .eq('created_by', user.id)
  .order('nama_kelompok', { ascending: true });

const { data: anggotaData } = await supabase
  .from('santri')
  .select('id, nama_lengkap, kelompok_id')
  .eq('created_by', user.id)
  .eq('status', 'Aktif')
  .eq('kelompok_id', selectedKelompokId)
  .order('nama_lengkap', { ascending: true });
```

- [ ] **Step 3: Implement tambah kelompok**

```jsx
const { error } = await supabase.from('kelompok').insert({
  created_by: user.id,
  nama_kelompok: formKelompok.namaKelompok.trim(),
  deskripsi: formKelompok.deskripsi.trim() || null,
});
if (error) throw error;
```

- [ ] **Step 4: Implement submit nilai dengan guard keanggotaan kelompok**

```jsx
const { data: anggotaSantri, error: cekError } = await supabase
  .from('santri')
  .select('id, nama_lengkap')
  .eq('id', formNilai.santriId)
  .eq('created_by', user.id)
  .eq('status', 'Aktif')
  .eq('kelompok_id', selectedKelompokId)
  .maybeSingle();

if (cekError) throw cekError;
if (!anggotaSantri) throw new Error('Santri bukan anggota kelompok terpilih atau sudah berpindah kelompok.');

const { error } = await supabase.from('nilai_ngaji').insert({
  created_by: user.id,
  santri_id: formNilai.santriId,
  tanggal: formNilai.tanggal,
  penilaian: formNilai.penilaian,
  materi: formNilai.materi.trim() || null,
  catatan: formNilai.catatan.trim() || null,
});
if (error) throw error;
```

- [ ] **Step 5: Implement UI empty states**

```jsx
{kelompokList.length === 0 && <div>Belum ada kelompok. Tambahkan kelompok terlebih dahulu.</div>}
{selectedKelompokId && anggotaKelompok.length === 0 && <div>Belum ada santri aktif di kelompok ini.</div>}
```

- [ ] **Step 6: Run build untuk validasi komponen baru**

Run: `npm run build`  
Expected: Build selesai tanpa error import/JSX.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/KelompokView.jsx
git commit -m "feat(kelompok): add kelompok management and scoped nilai input"
```

### Task 3: Integrasi Tab Kelompok di Dashboard

**Files:**
- Modify: `src/pages/DashboardPage.jsx`
- Test: `npm run build`

- [ ] **Step 1: Import dan tampilkan tab baru `Kelompok`**

```jsx
import KelompokView from '../components/dashboard/KelompokView';

const navItems = [
  { id: 'Dashboard', icon: 'DB', label: 'Dashboard' },
  { id: 'Data Santri', icon: 'DS', label: 'Data Santri' },
  { id: 'Absensi', icon: 'ABS', label: 'Absensi' },
  { id: 'Nilai', icon: 'NIL', label: 'Nilai' },
  { id: 'Kelompok', icon: 'KLP', label: 'Kelompok' },
];

{activeTab === 'Kelompok' && <KelompokView user={user} onDataChanged={handleKelompokDataChanged} />}
```

- [ ] **Step 2: Ubah quick action Input Nilai agar mengarah ke tab Kelompok**

```jsx
{
  key: 'add-nilai',
  label: 'Input Nilai',
  desc: 'Input nilai per kelompok halaqah',
  onClick: () => setActiveTab('Kelompok'),
  disabled: !user?.id,
}
```

- [ ] **Step 3: Tambahkan callback refresh lintas tab**

```jsx
const handleKelompokDataChanged = async () => {
  if (!user?.id) return;
  await Promise.all([
    fetchSantri(user.id),
    fetchSantriOptions(user.id),
    fetchNilaiHariIni(user.id),
  ]);
};
```

- [ ] **Step 4: Kirim daftar kelompok ke DataSantriView**

```jsx
<DataSantriView
  user={user}
  onSantriStatusChanged={handleSantriStatusChanged}
  onKelompokAssigned={handleKelompokDataChanged}
/>
```

- [ ] **Step 5: Run build untuk validasi integrasi**

Run: `npm run build`  
Expected: Build berhasil dan tidak ada error prop/import.

- [ ] **Step 6: Commit**

```bash
git add src/pages/DashboardPage.jsx
git commit -m "feat(dashboard): add kelompok tab and route nilai input to kelompok flow"
```

### Task 4: Tambah Assignment Kelompok di DataSantriView

**Files:**
- Modify: `src/components/dashboard/DataSantriView.jsx`
- Test: `npm run build`

- [ ] **Step 1: Tambahkan fetch daftar kelompok**

```jsx
const [kelompokList, setKelompokList] = useState([]);

const { data: kelompokData, error: kelompokError } = await supabase
  .from('kelompok')
  .select('id, nama_kelompok')
  .eq('created_by', user.id)
  .order('nama_kelompok', { ascending: true });

if (kelompokError) throw kelompokError;
setKelompokList(kelompokData || []);
```

- [ ] **Step 2: Ambil `kelompok_id` + relasi nama kelompok di query santri**

```jsx
const { data, error: err } = await supabase
  .from('santri')
  .select('*, kelompok:kelompok_id ( id, nama_kelompok )')
  .eq('created_by', user.id)
  .order('nama_lengkap', { ascending: true });
```

- [ ] **Step 3: Implement aksi assign kelompok per santri**

```jsx
const handleAssignKelompok = async (santriId, kelompokId) => {
  const { error: err } = await supabase
    .from('santri')
    .update({ kelompok_id: kelompokId || null })
    .eq('id', santriId)
    .eq('created_by', user.id);

  if (err) throw err;
};
```

- [ ] **Step 4: Tambahkan dropdown kelompok pada tabel/card data santri**

```jsx
<select
  value={santri.kelompok_id || ''}
  onChange={(event) => handleAssignKelompok(santri.id, event.target.value)}
>
  <option value="">Belum ada kelompok</option>
  {kelompokList.map((kelompok) => (
    <option key={kelompok.id} value={kelompok.id}>{kelompok.nama_kelompok}</option>
  ))}
</select>
```

- [ ] **Step 5: Run build untuk validasi assignment flow**

Run: `npm run build`  
Expected: Build berhasil, UI render dropdown tanpa error.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/DataSantriView.jsx
git commit -m "feat(santri): support kelompok assignment per santri"
```

### Task 5: Tambah Filter Kelompok pada Histori Nilai

**Files:**
- Modify: `src/components/dashboard/NilaiView.jsx`
- Test: `npm run build`

- [ ] **Step 1: Ambil daftar kelompok user**

```jsx
const [kelompokOptions, setKelompokOptions] = useState([]);
const [selectedKelompokId, setSelectedKelompokId] = useState('');

const { data: kelompokData } = await supabase
  .from('kelompok')
  .select('id, nama_kelompok')
  .eq('created_by', user.id)
  .order('nama_kelompok', { ascending: true });
```

- [ ] **Step 2: Sertakan relasi kelompok pada query nilai**

```jsx
const { data, error: err } = await supabase
  .from('nilai_ngaji')
  .select('*, santri ( nama_lengkap, kelompok_id, kelompok:kelompok_id ( nama_kelompok ) )')
  .eq('created_by', user.id)
  .order('tanggal', { ascending: false })
  .order('created_at', { ascending: false });
```

- [ ] **Step 3: Terapkan filter kelompok di hasil tampilan**

```jsx
const filteredNilai = useMemo(() => dataNilai.filter((nilai) => {
  const matchName = (nilai.santri?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase());
  const matchKelompok = !selectedKelompokId || nilai.santri?.kelompok_id === selectedKelompokId;
  return matchName && matchKelompok;
}), [dataNilai, searchQuery, selectedKelompokId]);
```

- [ ] **Step 4: Tambahkan dropdown filter kelompok di header NilaiView**

```jsx
<select value={selectedKelompokId} onChange={(e) => setSelectedKelompokId(e.target.value)}>
  <option value="">Semua kelompok</option>
  {kelompokOptions.map((item) => (
    <option key={item.id} value={item.id}>{item.nama_kelompok}</option>
  ))}
</select>
```

- [ ] **Step 5: Run build untuk validasi filter histori**

Run: `npm run build`  
Expected: Build berhasil, filter kelompok dapat dipilih.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/NilaiView.jsx
git commit -m "feat(nilai): add kelompok filter on nilai history"
```

### Task 6: Verifikasi Manual End-to-End

**Files:**
- Modify: none
- Test: aplikasi lokal

- [ ] **Step 1: Jalankan aplikasi lokal**

Run: `npm run dev`  
Expected: Dashboard dapat diakses normal.

- [ ] **Step 2: Uji pembuatan kelompok dan assignment santri**

Run (manual UI):
1. Buka tab Kelompok, tambah 2 kelompok.
2. Buka Data Santri, assign 2 santri ke kelompok berbeda.
Expected: Assignment tersimpan dan tampil konsisten saat refresh.

- [ ] **Step 3: Uji input nilai per kelompok**

Run (manual UI):
1. Pilih kelompok A.
2. Pastikan dropdown santri hanya anggota kelompok A.
3. Simpan nilai.
Expected: Sukses, nilai hari ini bertambah.

- [ ] **Step 4: Uji guard membership**

Run (manual UI): ubah assignment santri dari tab lain saat form nilai terbuka lalu submit form lama.  
Expected: Submit ditolak dengan pesan bahwa santri bukan anggota kelompok aktif.

- [ ] **Step 5: Uji histori nilai dan filter kelompok**

Run (manual UI): buka tab Nilai, pilih filter kelompok.  
Expected: daftar nilai terfilter sesuai kelompok.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: implement kelompok-based santri assignment and scoped nilai workflow"
```
