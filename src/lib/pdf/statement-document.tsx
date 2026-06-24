import "server-only";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formatKRW } from "@/lib/utils";
import {
  styles,
  DocHeader,
  DocFooter,
  MetaRow,
  SignatureBlock,
  Watermark,
  type PdfCompany,
} from "@/lib/pdf/shared";
import type { Database } from "@/types/database";

type Statement = Database["public"]["Tables"]["statements"]["Row"];

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("ko-KR") : "—");

/**
 * 발주서 / 거래명세서 — statements 기반.
 * type 에 따라 제목과 거래 상대 표기를 바꾼다(발주서: 공급받는 자, 명세서: 공급처).
 */
export function StatementDocument({
  company,
  statement,
  projectName,
  watermark = false,
}: {
  company: PdfCompany;
  statement: Statement;
  projectName: string | null;
  watermark?: boolean;
}) {
  const isPO = statement.type === "purchase_order";
  const title = isPO ? "발 주 서" : "거 래 명 세 서";
  const vat = Math.round(Number(statement.amount) * 0.1);
  const total = Number(statement.amount) + vat;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark show={watermark} />
        <DocHeader company={company} />
        <Text style={styles.title}>{title}</Text>

        <View style={styles.metaTable}>
          <MetaRow label={isPO ? "수신(공급처)" : "거래처"} value={statement.vendor ?? "—"} />
          {projectName ? <MetaRow label="현장" value={projectName} /> : null}
          <MetaRow label="작성일자" value={fmtDate(statement.issued_on)} last />
        </View>

        {/* 금액 명세 */}
        <View style={styles.tHead}>
          <Text style={[styles.th, { flex: 3 }]}>항목</Text>
          <Text style={[styles.th, { flex: 1.4 }, styles.num]}>금액</Text>
        </View>
        <View style={styles.tRow}>
          <Text style={[styles.td, { flex: 3 }]}>
            {isPO ? "발주 금액" : "거래 금액"}
            {statement.memo ? ` — ${statement.memo}` : ""}
          </Text>
          <Text style={[styles.td, { flex: 1.4 }, styles.num]}>
            {formatKRW(Number(statement.amount))}
          </Text>
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>공급가액</Text>
              <Text>{formatKRW(Number(statement.amount))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>부가세 (10%)</Text>
              <Text>{formatKRW(vat)}</Text>
            </View>
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>합계</Text>
              <Text style={styles.grandValue}>{formatKRW(total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text>
            본 문서는 작성 보조 도구로 만들어진 자료입니다. 금액·항목의 최종 확인 및 책임은 업체에
            있습니다.
          </Text>
        </View>

        <SignatureBlock
          company={company}
          counterpartyLabel={isPO ? "수신 (공급처)" : "거래처"}
          counterpartyName={statement.vendor ?? ""}
        />

        <DocFooter note={`${company.bizName || company.name} · ${isPO ? "발주서" : "거래명세서"}`} />
      </Page>
    </Document>
  );
}
