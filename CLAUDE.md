# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude/개발자를 위한 운영 지침이다.

## 서비스 정의

**건설(gunseol)** — 1인·소규모 인테리어 업자를 위한 **모바일 우선** B2B SaaS.
현장에서 **폰으로** 쓰는 도구라는 점이 모든 설계의 출발점이다.

- 핵심 가치: 현장에서 빠르게 **견적**을 만들고, **현장 진행**을 관리하고, **마진**을 한눈에 본다.
- 대상: 대부분 혼자 일하는 사장님. 팀 기능은 **있되 강요하지 않는다**.

## 아키텍처 원칙 (반드시 지킬 것)

### 1. 멀티테넌시 = `workspace_id` + RLS

- 구조: `workspace`(업체) → `member`(직원, role: `owner`/`staff`) → 거래처/현장/견적.
- **모든 업무 테이블은 `workspace_id` 컬럼을 가진다.**
- 데이터 격리는 **Postgres RLS** 로 강제한다. 애플리케이션 코드의 필터링에 의존하지 않는다.
  - 정책 핵심: `workspace_id in (select public.current_workspace_ids())`.
  - `current_workspace_ids()` 는 `security definer` 함수로 members RLS 재귀를 피한다.
- 회원가입 시 `auth.users` 트리거(`handle_new_user`)가 **workspace 자동 생성 + owner member 등록**.
- 새 업무 테이블을 추가하면 **즉시 `workspace_id` 와 RLS 정책을 함께** 만든다.

### 2. 견적가 / 실행가 분리로 마진 관리

- `estimates`/`estimate_lines` 는 두 가지 가격을 분리해 저장한다.
  - **견적가(quote)** = 고객에게 제시하는 금액.
  - **실행가(cost)** = 실제 들어가는 원가.
- 마진 = 견적가 − 실행가. 마진율은 `calcMargin()`(`src/lib/utils.ts`) 으로 계산한다.
- UI 에서 금액·마진은 **큼직한 숫자**(`.num`, `tabular-nums`)로 보여준다.
- **단가표(catalog_items)가 견적의 단가 소스**다. 견적 라인 추가 시
  `src/lib/data/catalog.ts` 의 `getCatalogPickerItems()` 로 품목을 불러와 단가를
  프리필한다. 신규 데이터 조회는 server 컴포넌트에서 `src/lib/data/*` 접근자를 쓴다.

### 3. AI 는 "항목 추출"에만, **금액 판단 금지**

- AI(Anthropic)는 사진/메모에서 **견적 항목을 추출(extract)** 하는 데만 쓴다.
- **단가·금액·마진을 AI 가 판단하거나 생성하지 않는다.** 금액은 항상 사용자가 입력/확정한다.
- 키가 없으면 기능을 **우아하게 비활성**한다(아래).

### 4. "키 없으면 우아하게 비활성"

- 선택 환경변수(예: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)가 없으면
  앱은 **죽지 않고**, 해당 기능만 비활성화한다.
- 판단은 `features` 플래그(`src/lib/env.ts`)로 한다. UI 는 "사용 가능 / 키 없음" 상태를 노출한다.

## 스택 / 컨벤션

- Next.js 15 App Router, **TS strict**, 서버 컴포넌트 + **server actions** 우선.
- Supabase(Postgres + Auth + Storage), `@supabase/ssr` 쿠키 세션.
- Tailwind v4 + shadcn/ui(new-york), lucide-react, react-hook-form + zod, sonner.
- 패키지 매니저: **pnpm**.

### 코드 규칙

- **환경변수**는 `src/lib/env.ts` 의 zod 스키마를 통해서만 읽는다(직접 `process.env` 지양).
- **server action**은 반드시 `action(schema, handler)` 래퍼(`src/lib/actions/safe-action.ts`)를 쓴다.
  - 결과는 항상 `{ ok, data }` 또는 `{ ok: false, error, fieldErrors? }`.
  - 사용자에게 보일 메시지는 `ActionError` 로 던진다.
- **인증 컨텍스트**는 `requireAuth()`/`getAuthContext()`(`src/lib/auth/context.ts`)로 가져온다.
- 보호 라우트는 `src/app/(app)/**` 아래에 둔다(미들웨어 + 레이아웃에서 이중 보호).
- 모바일 우선: 터치 타깃 ≥ 44px(`.tap-target`, 버튼 `size="touch"`), 하단 탭바, `pb-safe` 안전영역.

## 디자인 토큰 (CSS 변수, `src/app/globals.css`)

무드: **현장감 · 신뢰 · 실용**. 팔레트: **차콜 + 모래색(웜 뉴트럴) + 앰버 포인트**.

| 토큰 | 의미 | 라이트 값(HSL) |
| --- | --- | --- |
| `--charcoal` | 텍스트/주요 면 | `24 10% 16%` |
| `--sand` | 배경(모래색) | `38 36% 95%` |
| `--sand-card` | 카드 표면 | `40 40% 98%` |
| `--amber` | 포인트/CTA | `35 92% 52%` |
| `--profit` | 마진 + | `145 55% 34%` |
| `--loss` | 마진 − | `0 72% 48%` |
| `--radius` | 모서리 | `0.85rem` |

- 시맨틱 토큰(`--background`, `--primary`, `--accent`, `--border` …)은 위 원색을 참조한다.
- Tailwind v4 `@theme inline` 으로 `bg-background`, `text-profit`, `bg-accent` 등 유틸리티로 노출된다.
- 강조 CTA 는 `<Button variant="accent" size="touch">`, 금액은 `<span className="num">`.

## 디렉터리 지도

```
src/
  app/
    (auth)/        로그인·회원가입·비번재설정 (공개)
    (app)/         보호 라우트 셸(상단바+하단 탭바) + 기능 페이지
    auth/callback/ 이메일 확인·재설정 코드 교환
    api/extract/   AI 항목 추출 라우트
    api/pdf/       견적서·계약서·발주/명세 PDF 라우트(@react-pdf/renderer)
  components/
    ui/            shadcn 프리미티브
    auth/          인증 폼(client)
    app-shell/     상단바·하단탭바·페이지헤더·빈상태
  lib/
    env.ts         환경변수 zod 검증 + features 플래그
    supabase/      client/server/middleware
    actions/       safe-action 래퍼 + auth actions
    auth/          getAuthContext / requireAuth
    data/          server 데이터 접근자(catalog/estimates/statements/workspace)
    ai/            AI 추출(Haiku→Sonnet 폴백)
    pdf/           PDF 문서 템플릿 + 한글 폰트(NotoKR) 임베드
    pricing/       AI 원가(cogs)
    validations/   zod 스키마
  types/database.ts  Supabase 타입(수기; 프로덕션은 gen types 권장)
public/fonts/      Noto Sans KR OTF (OFL) — PDF 임베드용
※ 계약서 표준 문구는 예시 플레이스홀더이며 반드시 법무 검토 필요(contract-document.tsx)
supabase/
  migrations/   0001 스키마, 0002 RLS, 0003 거래처/현장(soft delete·감사),
                0004 단가표(카테고리 시드·즐겨찾기), 0005 견적 RPC(버전·합계),
                0006 AI 사용량 RPC(쿼터·토큰 적재), 0007 업체 프로필+브랜드 Storage,
                0008 공정 일정(tasks·사진)+reorder RPC+site 버킷, 0009 수금 인덱스,
                0010 구독 결제(subscriptions·billing_payments·billing_events 멱등)
  seed.sql      데모 데이터(거래처2/현장1/품목10/견적1)
  tests/        RLS 격리 pgTAP 테스트
  README.md     데이터 모델·RLS 정책 상세
```

## 작업 시 체크리스트

- [ ] 새 테이블 → `workspace_id` + RLS 정책 동시 추가했는가?
- [ ] server action → `action()` 래퍼와 zod 스키마를 썼는가?
- [ ] 금액 관련 AI 사용은 없는가(추출 전용)?
- [ ] 선택 키 없을 때 앱이 죽지 않고 비활성화되는가?
- [ ] 모바일에서 터치 타깃·안전영역·하단 탭바 가림이 괜찮은가?
