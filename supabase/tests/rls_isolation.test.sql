-- ════════════════════════════════════════════════════════════════════════
-- RLS 격리 통합 테스트 (pgTAP)
-- 실행:  supabase test db
--
-- 시나리오:
--   · 사용자 A(a@test.dev) → 업체 A 의 owner   (가입 트리거가 자동 생성)
--   · 사용자 B(b@test.dev) → 업체 B 의 owner
--   · 사용자 C(c@test.dev) → 업체 A 의 staff (+ 자신의 업체 C owner)
-- 검증:
--   1) A 는 자기 workspace 행만 보고, B 의 행은 못 본다.
--   2) 타 workspace 로의 쓰기는 차단된다.
--   3) 민감 테이블(audit_logs)은 owner 만 읽고, insert 는 차단된다.
--   4) staff(C)는 읽기 전체 가능하나 금전 테이블(payments) 쓰기는 차단된다.
-- ════════════════════════════════════════════════════════════════════════
begin;
select plan(10);

-- ── 셋업 (postgres 역할: RLS 우회) ───────────────────────────────────────
-- auth.users 삽입 → handle_new_user 트리거가 workspace + owner member 생성
insert into auth.users (instance_id, id, aud, role, email, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000001',
   'authenticated', 'authenticated', 'a@test.dev', now(), now(),
   '{"provider":"email"}', '{"workspace_name":"업체 A","name":"사장A"}'),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-000000000002',
   'authenticated', 'authenticated', 'b@test.dev', now(), now(),
   '{"provider":"email"}', '{"workspace_name":"업체 B","name":"사장B"}'),
  ('00000000-0000-0000-0000-000000000000', 'cccccccc-0000-0000-0000-000000000003',
   'authenticated', 'authenticated', 'c@test.dev', now(), now(),
   '{"provider":"email"}', '{"workspace_name":"업체 C","name":"사장C"}');

-- workspace id 캡처
create temporary table t_ids as
select
  (select id from public.workspaces where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001') as ws_a,
  (select id from public.workspaces where owner_id = 'bbbbbbbb-0000-0000-0000-000000000002') as ws_b;
grant select on t_ids to authenticated;

-- C 를 업체 A 의 staff 로 추가
insert into public.members (workspace_id, user_id, name, role, status)
select ws_a, 'cccccccc-0000-0000-0000-000000000003', '직원C', 'staff', 'active' from t_ids;

-- 각 업체에 거래처 1, 감사로그 1 (postgres 로 직접 삽입)
insert into public.clients (workspace_id, name) select ws_a, 'A거래처' from t_ids;
insert into public.clients (workspace_id, name) select ws_b, 'B거래처' from t_ids;
insert into public.audit_logs (workspace_id, action) select ws_a, 'seed' from t_ids;
insert into public.audit_logs (workspace_id, action) select ws_b, 'seed' from t_ids;

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 1 — 사용자 A (업체 A owner) 로 행동
-- ══════════════════════════════════════════════════════════════════════
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true);

select is(
  (select count(*)::int from public.clients),
  1,
  'A는 자기 workspace 거래처만 본다 (총 1건)'
);

select is(
  (select count(*)::int from public.clients c, t_ids where c.workspace_id = t_ids.ws_b),
  0,
  'A는 타 workspace(B) 거래처를 볼 수 없다'
);

select lives_ok(
  format('insert into public.clients (workspace_id, name) values (%L, %L)',
         (select ws_a from t_ids), '신규거래처'),
  'A는 자기 workspace 에 거래처를 추가할 수 있다'
);

select throws_ok(
  format('insert into public.clients (workspace_id, name) values (%L, %L)',
         (select ws_b from t_ids), '침입'),
  '42501', NULL::text,
  'A는 타 workspace(B) 에 쓰기를 할 수 없다'
);

select is(
  (select count(*)::int from public.audit_logs),
  1,
  'A(owner)는 자기 workspace 감사로그를 읽는다'
);

select throws_ok(
  format('insert into public.audit_logs (workspace_id, action) values (%L, %L)',
         (select ws_a from t_ids), 'hack'),
  '42501', NULL::text,
  '일반 사용자는 민감 테이블(audit_logs)에 insert 할 수 없다 (서비스 역할 전용)'
);

-- ══════════════════════════════════════════════════════════════════════
-- PHASE 2 — 사용자 C (업체 A staff) 로 행동
-- ══════════════════════════════════════════════════════════════════════
select set_config('request.jwt.claims',
  json_build_object('sub', 'cccccccc-0000-0000-0000-000000000003', 'role', 'authenticated')::text,
  true);

select is(
  (select count(*)::int from public.clients c, t_ids where c.workspace_id = t_ids.ws_a),
  2,
  'staff(C)는 업체 A 거래처를 모두 읽는다 (2건)'
);

select lives_ok(
  format('insert into public.clients (workspace_id, name) values (%L, %L)',
         (select ws_a from t_ids), 'C가 추가'),
  'staff(C)는 거래처를 추가할 수 있다 (업무 테이블 쓰기 허용)'
);

select throws_ok(
  format('insert into public.payments (workspace_id, label, amount) values (%L, %L, %s)',
         (select ws_a from t_ids), '계약금', '1000000'),
  '42501', NULL::text,
  'staff(C)는 금전 테이블(payments) 쓰기가 차단된다 (owner 전용)'
);

select is(
  (select count(*)::int from public.audit_logs a, t_ids where a.workspace_id = t_ids.ws_a),
  0,
  'staff(C)는 민감 테이블(audit_logs) 읽기가 차단된다 (owner 전용)'
);

-- ── 종료 ─────────────────────────────────────────────────────────────────
select * from finish();
rollback;
