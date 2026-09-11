alter table public.companies
  add column if not exists phone text not null default '';

alter table public.quotes
  add column if not exists advisor_name text not null default '';

alter table public.quotes
  add column if not exists client_phone text not null default '';

alter table public.quotes
  add column if not exists client_dni text not null default '';
