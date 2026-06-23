# 건설 (gunseol)

**인테리어 견적·현장관리** — 1인·소규모 인테리어 업자가 **현장에서 폰으로** 쓰는 모바일 우선 B2B SaaS.

견적가/실행가를 분리해 **마진을 한눈에**, 현장은 **카드형 목록**, 버튼은 **엄지로 누르기 좋게**.

> 현재 상태: **프로덕션 골격(scaffold)** — 인증·멀티테넌시·앱 셸·디자인 시스템까지 완성, 업무 기능은 빈 화면.

## 스택

- **Next.js 15** (App Router, TypeScript strict, server actions)
- **Supabase** (Postgres + Auth + Storage), `@supabase/ssr`
- **Tailwind CSS v4** + **shadcn/ui**(new-york), lucide-react
- **react-hook-form** + **zod**, **sonner**(토스트)
- 패키지 매니저: **pnpm**

## 빠른 시작

### 1) 사전 준비

- Node.js 20+ (권장 22), pnpm 9+
- [Supabase](https://supabase.com) 프로젝트 1개

### 2) 의존성 설치

```bash
pnpm install
```

### 3) 환경변수 설정

`.env.example` 를 복사해 `.env.local` 을 만들고 값을 채운다.

```bash
cp .env.example .env.local
```

| 변수 | 필수 | 설명 |
| --- | :---: | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon public key |
| `NEXT_PUBLIC_SITE_URL` | 선택 | 콜백 URL 생성용. 미설정 시 요청 헤더로 유추 (로컬: `http://localhost:3000`) |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | 서버 전용 관리 작업/시드용. **클라이언트 노출 금지** |
| `ANTHROPIC_API_KEY` | 선택 | AI 견적 **항목 추출**용. 없으면 해당 기능만 **우아하게 비활성** |

> 환경변수는 `src/lib/env.ts` 의 zod 스키마로 검증된다. 필수값이 없으면 친절한 에러로 즉시 실패한다.

### 4) 데이터베이스 마이그레이션 적용

`supabase/migrations` 의 SQL 을 프로젝트에 적용한다. 둘 중 하나:

**A. Supabase 대시보드 (가장 간단)**
SQL Editor 에서 아래 순서로 실행:

1. `supabase/migrations/0001_init.sql` — 스키마 + 회원가입 트리거
2. `supabase/migrations/0002_rls.sql` — RLS 정책

**B. Supabase CLI**

```bash
supabase link --project-ref <your-ref>
supabase db push
```

이 마이그레이션은 다음을 만든다:

- 업무 테이블: `workspaces`, `members`, `clients`, `projects`, `catalog_items`,
  `estimates`, `estimate_lines`, `contracts`, `statements`, `payments`, `documents`
- 마진 보호/감사: `ai_usage`, `audit_logs`, `billing_events`
- 회원가입 시 **workspace 자동 생성 + owner 등록** 트리거(`handle_new_user`)
- **`workspace_id` 기반 RLS** 전체 정책 (역할별 읽기/쓰기 분리)

> 모든 업무 테이블은 `workspace_id` 를 가지며 RLS 로 격리된다.
> 스키마·정책의 전체 설명은 [`supabase/README.md`](./supabase/README.md) 참고.

### 4-1) 데모 데이터 시드 (로컬, 선택)

로컬 Supabase(`supabase start`)에서 `supabase db reset` 을 실행하면 마이그레이션 적용 후
`supabase/seed.sql` 이 자동 실행되어 데모 업체/거래처 2/현장 1/품목 10/견적 1 이 채워진다.

```bash
supabase db reset      # 마이그레이션 + 시드
# 데모 로그인:  demo@gunseol.app  /  demo1234
```

### 4-2) RLS 격리 테스트 (선택)

타 workspace 데이터가 새지 않는지 pgTAP 통합 테스트로 검증한다.

```bash
supabase test db       # supabase/tests/rls_isolation.test.sql 실행
```

### 4-3) 타입 생성

스키마를 바꾸면 TypeScript 타입을 재생성한다(`src/types/database.ts`).

```bash
pnpm gen:types         # = supabase gen types typescript --local > src/types/database.ts
# 원격 프로젝트: supabase gen types typescript --linked > src/types/database.ts
```

> `supabase db reset/test/gen:types` 는 로컬 Supabase 스택이 필요하다.
> 처음이라면 `supabase init` → `supabase start` 후 사용한다.

### 5) (선택) 이메일 인증 설정

Supabase → Authentication → URL Configuration 에서 **Redirect URLs** 에 추가:

```
http://localhost:3000/auth/callback
```

로컬에서 메일 확인 없이 바로 테스트하려면 Authentication → Providers → Email 에서
"Confirm email" 을 끄면 가입 즉시 로그인된다.

### 6) 개발 서버 실행

```bash
pnpm dev
```

http://localhost:3000 접속 → 회원가입하면 업체가 자동 생성되고 대시보드로 진입한다.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | 타입 검사 (`tsc --noEmit`) |
| `pnpm format` | Prettier 포맷 |
| `pnpm db:reset` | (로컬) 마이그레이션 + 시드 재적용 |
| `pnpm db:test` | (로컬) RLS 격리 pgTAP 테스트 |
| `pnpm gen:types` | (로컬) DB → TS 타입 생성 |

## 프로젝트 구조 & 설계 규칙

자세한 아키텍처 원칙(멀티테넌시, 마진 관리, AI 사용 범위, 디자인 토큰)은
[`CLAUDE.md`](./CLAUDE.md) 를 참고하세요.

요약:

- **멀티테넌시**: `workspace_id` + RLS 로 데이터 격리
- **마진**: 견적가/실행가 분리 저장 → `calcMargin()`
- **AI**: 항목 추출 전용(사진/메모/텍스트 → 견적 라인), **금액 판단 금지**.
  Haiku 4.5 고정·저신뢰 시 Sonnet 폴백, free 플랜 월 쿼터, `ANTHROPIC_API_KEY` 없으면 숨김
- **출력물(PDF)**: 견적서·계약서·발주서·거래명세서를 서버에서 생성(`@react-pdf/renderer`,
  한글 Noto Sans KR 임베드). 업체 로고·도장 브랜딩. ⚠️ **계약서 표준 문구는 법무 검토 필요**.
- **공정 일정**: 현장별 체크리스트(드래그 정렬)·진행률·현장 사진 메모, 대시보드에서
  오늘/이번 주 할 공정 통합 보기(여러 현장 동시 진행)
- **선택 키**: 없으면 해당 기능만 비활성
- **모바일 우선**: 하단 탭바, 큰 터치 타깃, 안전영역, 차콜+모래+앰버 토큰
