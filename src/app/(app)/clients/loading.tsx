import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-12 w-full rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
