-- ════════════════════════════════════════════════════════════════════════
-- 0006_ai_usage — AI 추출 사용량 집계 + 쿼터 (마진 보호)
--   ai_usage 는 owner 만 읽고 insert 는 금지(서비스 역할)였다(0002).
--   여기서는 멤버가 호출하는 security definer 함수로 그 경로를 안전하게 연다:
--   함수 내부에서 멤버십을 검증하므로 타 workspace 사용량은 건드릴 수 없다.
-- ════════════════════════════════════════════════════════════════════════

-- 이번 달 추출 횟수 (free 플랜 쿼터 산정)
create or replace function public.current_month_extractions(p_workspace_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from public.members
    where workspace_id = p_workspace_id and user_id = auth.uid() and status <> 'disabled'
  ) then
    raise exception '권한이 없습니다.';
  end if;

  select doc_count into v_count
  from public.ai_usage
  where workspace_id = p_workspace_id and month = date_trunc('month', now())::date;

  return coalesce(v_count, 0);
end;
$$;

-- 호출 후 토큰/원가 적재 (월 단위 누적 upsert)
create or replace function public.record_ai_usage(
  p_workspace_id  uuid,
  p_input_tokens  bigint,
  p_output_tokens bigint,
  p_doc_count     integer,
  p_est_cost_krw  numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.members
    where workspace_id = p_workspace_id and user_id = auth.uid() and status <> 'disabled'
  ) then
    raise exception '권한이 없습니다.';
  end if;

  insert into public.ai_usage (workspace_id, month, input_tokens, output_tokens, doc_count, est_cost_krw)
  values (
    p_workspace_id, date_trunc('month', now())::date,
    p_input_tokens, p_output_tokens, p_doc_count, p_est_cost_krw
  )
  on conflict (workspace_id, month) do update set
    input_tokens  = public.ai_usage.input_tokens  + excluded.input_tokens,
    output_tokens = public.ai_usage.output_tokens + excluded.output_tokens,
    doc_count     = public.ai_usage.doc_count     + excluded.doc_count,
    est_cost_krw  = public.ai_usage.est_cost_krw  + excluded.est_cost_krw,
    updated_at    = now();
end;
$$;

grant execute on function public.current_month_extractions(uuid) to authenticated;
grant execute on function public.record_ai_usage(uuid, bigint, bigint, integer, numeric) to authenticated;
