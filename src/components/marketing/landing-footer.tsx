import Link from "next/link";

/** 랜딩·공개 페이지 공용 푸터 (법적 고지 링크) */
export function LandingFooter() {
  return (
    <footer className="mt-auto space-y-3 border-t border-border py-6 text-center">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground">
          이용약관
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          개인정보처리방침
        </Link>
        <Link href="/refund" className="hover:text-foreground">
          환불정책
        </Link>
        <Link href="/pricing" className="hover:text-foreground">
          요금제
        </Link>
      </nav>
      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} 건설(gunseol)</p>
    </footer>
  );
}
