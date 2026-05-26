-- =============================================================
-- Tabel payments: menyimpan data transaksi pembayaran Pakasir
-- =============================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null unique,
  plan text not null check (plan in ('monthly', 'yearly')),
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  payment_method text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status);

-- Row Level Security
alter table public.payments enable row level security;

-- User hanya bisa lihat payment milik sendiri
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
on public.payments
for select
to authenticated
using (auth.uid() = user_id);

-- User hanya bisa insert payment milik sendiri
drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own"
on public.payments
for insert
to authenticated
with check (auth.uid() = user_id);

-- User hanya bisa update payment milik sendiri
drop policy if exists "payments_update_own" on public.payments;
create policy "payments_update_own"
on public.payments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
