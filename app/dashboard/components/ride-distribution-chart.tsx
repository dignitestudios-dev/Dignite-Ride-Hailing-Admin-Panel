"use client";

import { type RideAnalytics } from "@/lib/api/dashboard.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, Label } from "recharts";

const RIDE_COLORS: Record<string, string> = {
  luxury: "hsl(239 84% 67%)",
  economy: "hsl(160 60% 45%)",
  carpool: "hsl(38 92% 50%)",
};

const chartConfig: ChartConfig = {
  luxury: { label: "Luxury", color: RIDE_COLORS.luxury },
  economy: { label: "Economy", color: RIDE_COLORS.economy },
  carpool: { label: "Carpool", color: RIDE_COLORS.carpool },
};

interface RideDistributionChartProps {
  analytics: RideAnalytics;
}

export function RideDistributionChart({
  analytics,
}: RideDistributionChartProps) {
  const data = analytics.rideDistribution.map((item) => ({
    name: item.type,
    value: item.count,
    percentage: item.percentage,
    fill: RIDE_COLORS[item.type] ?? "hsl(var(--muted))",
  }));

  const totalRides = analytics.overview.totalRides;

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-border/50 dark:bg-gradient-to-br dark:from-card dark:to-card/80">
      <CardHeader>
        <CardTitle className="text-base">Ride Distribution</CardTitle>
        <CardDescription>Breakdown by ride type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-5">
          {/* Donut chart centered */}
          <ChartContainer config={chartConfig} className="h-[380px] w-full max-w-full flex items-center justify-center">
            <PieChart width={340} height={340}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={110}
                outerRadius={160}
                strokeWidth={2}
                stroke="var(--color-background)"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalRides.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 22}
                            className="fill-muted-foreground text-xs"
                          >
                            Total Rides
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Labels below the chart */}
          <div className="flex w-full flex-row gap-3 justify-between">
            {analytics.rideDistribution.map((item) => (
              <div
                key={item.type}
                className="flex flex-row items-center gap-2 rounded-lg border bg-muted/30 px-5 py-3 dark:border-border/30 dark:bg-muted/10 min-w-0 flex-1 justify-center"
              >
                <div
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor:
                      RIDE_COLORS[item.type] ?? "hsl(var(--muted))",
                  }}
                />
                <span className="text-xs font-medium capitalize text-muted-foreground">
                  {item.type}
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
