-- ════════════════════════════════════════════════════════════════════════
-- 0002_rls — Row Level Security
-- 핵심 규칙: 모든 접근은 "현재 사용자가 속한 workspace_id" 로만 허용.
-- 역할 정책:
--   · 업무 테이블: 멤버는 읽기 전체 + 쓰기. (clients/projects/estimates/
--     estimate_lines/statements/documents)
--   · 금전·설정 테이블: 멤버 읽기 / owner 만 쓰기.
--     (workspaces/members/catalog_items/contracts/payments)
--   · 민감 테이블: owner 만 읽기, insert 는 서비스 역할(정책 없음 → service_role 만).
--     (ai_usage/billing_events/audit_logs)
-- ════════════════════════════════════════════════════════════════════════

-- ── 헬퍼 함수 (security definer → members RLS 재귀 방지) ──────────────────
create or replace function public.current_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.members
  where user_id = auth.uid()
    and status <> 'disabled';
$$;

create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where workspace_id = ws and user_id = auth.uid() and status <> 'disabled'
  );
$$;

create or replace function public.is_workspace_owner(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where workspace_id = ws and user_id = auth.uid()
      and role = 'owner' and status <> 'disabled'
  );
$$;

-- ── RLS 활성화 ───────────────────────────────────────────────────────────
alter table public.workspaces      enable row level security;
alter table public.members         enable row level security;
alter table public.clients         enable row level security;
alter table public.projects        enable row level security;
alter table public.catalog_items   enable row level security;
alter table public.estimates       enable row level security;
alter table public.estimate_lines  enable row level security;
alter table public.contracts       enable row level security;
alter table public.statements      enable row level security;
alter table public.payments        enable row level security;
alter table public.documents       enable row level security;
alter table public.ai_usage        enable row level security;
alter table public.audit_logs      enable row level security;
alter table public.billing_events  enable row level security;

-- ════════════════════════════════════════════════════════════════════════
-- workspaces — 멤버 읽기 / owner 수정·삭제 (생성은 가입 트리거가 처리)
-- ════════════════════════════════════════════════════════════════════════
create policy "ws_select_member" on public.workspaces
  for select using (id in (select public.current_workspace_ids()));
create policy "ws_update_owner" on public.workspaces
  for update using (public.is_workspace_owner(id)) with check (public.is_workspace_owner(id));
create policy "ws_delete_owner" on public.workspaces
  for delete using (public.is_workspace_owner(id));

-- ════════════════════════════════════════════════════════════════════════
-- members — 멤버 읽기 / owner 관리
-- ════════════════════════════════════════════════════════════════════════
create policy "members_select_member" on public.members
  for select using (workspace_id in (select public.current_workspace_ids()));
create policy "members_insert_owner" on public.members
  for insert with check (public.is_workspace_owner(workspace_id));
create policy "members_update_owner" on public.members
  for update using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));
create policy "members_delete_owner" on public.members
  for delete using (public.is_workspace_owner(workspace_id));

-- ════════════════════════════════════════════════════════════════════════
-- 업무 테이블 — 멤버 읽기/쓰기 전체
--   clients, projects, estimates, estimate_lines, statements, documents
-- ════════════════════════════════════════════════════════════════════════
create policy "clients_all_member" on public.clients
  for all using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

create policy "projects_all_member" on public.projects
  for all using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

create policy "estimates_all_member" on public.estimates
  for all using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

create policy "estimate_lines_all_member" on public.estimate_lines
  for all using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

create policy "statements_all_member" on public.statements
  for all using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

create policy "documents_all_member" on public.documents
  for all using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

-- ════════════════════════════════════════════════════════════════════════
-- 금전·설정 테이블 — 멤버 읽기 / owner 만 쓰기
--   catalog_items, contracts, payments
-- ════════════════════════════════════════════════════════════════════════
-- catalog_items
create policy "catalog_select_member" on public.catalog_items
  for select using (workspace_id in (select public.current_workspace_ids()));
create policy "catalog_insert_owner" on public.catalog_items
  for insert with check (public.is_workspace_owner(workspace_id));
create policy "catalog_update_owner" on public.catalog_items
  for update using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));
create policy "catalog_delete_owner" on public.catalog_items
  for delete using (public.is_workspace_owner(workspace_id));

-- contracts
create policy "contracts_select_member" on public.contracts
  for select using (workspace_id in (select public.current_workspace_ids()));
create policy "contracts_insert_owner" on public.contracts
  for insert with check (public.is_workspace_owner(workspace_id));
create policy "contracts_update_owner" on public.contracts
  for update using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));
create policy "contracts_delete_owner" on public.contracts
  for delete using (public.is_workspace_owner(workspace_id));

-- payments
create policy "payments_select_member" on public.payments
  for select using (workspace_id in (select public.current_workspace_ids()));
create policy "payments_insert_owner" on public.payments
  for insert with check (public.is_workspace_owner(workspace_id));
create policy "payments_update_owner" on public.payments
  for update using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));
create policy "payments_delete_owner" on public.payments
  for delete using (public.is_workspace_owner(workspace_id));

-- ════════════════════════════════════════════════════════════════════════
-- 민감 테이블 — owner 만 읽기. insert/update 정책 없음 → service_role 만 가능.
--   ai_usage, audit_logs, billing_events
-- ════════════════════════════════════════════════════════════════════════
create policy "ai_usage_select_owner" on public.ai_usage
  for select using (public.is_workspace_owner(workspace_id));

create policy "audit_logs_select_owner" on public.audit_logs
  for select using (public.is_workspace_owner(workspace_id));

create policy "billing_events_select_owner" on public.billing_events
  for select using (public.is_workspace_owner(workspace_id));

-- ════════════════════════════════════════════════════════════════════════
-- 권한(GRANT) — RLS 가 실제 격리를 담당. service_role 은 RLS 를 우회한다.
-- (Supabase 는 기본 default privileges 도 부여하지만, 마이그레이션을
--  자체 완결적으로 만들기 위해 명시한다.)
-- ════════════════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
