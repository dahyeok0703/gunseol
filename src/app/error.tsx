"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-warning/15 text-warning">
        <AlertTriangle className="size-7" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-bold">문제가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도해주세요. 계속되면 새로고침 해주세요.
        </p>
      </div>
      <Button size="lg" variant="accent" onClick={reset}>
        다시 시도
      </Button>
    </div>
  );
}
