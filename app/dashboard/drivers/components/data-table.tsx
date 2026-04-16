"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";

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

interface DataTableProps {
  users: any[];
  loading?: boolean;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  totalPages: number;
  search: string;
  setSearch: (s: string) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => Promise<void>;
  togglingUserId?: string | null;
  isToggling?: boolean;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatPhone(phone?: string) {
  if (!phone) return { label: "—", tel: "" };
  if (phone.startsWith("+")) return { label: phone, tel: phone };

  const digits = phone.replace(/\D/g, "");
  if (!digits) return { label: "—", tel: "" };

  if (digits.length === 11 && digits.startsWith("1")) {
    return { label: `+${digits}`, tel: `+${digits}` };
  }

  return { label: `+1${digits}`, tel: `+1${digits}` };
}

export function DataTable({
  users,
  loading,
  page,
  setPage,
  limit,
  setLimit,
  totalPages,
  search,
  setSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onToggleStatus,
  togglingUserId,
  isToggling,
}: DataTableProps) {
  const router = useRouter();
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [pendingStartDate, setPendingStartDate] = useState(startDate);
  const [pendingEndDate, setPendingEndDate] = useState(endDate);
  const [localSearch, setLocalSearch] = useState(search);
  const [jumpToPage, setJumpToPage] = useState("");

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    if (localSearch === search) return;

    const handler = setTimeout(() => {
      setSearch(localSearch);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch, search, setPage, setSearch]);

  const filtersApplied = useMemo(
    () => Boolean(startDate || endDate),
    [startDate, endDate]
  );

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

  function handleExportCSV() {
    const rows = [
      ["Name", "Email", "Phone", "Status", "Registered"],
      ...users.map((user) => [
        user.name ?? "",
        user.email ?? "",
        formatPhone(user.phoneNumber).label === "—"
          ? ""
          : formatPhone(user.phoneNumber).label,
        user.status ?? "",
        user.createdAt ? formatDate(user.createdAt) : "",
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "drivers.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const maxPage = Math.max(totalPages || 1, page, 1);

  function handleJumpToPage() {
    const parsed = Number(jumpToPage);
    if (!Number.isFinite(parsed)) return;

    const boundedPage = Math.min(Math.max(Math.floor(parsed), 1), maxPage);
    setPage(boundedPage);
    setJumpToPage("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Manage drivers with quick search, filters, status toggle, and export.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative w-full min-w-[220px] md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by name, email, or phone"
                className="pl-9"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              title="Filters"
              className="rounded-lg"
              onClick={() => setFilterDialogOpen(true)}
            >
              <Filter className="size-4" />
            </Button>

            {filtersApplied && (
              <Button
                variant="outline"
                size="icon"
                title="Reset Filters"
                className="rounded-lg"
                onClick={resetFilters}
              >
                <RotateCcw className="size-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              title="Export CSV"
              className="rounded-lg"
              onClick={handleExportCSV}
            >
              <Download className="size-4" />
            </Button>
          </div>
        </div>

        {filtersApplied && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary" className="font-normal">
              From: {startDate || "Any"}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              To: {endDate || "Any"}
            </Badge>
          </div>
        )}
      </div>

      <div className="max-h-[68vh] overflow-auto rounded-xl border border-border/70 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/35 hover:bg-muted/35">
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Name
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
                Registered
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`sk-${index}`} className="border-border/50">
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-36 bg-muted/90" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-44 bg-muted/90" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-28 bg-muted/90" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-7 w-28 rounded-full bg-muted/90" />
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Skeleton className="h-4 w-24 bg-muted/90" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length > 0 ? (
              users.map((user) => {
                const normalizedStatus = user.status?.toLowerCase();
                const isActive = normalizedStatus === "active";
                const isCurrentUserToggling =
                  Boolean(isToggling) && togglingUserId === user.id;
                const phone = formatPhone(user.phoneNumber);

                return (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer border-border/50 transition-colors hover:bg-muted/30"
                    onClick={() => router.push(`/dashboard/drivers/${user.id}`)}
                  >
                    <TableCell className="px-4 py-4 font-medium">
                      {user.name || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {user.email ? (
                        <a
                          href={`mailto:${user.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="underline underline-offset-2"
                        >
                          {user.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {phone.tel ? (
                        <a
                          href={`tel:${phone.tel}`}
                          onClick={(e) => e.stopPropagation()}
                          className="underline underline-offset-2"
                        >
                          {phone.label}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center">
                        <button
                          type="button"
                          disabled={isCurrentUserToggling}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await onToggleStatus(user.id, user.status || "");
                          }}
                          className={`inline-flex h-9 w-32 items-center justify-between rounded-full border pl-3 pr-1 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                              ? "border-primary/60 bg-primary/10 text-primary"
                              : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
                          }`}
                          title={isActive ? "Set inactive" : "Set active"}
                        >
                          <span>{isActive ? "Active" : "Inactive"}</span>
                          <span
                            className={`relative inline-flex h-6 w-10 items-center rounded-full border transition-colors ${
                              isActive
                                ? "border-primary/60 bg-primary"
                                : "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-600"
                            }`}
                          >
                            {isCurrentUserToggling ? (
                              <Loader2 className="m-auto size-3.5 animate-spin text-white" />
                            ) : (
                              <span
                                className={`absolute size-4 rounded-full bg-white shadow-sm transition-transform ${
                                  isActive ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            )}
                          </span>
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No drivers found for the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-sm text-muted-foreground">
            Rows per page
          </Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-20" id="page-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm text-muted-foreground">
            Page {page} of {maxPage}
          </span>
          <div className="flex items-center gap-1">
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
              onClick={() => setPage(Math.min(page + 1, maxPage))}
              disabled={page >= maxPage}
              title="Next"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {maxPage > 1 && (
            <div className="ml-2 flex items-center gap-2">
              <Input
                value={jumpToPage}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (!value) {
                    setJumpToPage("");
                    return;
                  }
                  const numeric = Math.min(Number(value), maxPage);
                  setJumpToPage(String(numeric));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJumpToPage();
                  }
                }}
                placeholder="Page"
                className="h-8 w-20"
                inputMode="numeric"
                min={1}
                max={maxPage}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleJumpToPage}
                disabled={!jumpToPage}
              >
                Go
              </Button>
            </div>
          )}
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
              <Label htmlFor="filter-start-date">Start date</Label>
              <Input
                id="filter-start-date"
                type="date"
                value={pendingStartDate}
                onChange={(e) => setPendingStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="filter-end-date">End date</Label>
              <Input
                id="filter-end-date"
                type="date"
                value={pendingEndDate}
                onChange={(e) => setPendingEndDate(e.target.value)}
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
