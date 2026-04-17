"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CarFront, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatsCard } from "@/app/dashboard/components/stats-card";
import { toast } from "sonner";
import {
  useUpdateUserStatusMutation,
  useUsersQuery,
} from "@/hooks/use-users-query";
import { DataTable } from "./components/data-table";

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [suppressTableSkeleton, setSuppressTableSkeleton] = useState(false);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useUsersQuery("driver", page, limit, search, startDate, endDate);
  const statusMutation = useUpdateUserStatusMutation("driver");

  const drivers = data?.data ?? [];
  const pagination = data?.pagination;
  const totalDrivers = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const filtersApplied = Boolean(search || startDate || endDate);

  useEffect(() => {
    if (suppressTableSkeleton && !isFetching) {
      setSuppressTableSkeleton(false);
    }
  }, [suppressTableSkeleton, isFetching]);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus =
      currentStatus?.toLowerCase() === "active" ? "deactivated" : "active";
    setSuppressTableSkeleton(true);
    try {
      await statusMutation.mutateAsync({ id, status: nextStatus });
      toast.success(
        `Driver ${nextStatus === "active" ? "activated" : "deactivated"} successfully`
      );
    } catch {
      setSuppressTableSkeleton(false);
      toast.error("Failed to update driver status");
    }
  };

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load drivers</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching driver data.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <CarFront className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
            <p className="text-sm text-muted-foreground">
              View and manage all driver accounts from one place.
            </p>
          </div>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          disabled={isFetching}
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Drivers"
          value={totalDrivers.toLocaleString()}
          icon={CarFront}
          description={
            filtersApplied
              ? "Count reflects currently applied filters."
              : "All registered drivers."
          }
        />
      </div>

      <DataTable
        users={drivers}
        loading={isLoading || (isFetching && !suppressTableSkeleton)}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        totalPages={totalPages}
        search={search}
        setSearch={setSearch}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onToggleStatus={handleStatusToggle}
        togglingUserId={statusMutation.variables?.id ?? null}
        isToggling={statusMutation.isPending}
      />
    </div>
  );
}
