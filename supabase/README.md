# 데이터베이스 (Supabase)

인테리어 견적·현장관리 SaaS 의 스키마·RLS·시드·테스트.

## 파일

| 경로 | 설명 |
| --- | --- |
| `migrations/0001_init.sql` | 전체 스키마 + enum + updated_at 트리거 + 가입 트리거 |
| `migrations/0002_rls.sql` | RLS 헬퍼 함수 + 정책 + 권한(GRANT) |
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
        │     └─ documents (업로드 자료)
        ├─ catalog_items (나만의 단가표)
        ├─ ai_usage (AI 사용량 집계)         ── 마진 보호
        ├─ audit_logs (감사 로그)
        └─ billing_events (결제 웹훅 원본)
```

- **모든 업무 테이블은 `workspace_id`** 를 가진다. 공통 컬럼: `id uuid`, `created_at`, `updated_at`
  (append-only 인 `audit_logs`/`billing_events` 는 `created_at` 만).
- 회원가입 시 `handle_new_user` 트리거가 **workspace 생성 + owner member 등록**.
  업체명/이름은 가입 시 user metadata(`workspace_name`, `name`)로 전달한다.
- 견적 마진 = `total_price − total_cost` (라인은 `unit_price` vs `cost`).

## RLS 정책 요약

데이터 격리는 전적으로 RLS 가 담당한다. 핵심 술어:
`workspace_id in (select public.current_workspace_ids())`.

| 그룹 | 테이블 | 읽기 | 쓰기 |
| --- | --- | --- | --- |
| 업무 | clients, projects, estimates, estimate_lines, statements, documents | 멤버 | **멤버** |
| 금전·설정 | workspaces, members, catalog_items, contracts, payments | 멤버 | **owner** |
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
