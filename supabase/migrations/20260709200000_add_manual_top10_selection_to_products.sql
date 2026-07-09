alter table public.products
  add column if not exists is_top10 boolean not null default false,
  add column if not exists top10_position integer;

alter table public.products
  add constraint products_top10_position_range
  check (top10_position is null or top10_position between 1 and 10);

create unique index if not exists products_top10_position_unique
  on public.products (top10_position)
  where is_top10 = true and top10_position is not null;

create index if not exists products_is_top10_idx
  on public.products (is_top10, top10_position);
