"use client";

import { type UserMetrics } from "@/lib/api/dashboard.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserCheck, CarFront, Calendar } from "lucide-react";

interface RegistrationCardsProps {
  userMetrics: UserMetrics;
}

export function RegistrationCards({ userMetrics }: RegistrationCardsProps) {
  const cards = [
    {
      title: "New Rider Registrations",
      icon: UserCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      last7: userMetrics.newRiderRegistrations.last7Days,
      last30: userMetrics.newRiderRegistrations.last30Days,
    },
    {
      title: "New Driver Registrations",
      icon: CarFront,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      last7: userMetrics.newDriverRegistrations.last7Days,
      last30: userMetrics.newDriverRegistrations.last30Days,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-border/50 dark:bg-gradient-to-br dark:from-card dark:to-card/80"
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${card.bg}`}>
                <card.icon className={`size-5 ${card.color}`} />
              </div>
              <div>
                <CardTitle className="text-sm">{card.title}</CardTitle>
                <CardDescription>Recent activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-4 dark:border-border/30 dark:bg-muted/10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="size-3 text-muted-foreground" />
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Last 7 days
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {card.last7.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 dark:border-border/30 dark:bg-muted/10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="size-3 text-muted-foreground" />
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Last 30 days
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {card.last30.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
