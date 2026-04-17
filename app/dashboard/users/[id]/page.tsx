"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CarFront,
  CreditCard,
  Eye,
  MapPin,
  ReceiptText,
  Star,
  UserRound,
} from "lucide-react";

import { StatsCard } from "@/app/dashboard/components/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserDetailsQuery } from "@/hooks/use-users-query";

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatPhone(phone?: string) {
  if (!phone) return "—";
  if (phone.startsWith("+")) return phone;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+1${digits}`;
}

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function yesNo(value: unknown) {
  if (value === null || value === undefined) return "—";
  return value ? "Yes" : "No";
}

function formatAddress(value: unknown) {
  if (typeof value !== "string") return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(trimmed)) return "—";
  return trimmed;
}

function getRideStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "completed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600";
  }
  if (normalized === "cancelled") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-600";
  }
  return "border-slate-400/30 bg-slate-500/10 text-slate-600";
}

function getTransactionTypeBadgeClass(type: string) {
  const normalized = type.toLowerCase();
  if (normalized === "debit") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600";
  }
  if (normalized === "credit") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600";
  }
  return "border-slate-400/30 bg-slate-500/10 text-slate-600";
}

function getSemanticBadgeClass(value: string) {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("not connected") ||
    normalized.includes("rejected") ||
    normalized.includes("inactive") ||
    normalized.includes("expired") ||
    normalized === "no"
  ) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-600";
  }
  if (
    normalized.includes("approved") ||
    normalized.includes("active") ||
    normalized.includes("connected") ||
    normalized === "yes" ||
    normalized === "completed"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600";
  }
  if (normalized.includes("pending")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600";
  }
  return "border-slate-400/30 bg-slate-500/10 text-slate-600";
}

function asBadge(value: string) {
  return (
    <Badge variant="outline" className={getSemanticBadgeClass(value)}>
      {value}
    </Badge>
  );
}

function renderRating(value: number, reviews: number): ReactNode {
  const safe = Math.max(0, Math.min(5, value));
  const filled = Math.round(safe);
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-3.5 ${i < filled ? "fill-amber-400 text-amber-400" : "text-amber-200"}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold">{safe.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({reviews})</span>
    </div>
  );
}

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  const { data, isLoading, isFetching, isError, refetch } = useUserDetailsQuery(
    id,
    "rider"
  );
  const [selectedRide, setSelectedRide] = useState<any | null>(null);
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);

  const detailsRoot = useMemo(() => {
    const raw = data as any;
    if (raw?.data?.personalInfo || raw?.data?.fullDetails) return raw.data;
    return raw?.data ?? raw?.user ?? raw ?? null;
  }, [data]);

  const personalInfo =
    detailsRoot?.personalInfo ?? detailsRoot?.fullDetails ?? detailsRoot ?? {};
  const fullDetails = detailsRoot?.fullDetails ?? detailsRoot ?? {};
  const activityLogs = detailsRoot?.activityLogs ?? {};
  const rideStats = detailsRoot?.rideStats ?? {};

  const rides = useMemo(() => {
    const source =
      detailsRoot?.rideHistory ??
      detailsRoot?.rides ??
      detailsRoot?.trips ??
      detailsRoot?.tripHistory ??
      [];

    if (!Array.isArray(source)) return [];

    return source.map((ride: any, index: number) => ({
      id: ride?._id ?? ride?.id ?? `ride-${index}`,
      createdAt: ride?.createdAt ?? ride?.date ?? ride?.startTime ?? "",
      startTime: ride?.startTime ?? "",
      endTime: ride?.endTime ?? "",
      from:
        ride?.pickupPoint?.placeName ??
        ride?.pickupLocation?.placeName ??
        ride?.pickup ??
        ride?.from ??
        "—",
      to:
        ride?.dropOffPointRequested?.placeName ??
        ride?.dropoffPoint?.placeName ??
        ride?.dropoff ??
        ride?.to ??
        "—",
      rideType: ride?.rideType ?? "—",
      rideStatus: ride?.rideStatus ?? ride?.status ?? "Unknown",
      paymentStatus: ride?.paymentStatus ?? "—",
      paymentMethod: ride?.paymentMethod ?? "—",
      fare: toNumber(ride?.rideFare ?? ride?.fare ?? ride?.amount ?? 0),
      distance: toNumber(ride?.rideDistance ?? 0),
      averageTime: toNumber(ride?.averageTime ?? 0),
      cancelledBy: ride?.cancelledBy ?? null,
      cancellationReason: ride?.cancellationReason ?? null,
      specialRequest: ride?.specialRequest ?? "",
      driverName: ride?.driver?.name ?? "—",
      driverEmail: ride?.driver?.email ?? "—",
      vehicleType: ride?.driver?.vehicleDetails?.vehicleType ?? "—",
      raw: ride,
    }));
  }, [detailsRoot]);

  const transactions = useMemo(() => {
    const source =
      detailsRoot?.transactionHistory ??
      detailsRoot?.transactions ??
      detailsRoot?.recentPayments ??
      detailsRoot?.payments ??
      detailsRoot?.walletTransactions ??
      [];

    if (!Array.isArray(source)) return [];

    return source.map((tx: any, index: number) => ({
      id: tx?._id ?? tx?.id ?? `txn-${index}`,
      date: tx?.date ?? tx?.createdAt ?? tx?.paidAt ?? "",
      amount: toNumber(tx?.amount ?? tx?.value ?? tx?.total ?? tx?.price),
      type: tx?.type ?? tx?.transactionType ?? tx?.method ?? "—",
      status: tx?.status ?? "Completed",
      description: tx?.description ?? tx?.note ?? "—",
    }));
  }, [detailsRoot]);

  const totalSpent = useMemo(
    () =>
      transactions
        .filter((tx) => String(tx.type).toLowerCase() === "debit")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load passenger details</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching user details.
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
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!detailsRoot) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <h2 className="text-lg font-semibold">Passenger not found</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find details for this passenger.
        </p>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/users">
            <ArrowLeft className="size-4" />
            Back to Passengers
          </Link>
        </Button>
      </div>
    );
  }

  const profilePicture =
    personalInfo?.profilePicture ??
    fullDetails?.profilePicture ??
    fullDetails?.avatar ??
    "";
  const name = personalInfo?.name ?? fullDetails?.name ?? "Unknown User";
  const email = personalInfo?.email ?? fullDetails?.email ?? "—";
  const phone = formatPhone(
    personalInfo?.phone ?? fullDetails?.phoneNumber ?? fullDetails?.phone
  );
  const address = formatAddress(
    personalInfo?.address ?? fullDetails?.address ?? fullDetails?.city ?? detailsRoot?.address ?? ""
  );
  const isDeactivated = Boolean(
    fullDetails?.isDeactivatedByAdmin ?? fullDetails?.signUpRecord?.isDeactivatedByAdmin
  );
  const statusLabel = isDeactivated ? "Inactive" : "Active";
  const joinedDate =
    activityLogs?.accountCreationDate ?? fullDetails?.createdAt ?? undefined;
  const lastLogin = activityLogs?.lastLogin ?? fullDetails?.lastLogin ?? undefined;
  const lastRideTaken = activityLogs?.lastRideTaken ?? undefined;
  const walletBalance = toNumber(
    detailsRoot?.walletBalance ?? fullDetails?.balance ?? 0
  );
  const averageRating = toNumber(detailsRoot?.averageRating ?? fullDetails?.rating ?? 0);
  const reviewsReceived = toNumber(fullDetails?.reviewsReceived ?? 0);
  const reviewsGiven = toNumber(fullDetails?.reviewsGiven ?? 0);
  const locale = fullDetails?.locale ?? "—";
  const notificationsEnabled = yesNo(fullDetails?.isNotificationEnabled);
  const onboarded = yesNo(fullDetails?.signUpRecord?.isOnboarded);
  const suspendedByAdmin = yesNo(fullDetails?.isDeactivatedByAdmin);
  const deleted = yesNo(fullDetails?.isDeleted);
  const stripeLinked = fullDetails?.stripeCustomerId ? "Connected" : "Not connected";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/users">
            <ArrowLeft className="size-4" />
            Back to Passengers
          </Link>
        </Button>
        {isFetching && <span className="text-xs text-muted-foreground">Refreshing...</span>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-gradient-to-r from-primary to-secondary shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => profilePicture && setProfilePreviewOpen(true)}
              disabled={!profilePicture}
              className="group relative size-24 overflow-hidden rounded-full border-2 border-white/70 transition-transform hover:scale-[1.02] disabled:cursor-default"
              title={profilePicture ? "View profile image" : "No profile image"}
            >
              {profilePicture ? (
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${profilePicture})` }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/15 text-3xl font-bold text-white">
                  {name.slice(0, 1).toUpperCase()}
                </div>
              )}
              {profilePicture ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Eye className="size-6 text-white" />
                </div>
              ) : null}
            </button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white">{name}</h1>
              <p className="text-base text-white/85">{email}</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    statusLabel === "Active"
                      ? "border-emerald-300/60 bg-emerald-500/20 text-white"
                      : "border-white/40 bg-white/15 text-white"
                  }
                >
                  {statusLabel}
                </Badge>
                <Badge variant="secondary" className="bg-white/15 text-white">
                  Passenger
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-white/90">
            <p className="inline-flex items-center gap-2">
              <CalendarClock className="size-4" />
              Joined: {formatDate(joinedDate)}
            </p>
            <p className="inline-flex items-center gap-2">
              <MapPin className="size-4" />
              {address}
            </p>
            <div className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 p-1">
              {renderRating(averageRating, reviewsReceived)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Rides" value={rides.length} icon={CarFront} />
        <StatsCard title="Transactions" value={transactions.length} icon={ReceiptText} />
        <StatsCard title="Total Spent" value={formatCurrency(totalSpent)} icon={CreditCard} />
        <StatsCard title="Wallet Balance" value={formatCurrency(walletBalance)} icon={UserRound} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <UserRound className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Profile Information</h3>
                <p className="text-xs text-muted-foreground">Passenger identity and account setup details</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 p-4 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Name</span><span className="font-medium">{name || "—"}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Email</span><span className="font-medium">{email}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Address</span><span className="font-medium">{address}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Registered</span><span className="font-medium">{formatDate(joinedDate)}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Locale</span><span className="font-medium">{locale}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Notifications</span><span className="font-medium">{asBadge(notificationsEnabled)}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Stripe</span><span className="font-medium">{asBadge(stripeLinked)}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Onboarded</span><span className="font-medium">{asBadge(onboarded)}</span></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Activity Overview</h3>
                <p className="text-xs text-muted-foreground">Ride behavior and account health metrics</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 p-4 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Completed rides</span><span className="font-medium">{toNumber(rideStats?.totalCompleted) || rides.filter((ride) => String(ride.rideStatus).toLowerCase() === "completed").length}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Cancelled rides</span><span className="font-medium">{toNumber(rideStats?.totalCancelled) || rides.filter((ride) => String(ride.rideStatus).toLowerCase() === "cancelled").length}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Last login</span><span className="font-medium">{formatDateTime(lastLogin)}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Last ride taken</span><span className="font-medium">{formatDateTime(lastRideTaken)}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Account status</span><span className="font-medium">{asBadge(statusLabel)}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Average rating</span><span className="font-medium">{renderRating(averageRating, reviewsReceived)}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Reviews received</span><span className="font-medium">{reviewsReceived}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Reviews given</span><span className="font-medium">{reviewsGiven}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Suspended by admin</span><span className="font-medium">{asBadge(suspendedByAdmin)}</span></div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 px-5 py-2"><span className="text-muted-foreground">Deleted</span><span className="font-medium">{asBadge(deleted)}</span></div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="rides" className="space-y-4">
        <TabsList className="h-12 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 p-1">
          <TabsTrigger value="rides" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:dark:bg-primary data-[state=active]:text-primary-foreground">
            Ride History
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:dark:bg-primary data-[state=active]:text-primary-foreground">
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rides">
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/35 hover:bg-muted/35">
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Date</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">From</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">To</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Type</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Fare</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Status</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rides.length ? (
                  rides.map((ride) => (
                    <TableRow key={ride.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="px-4 py-3">{formatDateTime(ride.createdAt)}</TableCell>
                      <TableCell className="max-w-[220px] truncate px-4 py-3">{ride.from}</TableCell>
                      <TableCell className="max-w-[220px] truncate px-4 py-3">{ride.to}</TableCell>
                      <TableCell className="px-4 py-3"><Badge variant="secondary" className="capitalize">{String(ride.rideType)}</Badge></TableCell>
                      <TableCell className="px-4 py-3">{formatCurrency(ride.fare)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className={`capitalize ${getRideStatusBadgeClass(String(ride.rideStatus))}`}>
                          {String(ride.rideStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Button variant="outline" size="icon" onClick={() => setSelectedRide(ride)} title="View ride details">
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                      No ride history available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/35 hover:bg-muted/35">
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Date</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Description</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Amount</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Type</TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length ? (
                  transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="px-4 py-3">{formatDate(tx.date)}</TableCell>
                      <TableCell className="px-4 py-3">{tx.description}</TableCell>
                      <TableCell className="px-4 py-3">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className={`capitalize ${getTransactionTypeBadgeClass(String(tx.type))}`}>
                          {String(tx.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 capitalize">
                          {String(tx.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      No transactions available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={profilePreviewOpen} onOpenChange={setProfilePreviewOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          {profilePicture ? (
            <div className="overflow-hidden rounded-xl bg-black">
              <img
                src={profilePicture}
                alt={`${name} profile`}
                className="max-h-[85vh] w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedRide)} onOpenChange={(open) => !open && setSelectedRide(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ride Details</DialogTitle>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/70 bg-gradient-to-r from-primary/10 to-secondary/10 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Ride status</p>
                  <Badge variant="outline" className={`mt-1 ${getRideStatusBadgeClass(String(selectedRide.rideStatus))}`}>
                    {String(selectedRide.rideStatus)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fare</p>
                  <p className="mt-1 font-semibold">{formatCurrency(selectedRide.fare)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ride type</p>
                  <p className="mt-1 capitalize font-semibold">{String(selectedRide.rideType)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 p-4">
                <p className="mb-2 font-semibold">Locations</p>
                <div className="space-y-2">
                  <p><span className="text-muted-foreground">Pickup:</span> {selectedRide.from}</p>
                  <p><span className="text-muted-foreground">Dropoff:</span> {selectedRide.to}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 p-4">
                  <p className="mb-2 font-semibold">Timing</p>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground">Created:</span> {formatDateTime(selectedRide.createdAt)}</p>
                    <p><span className="text-muted-foreground">Start:</span> {formatDateTime(selectedRide.startTime)}</p>
                    <p><span className="text-muted-foreground">End:</span> {formatDateTime(selectedRide.endTime)}</p>
                    <p><span className="text-muted-foreground">Avg time:</span> {selectedRide.averageTime || 0} mins</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 p-4">
                  <p className="mb-2 font-semibold">Payment & Driver</p>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground">Payment method:</span> {selectedRide.paymentMethod}</p>
                    <p><span className="text-muted-foreground">Payment status:</span> {selectedRide.paymentStatus}</p>
                    <p><span className="text-muted-foreground">Driver:</span> {selectedRide.driverName}</p>
                    <p><span className="text-muted-foreground">Vehicle:</span> {selectedRide.vehicleType}</p>
                  </div>
                </div>
              </div>

              {(selectedRide.cancelledBy || selectedRide.cancellationReason || selectedRide.specialRequest) && (
                <div className="rounded-lg border border-border/70 p-4">
                  <p className="mb-2 font-semibold">Notes</p>
                  <div className="space-y-1">
                    <p><span className="text-muted-foreground">Cancelled by:</span> {selectedRide.cancelledBy ?? "—"}</p>
                    <p><span className="text-muted-foreground">Reason:</span> {selectedRide.cancellationReason ?? "—"}</p>
                    <p><span className="text-muted-foreground">Special request:</span> {selectedRide.specialRequest || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
