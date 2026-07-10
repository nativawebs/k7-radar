alter table public.campaign_sales
  add column if not exists woo_line_item_id text;

create unique index if not exists campaign_sales_woo_line_unique
  on public.campaign_sales (woo_order_id, woo_line_item_id)
  where woo_line_item_id is not null;
