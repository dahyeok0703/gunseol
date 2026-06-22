import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="num text-5xl font-bold text-muted-foreground">404</p>
      <h1 className="text-lg font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-muted-foreground">주소가 바뀌었거나 삭제되었을 수 있어요.</p>
      <Button asChild size="lg" variant="accent">
        <Link href="/dashboard">대시보드로</Link>
      </Button>
    </div>
  );
}
