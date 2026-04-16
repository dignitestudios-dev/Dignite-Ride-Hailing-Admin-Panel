"use client";

import { type RideMetrics, type RideAnalytics } from "@/lib/api/dashboard.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface RideMetricsCardProps {
  rideMetrics: RideMetrics;
  overview: RideAnalytics["overview"];
}

export function RideMetricsCard({
  rideMetrics,
  overview,
}: RideMetricsCardProps) {
  const periods = [
    { label: "Today", key: "today" as const },
    { label: "This Week", key: "thisWeek" as const },
    { label: "This Month", key: "thisMonth" as const },
  ];

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-border/50 dark:bg-gradient-to-br dark:from-card dark:to-card/80">
      <CardHeader>
        <CardTitle className="text-base">Ride Metrics</CardTitle>
        <CardDescription>Completion &amp; cancellation overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Clock,
              value: overview.totalRides,
              label: "Total Rides",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              icon: CheckCircle2,
              value: overview.completedRides,
              label: "Completed",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              icon: XCircle,
              value: overview.cancelledRides,
              label: "Cancelled",
              color: "text-red-500",
              bg: "bg-red-500/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1.5 rounded-lg border bg-muted/30 p-3 dark:border-border/30 dark:bg-muted/10"
            >
              <div
                className={`flex size-9 items-center justify-center rounded-full ${stat.bg}`}
              >
                <stat.icon className={`size-4.5 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold tabular-nums">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-semibold text-emerald-500 tabular-nums">
                {overview.completedPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={overview.completedPercentage}
              className="h-2 bg-emerald-500/15 [&>[data-slot=progress-indicator]]:bg-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cancelled</span>
              <span className="font-semibold text-red-500 tabular-nums">
                {overview.cancelledPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={overview.cancelledPercentage}
              className="h-2 bg-red-500/15 [&>[data-slot=progress-indicator]]:bg-red-500"
            />
          </div>
        </div>

        {/* Time period breakdown */}
        <div className="overflow-hidden rounded-lg border dark:border-border/30">
          <div className="grid grid-cols-3 border-b bg-muted/50 px-4 py-2 dark:bg-muted/20">
            {periods.map((p) => (
              <p
                key={p.key}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {p.label}
              </p>
            ))}
          </div>
          <div className="divide-y dark:divide-border/30">
            <div className="grid grid-cols-3 px-4 py-3">
              {periods.map((p) => (
                <div key={p.key} className="space-y-0.5 text-center">
                  <p className="text-lg font-bold tabular-nums text-emerald-500">
                    {rideMetrics.totalRidesCompleted[p.key].toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 px-4 py-3">
              {periods.map((p) => (
                <div key={p.key} className="space-y-0.5 text-center">
                  <p className="text-lg font-bold tabular-nums text-red-500">
                    {rideMetrics.totalRidesCancelled[p.key].toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Cancelled</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
