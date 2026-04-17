"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useReportDetailsQuery,
  useReportUserStatusMutation,
  useResolveReportMutation,
} from "@/hooks/use-reports-query";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

function reportStatusBadge(status: string) {
  const normalized = String(status).toLowerCase();
  if (normalized === "resolved") {
    return (
      <Badge variant="outline" className="border-emerald-300/70 bg-emerald-500/20 text-white">
        Resolved
      </Badge>
    );
  }
  if (normalized === "rejected") {
    return (
      <Badge variant="outline" className="border-rose-300/70 bg-rose-500/20 text-white">
        Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-300/70 bg-amber-500/20 text-white">
      Pending
    </Badge>
  );
}

function userTypeBadge(value?: string) {
  const normalized = String(value ?? "").toLowerCase();
  const label = normalized === "driver" ? "Driver" : "User";
  return <Badge variant="secondary">{label}</Badge>;
}

function getProfilePath(type: string, id: string) {
  if (String(type).toLowerCase() === "driver") {
    return `/dashboard/drivers/${id}`;
  }
  return `/dashboard/users/${id}`;
}

function prettyValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value || "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ReportDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");

  const {
    data: report,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useReportDetailsQuery(id);
  const resolveMutation = useResolveReportMutation();
  const userStatusMutation = useReportUserStatusMutation();

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const relatedDetailsEntries = useMemo(() => {
    const source = report?.relatedDetails ?? {};
    return Object.entries(source);
  }, [report?.relatedDetails]);

  async function handleResolve() {
    try {
      await resolveMutation.mutateAsync({
        reportId: id,
        adminNotes: adminNotes.trim(),
      });
      toast.success("Report marked as resolved.");
      setResolveDialogOpen(false);
      setAdminNotes("");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to resolve report.");
    }
  }

  async function handleToggleUserStatus(args: {
    userId: string;
    userType: string;
    currentIsDeactivatedByAdmin: boolean;
    label: string;
  }) {
    try {
      await userStatusMutation.mutateAsync({
        reportId: id,
        userId: args.userId,
        userType: args.userType,
        currentIsDeactivatedByAdmin: args.currentIsDeactivatedByAdmin,
      });
      const next = args.currentIsDeactivatedByAdmin ? "activated" : "deactivated";
      toast.success(`${args.label} ${next} successfully.`);
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to update account status.");
    }
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load report details</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching report details.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <h2 className="text-lg font-semibold">Report not found</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find details for this report.
        </p>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/reports">
            <ArrowLeft className="size-4" />
            Back to Reports
          </Link>
        </Button>
      </div>
    );
  }

  const reporterInfo = report.reporterInfo;
  const reportedPersonInfo = report.reportedPersonInfo;
  const canResolve = String(report.status).toLowerCase() !== "resolved";

  const renderUserCard = (params: {
    label: string;
    user:
      | {
          id: string;
          name: string;
          email: string;
          phone: string;
          type: string;
          isDeactivatedByAdmin: boolean;
        }
      | null;
  }) => {
    const person = params.user;
    if (!person) {
      return (
        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{params.label} information unavailable.</p>
        </div>
      );
    }

    const isCurrentMutating =
      userStatusMutation.isPending && userStatusMutation.variables?.userId === person.id;
    const isActive = !person.isDeactivatedByAdmin;

    return (
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/15 p-1.5 text-primary">
              <UserRound className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{params.label}</p>
              <div className="mt-1">{userTypeBadge(person.type)}</div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              isActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : "border-rose-500/30 bg-rose-500/10 text-rose-600"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-lg font-semibold">{person.name || "—"}</p>

          <div className="rounded-md bg-muted/45 px-3 py-2">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-4" />
              {person.email ? (
                <a href={`mailto:${person.email}`} className="underline underline-offset-2">
                  {person.email}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="rounded-md bg-muted/45 px-3 py-2">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4" />
              {person.phone ? (
                <a href={`tel:${person.phone}`} className="underline underline-offset-2">
                  {person.phone}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={getProfilePath(person.type, person.id)}>
                <ExternalLink className="size-4" />
                View Profile
              </Link>
            </Button>

            <button
              type="button"
              disabled={isCurrentMutating}
              onClick={() =>
                handleToggleUserStatus({
                  userId: person.id,
                  userType: person.type,
                  currentIsDeactivatedByAdmin: person.isDeactivatedByAdmin,
                  label: params.label,
                })
              }
              className={`inline-flex h-9 w-full items-center justify-between rounded-full border pl-3 pr-1 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
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
                {isCurrentMutating ? (
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
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/reports">
            <ArrowLeft className="size-4" />
            Back to Reports
          </Link>
        </Button>
        {isFetching && <span className="text-xs text-muted-foreground">Refreshing...</span>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-gradient-to-r from-primary to-secondary shadow-sm">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Report Detail</h1>
              {reportStatusBadge(report.status)}
            </div>
            <p className="text-sm text-white/90">Report ID: {report.reportId}</p>
            <p className="text-sm text-white/85">Reason: {report.reportReason || "—"}</p>
          </div>

          {canResolve ? (
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={resolveMutation.isPending}
              onClick={() => setResolveDialogOpen(true)}
            >
              <CheckCircle2 className="size-4" />
              Mark Resolved
            </Button>
          ) : (
            <Badge variant="outline" className="border-emerald-300/70 bg-emerald-500/20 text-white">
              Resolved
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {renderUserCard({ label: "Reporter", user: reporterInfo })}
        {renderUserCard({ label: "Reported Person", user: reportedPersonInfo })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
            <div className="rounded-md bg-primary/15 p-1.5 text-primary">
              <FileText className="size-4" />
            </div>
            <h3 className="text-lg font-semibold">Report Summary</h3>
          </div>
          <div className="space-y-2 p-4 text-sm">
            <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-muted-foreground">Reason</span><p className="font-medium">{report.reportReason || "—"}</p></div>
            <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-muted-foreground">Description</span><p className="font-medium">{report.description || "—"}</p></div>
            <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-muted-foreground">Created at</span><p className="font-medium">{formatDateTime(report.createdAt)}</p></div>
            <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-muted-foreground">Resolved at</span><p className="font-medium">{formatDateTime(report.resolvedAt)}</p></div>
            <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-muted-foreground">Admin notes</span><p className="font-medium">{report.adminNotes || "—"}</p></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
            <div className="rounded-md bg-primary/15 p-1.5 text-primary">
              <MapPin className="size-4" />
            </div>
            <h3 className="text-lg font-semibold">Related Details</h3>
          </div>
          <div className="space-y-2 p-4 text-sm">
            {relatedDetailsEntries.length ? (
              relatedDetailsEntries.map(([key, value]) => (
                <div key={key} className="rounded-md bg-muted/45 px-3 py-2">
                  <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <p className="font-medium">{prettyValue(value)}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No related details available.</p>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={resolveDialogOpen}
        onOpenChange={(open) => {
          setResolveDialogOpen(open);
          if (!open) setAdminNotes("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Add optional admin notes before marking this report as resolved.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={adminNotes}
            onChange={(event) => setAdminNotes(event.target.value)}
            placeholder="Enter admin notes (optional)..."
            rows={5}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              disabled={resolveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={resolveMutation.isPending}
              className="min-w-[120px]"
            >
              {resolveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Mark Resolved"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
