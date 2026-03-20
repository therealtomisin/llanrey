-- Add name and roles to portfolio_config
alter table public.portfolio_config
  add column if not exists name text,
  add column if not exists roles text[] default '{}';
