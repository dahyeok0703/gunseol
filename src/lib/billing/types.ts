import "server-only";

/** 결제 어댑터 인터페이스 — 공급자(PortOne 등)를 갈아끼울 수 있게 분리한다. */

export interface ChargeArgs {
  billingKey: string;
  customerKey: string;
  amountKrw: number;
  orderName: string;
  paymentId: string; // 멱등 결제 식별자(우리가 생성)
}

export interface ChargeResult {
  ok: boolean;
  paymentId: string;
  status: string;
  raw: unknown;
}

export interface WebhookEvent {
  id: string; // 멱등용 이벤트 식별자
  type: string;
  paymentId: string | null;
  raw: unknown;
}

export interface PaymentDetail {
  status: string;
  amount: number;
  customData: Record<string, unknown>;
  raw: unknown;
}

export interface BillingAdapter {
  readonly provider: string;
  /** 빌링키로 결제(정기결제 1회분) */
  charge(args: ChargeArgs): Promise<ChargeResult>;
  /** 웹훅 서명 검증 + 파싱 (실패 시 throw) */
  verifyWebhook(rawBody: string, headers: Record<string, string | undefined>): Promise<WebhookEvent>;
  /** 결제 상세 조회 (customData 로 workspace 해석) */
  getPayment(paymentId: string): Promise<PaymentDetail>;
}
