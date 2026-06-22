import Link from "next/link";
import { HardHat } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-5 pb-safe pt-safe">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HardHat className="size-6" />
          </span>
          <span className="text-2xl font-bold tracking-tight">건설</span>
        </Link>
        {children}
      </div>
      <p className="pb-4 text-center text-xs text-muted-foreground">
        인테리어 견적·현장관리 · 현장에서 폰으로
      </p>
    </div>
  );
}
