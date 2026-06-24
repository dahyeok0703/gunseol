import type { Metadata } from "next";
import { LegalDoc, Clause } from "@/components/marketing/legal-doc";

export const metadata: Metadata = {
  title: "환불정책",
  description: "건설(gunseol) 환불정책",
};

// ⚠️ 법률 검토 필요 — 전자상거래법·콘텐츠 이용 환불 규정 준수 여부를 검토해야 한다.
export default function RefundPage() {
  return (
    <LegalDoc title="환불정책" updatedAt="2026-06-24">
      <Clause heading="1. 무료 플랜">
        <p>무료 플랜은 결제가 없으므로 환불 대상이 아닙니다. 언제든 사용을 중단할 수 있습니다.</p>
      </Clause>

      <Clause heading="2. 유료 플랜(Pro) 정기 결제">
        <p>
          유료 플랜은 월 단위 정기 결제로 제공됩니다. 해지를 신청하면 <strong>다음 결제일부터</strong>{" "}
          청구가 중단되며, 이미 결제된 현재 주기까지는 서비스가 정상 제공됩니다(일할 환불 미적용을
          원칙으로 함).
        </p>
      </Clause>

      <Clause heading="3. 환불이 가능한 경우">
        <ul>
          <li>결제 시스템 오류로 인한 중복 결제·오결제</li>
          <li>회사의 귀책으로 서비스를 정상 이용하지 못한 경우</li>
          <li>관계 법령(전자상거래 등에서의 소비자보호에 관한 법률 등)에서 정한 청약철회 사유</li>
        </ul>
      </Clause>

      <Clause heading="4. 환불 절차">
        <p>
          환불 요청은 문의처로 접수하며, 확인 후 영업일 기준 7일 이내에 원결제수단으로 환불합니다. 결제
          대행사(PG)·카드사 사정에 따라 실제 환불 시점은 달라질 수 있습니다.
        </p>
      </Clause>

      <Clause heading="5. 문의처">
        <p>
          환불 문의: billing@example.com
          <br />
          <span className="text-xs">※ 실제 연락처로 교체하고 전문가 검토를 받아야 합니다.</span>
        </p>
      </Clause>
    </LegalDoc>
  );
}
