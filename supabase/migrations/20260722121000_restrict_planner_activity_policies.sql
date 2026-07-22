drop policy if exists authenticated_select_planner_activities on public.planner_activities;
drop policy if exists authenticated_insert_planner_activities on public.planner_activities;
drop policy if exists authenticated_update_planner_activities on public.planner_activities;
drop policy if exists authenticated_delete_planner_activities on public.planner_activities;

create policy authenticated_select_planner_activities
  on public.planner_activities
  for select
  to authenticated
  using ((select auth.uid()) is not null);

create policy authenticated_insert_planner_activities
  on public.planner_activities
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

create policy authenticated_update_planner_activities
  on public.planner_activities
  for update
  to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

create policy authenticated_delete_planner_activities
  on public.planner_activities
  for delete
  to authenticated
  using ((select auth.uid()) is not null);
