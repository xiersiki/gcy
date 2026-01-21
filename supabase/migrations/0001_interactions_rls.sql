create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  github_username text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_public'
  ) then
    create policy profiles_select_public on public.profiles for select using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_upsert_own'
  ) then
    create policy profiles_upsert_own on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    create policy profiles_update_own on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

create table if not exists public.work_stats (
  work_id text primary key,
  like_count int not null default 0,
  bookmark_count int not null default 0,
  comment_count int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.work_stats enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_stats'
      and policyname = 'work_stats_select_public'
  ) then
    create policy work_stats_select_public on public.work_stats for select using (true);
  end if;
end $$;

create table if not exists public.work_likes (
  work_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (work_id, user_id)
);

alter table public.work_likes enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_likes'
      and policyname = 'work_likes_select_own'
  ) then
    create policy work_likes_select_own on public.work_likes
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_likes'
      and policyname = 'work_likes_insert_own'
  ) then
    create policy work_likes_insert_own on public.work_likes
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_likes'
      and policyname = 'work_likes_delete_own'
  ) then
    create policy work_likes_delete_own on public.work_likes
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists work_likes_user_id_idx on public.work_likes (user_id);
create index if not exists work_likes_work_id_idx on public.work_likes (work_id);

create table if not exists public.work_bookmarks (
  work_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (work_id, user_id)
);

alter table public.work_bookmarks enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_bookmarks'
      and policyname = 'work_bookmarks_select_own'
  ) then
    create policy work_bookmarks_select_own on public.work_bookmarks
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_bookmarks'
      and policyname = 'work_bookmarks_insert_own'
  ) then
    create policy work_bookmarks_insert_own on public.work_bookmarks
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_bookmarks'
      and policyname = 'work_bookmarks_delete_own'
  ) then
    create policy work_bookmarks_delete_own on public.work_bookmarks
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists work_bookmarks_user_id_idx on public.work_bookmarks (user_id);
create index if not exists work_bookmarks_work_id_idx on public.work_bookmarks (work_id);

create table if not exists public.work_comments (
  id uuid primary key default gen_random_uuid(),
  work_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_comments_work_id_created_at_idx on public.work_comments (work_id, created_at desc);
create index if not exists work_comments_user_id_idx on public.work_comments (user_id);

alter table public.work_comments enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_comments'
      and policyname = 'work_comments_select_public'
  ) then
    create policy work_comments_select_public on public.work_comments
      for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_comments'
      and policyname = 'work_comments_insert_own'
  ) then
    create policy work_comments_insert_own on public.work_comments
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_comments'
      and policyname = 'work_comments_update_own'
  ) then
    create policy work_comments_update_own on public.work_comments
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'work_comments'
      and policyname = 'work_comments_delete_own'
  ) then
    create policy work_comments_delete_own on public.work_comments
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists work_comments_touch_updated_at on public.work_comments;
create trigger work_comments_touch_updated_at
before update on public.work_comments
for each row
execute function public.touch_updated_at();

create or replace function public.work_stats_apply_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.work_stats (work_id, like_count, bookmark_count, comment_count, updated_at)
    values (new.work_id, 1, 0, 0, now())
    on conflict (work_id)
    do update set
      like_count = public.work_stats.like_count + 1,
      updated_at = now();
    return new;
  end if;

  update public.work_stats
  set
    like_count = greatest(like_count - 1, 0),
    updated_at = now()
  where work_id = old.work_id;
  return old;
end;
$$;

drop trigger if exists work_likes_apply_stats on public.work_likes;
create trigger work_likes_apply_stats
after insert or delete on public.work_likes
for each row
execute function public.work_stats_apply_like();

create or replace function public.work_stats_apply_bookmark()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.work_stats (work_id, like_count, bookmark_count, comment_count, updated_at)
    values (new.work_id, 0, 1, 0, now())
    on conflict (work_id)
    do update set
      bookmark_count = public.work_stats.bookmark_count + 1,
      updated_at = now();
    return new;
  end if;

  update public.work_stats
  set
    bookmark_count = greatest(bookmark_count - 1, 0),
    updated_at = now()
  where work_id = old.work_id;
  return old;
end;
$$;

drop trigger if exists work_bookmarks_apply_stats on public.work_bookmarks;
create trigger work_bookmarks_apply_stats
after insert or delete on public.work_bookmarks
for each row
execute function public.work_stats_apply_bookmark();

create or replace function public.work_stats_apply_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.work_stats (work_id, like_count, bookmark_count, comment_count, updated_at)
    values (new.work_id, 0, 0, 1, now())
    on conflict (work_id)
    do update set
      comment_count = public.work_stats.comment_count + 1,
      updated_at = now();
    return new;
  end if;

  update public.work_stats
  set
    comment_count = greatest(comment_count - 1, 0),
    updated_at = now()
  where work_id = old.work_id;
  return old;
end;
$$;

drop trigger if exists work_comments_apply_stats on public.work_comments;
create trigger work_comments_apply_stats
after insert or delete on public.work_comments
for each row
execute function public.work_stats_apply_comment();

