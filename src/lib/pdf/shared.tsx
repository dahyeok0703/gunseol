import "server-only";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";

/** PDF 출력에 쓰는 업체 프로필 (이미지는 data URL 로 임베드) */
export interface PdfCompany {
  name: string;
  bizName: string | null;
  bizOwner: string | null;
  bizRegNo: string | null;
  bizPhone: string | null;
  bizAddress: string | null;
  logoDataUrl: string | null;
  stampDataUrl: string | null;
}

const INK = "#24211d";
const SUB = "#6f675b";
const LINE = "#e4ddcc";
const FAINT = "#f7f3ea";
const ACCENT = "#e08a00";

export const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoKR",
    fontSize: 9.5,
    color: INK,
    paddingTop: 36,
    paddingHorizontal: 36,
    paddingBottom: 56,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    paddingBottom: 10,
    marginBottom: 16,
  },
  companyName: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  companyLine: { fontSize: 8.5, color: SUB, marginTop: 2 },
  logo: { width: 96, height: 42, objectFit: "contain" },
  title: {
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 16,
  },
  metaTable: { borderWidth: 1, borderColor: LINE, marginBottom: 14 },
  metaRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE },
  metaRowLast: { flexDirection: "row" },
  metaLabel: {
    width: 70,
    backgroundColor: FAINT,
    padding: 5,
    fontWeight: "bold",
    fontSize: 8.5,
    borderRightWidth: 1,
    borderRightColor: LINE,
  },
  metaValue: { flex: 1, padding: 5, fontSize: 9 },
  tHead: {
    flexDirection: "row",
    backgroundColor: FAINT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LINE,
  },
  th: { padding: 5, fontWeight: "bold", fontSize: 8.5 },
  tRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#efe9dc" },
  td: { padding: 5, fontSize: 8.8 },
  num: { textAlign: "right" },
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox: { width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: SUB },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: INK,
    marginTop: 4,
    paddingTop: 6,
  },
  grandLabel: { fontSize: 11, fontWeight: "bold" },
  grandValue: { fontSize: 14, fontWeight: "bold" },
  disclaimer: {
    marginTop: 16,
    backgroundColor: "#fff8ec",
    borderWidth: 1,
    borderColor: "#f1d9a6",
    borderRadius: 4,
    padding: 8,
    fontSize: 8,
    color: "#7a5b14",
  },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginTop: 16, marginBottom: 6 },
  paragraph: { fontSize: 8.8, color: "#3a352e", marginBottom: 3 },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  signBox: { width: "46%" },
  signLabel: { fontSize: 9, fontWeight: "bold", marginBottom: 6 },
  signLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#b9b1a1",
    paddingBottom: 2,
    marginTop: 18,
  },
  stamp: { width: 56, height: 56, objectFit: "contain", marginLeft: 8 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: SUB,
  },
});

/** 무료 플랜 출력물 워터마크 (Pro 는 표시 안 함) */
export function Watermark({ show, text = "건설 · 무료 플랜" }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <Text
      fixed
      style={{
        position: "absolute",
        top: "44%",
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 56,
        fontWeight: "bold",
        color: "#0000000c",
        transform: "rotate(-22deg)",
      }}
    >
      {text}
    </Text>
  );
}

export function DocHeader({ company }: { company: PdfCompany }) {
  const title = company.bizName || company.name;
  const lines = [
    company.bizOwner ? `대표 ${company.bizOwner}` : null,
    company.bizRegNo ? `사업자등록번호 ${company.bizRegNo}` : null,
    company.bizPhone,
    company.bizAddress,
  ].filter(Boolean) as string[];

  return (
    <View style={styles.header}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.companyName}>{title}</Text>
        {lines.map((l, i) => (
          <Text key={i} style={styles.companyLine}>
            {l}
          </Text>
        ))}
      </View>
      {company.logoDataUrl ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={company.logoDataUrl} style={styles.logo} />
      ) : null}
    </View>
  );
}

export function MetaRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={last ? styles.metaRowLast : styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export function DocFooter({ note }: { note: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{note}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

/** 서명·날인란 (도장 이미지가 있으면 우리 측에 표시) */
export function SignatureBlock({
  company,
  counterpartyLabel,
  counterpartyName,
}: {
  company: PdfCompany;
  counterpartyLabel: string;
  counterpartyName: string;
}) {
  return (
    <View style={styles.signRow}>
      <View style={styles.signBox}>
        <Text style={styles.signLabel}>{counterpartyLabel}</Text>
        <View style={styles.signLine}>
          <Text style={{ fontSize: 9 }}>{counterpartyName || "　"}</Text>
          <Text style={{ fontSize: 8, color: SUB }}>(인)</Text>
        </View>
      </View>
      <View style={styles.signBox}>
        <Text style={styles.signLabel}>공급자 (을)</Text>
        <View style={styles.signLine}>
          <Text style={{ fontSize: 9 }}>{company.bizName || company.name}</Text>
          {company.stampDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={company.stampDataUrl} style={styles.stamp} />
          ) : (
            <Text style={{ fontSize: 8, color: SUB }}>(인)</Text>
          )}
        </View>
      </View>
    </View>
  );
}
