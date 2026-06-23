-- ════════════════════════════════════════════════════════════════════════
-- 0005_estimates — 견적 작성 엔진 지원
--   create_estimate(): 견적 + 라인을 원자적으로 생성한다.
--   · 버전 자동 증가 (수정 시 새 버전)
--   · 합계(견적가/실행가)는 라인으로부터 서버에서 재계산한다.
--
--   ⚠️ 견적 금액은 업체가 최종 확인·책임지며, 본 도구는 작성을 보조한다.
--      금액 산출은 사용자가 입력한 라인 단가의 단순 합산일 뿐, 가격을 판단하지 않는다.
--
--   security invoker(기본): RLS 가 그대로 적용된다. 권한 없는 project 면
--   projects RLS 로 인해 조회가 비어 예외가 발생한다.
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.create_estimate(
  p_project_id uuid,
  p_status     text,
  p_memo       text,
  p_lines      jsonb
)
returns public.estimates
language plpgsql
as $$
declare
  v_ws       uuid;
  v_version  integer;
  v_price    numeric(14, 2);
  v_cost     numeric(14, 2);
  v_estimate public.estimates;
begin
  -- 프로젝트의 workspace 확인 (RLS: 멤버가 아니면 NULL → 예외)
  select workspace_id into v_ws from public.projects where id = p_project_id;
  if v_ws is null then
    raise exception '현장을 찾을 수 없거나 권한이 없습니다.';
  end if;

  -- 다음 버전 번호
  select coalesce(max(version), 0) + 1 into v_version
  from public.estimates where project_id = p_project_id;

  -- 합계는 라인에서 재계산 (클라이언트 값 신뢰하지 않음)
  select
    coalesce(sum((l->>'qty')::numeric * (l->>'unit_price')::numeric), 0),
    coalesce(sum((l->>'qty')::numeric * (l->>'cost')::numeric), 0)
  into v_price, v_cost
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) as l;

  insert into public.estimates
    (workspace_id, project_id, version, status, total_price, total_cost, memo)
  values
    (v_ws, p_project_id, v_version,
     coalesce(nullif(p_status, ''), 'draft')::public.estimate_status,
     v_price, v_cost, nullif(p_memo, ''))
  returning * into v_estimate;

  insert into public.estimate_lines
    (workspace_id, estimate_id, category, name, unit, qty, unit_price, cost, sort_order)
  select
    v_ws,
    v_estimate.id,
    nullif(l->>'category', ''),
    coalesce(nullif(l->>'name', ''), '(이름 없음)'),
    nullif(l->>'unit', ''),
    coalesce((l->>'qty')::numeric, 1),
    coalesce((l->>'unit_price')::numeric, 0),
    coalesce((l->>'cost')::numeric, 0),
    (ord - 1)::integer
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) with ordinality as t(l, ord);

  return v_estimate;
end;
$$;

grant execute on function public.create_estimate(uuid, text, text, jsonb) to authenticated;
