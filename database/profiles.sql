-- =============================================================
-- Tabel profiles: menyimpan data profil lembaga TPQ
-- =============================================================

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  institution_name text,
  address text,
  phone text,
  description text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles (user_id);

drop trigger if exists tr_profiles_set_updated_at on public.profiles;
create trigger tr_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at_timestamp();

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =============================================================
-- Supabase Storage: buat bucket "logos" via Dashboard
--
-- 1. Buka Supabase Dashboard > Storage
-- 2. Klik "New Bucket", nama: logos, Public: ON
-- 3. Tambah policy berikut di bucket logos:
--
--    SELECT (download): allow authenticated, TRUE
--    INSERT (upload):   allow authenticated, bucket_id = 'logos'
--                       AND (storage.foldername(name))[1] = auth.uid()::text
--    UPDATE:            allow authenticated, bucket_id = 'logos'
--                       AND (storage.foldername(name))[1] = auth.uid()::text
--    DELETE:            allow authenticated, bucket_id = 'logos'
--                       AND (storage.foldername(name))[1] = auth.uid()::text
-- =============================================================
