create table if not exists public.apps (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.apps (id, name)
values ('swedencivicsprep', 'Sweden Civics Prep')
on conflict (id) do nothing;

create table if not exists public.user_app_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null references public.apps(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, app_id)
);

alter table public.user_app_memberships enable row level security;

drop policy if exists "Users can read their own app memberships" on public.user_app_memberships;
create policy "Users can read their own app memberships"
on public.user_app_memberships
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create their own app membership" on public.user_app_memberships;
create policy "Users can create their own app membership"
on public.user_app_memberships
for insert
to authenticated
with check (user_id = auth.uid());

create table if not exists public.swedencivicsprep_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  topic_id text,
  chapter_id text,
  is_correct boolean not null,
  selected_index integer,
  answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table public.swedencivicsprep_progress enable row level security;

drop policy if exists "Users can read their own civics progress" on public.swedencivicsprep_progress;
create policy "Users can read their own civics progress"
on public.swedencivicsprep_progress
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their own civics progress" on public.swedencivicsprep_progress;
create policy "Users can insert their own civics progress"
on public.swedencivicsprep_progress
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own civics progress" on public.swedencivicsprep_progress;
create policy "Users can update their own civics progress"
on public.swedencivicsprep_progress
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
