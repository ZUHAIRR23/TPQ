-- Jalankan file ini di Supabase SQL Editor.
-- Tujuan: membuat tabel santri & absensi + RLS agar user hanya mengakses datanya sendiri.

create extension if not exists pgcrypto;

create table if not exists public.santri (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  nama_lengkap text not null,
  jenis_kelamin text not null check (jenis_kelamin in ('Laki-laki', 'Perempuan')),
  status text not null default 'Aktif',
  tanggal_lahir date,
  nama_wali text,
  no_hp text,
  alamat text,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.santri
add column if not exists status text;

update public.santri
set status = 'Aktif'
where status is null or status = '';

alter table public.santri
alter column status set default 'Aktif';

alter table public.santri
alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'santri_status_check'
      and conrelid = 'public.santri'::regclass
  ) then
    alter table public.santri
    add constraint santri_status_check
    check (status in ('Aktif', 'Nonaktif'));
  end if;
end;
$$;

create index if not exists santri_created_by_idx on public.santri (created_by);
create index if not exists santri_created_at_idx on public.santri (created_at desc);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tr_santri_set_updated_at on public.santri;
create trigger tr_santri_set_updated_at
before update on public.santri
for each row
execute function public.set_updated_at_timestamp();

alter table public.santri enable row level security;

drop policy if exists "santri_select_own" on public.santri;
create policy "santri_select_own"
on public.santri
for select
to authenticated
using (auth.uid() = created_by);

drop policy if exists "santri_insert_own" on public.santri;
create policy "santri_insert_own"
on public.santri
for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "santri_update_own" on public.santri;
create policy "santri_update_own"
on public.santri
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "santri_delete_own" on public.santri;
create policy "santri_delete_own"
on public.santri
for delete
to authenticated
using (auth.uid() = created_by);

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

alter table public.santri
add column if not exists kelompok_id uuid references public.kelompok (id) on delete set null;

create index if not exists santri_kelompok_id_idx on public.santri (kelompok_id);

create table if not exists public.absensi (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  santri_id uuid not null references public.santri (id) on delete cascade,
  tanggal date not null default (now()::date),
  status text not null check (status in ('Hadir', 'Izin', 'Sakit', 'Alpa')),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (santri_id, tanggal)
);

create index if not exists absensi_created_by_idx on public.absensi (created_by);
create index if not exists absensi_tanggal_idx on public.absensi (tanggal desc);
create index if not exists absensi_santri_idx on public.absensi (santri_id);

drop trigger if exists tr_absensi_set_updated_at on public.absensi;
create trigger tr_absensi_set_updated_at
before update on public.absensi
for each row
execute function public.set_updated_at_timestamp();

alter table public.absensi enable row level security;

drop policy if exists "absensi_select_own" on public.absensi;
create policy "absensi_select_own"
on public.absensi
for select
to authenticated
using (auth.uid() = created_by);

drop policy if exists "absensi_insert_own" on public.absensi;
create policy "absensi_insert_own"
on public.absensi
for insert
to authenticated
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.santri
    where public.santri.id = santri_id
      and public.santri.created_by = auth.uid()
  )
);

drop policy if exists "absensi_update_own" on public.absensi;
create policy "absensi_update_own"
on public.absensi
for update
to authenticated
using (auth.uid() = created_by)
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.santri
    where public.santri.id = santri_id
      and public.santri.created_by = auth.uid()
  )
);

drop policy if exists "absensi_delete_own" on public.absensi;
create policy "absensi_delete_own"
on public.absensi
for delete
to authenticated
using (auth.uid() = created_by);

create table if not exists public.nilai_ngaji (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  santri_id uuid not null references public.santri (id) on delete cascade,
  tanggal date not null default (now()::date),
  penilaian text not null check (penilaian in ('L', 'KL', 'TL')),
  materi text,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (santri_id, tanggal)
);

create index if not exists nilai_ngaji_created_by_idx on public.nilai_ngaji (created_by);
create index if not exists nilai_ngaji_tanggal_idx on public.nilai_ngaji (tanggal desc);
create index if not exists nilai_ngaji_santri_idx on public.nilai_ngaji (santri_id);

drop trigger if exists tr_nilai_ngaji_set_updated_at on public.nilai_ngaji;
create trigger tr_nilai_ngaji_set_updated_at
before update on public.nilai_ngaji
for each row
execute function public.set_updated_at_timestamp();

alter table public.nilai_ngaji enable row level security;

drop policy if exists "nilai_ngaji_select_own" on public.nilai_ngaji;
create policy "nilai_ngaji_select_own"
on public.nilai_ngaji
for select
to authenticated
using (auth.uid() = created_by);

drop policy if exists "nilai_ngaji_insert_own" on public.nilai_ngaji;
create policy "nilai_ngaji_insert_own"
on public.nilai_ngaji
for insert
to authenticated
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.santri
    where public.santri.id = santri_id
      and public.santri.created_by = auth.uid()
  )
);

drop policy if exists "nilai_ngaji_update_own" on public.nilai_ngaji;
create policy "nilai_ngaji_update_own"
on public.nilai_ngaji
for update
to authenticated
using (auth.uid() = created_by)
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.santri
    where public.santri.id = santri_id
      and public.santri.created_by = auth.uid()
  )
);

drop policy if exists "nilai_ngaji_delete_own" on public.nilai_ngaji;
create policy "nilai_ngaji_delete_own"
on public.nilai_ngaji
for delete
to authenticated
using (auth.uid() = created_by);
