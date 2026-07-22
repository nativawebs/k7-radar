create table if not exists public.planner_activities (
  id text primary key,
  title text not null,
  description text,
  activity_type text not null default 'tarea',
  status text not null default 'pendiente',
  scheduled_date date not null,
  scheduled_time time,
  product_id text references public.products(id) on delete set null,
  campaign_id text references public.campaigns(id) on delete set null,
  action_label text,
  owner text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint planner_activities_type_check check (activity_type in ('campana', 'anuncio', 'monitoreo', 'top10', 'tarea')),
  constraint planner_activities_status_check check (status in ('pendiente', 'en_progreso', 'completada', 'cancelada'))
);

alter table public.planner_activities enable row level security;

create policy authenticated_select_planner_activities
  on public.planner_activities
  for select
  to authenticated
  using (true);

create policy authenticated_insert_planner_activities
  on public.planner_activities
  for insert
  to authenticated
  with check (true);

create policy authenticated_update_planner_activities
  on public.planner_activities
  for update
  to authenticated
  using (true)
  with check (true);

create policy authenticated_delete_planner_activities
  on public.planner_activities
  for delete
  to authenticated
  using (true);

grant select, insert, update, delete on table public.planner_activities to authenticated;
grant select on table public.planner_activities to anon;

create index if not exists planner_activities_scheduled_date_idx
  on public.planner_activities (scheduled_date, scheduled_time);

create index if not exists planner_activities_product_id_idx
  on public.planner_activities (product_id);

create index if not exists planner_activities_campaign_id_idx
  on public.planner_activities (campaign_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'planner_activities'
  ) then
    alter publication supabase_realtime add table public.planner_activities;
  end if;
end $$;
