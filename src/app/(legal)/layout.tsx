import Link from "next/link";
import { HardHat, ArrowLeft } from "lucide-react";
import { LandingFooter } from "@/components/marketing/landing-footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-safe pt-safe">
      <header className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HardHat className="size-4.5" />
          </span>
          <span className="font-bold">건설</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 홈
        </Link>
      </header>

      <main className="flex-1 py-4">{children}</main>

      <LandingFooter />
    </div>
  );
}
