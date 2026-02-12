-- PagePerfect Database Schema
-- Run this in Supabase SQL Editor or via CLI: supabase db push

-- ============================================================
-- Custom types
-- ============================================================
create type public.tier as enum ('drafter', 'publisher', 'studio');

-- ============================================================
-- Profiles (synced from auth.users via trigger)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text,
  tier        public.tier not null default 'drafter',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS: users can only read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Manuscripts (user-saved documents)
-- ============================================================
create table public.manuscripts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null default 'Untitled',
  content       text not null default '',
  template      text not null default 'symphony',
  page_size     text not null default 'sixByNine',
  margin_preset text not null default 'normal',
  safe_mode     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_manuscripts_user on public.manuscripts(user_id);

alter table public.manuscripts enable row level security;

create policy "Users can view own manuscripts"
  on public.manuscripts for select
  using (auth.uid() = user_id);

create policy "Users can insert own manuscripts"
  on public.manuscripts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own manuscripts"
  on public.manuscripts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own manuscripts"
  on public.manuscripts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Compile history (analytics + debugging)
-- ============================================================
create table public.compile_history (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete set null,
  template       text not null,
  page_size      text not null,
  margin_preset  text not null,
  compile_mode   text not null,
  safe_mode      boolean not null default false,
  status         text not null check (status in ('success', 'error', 'timeout')),
  compile_time_ms integer not null default 0,
  error_message  text,
  created_at     timestamptz not null default now()
);

create index idx_compile_history_user on public.compile_history(user_id);
create index idx_compile_history_created on public.compile_history(created_at desc);

alter table public.compile_history enable row level security;

-- Users can view their own compile history
create policy "Users can view own compile history"
  on public.compile_history for select
  using (auth.uid() = user_id);

-- Backend service role can insert for any user (or anonymous)
create policy "Service can insert compile history"
  on public.compile_history for insert
  with check (true);

-- ============================================================
-- Updated_at trigger
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger manuscripts_updated_at
  before update on public.manuscripts
  for each row execute function public.update_updated_at();
