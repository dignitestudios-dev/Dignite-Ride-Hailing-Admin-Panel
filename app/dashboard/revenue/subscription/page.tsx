"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  ExternalLink,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { StatsCard } from "@/app/dashboard/components/stats-card";
import { Badge } from "@/components/ui/badge";
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
import { useSubscriptionRevenueQuery } from "@/hooks/use-revenue-query";
import type { SubscriptionStatusFilter } from "@/lib/api/revenue.api";

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

function formatPhoneWithPlus(phone?: string) {
  const value = String(phone ?? "").trim();
  if (!value || value === "—") return "—";
  return value.startsWith("+") ? value : `+${value}`;
}

function getStatusBadge(status?: string) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "active") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
        <ShieldCheck className="mr-1 size-3.5" />
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600">
      <ShieldX className="mr-1 size-3.5" />
      Expired
    </Badge>
  );
}

export default function SubscriptionRevenuePage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [search, setSearch] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [status, setStatus] = useState<SubscriptionStatusFilter>("all");
  const [pendingStatus, setPendingStatus] = useState<SubscriptionStatusFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pendingStartDate, setPendingStartDate] = useState("");
  const [pendingEndDate, setPendingEndDate] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useSubscriptionRevenueQuery(
    page,
    limit,
    search,
    startDate,
    endDate,
    status
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
  const filtersApplied = Boolean(startDate || endDate || status !== "all");
  const showSkeletonRows = isLoading || isFetching;

  const totalRevenue = useMemo(() => {
    const fromApi = Number(stats.totalRevenue ?? stats.totalRevenueUSD ?? stats.totalAmount);
    if (Number.isFinite(fromApi)) return fromApi;
    return rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [stats, rows]);

  const activeCount = useMemo(() => {
    const fromApi = Number(stats.activeSubscriptions ?? stats.activeCount);
    if (Number.isFinite(fromApi)) return fromApi;
    return rows.filter((item) => String(item.subscriptionStatus).toLowerCase() === "active").length;
  }, [stats, rows]);

  const expiredCount = useMemo(() => {
    const fromApi = Number(stats.expiredSubscriptions ?? stats.expiredCount);
    if (Number.isFinite(fromApi)) return fromApi;
    return rows.filter((item) => String(item.subscriptionStatus).toLowerCase() !== "active").length;
  }, [stats, rows]);

  function handleExportCSV() {
    if (!rows.length) return;
    const csvRows = [
      ["Driver Name", "Email", "Phone", "Status", "Purchase Date", "Expiry Date", "Amount"],
      ...rows.map((item) => [
        item.driverName ?? "",
        item.email ?? "",
        item.phone ?? "",
        item.subscriptionStatus ?? "",
        formatDate(item.purchaseDate),
        formatDate(item.expiryDate),
        formatMoney(item.amount),
      ]),
    ];
    const csv = csvRows
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "subscription-revenue.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setStartDate("");
    setEndDate("");
    setStatus("all");
    setPendingStartDate("");
    setPendingEndDate("");
    setPendingStatus("all");
    setPage(1);
  }

  function applyFilters() {
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
    setStatus(pendingStatus);
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
          <h2 className="text-lg font-semibold">Failed to load subscription revenue</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching subscription revenue records.
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
            <CircleDollarSign className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscription Revenue</h1>
            <p className="text-sm text-muted-foreground">
              Track subscription purchases, status, and earnings.
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
        <StatsCard title="Total Records" value={totalCount.toLocaleString()} icon={CircleDollarSign} />
        <StatsCard title="Total Revenue" value={formatMoney(totalRevenue)} icon={CircleDollarSign} />
        <StatsCard title="Active Subscriptions" value={activeCount.toLocaleString()} icon={ShieldCheck} />
        <StatsCard title="Expired Subscriptions" value={expiredCount.toLocaleString()} icon={Clock3} />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Search by driver details, filter by date/status, and export report data.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative w-full min-w-[220px] md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Search by name or email"
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
                setPendingStatus(status);
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
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Email
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Phone
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Status
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Purchase Date
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Expiry Date
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-right text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeletonRows ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`subscription-sk-${index}`} className="border-border/50">
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-44 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-52 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-32 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-7 w-24 rounded-full bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4 text-right"><Skeleton className="ml-auto h-4 w-16 bg-muted/90" /></TableCell>
                </TableRow>
              ))
            ) : rows.length ? (
              rows.map((item) => (
                <TableRow key={item.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <p className="max-w-[190px] truncate font-medium" title={item.driverName || "—"}>
                        {item.driverName || "—"}
                      </p>
                      {item.driverId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-md border-border/70 px-2 text-xs font-medium"
                          title="Open driver profile"
                          onClick={() => router.push(`/dashboard/drivers/${item.driverId}`)}
                        >
                          <ExternalLink className="size-3.5" />
                          Profile
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {item.email ? (
                      <a href={`mailto:${item.email}`} className="inline-block max-w-[280px] truncate underline underline-offset-2" title={item.email}>
                        {item.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {item.phone && item.phone !== "—" ? (
                      <a
                        href={`tel:${item.phone}`}
                        className="inline-flex max-w-[180px] items-center gap-1 truncate underline underline-offset-2"
                        title={formatPhoneWithPlus(item.phone)}
                      >
                        <span className="truncate">{formatPhoneWithPlus(item.phone)}</span>
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4">{getStatusBadge(item.subscriptionStatus)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDate(item.purchaseDate)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDate(item.expiryDate)}</TableCell>
                  <TableCell className="px-4 py-4 text-right font-medium">{formatMoney(item.amount)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                  No subscription revenue records found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="subscription-limit" className="text-sm text-muted-foreground">
            Rows per page
          </Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-20" id="subscription-limit">
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
              <Label htmlFor="subscription-start-date">Start date</Label>
              <Input
                id="subscription-start-date"
                type="date"
                value={pendingStartDate}
                onChange={(event) => setPendingStartDate(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="subscription-end-date">End date</Label>
              <Input
                id="subscription-end-date"
                type="date"
                value={pendingEndDate}
                onChange={(event) => setPendingEndDate(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={pendingStatus}
                onValueChange={(value: SubscriptionStatusFilter) => setPendingStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setPendingStartDate(startDate);
                setPendingEndDate(endDate);
                setPendingStatus(status);
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

