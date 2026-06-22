-- ════════════════════════════════════════════════════════════════════════
-- 0001_init — 멀티테넌시 골격 스키마
-- workspace(업체) → member(직원) → 거래처/현장/견적
-- 모든 업무 테이블은 workspace_id 를 가지며 RLS(0002)로 격리된다.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── 역할 enum ────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('owner', 'staff');
  end if;
end$$;

-- ── workspaces (업체) ────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 60),
  owner_id   uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ── members (직원) ───────────────────────────────────────────────────────
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         public.member_role not null default 'staff',
  display_name text,
  created_at   timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index if not exists members_user_id_idx on public.members (user_id);
create index if not exists members_workspace_id_idx on public.members (workspace_id);

-- ── clients (거래처) ─────────────────────────────────────────────────────
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null,
  phone        text,
  memo         text,
  created_at   timestamptz not null default now()
);
create index if not exists clients_workspace_id_idx on public.clients (workspace_id);

-- ── sites (현장) ─────────────────────────────────────────────────────────
create table if not exists public.sites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id    uuid references public.clients (id) on delete set null,
  name         text not null,
  address      text,
  status       text not null default 'planned',
  created_at   timestamptz not null default now()
);
create index if not exists sites_workspace_id_idx on public.sites (workspace_id);

-- ── estimates (견적) — 견적가/실행가 분리로 마진 관리 ─────────────────────
create table if not exists public.estimates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  site_id      uuid references public.sites (id) on delete set null,
  title        text not null,
  status       text not null default 'draft',
  quote_total  numeric(14, 2) not null default 0, -- 견적가(고객 제시가) 합계
  cost_total   numeric(14, 2) not null default 0, -- 실행가(실제 원가) 합계
  created_at   timestamptz not null default now()
);
create index if not exists estimates_workspace_id_idx on public.estimates (workspace_id);

-- ── estimate_items (견적 항목) ───────────────────────────────────────────
create table if not exists public.estimate_items (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  estimate_id      uuid not null references public.estimates (id) on delete cascade,
  name             text not null,
  unit             text,
  qty              numeric(12, 2) not null default 1,
  quote_unit_price numeric(14, 2) not null default 0, -- 견적 단가
  cost_unit_price  numeric(14, 2) not null default 0, -- 실행 단가(원가)
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists estimate_items_estimate_id_idx on public.estimate_items (estimate_id);
create index if not exists estimate_items_workspace_id_idx on public.estimate_items (workspace_id);

-- ════════════════════════════════════════════════════════════════════════
-- 회원가입 시 workspace 자동 생성 + owner 등록
-- 업체명은 user metadata(workspace_name)에서 읽는다.
-- security definer 로 실행되어 RLS 를 우회한다.
-- ════════════════════════════════════════════════════════════════════════
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

  insert into public.members (workspace_id, user_id, role, display_name)
  values (ws_id, new.id, 'owner', null);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
