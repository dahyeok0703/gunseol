import type { Metadata } from "next";
import { LegalDoc, Clause } from "@/components/marketing/legal-doc";

export const metadata: Metadata = {
  title: "이용약관",
  description: "건설(gunseol) 서비스 이용약관",
};

// ⚠️ 법률 검토 필요 — 아래는 예시 플레이스홀더이며 변호사 검토 후 확정해야 한다.
export default function TermsPage() {
  return (
    <LegalDoc title="이용약관" updatedAt="2026-06-24">
      <Clause heading="제1조 (목적)">
        <p>
          본 약관은 건설(gunseol, 이하 &ldquo;회사&rdquo;)이 제공하는 견적·현장관리 SaaS(이하
          &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 회원 간의 권리·의무 및 책임사항을 규정함을
          목적으로 합니다.
        </p>
      </Clause>

      <Clause heading="제2조 (정의)">
        <ul>
          <li>&ldquo;회원&rdquo;이란 본 약관에 동의하고 서비스를 이용하는 사업자를 말합니다.</li>
          <li>&ldquo;워크스페이스&rdquo;란 회원의 업체 단위 데이터 공간을 말합니다.</li>
          <li>&ldquo;유료 플랜(Pro)&rdquo;이란 정기 결제로 제공되는 부가 기능 플랜을 말합니다.</li>
        </ul>
      </Clause>

      <Clause heading="제3조 (견적·금액에 대한 책임)">
        <p>
          서비스는 견적 작성·항목 정리·금액 합산을 보조하는 도구이며, 제시되는 견적 금액·마진은
          회원이 입력한 값에 기반한 참고치입니다. <strong>금액의 최종 확인과 그에 따른 책임은
          전적으로 회원(업체)에게 있습니다.</strong> 또한 서비스에 포함된 계약서·약정 표준 문구는
          예시이며, 실제 사용 전 반드시 변호사의 검토를 거쳐야 합니다.
        </p>
      </Clause>

      <Clause heading="제4조 (AI 기능의 범위)">
        <p>
          AI 기능은 사진·메모·텍스트에서 견적 &ldquo;항목&rdquo;을 추출·정리하는 데에만 사용되며,
          단가·금액·마진을 판단하거나 생성하지 않습니다. 추출 결과는 초안이며 회원이 직접 확인·확정해야
          합니다.
        </p>
      </Clause>

      <Clause heading="제5조 (요금 및 결제)">
        <p>
          유료 플랜의 요금·결제 주기·기능 범위는 요금제 페이지에 따릅니다. 정기 결제는 등록된 결제수단으로
          매 결제 주기마다 자동 청구되며, 회원은 언제든지 다음 주기에 대한 해지를 신청할 수 있습니다. 환불은
          환불정책을 따릅니다.
        </p>
      </Clause>

      <Clause heading="제6조 (회원의 의무)">
        <ul>
          <li>회원은 법령과 본 약관을 준수해야 합니다.</li>
          <li>타인의 권리를 침해하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.</li>
          <li>계정·결제 정보를 안전하게 관리할 책임은 회원에게 있습니다.</li>
        </ul>
      </Clause>

      <Clause heading="제7조 (서비스의 변경·중단)">
        <p>
          회사는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 중대한
          변경 시 사전에 공지합니다.
        </p>
      </Clause>

      <Clause heading="제8조 (책임의 제한)">
        <p>
          회사는 회원이 입력한 데이터의 정확성, 견적·세무·법률적 적정성에 대해 보증하지 않으며, 관련하여
          발생한 손해에 대해 관계 법령이 허용하는 범위에서 책임을 제한합니다.
        </p>
      </Clause>

      <Clause heading="부칙">
        <p>본 약관은 공지한 시행일로부터 적용됩니다.</p>
      </Clause>
    </LegalDoc>
  );
}
