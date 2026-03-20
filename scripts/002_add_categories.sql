-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add category_id to videos table
alter table public.videos
  add column if not exists category_id uuid references public.categories(id) on delete set null;

-- Enable RLS on categories
alter table public.categories enable row level security;

-- Categories are publicly readable, only authenticated users can manage them
create policy "cat_select" on public.categories for select using (true);
create policy "cat_insert" on public.categories for insert with check (auth.uid() is not null);
create policy "cat_update" on public.categories for update using (auth.uid() is not null);
create policy "cat_delete" on public.categories for delete using (auth.uid() is not null);

-- Seed default categories for a video editing portfolio
insert into public.categories (name, slug, display_order) values
  ('Commercial', 'commercial', 1),
  ('Music Video', 'music-video', 2),
  ('Short Film', 'short-film', 3),
  ('Documentary', 'documentary', 4),
  ('Social Media', 'social-media', 5),
  ('Event', 'event', 6),
  ('Other', 'other', 99)
on conflict (slug) do nothing;
