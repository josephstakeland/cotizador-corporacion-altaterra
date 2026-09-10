-- Public catalog: anyone can view company, projects and lots.
-- Writes remain admin-only via existing authenticated policies.

create policy companies_select_anon
  on public.companies
  for select
  to anon
  using (true);

create policy projects_select_anon
  on public.projects
  for select
  to anon
  using (true);

create policy lots_select_anon
  on public.lots
  for select
  to anon
  using (true);
