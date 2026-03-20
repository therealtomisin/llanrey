-- Add bitmoji_url to portfolio_config
alter table public.portfolio_config
  add column if not exists bitmoji_url text;
