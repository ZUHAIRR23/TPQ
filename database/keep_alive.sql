-- Keep Supabase free-tier project active by creating lightweight DB activity.
-- Jalankan file ini sekali di Supabase SQL Editor.

create or replace function public.keep_alive()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  select now();
$$;

grant execute on function public.keep_alive() to anon, authenticated;
