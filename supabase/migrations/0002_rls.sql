-- ════════════════════════════════════════════════════════════════════════
-- 0002_rls — Row Level Security
-- 핵심 규칙: 모든 접근은 "현재 사용자가 속한 workspace_id" 로만 허용.
-- ════════════════════════════════════════════════════════════════════════

-- 현재 사용자가 속한 workspace_id 집합.
-- security definer → members 테이블의 RLS 를 우회해 재귀를 방지한다.
create or replace function public.current_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from public.members where user_id = auth.uid();
$$;

-- 소유(owner) 여부 — 일부 관리 정책에 사용.
create or replace function public.is_workspace_owner(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where workspace_id = ws and user_id = auth.uid() and role = 'owner'
  );
$$;

-- RLS 활성화
alter table public.workspaces      enable row level security;
alter table public.members         enable row level security;
alter table public.clients         enable row level security;
alter table public.sites           enable row level security;
alter table public.estimates       enable row level security;
alter table public.estimate_items  enable row level security;

-- ── workspaces ───────────────────────────────────────────────────────────
create policy "workspace 멤버는 자기 업체 조회"
  on public.workspaces for select
  using (id in (select public.current_workspace_ids()));

create policy "owner 는 자기 업체 수정"
  on public.workspaces for update
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

create policy "owner 는 자기 업체 삭제"
  on public.workspaces for delete
  using (public.is_workspace_owner(id));

-- ── members ──────────────────────────────────────────────────────────────
create policy "같은 업체 멤버 조회"
  on public.members for select
  using (workspace_id in (select public.current_workspace_ids()));

create policy "owner 는 멤버 추가"
  on public.members for insert
  with check (public.is_workspace_owner(workspace_id));

create policy "owner 는 멤버 수정"
  on public.members for update
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

create policy "owner 는 멤버 삭제"
  on public.members for delete
  using (public.is_workspace_owner(workspace_id));

-- ── 업무 테이블 공통 정책 (멤버이면 CRUD 허용) ───────────────────────────
-- clients
create policy "멤버는 거래처 CRUD"
  on public.clients for all
  using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

-- sites
create policy "멤버는 현장 CRUD"
  on public.sites for all
  using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

-- estimates
create policy "멤버는 견적 CRUD"
  on public.estimates for all
  using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

-- estimate_items
create policy "멤버는 견적항목 CRUD"
  on public.estimate_items for all
  using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));
