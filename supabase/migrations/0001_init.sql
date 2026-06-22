-- ════════════════════════════════════════════════════════════════════════
-- 0001_init — 전체 스키마
-- 인테리어 견적·현장관리 SaaS. 멀티테넌시 핵심:
--   workspace(업체) → member(직원) → 거래처/현장/견적/계약/수금 …
-- 모든 업무 테이블은 workspace_id 를 가지며 RLS(0002)로 격리된다.
-- 모든 테이블: id uuid, (workspace_id), created_at, updated_at
--   (append-only 성격의 audit_logs/billing_events 는 created_at 만)
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_plan') then
    create type public.workspace_plan as enum ('free', 'pro');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('owner', 'staff');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_status') then
    create type public.member_status as enum ('invited', 'active', 'disabled');
  end if;
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum ('estimating', 'contracted', 'in_progress', 'done');
  end if;
  if not exists (select 1 from pg_type where typname = 'estimate_status') then
    create type public.estimate_status as enum ('draft', 'sent', 'accepted', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'statement_type') then
    create type public.statement_type as enum ('purchase_order', 'trade_statement');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'paid');
  end if;
end$$;

-- ── 공통 updated_at 트리거 ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════
-- workspaces (업체) — 테넌트 루트
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.workspaces (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(name) between 1 and 60),
  plan                public.workspace_plan not null default 'free',
  trial_ends_at       timestamptz not null default (now() + interval '14 days'),
  billing_customer_id text,
  owner_id            uuid not null references auth.users (id) on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════
-- members (직원)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text,
  role         public.member_role not null default 'staff',
  status       public.member_status not null default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index if not exists members_user_id_idx on public.members (user_id);
create index if not exists members_workspace_id_idx on public.members (workspace_id);

-- ════════════════════════════════════════════════════════════════════════
-- clients (거래처)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name         text not null,
  phone        text,
  address      text,
  memo         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists clients_workspace_id_idx on public.clients (workspace_id);

-- ════════════════════════════════════════════════════════════════════════
-- projects (현장)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id    uuid references public.clients (id) on delete set null,
  name         text not null,
  site_address text,
  status       public.project_status not null default 'estimating',
  memo         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists projects_workspace_id_idx on public.projects (workspace_id);
create index if not exists projects_client_id_idx on public.projects (client_id);

-- ════════════════════════════════════════════════════════════════════════
-- catalog_items (품목·공정단가) — '나만의 단가표'
-- 한 번 세팅하면 견적 작성 시 재사용한다.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.catalog_items (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid not null references public.workspaces (id) on delete cascade,
  category           text,                                  -- 공정 (예: 철거, 도장, 전기)
  name               text not null,                         -- 품목명
  unit               text,                                  -- 단위 (평, 개, m 등)
  default_unit_price numeric(14, 2) not null default 0,     -- 기본 견적단가
  default_cost       numeric(14, 2) not null default 0,     -- 기본 실행단가(원가)
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists catalog_items_workspace_id_idx on public.catalog_items (workspace_id);

-- ════════════════════════════════════════════════════════════════════════
-- estimates (견적) — 견적가/실행가 분리로 마진 관리
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.estimates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  version      integer not null default 1,
  status       public.estimate_status not null default 'draft',
  total_price  numeric(14, 2) not null default 0,           -- 견적가 합계
  total_cost   numeric(14, 2) not null default 0,           -- 실행가 합계
  memo         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists estimates_workspace_id_idx on public.estimates (workspace_id);
create index if not exists estimates_project_id_idx on public.estimates (project_id);

-- ════════════════════════════════════════════════════════════════════════
-- estimate_lines (견적 라인) — 라인별 견적가/실행가 분리
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.estimate_lines (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  estimate_id  uuid not null references public.estimates (id) on delete cascade,
  category     text,
  name         text not null,
  unit         text,
  qty          numeric(12, 2) not null default 1,
  unit_price   numeric(14, 2) not null default 0,           -- 견적단가
  cost         numeric(14, 2) not null default 0,           -- 실행단가(원가)
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists estimate_lines_estimate_id_idx on public.estimate_lines (estimate_id);
create index if not exists estimate_lines_workspace_id_idx on public.estimate_lines (workspace_id);

-- ════════════════════════════════════════════════════════════════════════
-- contracts (계약)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.contracts (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  estimate_id  uuid references public.estimates (id) on delete set null,
  amount       numeric(14, 2) not null default 0,
  signed_on    date,
  terms        text,
  memo         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists contracts_workspace_id_idx on public.contracts (workspace_id);
create index if not exists contracts_project_id_idx on public.contracts (project_id);

-- ════════════════════════════════════════════════════════════════════════
-- statements (거래명세/발주)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.statements (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  type         public.statement_type not null,
  vendor       text,
  amount       numeric(14, 2) not null default 0,
  issued_on    date,
  memo         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists statements_workspace_id_idx on public.statements (workspace_id);
create index if not exists statements_project_id_idx on public.statements (project_id);

-- ════════════════════════════════════════════════════════════════════════
-- payments (수금/기성) — 받을 돈(미수금) 추적
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  label        text not null,                               -- 예: 계약금/중도금/잔금
  amount       numeric(14, 2) not null default 0,
  due_on       date,
  paid_on      date,                                        -- nullable: 미수금 추적
  status       public.payment_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists payments_workspace_id_idx on public.payments (workspace_id);
create index if not exists payments_project_id_idx on public.payments (project_id);

-- ════════════════════════════════════════════════════════════════════════
-- documents (업로드 자료: 카톡 캡처·사진 등)
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  kind         text,                                        -- 예: kakao_capture, photo, drawing
  file_path    text not null,                               -- Supabase Storage 경로
  ai_extracted boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists documents_workspace_id_idx on public.documents (workspace_id);
create index if not exists documents_project_id_idx on public.documents (project_id);

-- ════════════════════════════════════════════════════════════════════════
-- ai_usage (AI 사용량 집계) — 마진 보호. owner 만 읽기, insert 는 서비스 역할.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  month         date not null,                              -- 해당 월의 1일
  input_tokens  bigint not null default 0,
  output_tokens bigint not null default 0,
  doc_count     integer not null default 0,
  est_cost_krw  numeric(14, 2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, month)
);
create index if not exists ai_usage_workspace_id_idx on public.ai_usage (workspace_id);

-- ════════════════════════════════════════════════════════════════════════
-- audit_logs (감사 로그) — append-only. owner 만 읽기, insert 는 서비스 역할/트리거.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  actor_member_id uuid references public.members (id) on delete set null,
  action          text not null,
  target_table    text,
  target_id       uuid,
  meta            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists audit_logs_workspace_id_idx on public.audit_logs (workspace_id);

-- ════════════════════════════════════════════════════════════════════════
-- billing_events (결제 웹훅 원본) — append-only. owner 만 읽기, insert 는 서비스 역할.
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.billing_events (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type         text not null,
  raw          jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists billing_events_workspace_id_idx on public.billing_events (workspace_id);

-- ── updated_at 트리거 연결 (updated_at 있는 테이블) ───────────────────────
do $$
declare
  t text;
begin
  foreach t in array array[
    'workspaces','members','clients','projects','catalog_items',
    'estimates','estimate_lines','contracts','statements','payments',
    'documents','ai_usage'
  ]
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- ════════════════════════════════════════════════════════════════════════
-- 회원가입 시 workspace 자동 생성 + owner member 등록
-- 업체명/이름은 user metadata(workspace_name, name)에서 읽는다.
-- security definer 로 RLS 를 우회한다.
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

  insert into public.members (workspace_id, user_id, name, role, status)
  values (
    ws_id,
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    'owner',
    'active'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
