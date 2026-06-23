import "server-only";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formatKRW } from "@/lib/utils";
import {
  styles,
  DocHeader,
  DocFooter,
  MetaRow,
  SignatureBlock,
  type PdfCompany,
} from "@/lib/pdf/shared";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ko-KR");

/**
 * 공사 계약서 — 견적 기반.
 *
 * ⚠️⚠️ 중요: 아래 "표준 계약 조항"은 **예시 플레이스홀더**다.
 *   계약 효력·분쟁·하자담보·지체상금 등 법적 조항은 반드시 **법무 검토**를 거쳐야 한다.
 *   본 도구는 작성 보조용이며, 계약서의 법적 책임은 사용자(업체)에게 있다.
 *
 * 계약금액·공사기간·지급조건은 현재 플레이스홀더이며 계약 기능 연동 시 실제 값으로 대체된다.
 */
export function ContractDocument({
  company,
  clientName,
  projectName,
  siteAddress,
  amount,
  createdAt,
}: {
  company: PdfCompany;
  clientName: string | null;
  projectName: string;
  siteAddress: string | null;
  amount: number;
  createdAt: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocHeader company={company} />
        <Text style={styles.title}>공 사 계 약 서</Text>

        <Text style={styles.paragraph}>
          발주자(이하 “갑”)와 시공자(이하 “을”)는 아래 공사에 대하여 다음과 같이 계약을 체결한다.
        </Text>

        <View style={[styles.metaTable, { marginTop: 10 }]}>
          <MetaRow label="공사명" value={projectName} />
          <MetaRow label="현장" value={siteAddress ?? "—"} />
          <MetaRow label="발주자(갑)" value={clientName ?? "—"} />
          <MetaRow label="시공자(을)" value={company.bizName || company.name} />
          <MetaRow label="계약금액" value={`${formatKRW(amount)} (부가세 별도)`} />
          <MetaRow label="공사기간" value="착공 ____년 __월 __일 ~ 준공 ____년 __월 __일" />
          <MetaRow
            label="지급조건"
            value="계약금 __% / 중도금 __% / 잔금 __% (협의 후 확정)"
            last
          />
        </View>

        {/* 표준 계약 조항 — 예시 플레이스홀더 (법무 검토 필요) */}
        <Text style={styles.sectionTitle}>표준 계약 조항 (예시)</Text>
        <Text style={styles.paragraph}>
          제1조(목적) 본 계약은 위 공사의 시공에 관하여 갑과 을의 권리·의무를 정함을 목적으로 한다.
        </Text>
        <Text style={styles.paragraph}>
          제2조(계약금액 및 지급) 계약금액과 지급조건은 위 표에 따르며, 세부 일정은 상호 협의로 정한다.
        </Text>
        <Text style={styles.paragraph}>
          제3조(공사기간) 을은 정해진 공사기간 내에 공사를 완료한다. 천재지변 등 불가항력 시 기간을
          연장할 수 있다.
        </Text>
        <Text style={styles.paragraph}>
          제4조(변경·추가공사) 설계변경 또는 추가공사가 필요한 경우 갑·을 협의 후 별도 정산한다.
        </Text>
        <Text style={styles.paragraph}>
          제5조(하자담보) 하자담보 책임기간 및 범위는 관계 법령에 따른다. (세부 조항은 법무 검토 후 확정)
        </Text>
        <Text style={styles.paragraph}>
          제6조(분쟁해결) 본 계약과 관련한 분쟁은 상호 협의하며, 협의가 어려운 경우 관할 법원에 따른다.
        </Text>

        <View style={styles.disclaimer}>
          <Text>
            ※ 위 표준 계약 조항은 작성 보조용 예시이며 법적 효력을 보장하지 않습니다. 실제 계약 체결
            전 반드시 변호사 등 전문가의 법무 검토를 받으십시오. 계약 내용의 최종 책임은 당사자에게
            있습니다.
          </Text>
        </View>

        <Text style={{ textAlign: "center", marginTop: 22, fontSize: 9 }}>
          계약일자: {fmtDate(createdAt)}
        </Text>

        <SignatureBlock
          company={company}
          counterpartyLabel="발주자 (갑)"
          counterpartyName={clientName ?? ""}
        />

        <DocFooter note={`${company.bizName || company.name} · 공사계약서 (법무 검토 필요)`} />
      </Page>
    </Document>
  );
}
