"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-5 shadow-sm dark:border-border/50 dark:bg-gradient-to-br dark:from-card dark:to-card/80"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Pending actions skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-5 shadow-sm dark:border-border/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="size-11 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-border/50">
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm dark:border-border/50">
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="mx-auto h-48 w-48 rounded-full" />
        </div>
      </div>
    </div>
  );
}
