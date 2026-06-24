# 데이터베이스 (Supabase)

인테리어 견적·현장관리 SaaS 의 스키마·RLS·시드·테스트.

## 파일

| 경로 | 설명 |
| --- | --- |
| `migrations/0001_init.sql` | 전체 스키마 + enum + updated_at 트리거 + 가입 트리거 |
| `migrations/0002_rls.sql` | RLS 헬퍼 함수 + 정책 + 권한(GRANT) |
| `migrations/0003_clients_projects.sql` | soft delete + 변경 감사 트리거 + project_overview 뷰 |
| `migrations/0004_catalog.sql` | 단가표(즐겨찾기·카테고리·기본 카테고리 시드) |
| `migrations/0005_estimates.sql` | `create_estimate()` RPC (견적+라인 원자적 생성·버전·합계) |
| `migrations/0006_ai_usage.sql` | AI 사용량 RPC (`current_month_extractions`/`record_ai_usage`, 멤버십 검증) |
| `migrations/0007_brand_documents.sql` | 업체 프로필 컬럼 + 브랜드 자산 Storage 버킷/정책(로고·도장) |
| `migrations/0008_schedule.sql` | 공정 일정(tasks)·현장 사진(task_photos) + `reorder_tasks` RPC + site 버킷 |
| `migrations/0009_receivables.sql` | 수금(payments) 미수 집계·임박 정렬용 부분 인덱스 |
| `migrations/0010_billing.sql` | 구독(subscriptions·빌링키 민감)·결제내역(billing_payments) + billing_events 멱등(event_id unique). owner SELECT만, 쓰기는 서비스 역할 |
| `seed.sql` | 데모 데이터 (`supabase db reset` 시 자동 실행) |
| `tests/rls_isolation.test.sql` | 타 workspace 격리 pgTAP 통합 테스트 |

## 멀티테넌시 모델

```
auth.users
   └─ workspaces (업체, 테넌트 루트)         plan/trial/billing
        ├─ members (직원)                   role: owner|staff, status
        ├─ clients (거래처)
        ├─ projects (현장)  ── client_id
        │     ├─ estimates (견적)  ── version, total_price/total_cost
        │     │     └─ estimate_lines  ── qty, unit_price(견적) / cost(실행)
        │     ├─ contracts (계약)
        │     ├─ statements (거래명세/발주)
        │     ├─ payments (수금/기성)  ── 미수금 추적
        │     ├─ documents (업로드 자료)
        │     └─ tasks (공정 일정)  ── 체크리스트·예정일·순서
        │            └─ task_photos (현장 사진, site 버킷)
        ├─ catalog_categories (공정 카테고리)  ── 가입 시 기본값 시드
        ├─ catalog_items (나만의 단가표)       ── is_favorite, soft delete
        ├─ ai_usage (AI 사용량 집계)         ── 마진 보호
        ├─ subscriptions (구독, 1:1)         ── 빌링키(민감)·상태·다음 결제일
        ├─ billing_payments (결제 내역)       ── 정기결제 성공/실패 이력
        ├─ audit_logs (감사 로그)
        └─ billing_events (결제 웹훅 원본)    ── event_id 멱등
```

- **모든 업무 테이블은 `workspace_id`** 를 가진다. 공통 컬럼: `id uuid`, `created_at`, `updated_at`
  (append-only 인 `audit_logs`/`billing_events` 는 `created_at` 만).
- 회원가입 시 `handle_new_user` 트리거가 **workspace 생성 + owner member 등록**.
  업체명/이름은 가입 시 user metadata(`workspace_name`, `name`)로 전달한다.
- 견적 마진 = `total_price − total_cost` (라인은 `unit_price` vs `cost`).
- **단가표**: 가입 시 기본 공정 카테고리(철거/설비/전기/목공/도장/도배/바닥/타일/
  필름/창호/주방/기타)만 시드되고 단가는 비워둔다. `catalog_items` 가 견적 작성 시
  자동완성/선택 소스(`src/lib/data/catalog.ts`)로 쓰인다.
- **변경 감사**: clients/projects/catalog_items 의 INSERT/UPDATE/DELETE 가
  `audit_changes` 트리거로 `audit_logs` 에 자동 기록된다(soft delete·상태변경 구분).
- **견적 생성**: `create_estimate(project_id, status, memo, lines jsonb)` RPC 가
  견적+라인을 원자적으로 만든다. 버전은 자동 증가(수정=새 버전), 합계(견적가/실행가)는
  **서버에서 라인으로 재계산**한다. security invoker 라 비멤버는 RLS 로 차단된다.
  ⚠️ 금액의 최종 확인·책임은 업체에 있으며, 도구는 단순 합산만 한다.
- **AI 사용량(마진 보호)**: `record_ai_usage`/`current_month_extractions` security definer RPC 가
  멤버십을 검증한 뒤 `ai_usage` 를 월 단위로 누적한다(`ai_usage` 직접 insert 는 여전히 금지).
  free 플랜은 `current_month_extractions` 로 월 추출 쿼터를 산정한다.
- **출력물(PDF)**: 업체 프로필(상호·대표·사업자번호·연락처·주소·로고·도장)은 `workspaces` 컬럼.
  로고·도장 이미지는 `brand` Storage 버킷(`{workspace_id}/...` 경로)에 저장하고
  workspace 단위 RLS(`storage.objects`)로 격리한다. PDF 는 서버(`@react-pdf/renderer`,
  Noto Sans KR 임베드)에서 생성한다.
- **구독 결제**: `subscriptions`(빌링키 등 민감값 보관)·`billing_payments` 는 owner SELECT 만
  허용하고 **쓰기 정책은 없다** — 결제 처리는 PortOne 어댑터를 통해 서비스 역할(RLS 우회)로만
  기록한다. 웹훅(`/api/webhooks/portone`)은 서명 검증 후 `billing_events.event_id` UNIQUE 로
  **멱등** 처리한다(중복 이벤트는 23505 → 200). 가격은 설정값(`PRO_PRICE_KRW`), plan 한도는
  `PLAN_LIMITS`(`src/lib/constants/plan.ts`). PORTONE 키가 없으면 결제는 "준비 중"으로 비활성.

## RLS 정책 요약

데이터 격리는 전적으로 RLS 가 담당한다. 핵심 술어:
`workspace_id in (select public.current_workspace_ids())`.

| 그룹 | 테이블 | 읽기 | 쓰기 |
| --- | --- | --- | --- |
| 업무 | clients, projects, estimates, estimate_lines, statements, documents | 멤버 | **멤버** |
| 금전·설정 | workspaces, members, catalog_items, catalog_categories, contracts, payments | 멤버 | **owner** |
| 민감 | ai_usage, audit_logs, billing_events | **owner** | 없음 → `service_role` 만 |

- 헬퍼 함수(`current_workspace_ids`, `is_workspace_member`, `is_workspace_owner`)는
  `security definer` 로 members 의 RLS 재귀를 피한다.
- `service_role` 키는 RLS 를 우회하므로 서버 측 집계/웹훅 적재에 사용한다.
- `disabled` 상태 멤버는 모든 접근에서 제외된다.

## 로컬에서 실행

```bash
supabase init          # 최초 1회 (config.toml 생성)
supabase start         # 로컬 스택 기동
supabase db reset      # 마이그레이션 + 시드
supabase test db       # RLS 격리 테스트
```

데모 로그인: `demo@gunseol.app` / `demo1234`

## 검증 상태

`migrations → seed → tests` 를 PostgreSQL 16 + pgTAP 으로 실행해 확인했다:

- 시드 결과: workspace 1 / member 1(owner) / clients 2 / project 1 / catalog 10 /
  estimate 1(+lines 4, 마진 ₩2,016,000 = 31.8%)
- RLS 통합 테스트 **10/10 통과**:
  타 workspace 읽기/쓰기 차단, owner vs staff 쓰기 권한, 민감 테이블 owner 전용 읽기·insert 차단.

## 호스팅 환경 적용

대시보드 SQL Editor 에 `0001 → 0002` 순서로 실행하거나:

```bash
supabase link --project-ref <ref>
supabase db push
```

> `seed.sql` 의 `auth.users` 직접 삽입은 **로컬 전용**이다.
> 호스팅에서는 앱 회원가입(또는 대시보드 사용자 생성) 후 업무 데이터만 시드하라.
