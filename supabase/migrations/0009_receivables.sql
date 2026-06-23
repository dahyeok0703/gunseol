-- ════════════════════════════════════════════════════════════════════════
-- 0009_receivables — 수금/수익성 조회 최적화
--   payments 테이블/RLS 는 0001/0002 에 이미 있다(멤버 읽기 / owner 쓰기).
--   '받을 돈(미수)' 집계·임박 정렬을 위한 부분 인덱스만 추가한다.
-- ════════════════════════════════════════════════════════════════════════

create index if not exists payments_pending_due_idx
  on public.payments (workspace_id, due_on)
  where status = 'pending';

create index if not exists payments_project_idx
  on public.payments (project_id);
