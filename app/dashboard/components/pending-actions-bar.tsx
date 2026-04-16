"use client";

import Link from "next/link";
import { type PendingActions } from "@/lib/api/dashboard.api";
import { FileWarning, UserPlus, ArrowRight } from "lucide-react";

interface PendingActionsBarProps {
  pendingActions: PendingActions;
}

export function PendingActionsBar({ pendingActions }: PendingActionsBarProps) {
  const items = [
    {
      label: "Pending Driver Requests",
      count: pendingActions.pendingDriverRequests,
      icon: UserPlus,
      href: "/dashboard/driver-requests",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Pending Reports",
      count: pendingActions.pendingReports,
      icon: FileWarning,
      href: "/dashboard/reports",
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-border/50 dark:bg-gradient-to-br dark:from-card dark:to-card/80"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-primary" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${item.bg}`}>
                <item.icon className={`size-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-2xl font-bold tabular-nums">{item.count}</p>
              </div>
            </div>
            <Link
              href={item.href}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md active:scale-[0.97]" aria-label={`Review ${item.label}`}
            >
              Review
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
