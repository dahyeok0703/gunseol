-- ════════════════════════════════════════════════════════════════════════
-- 0010_billing — 구독 결제(PortOne 빌링키 정기결제)
--   · subscriptions: 빌링키·상태·결제수단·기간 (빌링키는 민감 → 서버 전용 사용)
--   · billing_payments: 정기결제 이력
--   · billing_events: 웹훅 멱등용 event_id + workspace 미해석 허용
--   plan 컬럼은 0001 의 workspaces.plan(free|pro) 사용.
-- ════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('inactive', 'active', 'canceled', 'past_due');
  end if;
end$$;

create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null unique references public.workspaces (id) on delete cascade,
  status               public.subscription_status not null default 'inactive',
  billing_key          text,  -- ⚠️ 민감: 서비스 역할(admin)만 읽어 결제에 사용
  customer_key         text,
  card_brand           text,
  card_last4           text,
  current_period_end   date,
  cancel_at_period_end boolean not null default false,
  last_payment_at      timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.billing_payments (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces (id) on delete cascade,
  provider_payment_id text,
  amount              numeric(14, 2) not null default 0,
  status              text not null,  -- paid / failed
  paid_at             timestamptz,
  raw                 jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create index if not exists billing_payments_workspace_idx on public.billing_payments (workspace_id);

-- 웹훅 멱등 + workspace 미해석 허용
alter table public.billing_events add column if not exists event_id text;
alter table public.billing_events alter column workspace_id drop not null;
create unique index if not exists billing_events_event_id_key
  on public.billing_events (event_id) where event_id is not null;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ── RLS: owner 읽기. 쓰기는 서비스 역할(admin)만(정책 없음 → service_role bypass). ──
alter table public.subscriptions enable row level security;
alter table public.billing_payments enable row level security;

create policy "subscriptions_select_owner" on public.subscriptions
  for select using (public.is_workspace_owner(workspace_id));

create policy "billing_payments_select_owner" on public.billing_payments
  for select using (public.is_workspace_owner(workspace_id));
