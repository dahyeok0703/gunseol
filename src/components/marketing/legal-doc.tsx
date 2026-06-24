import { AlertTriangle } from "lucide-react";

/**
 * 법적 고지 문서 공용 레이아웃.
 *
 * ⚠️ 본 컴포넌트로 렌더링되는 약관·개인정보처리방침·환불정책 본문은 모두
 *    **예시 플레이스홀더**다. 실제 서비스 출시 전 반드시 변호사·노무/개인정보
 *    전문가의 검토를 받아 내용을 확정해야 한다. (계약서 표준 문구도 동일 —
 *    `src/lib/pdf/contract-document.tsx` 참고)
 */
export function LegalDoc({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">최종 업데이트: {updatedAt}</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs text-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <p>
          <strong>법률 검토 필요 (플레이스홀더):</strong> 아래 내용은 예시이며 법적 효력을 보장하지
          않습니다. 정식 출시 전 반드시 변호사·개인정보 전문가의 검토를 받아 확정하세요.
        </p>
      </div>

      <div className="legal-body space-y-5 text-sm leading-relaxed text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground">
        {children}
      </div>
    </article>
  );
}

/** 약관 한 조항 (제목 + 본문) */
export function Clause({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2>{heading}</h2>
      {children}
    </section>
  );
}
