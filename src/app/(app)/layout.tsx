import { requireAuth } from "@/lib/auth/context";
import { TopBar } from "@/components/app-shell/top-bar";
import { BottomNav } from "@/components/app-shell/bottom-nav";

/**
 * 보호 라우트 셸 (모바일 우선).
 * 상단바 + 콘텐츠 + 하단 탭바. 콘텐츠는 하단 탭바에 가리지 않게 패딩 확보.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar workspaceName={ctx.workspaceName} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 md:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
