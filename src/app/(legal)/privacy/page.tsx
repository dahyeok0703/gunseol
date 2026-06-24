import type { Metadata } from "next";
import { LegalDoc, Clause } from "@/components/marketing/legal-doc";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "건설(gunseol) 개인정보처리방침",
};

// ⚠️ 법률 검토 필요 — 개인정보 보호법 준수 여부를 전문가가 검토해야 한다.
export default function PrivacyPage() {
  return (
    <LegalDoc title="개인정보처리방침" updatedAt="2026-06-24">
      <Clause heading="1. 수집하는 개인정보 항목">
        <ul>
          <li>회원가입: 이메일, 비밀번호(해시), 업체명, 담당자 이름</li>
          <li>서비스 이용: 거래처·현장·견적·수금 등 회원이 입력한 업무 데이터</li>
          <li>결제: 결제 식별자·카드 브랜드·마스킹된 카드 번호(전체 카드번호는 저장하지 않음)</li>
          <li>자동 수집: 접속 로그, 기기·브라우저 정보, 서비스 이용 기록</li>
        </ul>
      </Clause>

      <Clause heading="2. 개인정보의 이용 목적">
        <ul>
          <li>서비스 제공 및 회원 식별·인증</li>
          <li>유료 플랜 결제 처리 및 정기 결제 관리</li>
          <li>고객 문의 대응 및 공지 전달</li>
          <li>서비스 개선 및 부정 이용 방지</li>
        </ul>
      </Clause>

      <Clause heading="3. AI 처리 시 개인정보 최소화">
        <p>
          AI 항목 추출 기능 이용 시, 견적 항목 추출에 필요한 최소한의 내용만 처리하며 원문은
          저장·학습에 사용하지 않습니다. 토큰 사용량 등 집계 정보만 마진 모니터링 목적으로 남깁니다.
        </p>
      </Clause>

      <Clause heading="4. 개인정보의 보유 및 파기">
        <p>
          회원 탈퇴 시 또는 수집·이용 목적 달성 시 지체 없이 파기합니다. 다만 관계 법령에서 정한 기간
          동안 보존이 필요한 정보(전자상거래 등 거래·결제 기록)는 해당 기간 동안 보관합니다.
        </p>
      </Clause>

      <Clause heading="5. 개인정보 처리의 위탁 (수탁자)">
        <ul>
          <li>인프라·데이터베이스·인증: Supabase</li>
          <li>호스팅·배포: Vercel</li>
          <li>결제 처리: 포트원(PortOne) 및 연동 결제대행사(PG)</li>
          <li>AI 항목 추출: Anthropic</li>
        </ul>
        <p>각 수탁자에게는 처리 목적 달성에 필요한 범위 내에서만 정보가 제공됩니다.</p>
      </Clause>

      <Clause heading="6. 이용자의 권리">
        <p>
          회원은 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요청할 수 있습니다. 요청은
          아래 문의처를 통해 접수합니다.
        </p>
      </Clause>

      <Clause heading="7. 개인정보 보호책임자 및 문의처">
        <p>
          개인정보 보호책임자: (담당자 지정 필요) · 문의: privacy@example.com
          <br />
          <span className="text-xs">※ 실제 책임자·연락처로 교체하고 전문가 검토를 받아야 합니다.</span>
        </p>
      </Clause>
    </LegalDoc>
  );
}
