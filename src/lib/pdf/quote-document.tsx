import "server-only";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formatKRW } from "@/lib/utils";
import { styles, DocHeader, DocFooter, MetaRow, Watermark, type PdfCompany } from "@/lib/pdf/shared";
import type { EstimateLine } from "@/lib/data/estimates";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ko-KR");

/**
 * 견적서 — 고객 제출용. **견적가만 노출하고 실행가·마진은 절대 포함하지 않는다.**
 * ⚠️ 최종 금액의 확인·책임은 업체에 있으며, 본 출력물은 작성 보조 결과다.
 */
export function QuoteDocument({
  company,
  clientName,
  projectName,
  siteAddress,
  version,
  createdAt,
  lines,
  totalPrice,
  watermark = false,
}: {
  company: PdfCompany;
  clientName: string | null;
  projectName: string;
  siteAddress: string | null;
  version: number;
  createdAt: string;
  lines: EstimateLine[];
  totalPrice: number;
  watermark?: boolean;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark show={watermark} />
        <DocHeader company={company} />
        <Text style={styles.title}>견 적 서</Text>

        <View style={styles.metaTable}>
          <MetaRow label="거래처" value={clientName ?? "—"} />
          <MetaRow label="현장" value={[projectName, siteAddress].filter(Boolean).join(" / ")} />
          <MetaRow label="견적일자" value={fmtDate(createdAt)} last />
        </View>

        {/* 라인 (견적가만) */}
        <View style={styles.tHead}>
          <Text style={[styles.th, { flex: 1.2 }]}>공정</Text>
          <Text style={[styles.th, { flex: 2.6 }]}>품목</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>단위</Text>
          <Text style={[styles.th, { flex: 0.8 }, styles.num]}>수량</Text>
          <Text style={[styles.th, { flex: 1.4 }, styles.num]}>단가</Text>
          <Text style={[styles.th, { flex: 1.6 }, styles.num]}>금액</Text>
        </View>
        {lines.map((l) => (
          <View key={l.id} style={styles.tRow} wrap={false}>
            <Text style={[styles.td, { flex: 1.2 }]}>{l.category ?? ""}</Text>
            <Text style={[styles.td, { flex: 2.6 }]}>{l.name}</Text>
            <Text style={[styles.td, { flex: 0.8 }]}>{l.unit ?? ""}</Text>
            <Text style={[styles.td, { flex: 0.8 }, styles.num]}>{l.qty}</Text>
            <Text style={[styles.td, { flex: 1.4 }, styles.num]}>{formatKRW(l.unit_price)}</Text>
            <Text style={[styles.td, { flex: 1.6 }, styles.num]}>
              {formatKRW(l.qty * l.unit_price)}
            </Text>
          </View>
        ))}

        {/* 합계 */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>공급가액 합계</Text>
              <Text>{formatKRW(totalPrice)}</Text>
            </View>
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>총 견적금액</Text>
              <Text style={styles.grandValue}>{formatKRW(totalPrice)}</Text>
            </View>
            <Text style={{ fontSize: 8, color: "#6f675b", textAlign: "right", marginTop: 3 }}>
              ※ 부가가치세 별도
            </Text>
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text>
            본 견적서는 작성 보조 도구로 만들어진 자료이며, 견적 금액의 최종 확인·책임은 업체에
            있습니다. 자재·현장 여건에 따라 실제 금액은 변동될 수 있습니다. (견적 v{version})
          </Text>
        </View>

        <DocFooter note={`${company.bizName || company.name} · 견적서`} />
      </Page>
    </Document>
  );
}
