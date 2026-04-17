"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { StatsCard } from "@/app/dashboard/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useDriverRequestsQuery } from "@/hooks/use-users-query";

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

function formatPhone(phone?: string) {
  if (!phone) return "—";
  if (phone.startsWith("+")) return phone;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+1${digits}`;
}

function getRequestStatus(driver: any): "pending" | "approved" | "rejected" {
  if (driver?.requiresApproval === true) return "pending";
  const status = String(driver?.status ?? "").toLowerCase();
  if (status.includes("reject")) return "rejected";
  if (status.includes("pending")) return "pending";
  return "approved";
}

function getRequestStatusBadge(status: "pending" | "approved" | "rejected") {
  if (status === "approved") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
        <ShieldCheck className="mr-1 size-3.5" />
        Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600">
        <XCircle className="mr-1 size-3.5" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
      <Clock3 className="mr-1 size-3.5" />
      Pending
    </Badge>
  );
}

export default function DriverRequestsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("pending");
  const [search, setSearch] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDriverRequestsQuery(page, limit, search, statusFilter);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [localSearch, search]);

  const requests = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const totalCount = pagination?.total ?? requests.length;

  const pendingCount = useMemo(
    () => requests.filter((driver) => getRequestStatus(driver) === "pending").length,
    [requests]
  );
  const approvedCount = useMemo(
    () => requests.filter((driver) => getRequestStatus(driver) === "approved").length,
    [requests]
  );

  function handleExportCSV() {
    if (!requests.length) return;
    const rows = [
      ["Name", "Email", "Phone", "Status", "Registered"],
      ...requests.map((driver) => [
        driver.name ?? "",
        driver.email ?? "",
        formatPhone(driver.phoneNumber),
        getRequestStatus(driver),
        formatDate(driver.createdAt),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "driver-requests.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load driver requests</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching verification requests.
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
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Driver Requests</h1>
            <p className="text-sm text-muted-foreground">
              Review pending verification requests and open details to approve or reject.
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
        <StatsCard title="Total Requests" value={totalCount.toLocaleString()} icon={ShieldAlert} />
        <StatsCard title="Pending" value={pendingCount.toLocaleString()} icon={Clock3} />
        <StatsCard title="Approved" value={approvedCount.toLocaleString()} icon={ShieldCheck} />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Click a row to open request details and handle verification actions.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full min-w-[220px] md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by name, email or phone"
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "pending" | "approved") => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" title="Export CSV" onClick={handleExportCSV} disabled={!requests.length}>
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
                Contact
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Registered
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`sk-${index}`} className="border-border/50">
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-40 bg-muted/90" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-56 bg-muted/90" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-24 bg-muted/90" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-7 w-24 rounded-full bg-muted/90" />
                  </TableCell>
                </TableRow>
              ))
            ) : requests.length ? (
              requests.map((driver) => {
                const status = getRequestStatus(driver);
                return (
                  <TableRow
                    key={driver.id}
                    className="cursor-pointer border-border/50 hover:bg-muted/30"
                    onClick={() => router.push(`/dashboard/driver-requests/${driver.id}`)}
                  >
                    <TableCell className="px-4 py-4">
                      <p className="max-w-[220px] truncate font-medium" title={driver.name || "—"}>{driver.name || "—"}</p>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="space-y-0.5">
                        <p className="max-w-[320px] truncate text-sm" title={driver.email || "—"}>{driver.email || "—"}</p>
                        <p className="max-w-[170px] truncate text-xs text-muted-foreground" title={formatPhone(driver.phoneNumber)}>{formatPhone(driver.phoneNumber)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {formatDate(driver.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-4">{getRequestStatusBadge(status)}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                  No driver requests found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="driver-requests-page-size" className="text-sm text-muted-foreground">
            Rows per page
          </Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-20" id="driver-requests-page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="30">30</SelectItem>
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
    </div>
  );
}

