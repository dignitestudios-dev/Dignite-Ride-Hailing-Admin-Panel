"use client";

import { useEffect, useState } from "react";
import { useDashboardStats, useRideAnalytics } from "@/hooks/use-dashboard";
import { StatsCard } from "./components/stats-card";
import { PendingActionsBar } from "./components/pending-actions-bar";
import { RideMetricsCard } from "./components/ride-metrics-card";
import { RideDistributionChart } from "./components/ride-distribution-chart";
import { RegistrationCards } from "./components/registration-cards";
import { DashboardSkeleton } from "./components/dashboard-skeleton";
import {
  Users,
  CarFront,
  DollarSign,
  Wallet,
  AlertCircle,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    isFetching: statsFetching,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    isFetching: analyticsFetching,
    refetch: refetchAnalytics,
  } = useRideAnalytics();

  const isLoading = statsLoading || analyticsLoading;
  const isFetching = statsFetching || analyticsFetching;
  const isError = statsError || analyticsError;
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setAnimateIn(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isLoading]);

  function handleRefresh() {
    refetchStats();
    refetchAnalytics();
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Loading your overview...
          </p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching your data.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const { userMetrics, rideMetrics, revenueMetrics, pendingActions } = stats;
  const sectionBaseClass =
    "transition-all duration-500 ease-out will-change-transform";
  const sectionHiddenClass = "translate-y-2 opacity-0";
  const sectionVisibleClass = "translate-y-0 opacity-100";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`${sectionBaseClass} ${
          animateIn ? sectionVisibleClass : sectionHiddenClass
        } flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Activity className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back — here&apos;s your platform overview.
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          disabled={isFetching}
        >
          <RefreshCw
            className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Stats cards */}
      <div
        className={`${sectionBaseClass} ${
          animateIn ? sectionVisibleClass : sectionHiddenClass
        } grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4`}
        style={{ transitionDelay: "70ms" }}
      >
        <StatsCard
          title="Active Passengers"
          value={userMetrics.totalActiveRiders.toLocaleString()}
          icon={Users}
          trend={{
            value: userMetrics.newRiderRegistrations.last7Days,
            label: "new this week",
          }}
        />
        <StatsCard
          title="Active Drivers"
          value={userMetrics.totalActiveDrivers.toLocaleString()}
          icon={CarFront}
          trend={{
            value: userMetrics.newDriverRegistrations.last7Days,
            label: "new this week",
          }}
        />
        <StatsCard
          title="Subscription Revenue"
          value={formatCurrency(revenueMetrics.subscriptionRevenueUSD)}
          icon={DollarSign}
          description="Total subscription earnings"
        />
        <StatsCard
          title="Commission Revenue"
          value={formatCurrency(
            revenueMetrics.withdrawalCommissionRevenueUSD
          )}
          icon={Wallet}
          description="Total withdrawal commissions"
        />
      </div>

      {/* Pending actions */}
      <div
        className={`${sectionBaseClass} ${
          animateIn ? sectionVisibleClass : sectionHiddenClass
        }`}
        style={{ transitionDelay: "120ms" }}
      >
        <PendingActionsBar pendingActions={pendingActions} />
      </div>

      {/* Charts row */}
      <div
        className={`${sectionBaseClass} ${
          animateIn ? sectionVisibleClass : sectionHiddenClass
        } grid grid-cols-1 gap-4 lg:grid-cols-2`}
        style={{ transitionDelay: "170ms" }}
      >
        {analytics && (
          <>
            <RideMetricsCard
              rideMetrics={rideMetrics}
              overview={analytics.overview}
            />
            <RideDistributionChart analytics={analytics} />
          </>
        )}
      </div>

      {/* Registration cards */}
      <div
        className={`${sectionBaseClass} ${
          animateIn ? sectionVisibleClass : sectionHiddenClass
        }`}
        style={{ transitionDelay: "220ms" }}
      >
        <RegistrationCards userMetrics={userMetrics} />
      </div>
    </div>
  );
}
