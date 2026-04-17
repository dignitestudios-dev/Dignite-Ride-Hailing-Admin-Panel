"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BanknoteArrowDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";

import { StatsCard } from "@/app/dashboard/components/stats-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWithdrawalCommissionQuery } from "@/hooks/use-revenue-query";

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

function formatMoney(value?: number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
}

export default function WithdrawalCommissionPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [search, setSearch] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pendingStartDate, setPendingStartDate] = useState("");
  const [pendingEndDate, setPendingEndDate] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useWithdrawalCommissionQuery(
    page,
    limit,
    search,
    startDate,
    endDate
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [localSearch, search]);

  const rows = data?.data ?? [];
  const stats = data?.stats ?? {};
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const totalCount = pagination?.total ?? rows.length;
  const filtersApplied = Boolean(startDate || endDate);
  const showSkeletonRows = isLoading || isFetching;

  const totalWithdrawalsProcessed = Number(stats.totalWithdrawalsProcessed ?? 0);
  const totalCommissionRevenue = Number(stats.totalCommissionRevenue ?? 0);

  function handleExportCSV() {
    if (!rows.length) return;
    const csvRows = [
      ["Driver Name", "Withdrawal Amount", "Admin Commission", "Date"],
      ...rows.map((item) => [
        item.driverName ?? "",
        formatMoney(item.withdrawalAmount),
        formatMoney(item.adminCommission),
        formatDate(item.date),
      ]),
    ];
    const csv = csvRows
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "withdrawal-commission.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setStartDate("");
    setEndDate("");
    setPendingStartDate("");
    setPendingEndDate("");
    setPage(1);
  }

  function applyFilters() {
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
    setPage(1);
    setFilterDialogOpen(false);
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load withdrawal commission</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching withdrawal commission records.
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
            <BanknoteArrowDown className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Withdrawal Commission</h1>
            <p className="text-sm text-muted-foreground">
              Monitor withdrawal amounts and commission earned by the platform.
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
          title="Total Withdrawals Processed"
          value={Number.isFinite(totalWithdrawalsProcessed) ? totalWithdrawalsProcessed.toLocaleString() : "0"}
          icon={BanknoteArrowDown}
        />
        <StatsCard
          title="Total Commission Revenue"
          value={formatMoney(Number.isFinite(totalCommissionRevenue) ? totalCommissionRevenue : 0)}
          icon={BanknoteArrowDown}
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Search records, filter by date, and export withdrawal commission data.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative w-full min-w-[220px] md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Search by driver name"
                className="pl-9"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              title="Filters"
              className="rounded-lg"
              onClick={() => {
                setPendingStartDate(startDate);
                setPendingEndDate(endDate);
                setFilterDialogOpen(true);
              }}
            >
              <Filter className="size-4" />
            </Button>

            {filtersApplied ? (
              <Button
                variant="outline"
                size="icon"
                title="Reset Filters"
                className="rounded-lg"
                onClick={resetFilters}
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="icon"
              title="Export CSV"
              className="rounded-lg"
              onClick={handleExportCSV}
              disabled={!rows.length}
            >
              <Download className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-h-[68vh] overflow-auto rounded-xl border border-border/70 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/35 hover:bg-muted/35">
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Driver
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-right text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Withdrawal Amount
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-right text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Admin Commission
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeletonRows ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`withdrawal-sk-${index}`} className="border-border/50">
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-44 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4 text-right"><Skeleton className="ml-auto h-4 w-20 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4 text-right"><Skeleton className="ml-auto h-4 w-20 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24 bg-muted/90" /></TableCell>
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((item) => (
                <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="px-4 py-4">
                    <p className="max-w-[220px] truncate font-medium" title={item.driverName || "—"}>
                      {item.driverName || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right font-medium">{formatMoney(item.withdrawalAmount)}</TableCell>
                  <TableCell className="px-4 py-4 text-right font-medium">{formatMoney(item.adminCommission)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDate(item.date)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                  No withdrawal commission records found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="withdrawal-limit" className="text-sm text-muted-foreground">
            Rows per page
          </Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-20" id="withdrawal-limit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end gap-1">
          <span className="mr-2 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page <= 1}
            title="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => setPage(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages}
            title="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              Filters
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="withdrawal-start-date">Start date</Label>
              <Input
                id="withdrawal-start-date"
                type="date"
                value={pendingStartDate}
                onChange={(event) => setPendingStartDate(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="withdrawal-end-date">End date</Label>
              <Input
                id="withdrawal-end-date"
                type="date"
                value={pendingEndDate}
                onChange={(event) => setPendingEndDate(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setPendingStartDate(startDate);
                setPendingEndDate(endDate);
                setFilterDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={applyFilters}>Apply filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

