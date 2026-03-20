-- Create portfolio configuration table
create table if not exists public.portfolio_config (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logo_url text,
  profile_picture_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id)
);

-- Create videos table
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.portfolio_config enable row level security;
alter table public.videos enable row level security;

-- Portfolio config RLS policies
create policy "pc_select" on public.portfolio_config for select using (true);
create policy "pc_insert" on public.portfolio_config for insert with check (auth.uid() = user_id);
create policy "pc_update" on public.portfolio_config for update using (auth.uid() = user_id);
create policy "pc_delete" on public.portfolio_config for delete using (auth.uid() = user_id);

-- Videos RLS policies
create policy "v_select" on public.videos for select using (true);
create policy "v_insert" on public.videos for insert with check (auth.uid() = user_id);
create policy "v_update" on public.videos for update using (auth.uid() = user_id);
create policy "v_delete" on public.videos for delete using (auth.uid() = user_id);
