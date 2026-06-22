-- ════════════════════════════════════════════════════════════════════════
-- 0004_catalog — '나만의 단가표' (catalog) 지원
--   · catalog_items: 즐겨찾기 + soft delete + 감사 트리거
--   · catalog_categories: 공정 카테고리 (가입 시 기본값 시드)
--   · handle_new_user 확장: 기본 공정 카테고리만 깔아준다(단가는 본인이 채움)
-- ════════════════════════════════════════════════════════════════════════

-- ── catalog_items 확장 ───────────────────────────────────────────────────
alter table public.catalog_items add column if not exists is_favorite boolean not null default false;
alter table public.catalog_items add column if not exists deleted_at timestamptz;

create index if not exists catalog_items_active_idx
  on public.catalog_items (workspace_id) where deleted_at is null;
create index if not exists catalog_items_favorite_idx
  on public.catalog_items (workspace_id) where is_favorite and deleted_at is null;

-- 변경 감사 (audit_changes 재사용: name/deleted_at 기반)
drop trigger if exists trg_catalog_items_audit on public.catalog_items;
create trigger trg_catalog_items_audit
  after insert or update or delete on public.catalog_items
  for each row execute function public.audit_changes();

-- ── catalog_categories (공정 카테고리) ───────────────────────────────────
create table if not exists public.catalog_categories (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 40),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, name)
);
create index if not exists catalog_categories_workspace_id_idx
  on public.catalog_categories (workspace_id);

drop trigger if exists trg_catalog_categories_updated_at on public.catalog_categories;
create trigger trg_catalog_categories_updated_at
  before update on public.catalog_categories
  for each row execute function public.set_updated_at();

-- ── RLS: 멤버 읽기 / owner 쓰기 (catalog_items 와 동일 정책) ──────────────
alter table public.catalog_categories enable row level security;

create policy "catalog_cat_select_member" on public.catalog_categories
  for select using (workspace_id in (select public.current_workspace_ids()));
create policy "catalog_cat_insert_owner" on public.catalog_categories
  for insert with check (public.is_workspace_owner(workspace_id));
create policy "catalog_cat_update_owner" on public.catalog_categories
  for update using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));
create policy "catalog_cat_delete_owner" on public.catalog_categories
  for delete using (public.is_workspace_owner(workspace_id));

grant select, insert, update, delete on public.catalog_categories to authenticated;
grant all on public.catalog_categories to service_role;

-- ── 기본 공정 카테고리 시드 함수 ─────────────────────────────────────────
create or replace function public.seed_default_categories(ws uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.catalog_categories (workspace_id, name, sort_order)
  select ws, c.name, c.ord
  from (values
    ('철거', 1), ('설비', 2), ('전기', 3), ('목공', 4), ('도장', 5),
    ('도배', 6), ('바닥', 7), ('타일', 8), ('필름', 9), ('창호', 10),
    ('주방', 11), ('기타', 99)
  ) as c(name, ord)
  on conflict (workspace_id, name) do nothing;
$$;

-- ── handle_new_user 확장: 가입 시 기본 카테고리 시드 ─────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_name text;
  ws_id   uuid;
begin
  ws_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    split_part(new.email, '@', 1) || '의 업체'
  );

  insert into public.workspaces (name, owner_id)
  values (ws_name, new.id)
  returning id into ws_id;

  insert into public.members (workspace_id, user_id, name, role, status)
  values (
    ws_id,
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    'owner',
    'active'
  );

  -- 기본 공정 카테고리만 깔아준다 (단가는 본인이 채움)
  perform public.seed_default_categories(ws_id);

  return new;
end;
$$;

-- ── 기존 workspace 들에도 기본 카테고리 backfill ─────────────────────────
do $$
declare
  w record;
begin
  for w in select id from public.workspaces loop
    perform public.seed_default_categories(w.id);
  end loop;
end$$;
