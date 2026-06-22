-- ════════════════════════════════════════════════════════════════════════
-- seed.sql — 데모 데이터 (로컬 개발용)
-- `supabase db reset` 시 마이그레이션 적용 후 자동 실행된다.
--
-- 데모 계정으로 로그인:  demo@gunseol.app  /  demo1234
-- 데모 auth 사용자를 만들면 0001 의 트리거가 workspace + owner member 를
-- 자동 생성한다. 그 workspace 에 거래처/현장/품목/견적을 채운다.
--
-- 주의: auth.users 직접 삽입은 로컬 개발 전용이다. 호스팅 환경에서는
-- 앱에서 회원가입(또는 대시보드에서 사용자 생성) 후 업무 데이터만 시드하라.
-- ════════════════════════════════════════════════════════════════════════
do $$
declare
  demo_user uuid := '00000000-0000-0000-0000-0000000d3a01';
  ws  uuid;
  c1  uuid;
  c2  uuid;
  p1  uuid;
  est uuid;
begin
  -- ── 데모 auth 사용자 (없을 때만) ──────────────────────────────────────
  if not exists (select 1 from auth.users where id = demo_user) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', demo_user, 'authenticated', 'authenticated',
      'demo@gunseol.app', crypt('demo1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"workspace_name":"데모 인테리어","name":"데모 사장"}'::jsonb,
      now(), now()
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      created_at, updated_at, last_sign_in_at
    ) values (
      gen_random_uuid(), demo_user, demo_user::text,
      jsonb_build_object('sub', demo_user::text, 'email', 'demo@gunseol.app'),
      'email', now(), now(), now()
    );
  end if;

  -- 트리거가 만든 workspace 조회 (없으면 직접 생성 — 트리거 미적용 환경 대비)
  select id into ws from public.workspaces where owner_id = demo_user
    order by created_at limit 1;
  if ws is null then
    insert into public.workspaces (name, owner_id) values ('데모 인테리어', demo_user)
      returning id into ws;
    insert into public.members (workspace_id, user_id, name, role, status)
      values (ws, demo_user, '데모 사장', 'owner', 'active');
  end if;

  -- 업무 데이터는 비어있을 때만 (idempotent)
  if exists (select 1 from public.clients where workspace_id = ws) then
    raise notice '데모 업무 데이터가 이미 존재합니다. 시드를 건너뜁니다.';
    return;
  end if;

  -- ── 거래처 2 ──────────────────────────────────────────────────────────
  insert into public.clients (workspace_id, name, phone, address, memo)
    values (ws, '김철수', '010-1234-5678', '서울 강남구 테헤란로 123', '32평 아파트 올수리 문의')
    returning id into c1;
  insert into public.clients (workspace_id, name, phone, address, memo)
    values (ws, '이영희', '010-2222-3333', '서울 마포구 양화로 45', '상가 인테리어 (1층 카페)')
    returning id into c2;

  -- ── 현장 1 ────────────────────────────────────────────────────────────
  insert into public.projects (workspace_id, client_id, name, site_address, status, memo)
    values (ws, c1, '강남 OO아파트 32평 올수리', '서울 강남구 테헤란로 123, 1203호',
            'estimating', '6월 말 착공 예정. 발코니 확장 포함.')
    returning id into p1;

  -- ── 품목·공정단가 10 (나만의 단가표) ─────────────────────────────────
  insert into public.catalog_items (workspace_id, category, name, unit, default_unit_price, default_cost)
  values
    (ws, '철거',   '내부 철거 및 폐기물 처리', '평',  60000,  42000),
    (ws, '설비',   '욕실 배관 교체',           '식', 850000, 600000),
    (ws, '전기',   '전기 배선 및 콘센트 증설', '개',  35000,  22000),
    (ws, '목공',   '목공 가벽/문틀',           '자',  45000,  30000),
    (ws, '도장',   '벽면 도장 (친환경)',       '평',  25000,  15000),
    (ws, '도배',   '실크 도배',                '평',  18000,  11000),
    (ws, '바닥',   '강마루 시공',              '평',  90000,  62000),
    (ws, '타일',   '욕실/주방 타일',           '평', 120000,  80000),
    (ws, '필름',   '문/창틀 필름 래핑',        '자',  28000,  17000),
    (ws, '주방',   '싱크대 상부장 교체',       '자', 150000, 105000);

  -- ── 데모 견적 1 + 라인 (마진 표시용, 선택) ───────────────────────────
  insert into public.estimates (workspace_id, project_id, version, status, total_price, total_cost, memo)
    values (ws, p1, 1, 'draft', 0, 0, '1차 견적 (초안)')
    returning id into est;

  insert into public.estimate_lines (workspace_id, estimate_id, category, name, unit, qty, unit_price, cost, sort_order)
  values
    (ws, est, '철거', '내부 철거 및 폐기물 처리', '평', 32, 60000, 42000, 1),
    (ws, est, '도배', '실크 도배',                '평', 32, 18000, 11000, 2),
    (ws, est, '바닥', '강마루 시공',              '평', 32, 90000, 62000, 3),
    (ws, est, '타일', '욕실/주방 타일',           '평',  8,120000, 80000, 4);

  -- 합계 재계산 (견적가/실행가)
  update public.estimates e
     set total_price = sub.tp, total_cost = sub.tc
    from (
      select estimate_id, sum(qty * unit_price) tp, sum(qty * cost) tc
      from public.estimate_lines where estimate_id = est group by estimate_id
    ) sub
   where e.id = sub.estimate_id;

  raise notice '✅ 데모 시드 완료: workspace=%', ws;
end$$;
