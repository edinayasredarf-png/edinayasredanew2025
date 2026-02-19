-- Таблица сторис для Stories
-- Выполните в Supabase SQL Editor: https://supabase.com/dashboard → Settings → SQL Editor → New query

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  thumbnail text not null default '',
  slides jsonb not null default '[]',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  view_count integer not null default 0
);

-- Индексы для сортировки и поиска
create index if not exists idx_stories_updated_at on stories (updated_at desc);

-- Политика: анонимное чтение (для отображения в ленте)
alter table stories enable row level security;

create policy "Stories are viewable by everyone"
  on stories for select
  using (true);

-- Политика: вставка/обновление/удаление — только для authenticated (или можно anon для редактирования через пароль)
-- Для редактирования через пароль блога оставляем anon — проверка в приложении
create policy "Stories are insertable by anon"
  on stories for insert
  with check (true);

create policy "Stories are updatable by anon"
  on stories for update
  using (true);

create policy "Stories are deletable by anon"
  on stories for delete
  using (true);
