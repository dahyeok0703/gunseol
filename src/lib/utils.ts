import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 원화 금액 포맷 — 큼직한 숫자 표시에 사용 */
export function formatKRW(value: number, opts?: { withSymbol?: boolean }) {
  const formatted = new Intl.NumberFormat("ko-KR").format(Math.round(value));
  return opts?.withSymbol === false ? formatted : `₩${formatted}`;
}

/** 견적가 대비 실행가로 마진(금액)과 마진율(%)을 계산 */
export function calcMargin(quotePrice: number, costPrice: number) {
  const margin = quotePrice - costPrice;
  const rate = quotePrice > 0 ? (margin / quotePrice) * 100 : 0;
  return { margin, rate: Math.round(rate * 10) / 10 };
}
