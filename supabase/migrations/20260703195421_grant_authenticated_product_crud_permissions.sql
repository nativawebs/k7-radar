grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.products,
  public.product_financials,
  public.campaigns,
  public.campaign_sales,
  public.campaign_metrics,
  public.decision_logs,
  public.sync_logs,
  public.unmatched_woocommerce_products
  to authenticated;

grant select on table
  public.products,
  public.campaigns,
  public.campaign_sales,
  public.campaign_metrics,
  public.decision_logs,
  public.sync_logs,
  public.unmatched_woocommerce_products
  to anon;
