"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems, settingsNav } from "@/components/app-shell/nav-items";

/**
 * 상단바.
 * - 모바일: 업체명 + 현재 화면 표시
 * - md 이상: 가로 내비게이션(데스크톱 보강)
 */
export function TopBar({ workspaceName }: { workspaceName: string }) {
  const pathname = usePathname();
  const current = navItems.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur pt-safe">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HardHat className="size-4.5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold">{workspaceName}</span>
            <span className="text-[11px] text-muted-foreground md:hidden">
              {current?.label ?? "건설"}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href={settingsNav.href}
            aria-label="설정"
            className={cn(
              "tap-target flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
              pathname.startsWith(settingsNav.href) && "text-foreground",
            )}
          >
            <settingsNav.icon className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
