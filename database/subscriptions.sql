-- =============================================================
-- Tabel subscriptions: menyimpan data langganan pengguna
-- =============================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'inactive', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

drop trigger if exists tr_subscriptions_set_updated_at on public.subscriptions;
create trigger tr_subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at_timestamp();

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
create policy "Users can view their own subscriptions"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own subscriptions" on public.subscriptions;
create policy "Users can insert their own subscriptions"
on public.subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own subscriptions" on public.subscriptions;
create policy "Users can update their own subscriptions"
on public.subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =============================================================
-- Fungsi RPC: check_pakasir_payment
-- Proxy server-side untuk cek status pembayaran ke Pakasir API
-- menggunakan extension http (harus diaktifkan di Supabase Dashboard:
--   Database > Extensions > cari "http" > Enable)
-- =============================================================

create extension if not exists http with schema extensions;

create or replace function public.check_pakasir_payment(
  p_project text,
  p_amount integer,
  p_order_id text,
  p_api_key text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  response extensions.http_response;
  url text;
  result jsonb;
begin
  url := format(
    'https://app.pakasir.com/api/transactiondetail?project=%s&amount=%s&order_id=%s&api_key=%s',
    p_project, p_amount, p_order_id, p_api_key
  );

  select * into response from extensions.http_get(url);

  if response.status != 200 then
    return jsonb_build_object(
      'error', true,
      'message', format('HTTP %s dari Pakasir API', response.status)
    );
  end if;

  result := response.content::jsonb;
  return result;
end;
$$;
