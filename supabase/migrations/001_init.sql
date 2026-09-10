create schema if not exists private;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ruc text default '',
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  plan_url text,
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.lot_status as enum ('disponible', 'vendido');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  manzana text not null,
  numero integer not null,
  area_m2 numeric(10,2) not null,
  price numeric(12,2) not null,
  status public.lot_status not null default 'disponible',
  polygon jsonb,
  unique (project_id, manzana, numero)
);

create index if not exists lots_project_id_idx on public.lots(project_id);
create index if not exists lots_project_status_idx on public.lots(project_id, status);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('admin', 'asesor')),
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  advisor_id uuid not null references public.profiles(id),
  client_name text not null,
  down_payment numeric(12,2) not null default 0,
  items jsonb not null,
  total_list numeric(12,2) not null,
  total_discount numeric(12,2) not null,
  total_final numeric(12,2) not null,
  balance numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_count integer;
begin
  select count(*) into admin_count from public.profiles where role = 'admin';
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when admin_count = 0 then 'admin' else 'asesor' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.companies enable row level security;
alter table public.projects enable row level security;
alter table public.lots enable row level security;
alter table public.profiles enable row level security;
alter table public.quotes enable row level security;

create policy companies_select on public.companies for select to authenticated using (true);
create policy companies_update on public.companies for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy projects_select on public.projects for select to authenticated using (true);
create policy projects_insert on public.projects for insert to authenticated with check (private.is_admin());
create policy projects_update on public.projects for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy lots_select on public.lots for select to authenticated using (true);
create policy lots_insert on public.lots for insert to authenticated with check (private.is_admin());
create policy lots_update on public.lots for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (private.is_admin() or id = auth.uid()) with check (private.is_admin() or id = auth.uid());

create policy quotes_select on public.quotes for select to authenticated using (private.is_admin() or advisor_id = auth.uid());
create policy quotes_insert on public.quotes for insert to authenticated with check (advisor_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

create policy assets_select on storage.objects for select to public using (bucket_id = 'assets');
create policy assets_insert on storage.objects for insert to authenticated with check (bucket_id = 'assets' and private.is_admin());
create policy assets_update on storage.objects for update to authenticated using (bucket_id = 'assets' and private.is_admin()) with check (bucket_id = 'assets' and private.is_admin());
create policy assets_delete on storage.objects for delete to authenticated using (bucket_id = 'assets' and private.is_admin());
