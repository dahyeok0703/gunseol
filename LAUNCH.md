# 🚀 LAUNCH 체크리스트 — 건설(gunseol)

출시 전 반드시 확인할 항목. 위에서 아래로 순서대로 진행한다.
모든 박스를 채우기 전까지는 **정식 출시 금지**.

---

## 1. 인프라 · 배포

- [ ] **Supabase 프로덕션 프로젝트** 생성 (개발용과 분리)
- [ ] `supabase/migrations/0001~0010` 을 프로덕션에 적용 (`supabase db push` 또는 SQL 에디터 순서대로)
- [ ] RLS 격리 테스트 통과 확인 (`supabase test db` → pgTAP 10/10)
- [ ] **Vercel 프로젝트** 연결, `main`(또는 배포 브랜치) 자동 배포 확인
- [ ] Vercel 환경변수 등록 (아래 2번)
- [ ] **커스텀 도메인** 연결 + HTTPS 인증서 발급 확인
- [ ] `NEXT_PUBLIC_SITE_URL` 을 **실제 도메인**으로 설정 (OG/사이트맵/콜백 URL 정확성)

## 2. 환경변수 (Vercel)

필수:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` (실도메인)

선택(기능별, 없으면 우아하게 비활성):

- [ ] `SUPABASE_SERVICE_ROLE_KEY` — 결제·크론·관리 작업 (**서버 전용, 절대 노출 금지**)
- [ ] `ANTHROPIC_API_KEY` — AI 항목 추출
- [ ] `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` — 구독 결제
- [ ] `CRON_SECRET` — 연체 알림 크론 (Vercel 이 자동 주입하도록 등록)

## 3. 결제 (PortOne)

- [ ] PortOne **실 운영 채널** 연동 (테스트 채널 아님)
- [ ] 빌링키 발급 → 첫 결제 → 정기 결제 **실거래 1건** 성공 확인
- [ ] 웹훅 URL `https://<도메인>/api/webhooks/portone` 등록 + 서명 시크릿 일치
- [ ] 웹훅 **멱등성** 확인 (동일 이벤트 재전송 시 중복 처리 없음 — `billing_events.event_id`)
- [ ] 결제 실패 → `past_due` 전이, 해지/재개 동작 확인
- [ ] 환불 프로세스 1건 리허설 (PG 환불 반영 시점 포함)

## 4. 법무 · 약관 ⚠️

- [ ] **이용약관** 변호사 검토 후 확정 (`/terms` — 현재 플레이스홀더)
- [ ] **개인정보처리방침** 검토 + 수탁자 목록·보호책임자·연락처 실제 값으로 (`/privacy`)
- [ ] **환불정책** 전자상거래법 부합 검토 (`/refund`)
- [ ] ★ **계약서 표준 문구는 반드시 변호사 검토** (`src/lib/pdf/contract-document.tsx` — 예시 플레이스홀더)
- [ ] 사업자 정보(상호·사업자번호·통신판매업 신고번호) 푸터/약관에 표기
- [ ] 개인정보 처리 위탁 동의·수집 동의 플로우 점검

## 5. 마진 · 쿼터 보호

- [ ] `PLAN_LIMITS` 의 free 현장 수·AI 추출 한도 확정 (`src/lib/constants/plan.ts`)
- [ ] `PRO_PRICE_KRW` 가 AI 원가 상한을 충분히 상회하는지 점검 (`/billing` 마진 점검 카드)
- [ ] `AI_USD_KRW` 환율 최신값으로 갱신 (`src/lib/pricing/cogs.ts`)
- [ ] AI 모델 토큰 단가(`MODEL_PRICING`) 현행화
- [ ] 무료 플랜 쿼터 초과 시 차단 동작 확인 (현장 생성·AI 추출)

## 6. 데이터 · 보안

- [ ] **데모/시드 데이터 제거** — 프로덕션 DB 에 `supabase/seed.sql` 미적용 확인
- [ ] 테스트 계정·내부 워크스페이스 정리
- [ ] 모든 업무 테이블 `workspace_id` + RLS 적용 재확인
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 가 클라이언트 번들에 포함되지 않음 확인 (서버 전용)
- [ ] Storage 버킷(brand/site) 정책이 워크스페이스 단위로 격리되는지 확인

## 7. SEO · 마케팅

- [ ] `/sitemap.xml`, `/robots.txt` 응답 확인
- [ ] OG 이미지 `/opengraph-image` 렌더링 확인 (한글 폰트 정상)
- [ ] 랜딩(`/`) 히어로·기능·가격·CTA 카피 최종 검수
- [ ] (선택) 검색엔진 등록 / 애널리틱스 연동

## 8. 모바일 · 품질

- [ ] 실제 폰(iOS Safari / Android Chrome)에서 핵심 플로우 점검 (가입 → 견적 → 수금)
- [ ] 안전영역(`pb-safe`)·하단 탭바 가림 없음
- [ ] `pnpm build` / `pnpm lint` / `pnpm typecheck` 모두 통과
- [ ] 이메일 인증·비밀번호 재설정 메일 실제 수신 확인 (Supabase Auth 설정)

---

### 출시 직전 최종 3줄

1. 약관 3종 + 계약서 문구 **변호사 검토 완료**.
2. 결제 **실거래 1건** + 웹훅 멱등 확인 완료.
3. 프로덕션 DB **데모데이터 0건**, 도메인·환경변수 정상.
