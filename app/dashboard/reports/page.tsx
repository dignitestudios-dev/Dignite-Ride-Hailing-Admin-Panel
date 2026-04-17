"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";

import { StatsCard } from "@/app/dashboard/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useReportsQuery } from "@/hooks/use-reports-query";

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

function getReportStatusBadge(status: string) {
  const normalized = String(status).toLowerCase();
  if (normalized === "resolved") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
        <CheckCircle2 className="mr-1 size-3.5" />
        Resolved
      </Badge>
    );
  }
  if (normalized === "rejected") {
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

function getUserTypeBadge(type?: string) {
  const normalized = String(type ?? "").toLowerCase();
  return (
    <Badge variant="secondary" className="capitalize">
      {normalized === "driver" ? "Driver" : "Passenger"}
    </Badge>
  );
}

function getMostReportedEntityPath(entity?: { entityId?: string; type?: string }) {
  if (!entity?.entityId) return null;
  const normalizedType = String(entity.type ?? "").toLowerCase();
  return normalizedType === "driver"
    ? `/dashboard/drivers/${entity.entityId}`
    : `/dashboard/users/${entity.entityId}`;
}

export default function ReportsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved" | "rejected">(
    "pending"
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useReportsQuery(page, limit, statusFilter);

  const reports = data?.data ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const mostReported = stats?.mostReportedEntities?.[0];
  const mostReportedPath = getMostReportedEntityPath(mostReported);
  const showSkeletonRows = isLoading || isFetching;

  function handleExportCSV() {
    if (!reports.length) return;
    const rows = [
      ["Reporter", "Reporter Type", "Reported Person", "Reported Type", "Reason", "Date", "Status"],
      ...reports.map((report) => [
        report.reporterName ?? "",
        report.reporterType ?? "",
        report.reportedPersonName ?? "",
        report.reportedPersonType ?? "",
        report.reportReason ?? "",
        formatDate(report.date),
        report.status ?? "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reports.csv";
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
          <h2 className="text-lg font-semibold">Failed to load reports</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching reports data.
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
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">
              Review, investigate and resolve user and driver reports.
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
        <StatsCard title="Total Reports" value={(stats?.totalReportsReceived ?? 0).toLocaleString()} icon={ShieldAlert} />
        <StatsCard title="Pending" value={(stats?.pendingReports ?? 0).toLocaleString()} icon={Clock3} />
        <StatsCard title="Resolved" value={(stats?.resolvedReports ?? 0).toLocaleString()} icon={CheckCircle2} />
        <StatsCard
          title="Most Reported"
          value={mostReported?.name ?? "N/A"}
          icon={Users}
          description={
            mostReported
              ? (
                <span className="inline-flex items-center gap-1.5">
                  <span>{mostReported.reportCount} report(s) • {mostReported.type}</span>
                  {mostReportedPath ? (
                    <button
                      type="button"
                      onClick={() => router.push(mostReportedPath)}
                      className="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Open details"
                    >
                      <ExternalLink className="size-3.5" />
                    </button>
                  ) : null}
                </span>
              )
              : "No entities yet"
          }
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Filter by report status and open details to investigate and take action.
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "pending" | "resolved" | "rejected") => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              title="Export CSV"
              onClick={handleExportCSV}
              disabled={!reports.length}
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
                Reporter
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Reported Person
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Reason
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Date
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeletonRows ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`reports-sk-${index}`} className="border-border/50">
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-36 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-36 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-52 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-7 w-24 rounded-full bg-muted/90" /></TableCell>
                </TableRow>
              ))
            ) : reports.length ? (
              reports.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer border-border/50 hover:bg-muted/30"
                  onClick={() => router.push(`/dashboard/reports/${report.reportId}`)}
                >
                  <TableCell className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="max-w-[220px] truncate font-medium" title={report.reporterName || "—"}>{report.reporterName || "—"}</p>
                      {getUserTypeBadge(report.reporterType)}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="max-w-[220px] truncate font-medium" title={report.reportedPersonName || "—"}>{report.reportedPersonName || "—"}</p>
                      {getUserTypeBadge(report.reportedPersonType)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[360px] px-4 py-4 text-muted-foreground">
                    <p className="truncate">{report.reportReason || "—"}</p>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDate(report.date)}</TableCell>
                  <TableCell className="px-4 py-4">{getReportStatusBadge(report.status)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  No reports found for the selected filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="reports-limit" className="text-sm text-muted-foreground">
            Rows per page
          </Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-20" id="reports-limit">
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
    </div>
  );
}
