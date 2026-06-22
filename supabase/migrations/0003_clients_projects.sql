-- ════════════════════════════════════════════════════════════════════════
-- 0003_clients_projects — 거래처/현장 관리 지원
--   · soft delete (deleted_at)
--   · 변경 감사 트리거 (audit_logs 자동 기록)
--   · 현장 목록 카드용 집계 뷰 (계약금액 · 받을 돈)
-- ════════════════════════════════════════════════════════════════════════

-- ── soft delete 컬럼 ─────────────────────────────────────────────────────
alter table public.clients  add column if not exists deleted_at timestamptz;
alter table public.projects add column if not exists deleted_at timestamptz;

-- 활성(미삭제) 행 조회 최적화 (부분 인덱스)
create index if not exists clients_active_idx
  on public.clients (workspace_id) where deleted_at is null;
create index if not exists projects_active_idx
  on public.projects (workspace_id) where deleted_at is null;

-- ════════════════════════════════════════════════════════════════════════
-- 변경 감사 트리거
--   action 예: clients.created / projects.updated / projects.status_changed /
--              clients.deleted(soft) / clients.restored
--   actor 는 auth.uid() → member 로 해석. service/seed 작업이면 null.
--   security definer 라 audit_logs RLS(insert 금지)를 우회한다.
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws     uuid;
  rec_id uuid;
  nm     text;
  act    text;
  actor  uuid;
  m      jsonb;
begin
  if tg_op = 'INSERT' then
    ws := new.workspace_id; rec_id := new.id; nm := new.name;
    act := tg_table_name || '.created';
  elsif tg_op = 'DELETE' then
    ws := old.workspace_id; rec_id := old.id; nm := old.name;
    act := tg_table_name || '.hard_deleted';
  else -- UPDATE
    ws := new.workspace_id; rec_id := new.id; nm := new.name;
    if old.deleted_at is null and new.deleted_at is not null then
      act := tg_table_name || '.deleted';
    elsif old.deleted_at is not null and new.deleted_at is null then
      act := tg_table_name || '.restored';
    else
      act := tg_table_name || '.updated';
      -- status 컬럼 접근은 projects 일 때만 (중첩 IF: 다른 테이블에서 평가 방지)
      if tg_table_name = 'projects' then
        if old.status is distinct from new.status then
          act := 'projects.status_changed';
          m := jsonb_build_object('name', nm, 'from', old.status, 'to', new.status);
        end if;
      end if;
    end if;
  end if;

  if m is null then
    m := jsonb_build_object('name', nm);
  end if;

  select id into actor
  from public.members
  where workspace_id = ws and user_id = auth.uid()
  limit 1;

  insert into public.audit_logs (workspace_id, actor_member_id, action, target_table, target_id, meta)
  values (ws, actor, act, tg_table_name, rec_id, m);

  return null; -- AFTER 트리거
end;
$$;

drop trigger if exists trg_clients_audit on public.clients;
create trigger trg_clients_audit
  after insert or update or delete on public.clients
  for each row execute function public.audit_changes();

drop trigger if exists trg_projects_audit on public.projects;
create trigger trg_projects_audit
  after insert or update or delete on public.projects
  for each row execute function public.audit_changes();

-- ════════════════════════════════════════════════════════════════════════
-- 현장 목록 카드용 집계 뷰
--   거래처명 + 계약금액 합계 + 받을 돈(미수금: pending payments 합계)
--   security_invoker → 조회자의 RLS 가 그대로 적용된다.
-- ════════════════════════════════════════════════════════════════════════
create or replace view public.project_overview
with (security_invoker = on) as
select
  p.id,
  p.workspace_id,
  p.client_id,
  p.name,
  p.site_address,
  p.status,
  p.memo,
  p.created_at,
  p.updated_at,
  c.name as client_name,
  coalesce(con.contract_amount, 0)::numeric(14, 2) as contract_amount,
  coalesce(pay.receivable, 0)::numeric(14, 2)     as receivable
from public.projects p
left join public.clients c
  on c.id = p.client_id and c.deleted_at is null
left join (
  select project_id, sum(amount) as contract_amount
  from public.contracts group by project_id
) con on con.project_id = p.id
left join (
  select project_id, sum(amount) as receivable
  from public.payments where status = 'pending' group by project_id
) pay on pay.project_id = p.id
where p.deleted_at is null;

grant select on public.project_overview to authenticated, service_role;
