"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { StatsCard } from "@/app/dashboard/components/stats-card";
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
import {
  Input
} from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { useNotificationsQuery, useSendNotificationMutation } from "@/hooks/use-notifications-query";
import type { NotificationItem, NotificationSort, SendNotificationPayload } from "@/lib/api/notifications.api";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

function getRecipientBadge(type?: string) {
  const normalized = String(type ?? "").toLowerCase();
  if (normalized.includes("driver")) {
    return (
      <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600">
        <UserCheck className="mr-1 size-3.5" />
        Drivers
      </Badge>
    );
  }
  if (normalized.includes("rider") || normalized.includes("user") || normalized.includes("passenger")) {
    return (
      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
        <Users className="mr-1 size-3.5" />
        Passengers
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
      <Bell className="mr-1 size-3.5" />
      Both
    </Badge>
  );
}

function getStatusBadge(status?: string) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "sent" || normalized === "success") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
        <CheckCircle2 className="mr-1 size-3.5" />
        Sent
      </Badge>
    );
  }
  if (normalized === "scheduled") {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600">
        <Clock3 className="mr-1 size-3.5" />
        Scheduled
      </Badge>
    );
  }
  if (normalized === "failed") {
    return (
      <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600">
        <XCircle className="mr-1 size-3.5" />
        Failed
      </Badge>
    );
  }
  return <Badge variant="secondary">Unknown</Badge>;
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [search, setSearch] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [sort, setSort] = useState<NotificationSort>("desc");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [formErrors, setFormErrors] = useState<{
    audienceType?: string;
    deliveryType?: string;
    scheduledFor?: string;
    title?: string;
    message?: string;
  }>({});
  const [formData, setFormData] = useState({
    audienceType: "both" as "both" | "drivers" | "riders",
    title: "",
    message: "",
    deliveryType: "immediate" as "immediate" | "scheduled",
    scheduledFor: "",
  });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useNotificationsQuery(page, limit, search, sort);
  const sendMutation = useSendNotificationMutation();
  const isSendPending = sendMutation.isPending;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== localSearch) {
        setPage(1);
        setSearch(localSearch);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [localSearch, search]);

  const notifications = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const totalNotifications = pagination?.total ?? notifications.length;
  const sentCount = useMemo(() => notifications.filter((item) => String(item.status).toLowerCase() === "sent").length, [notifications]);
  const scheduledCount = useMemo(() => notifications.filter((item) => String(item.status).toLowerCase() === "scheduled").length, [notifications]);
  const showSkeletonRows = isLoading || isFetching;

  function clearFieldError(field: keyof typeof formErrors) {
    if (!formErrors[field]) return;
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateForm() {
    const errors: typeof formErrors = {};
    if (!formData.audienceType) errors.audienceType = "Recipient type is required.";
    if (!formData.deliveryType) errors.deliveryType = "Delivery type is required.";
    if (formData.deliveryType === "scheduled" && !formData.scheduledFor) {
      errors.scheduledFor = "Scheduled date and time is required.";
    }
    if (!formData.title.trim()) errors.title = "Notification title is required.";
    if (!formData.message.trim()) errors.message = "Notification message is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleExportCSV() {
    if (!notifications.length) return;
    const rows = [
      ["Title", "Message", "Recipient Type", "Date & Time", "Status"],
      ...notifications.map((item) => [
        item.title,
        item.messagePreview || item.message || "",
        item.recipientType,
        formatDateTime(item.dateAndTime),
        item.status,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "notifications.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function openDetails(item: NotificationItem) {
    setSelectedNotification(item);
    setDetailsOpen(true);
  }

  function openPreview() {
    if (!validateForm()) return;
    setPreviewOpen(true);
  }

  async function sendNotification() {
    try {
      const payload: SendNotificationPayload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        recipientType: formData.audienceType,
      };
      if (formData.deliveryType === "scheduled" && formData.scheduledFor) {
        payload.scheduledFor = new Date(formData.scheduledFor).toISOString();
      }

      await sendMutation.mutateAsync(payload);
      toast.success("Notification queued successfully.");
      setPreviewOpen(false);
      setComposeOpen(false);
      setFormErrors({});
      setFormData({
        audienceType: "both",
        title: "",
        message: "",
        deliveryType: "immediate",
        scheduledFor: "",
      });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to send notification.");
    }
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load notifications</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching notifications.
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
            <Bell className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Send and manage push notifications for drivers and passengers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setComposeOpen(true);
              setPreviewOpen(false);
              setFormErrors({});
            }}
            className="gap-2"
          >
            <Megaphone className="size-4" />
            Send Notification
          </Button>
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Total Notifications" value={totalNotifications.toLocaleString()} icon={Bell} />
        <StatsCard title="Sent" value={sentCount.toLocaleString()} icon={CheckCircle2} />
        <StatsCard title="Scheduled" value={scheduledCount.toLocaleString()} icon={Clock3} />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Search notifications, export logs, and open details to review delivery status.
          </div>

          <div className="flex w-full items-center justify-end gap-2 md:w-auto">
            <div className="relative w-full min-w-[220px] md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Search by title"
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              title="Export CSV"
              onClick={handleExportCSV}
              disabled={!notifications.length}
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
                Title
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Recipient
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                  onClick={() => {
                    setSort((value) => (value === "desc" ? "asc" : "desc"));
                    setPage(1);
                  }}
                >
                  Date &amp; Time
                  {sort === "desc" ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />}
                </button>
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Status
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-right text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeletonRows ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`notifications-sk-${index}`} className="border-border/50">
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-52 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-7 w-28 rounded-full bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-40 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-7 w-24 rounded-full bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4 text-right"><Skeleton className="ml-auto h-8 w-16 bg-muted/90" /></TableCell>
                </TableRow>
              ))
            ) : notifications.length ? (
              notifications.map((item) => (
                <TableRow key={item.id} className="cursor-pointer border-border/50 hover:bg-muted/30" onClick={() => openDetails(item)}>
                  <TableCell className="max-w-[420px] px-4 py-4">
                    <p className="max-w-[260px] truncate font-medium" title={item.title || "—"}>{item.title || "—"}</p>
                    <p className="max-w-[340px] truncate text-sm text-muted-foreground" title={item.messagePreview || item.message || "—"}>
                      {item.messagePreview || item.message || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-4">{getRecipientBadge(item.recipientType)}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {formatDateTime(item.dateAndTime)}
                  </TableCell>
                  <TableCell className="px-4 py-4">{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDetails(item);
                      }}
                    >
                      <Eye className="size-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                  No notifications found for current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="notifications-limit" className="text-sm text-muted-foreground">
            Rows per page
          </Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-20" id="notifications-limit">
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

      <Dialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) setPreviewOpen(false);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Push Notification</DialogTitle>
            <DialogDescription>
              Create a notification and preview it before sending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label>Recipient Type</Label>
                <Select
                  value={formData.audienceType}
                  onValueChange={(value: "both" | "drivers" | "riders") => {
                    setFormData((prev) => ({ ...prev, audienceType: value }));
                    clearFieldError("audienceType");
                  }}
                  disabled={isSendPending}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both (Drivers &amp; Passengers)</SelectItem>
                    <SelectItem value="drivers">Drivers Only</SelectItem>
                    <SelectItem value="riders">Passengers Only</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.audienceType ? (
                  <p className="text-xs text-rose-600">{formErrors.audienceType}</p>
                ) : null}
              </div>

              <div className="min-w-0 space-y-2">
                <Label>Delivery</Label>
                <Select
                  value={formData.deliveryType}
                  onValueChange={(value: "immediate" | "scheduled") => {
                    setFormData((prev) => ({ ...prev, deliveryType: value }));
                    clearFieldError("deliveryType");
                    if (value === "immediate") {
                      setFormErrors((prev) => ({ ...prev, scheduledFor: undefined }));
                    }
                  }}
                  disabled={isSendPending}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Send immediately</SelectItem>
                    <SelectItem value="scheduled">Schedule</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.deliveryType ? (
                  <p className="text-xs text-rose-600">{formErrors.deliveryType}</p>
                ) : null}
              </div>
            </div>

            {formData.deliveryType === "scheduled" ? (
              <div className="space-y-2">
                <Label>Scheduled Date &amp; Time</Label>
                <Input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  value={formData.scheduledFor}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, scheduledFor: event.target.value }));
                    clearFieldError("scheduledFor");
                  }}
                  disabled={isSendPending}
                />
                {formErrors.scheduledFor ? (
                  <p className="text-xs text-rose-600">{formErrors.scheduledFor}</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Notification Title</Label>
                <Input
                  value={formData.title}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, title: event.target.value }));
                    clearFieldError("title");
                  }}
                  placeholder="Enter title..."
                  maxLength={60}
                  disabled={isSendPending}
                />
                {formErrors.title ? (
                  <p className="text-xs text-rose-600">{formErrors.title}</p>
                ) : null}
                <p className="text-right text-xs text-muted-foreground">{formData.title.length}/60</p>
              </div>

            <div className="space-y-2">
              <Label>Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, message: event.target.value }));
                    clearFieldError("message");
                  }}
                  placeholder="Enter message..."
                  rows={5}
                  maxLength={200}
                  disabled={isSendPending}
                />
                {formErrors.message ? (
                  <p className="text-xs text-rose-600">{formErrors.message}</p>
                ) : null}
                <p className="text-right text-xs text-muted-foreground">{formData.message.length}/200</p>
              </div>
            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={isSendPending}>
              Cancel
            </Button>
            <Button className="gap-2" onClick={openPreview} disabled={isSendPending}>
              <Send className="size-4" />
              Preview &amp; Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview Notification</DialogTitle>
            <DialogDescription>
              Confirm recipient type and delivery before sending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="mx-auto w-full max-w-sm rounded-3xl bg-gray-900 p-4 shadow-2xl">
              <div className="space-y-2 rounded-2xl bg-white p-4 text-gray-900">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
                    <Bell className="size-4" />
                  </div>
                  <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Ride Hailing
                  </p>
                </div>
                <p className="text-sm font-bold break-words">{formData.title || "—"}</p>
                <p className="text-xs leading-relaxed text-gray-600 break-words whitespace-pre-wrap">
                  {formData.message || "—"}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-semibold capitalize">{formData.audienceType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold capitalize">{formData.deliveryType}</span>
              </div>
              {formData.deliveryType === "scheduled" ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Scheduled For</span>
                  <span className="font-semibold">{formatDateTime(formData.scheduledFor)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)} disabled={sendMutation.isPending}>
              Back
            </Button>
            <Button onClick={sendNotification} className="gap-2" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Confirm &amp; Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedNotification(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>
              View full notification metadata.
            </DialogDescription>
          </DialogHeader>

          {selectedNotification ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-card/70 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold">{selectedNotification.title || "—"}</h3>
                  {getStatusBadge(selectedNotification.status)}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedNotification.message || selectedNotification.messagePreview || "—"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="mb-1 text-xs text-muted-foreground uppercase">Recipient Type</p>
                  {getRecipientBadge(selectedNotification.recipientType)}
                </div>
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="mb-1 text-xs text-muted-foreground uppercase">Date &amp; Time</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedNotification.dateAndTime)}</p>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

