"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  ArrowLeft,
  CalendarClock,
  CarFront,
  CreditCard,
  Eye,
  FileText,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  Star,
  Users,
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

function getDocumentStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "approved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600";
  }
  if (normalized === "rejected") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-600";
  }
  if (normalized === "pending") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-600";
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

function getExpiryLabel(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.getTime() < Date.now() ? "Expired" : "Active";
}

function renderRating(value: number, reviews: number) {
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

function kvRow(label: string, value: ReactNode) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-muted/45 dark:bg-muted px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function DriverDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  const { data, isLoading, isFetching, isError, refetch } = useUserDetailsQuery(
    id,
    "driver"
  );

  const [selectedRide, setSelectedRide] = useState<any | null>(null);
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
  const [selectedDocumentImage, setSelectedDocumentImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

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
  const vehicleDetails = detailsRoot?.vehicleDetails ?? fullDetails?.vehicleDetails ?? {};
  const revenue = detailsRoot?.revenue ?? {};
  const referralInfo = detailsRoot?.referralInfo ?? {};
  const ratingAndFeedback = detailsRoot?.ratingAndFeedback ?? {};
  const approvedDocuments = detailsRoot?.approvedDocuments ?? {};

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
      riderName: ride?.user?.name ?? "—",
      riderEmail: ride?.user?.email ?? "—",
      driverName: ride?.driver?.name ?? "—",
      driverEmail: ride?.driver?.email ?? "—",
      vehicleType: ride?.driver?.vehicleDetails?.vehicleType ?? "—",
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

  const referrals = useMemo(() => {
    const source =
      referralInfo?.referrals ??
      fullDetails?.referrals ??
      fullDetails?.referredUsers ??
      [];
    if (!Array.isArray(source)) return [];
    return source.map((ref: any, index: number) => ({
      id: ref?.id ?? ref?._id ?? `ref-${index}`,
      name: ref?.name ?? ref?.fullName ?? "—",
      canViewProfile: Boolean(ref?.id ?? ref?._id),
      profileId: String(ref?.id ?? ref?._id ?? ""),
    }));
  }, [referralInfo, fullDetails]);

  const recentReviews = useMemo(() => {
    const source =
      ratingAndFeedback?.recentReviews ??
      detailsRoot?.recentReviews ??
      fullDetails?.recentReviews ??
      [];
    if (!Array.isArray(source)) return [];
    return source.map((review: any, index: number) => ({
      id: review?._id ?? review?.id ?? `review-${index}`,
      rating: toNumber(review?.rating ?? review?.stars ?? 0),
      comment:
        review?.description ??
        review?.comment ??
        review?.review ??
        review?.message ??
        "—",
      by:
        review?.reviewerName ??
        review?.user?.name ??
        review?.reviewer?.name ??
        (String(review?.reviewerType ?? "").toLowerCase() === "user"
          ? "Passenger"
          : review?.reviewerType ?? "Passenger"),
      date: review?.createdAt ?? review?.date ?? "",
    }));
  }, [ratingAndFeedback, detailsRoot, fullDetails]);

  const documents = useMemo(() => {
    const sourceDocs = [
      {
        key: "license",
        label: "Driver License",
        raw: approvedDocuments?.license ?? fullDetails?.driverLicense ?? null,
      },
      {
        key: "registration",
        label: "Vehicle Registration",
        raw:
          approvedDocuments?.registration ?? fullDetails?.vehicleRegistration ?? null,
      },
      {
        key: "insurance",
        label: "Insurance",
        raw: approvedDocuments?.insurance ?? fullDetails?.insurance ?? null,
      },
    ];

    return sourceDocs
      .filter((doc) => Boolean(doc.raw))
      .map((doc) => {
        const raw = doc.raw as any;
        return {
          key: doc.key,
          label: doc.label,
          status: raw?.status ?? "—",
          frontImage: raw?.frontImage ?? null,
          backImage: raw?.backImage ?? null,
          submittedAt: raw?.createdAt ?? raw?.veriffLastSubmittedAt ?? "",
          decisionAt: raw?.updatedAt ?? raw?.veriffDecisionTime ?? "",
          rejectReason: raw?.rejectReason ?? raw?.rejectionReason ?? null,
          licenseNumber: raw?.metadata?.licenseNumber ?? "—",
          expiryDate: raw?.metadata?.expiryDate ?? raw?.expiryDate ?? "—",
        };
      });
  }, [approvedDocuments, fullDetails]);

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
          <h2 className="text-lg font-semibold">Failed to load driver details</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching driver details.
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
        <h2 className="text-lg font-semibold">Driver not found</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find details for this driver.
        </p>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/drivers">
            <ArrowLeft className="size-4" />
            Back to Drivers
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
  const name = personalInfo?.name ?? fullDetails?.name ?? "Unknown Driver";
  const email = personalInfo?.email ?? fullDetails?.email ?? "—";
  const phone = formatPhone(
    personalInfo?.phone ?? fullDetails?.phoneNumber ?? fullDetails?.phone
  );
  const address = formatAddress(
    personalInfo?.address ??
      fullDetails?.address ??
      detailsRoot?.address ??
      fullDetails?.city ??
      ""
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
  const averageRating = toNumber(
    ratingAndFeedback?.rating ?? detailsRoot?.averageRating ?? fullDetails?.rating ?? 0
  );
  const reviewsReceived = toNumber(
    ratingAndFeedback?.reviewsCount ?? fullDetails?.reviewsReceived ?? 0
  );
  const reviewsGiven = toNumber(fullDetails?.reviewsGiven ?? 0);
  const locale = fullDetails?.locale ?? "—";
  const notificationsEnabled = yesNo(fullDetails?.isNotificationEnabled);
  const onboarded = yesNo(fullDetails?.signUpRecord?.isOnboarded);
  const suspendedByAdmin = yesNo(fullDetails?.isDeactivatedByAdmin);
  const deleted = yesNo(fullDetails?.isDeleted);
  const stripeCustomerLinked = fullDetails?.stripeCustomerId ? "Connected" : "Not connected";
  const stripeAccountLinked = fullDetails?.stripeAccountId ? "Connected" : "Not connected";
  const subscriptionStatus = detailsRoot?.subscriptionStatus ?? "—";
  const adminCommission = toNumber(revenue?.adminCommission ?? 0);
  const totalReferrals = toNumber(
    referralInfo?.totalReferrals ?? fullDetails?.totalReferrals ?? referrals.length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/drivers">
            <ArrowLeft className="size-4" />
            Back to Drivers
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
                <Image
                  src={profilePicture}
                  alt={`${name} profile`}
                  fill
                  className="object-cover"
                  sizes="96px"
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
                  Driver
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
            <p className="inline-flex items-center gap-2">
              <Phone className="size-4" />
              {phone}
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
        <StatsCard title="Wallet Balance" value={formatCurrency(walletBalance)} icon={CreditCard} />
        <StatsCard title="Referrals" value={totalReferrals} icon={Users} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Driver Profile Information</h3>
                <p className="text-xs text-muted-foreground">Core identity and account setup details</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 p-4 text-sm">
            {kvRow("Name", name || "—")}
            {kvRow("Email", email)}
            {kvRow("Phone", phone)}
            {kvRow("Locale", locale)}
            {kvRow("Registered", formatDate(joinedDate))}
            {kvRow("Notifications", asBadge(notificationsEnabled))}
            {kvRow("Stripe Customer", asBadge(stripeCustomerLinked))}
            {kvRow("Stripe Account", asBadge(stripeAccountLinked))}
            {kvRow("Onboarded", asBadge(onboarded))}
            {kvRow("Address", address)}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Activity & Monetization</h3>
                <p className="text-xs text-muted-foreground">Ride performance and financial metrics</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 p-4 text-sm">
            {kvRow(
              "Completed rides",
              toNumber(rideStats?.totalCompleted) ||
                rides.filter((ride) => String(ride.rideStatus).toLowerCase() === "completed")
                  .length
            )}
            {kvRow(
              "Cancelled rides",
              toNumber(rideStats?.totalCancelled) ||
                rides.filter((ride) => String(ride.rideStatus).toLowerCase() === "cancelled")
                  .length
            )}
            {kvRow("Last login", formatDateTime(lastLogin))}
            {kvRow("Last ride taken", formatDateTime(lastRideTaken))}
            {kvRow("Average rating", renderRating(averageRating, reviewsReceived))}
            {kvRow("Reviews received", reviewsReceived)}
            {kvRow("Reviews given", reviewsGiven)}
            {kvRow("Total referrals", totalReferrals)}
            {kvRow("Total debit spent", formatCurrency(totalSpent))}
            {kvRow("Admin commission", formatCurrency(adminCommission))}
            {kvRow("Subscription", asBadge(subscriptionStatus))}
            {kvRow("Suspended by admin", asBadge(suspendedByAdmin))}
            {kvRow("Deleted", asBadge(deleted))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <CarFront className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Vehicle Details</h3>
              <p className="text-xs text-muted-foreground">Verified vehicle and registration identity</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`capitalize ${getDocumentStatusBadgeClass(String(vehicleDetails?.status ?? "pending"))}`}
          >
            {String(vehicleDetails?.status ?? "pending")}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Vehicle Type</p>
            <p className="mt-1 font-semibold capitalize">{vehicleDetails?.vehicleType ?? fullDetails?.vehicleType ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Make & Model</p>
            <p className="mt-1 font-semibold">{`${vehicleDetails?.make ?? "—"} ${vehicleDetails?.model ?? ""}`.trim()}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Color / Year</p>
            <p className="mt-1 font-semibold">{`${vehicleDetails?.color ?? "—"} / ${vehicleDetails?.yearOfManufacture ?? "—"}`}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">License Plate</p>
            <p className="mt-1 font-semibold">{vehicleDetails?.licensePlateNumber ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Registration Number</p>
            <p className="mt-1 font-semibold">{vehicleDetails?.registrationNumber ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Region</p>
            <p className="mt-1 font-semibold">{vehicleDetails?.regionOfRegistration ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/35 p-3 md:col-span-2 xl:col-span-1">
            <p className="text-xs text-muted-foreground">Vehicle Identification Number</p>
            <p className="mt-1 break-all font-semibold">{vehicleDetails?.vehicleIdentificationNumber ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/35 p-3">
            <p className="text-xs text-muted-foreground">Registration Expiry</p>
            <p className="mt-1 font-semibold">{formatDate(vehicleDetails?.expiryDate)}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="rides" className="space-y-4">
        <TabsList className="h-12 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 p-1">
          <TabsTrigger
            value="rides"
            className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:dark:bg-primary data-[state=active]:text-primary-foreground"
          >
            Ride History
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:dark:bg-primary data-[state=active]:text-primary-foreground"
          >
            Transactions
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:dark:bg-primary data-[state=active]:text-primary-foreground"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="referrals"
            className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:dark:bg-primary data-[state=active]:text-primary-foreground"
          >
            Referrals
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:dark:bg-primary data-[state=active]:text-primary-foreground"
          >
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rides">
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-border/70 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/35 hover:bg-muted/35">
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Date
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Passenger
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    From
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    To
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Type
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Fare
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Status
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rides.length ? (
                  rides.map((ride) => (
                    <TableRow key={ride.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="px-4 py-3">{formatDateTime(ride.createdAt)}</TableCell>
                      <TableCell className="px-4 py-3">{ride.riderName}</TableCell>
                      <TableCell className="max-w-[220px] truncate px-4 py-3">{ride.from}</TableCell>
                      <TableCell className="max-w-[220px] truncate px-4 py-3">{ride.to}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="secondary" className="capitalize">
                          {String(ride.rideType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">{formatCurrency(ride.fare)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`capitalize ${getRideStatusBadgeClass(String(ride.rideStatus))}`}
                        >
                          {String(ride.rideStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedRide(ride)}
                          title="View ride details"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
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
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Date
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Description
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Amount
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Type
                  </TableHead>
                  <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                    Status
                  </TableHead>
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
                        <Badge
                          variant="outline"
                          className={`capitalize ${getTransactionTypeBadgeClass(String(tx.type))}`}
                        >
                          {String(tx.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 capitalize"
                        >
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

        <TabsContent value="documents">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatsCard title="Total Documents" value={documents.length} icon={FileText} />
              <StatsCard
                title="Approved Documents"
                value={documents.filter((doc) => String(doc.status).toLowerCase() === "approved").length}
                icon={ShieldCheck}
              />
              <StatsCard
                title="Pending / Rejected"
                value={documents.filter((doc) => String(doc.status).toLowerCase() !== "approved").length}
                icon={AlertCircle}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.length ? (
              documents.map((doc) => (
                <div key={doc.key} className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/15 p-1.5 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <h4 className="font-semibold">{doc.label}</h4>
                    </div>
                    <Badge
                      variant="outline"
                      className={`capitalize ${getDocumentStatusBadgeClass(String(doc.status))}`}
                    >
                      {String(doc.status)}
                    </Badge>
                  </div>

                  <div className="p-3">
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {doc.frontImage ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDocumentImage({ url: doc.frontImage!, title: `${doc.label} Front` })
                        }
                        className="group relative h-28 overflow-hidden rounded-lg border border-border/60"
                      >
                        <Image
                          src={doc.frontImage}
                          alt={`${doc.label} front`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                          <Eye className="size-5 text-white" />
                        </div>
                        <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                          Front
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                        No front image
                      </div>
                    )}

                    {doc.backImage ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDocumentImage({ url: doc.backImage!, title: `${doc.label} Back` })
                        }
                        className="group relative h-28 overflow-hidden rounded-lg border border-border/60"
                      >
                        <Image
                          src={doc.backImage}
                          alt={`${doc.label} back`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                          <Eye className="size-5 text-white" />
                        </div>
                        <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                          Back
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                        No back image
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="rounded-md bg-muted/45 dark:bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">License no.</span><p className="font-medium">{doc.licenseNumber}</p></div>
                    <div className="rounded-md bg-muted/45 dark:bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">Expiry</span><p className="mt-1 flex items-center gap-2 font-medium">{formatDate(doc.expiryDate)} {asBadge(getExpiryLabel(doc.expiryDate))}</p></div>
                    <div className="rounded-md bg-muted/45 dark:bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">Submitted</span><p className="font-medium">{formatDateTime(doc.submittedAt)}</p></div>
                    <div className="rounded-md bg-muted/45 dark:bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">Updated</span><p className="font-medium">{formatDateTime(doc.decisionAt)}</p></div>
                    <div className="rounded-md bg-muted/45 dark:bg-muted px-3 py-2"><span className="text-xs text-muted-foreground">Reject reason</span><p className="font-medium">{doc.rejectReason || "—"}</p></div>
                  </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No approved documents available.
              </div>
            )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="referrals">
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Referral Information</h3>
              <Badge variant="secondary">{totalReferrals} Total</Badge>
            </div>
            {referrals.length ? (
              <div className="max-h-[50vh] overflow-auto rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b bg-muted/35 hover:bg-muted/35">
                      <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase">Name</TableHead>
                      <TableHead className="px-4 py-3 text-[11px] font-semibold uppercase">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((ref) => (
                      <TableRow key={ref.id} className="border-border/50 hover:bg-muted/30">
                        <TableCell className="px-4 py-3">{ref.name}</TableCell>
                        <TableCell className="px-4 py-3">
                          {ref.canViewProfile ? (
                            <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
                              <Link href={`/dashboard/drivers/${ref.profileId}`}>
                                <ShieldCheck className="size-3.5" />
                                View profile
                                <ArrowUpRight className="size-3.5" />
                              </Link>
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Unavailable</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No referrals available.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ratings & Reviews</h3>
              <div className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-sm">
                {renderRating(averageRating, reviewsReceived)}
              </div>
            </div>
            {recentReviews.length ? (
              <div className="space-y-3">
                {recentReviews.map((review) => (
                  <div key={review.id} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="font-medium">{review.by}</p>
                      <div className="inline-flex items-center gap-1 text-sm">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span>{review.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(review.date)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No recent reviews available.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={profilePreviewOpen} onOpenChange={setProfilePreviewOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          {profilePicture ? (
            <div className="relative h-[85vh] overflow-hidden rounded-xl bg-black">
              <Image
                src={profilePicture}
                alt={`${name} profile`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedDocumentImage)} onOpenChange={(open) => !open && setSelectedDocumentImage(null)}>
        <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
          {selectedDocumentImage ? (
            <div className="relative h-[85vh] overflow-hidden rounded-xl bg-black">
              <Image
                src={selectedDocumentImage.url}
                alt={selectedDocumentImage.title}
                fill
                className="object-contain"
                sizes="100vw"
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
                  <p>
                    <span className="text-muted-foreground">Pickup:</span> {selectedRide.from}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Dropoff:</span> {selectedRide.to}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/70 p-4">
                  <p className="mb-2 font-semibold">Timing</p>
                  <div className="space-y-1">
                    <p>
                      <span className="text-muted-foreground">Created:</span> {formatDateTime(selectedRide.createdAt)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Start:</span> {formatDateTime(selectedRide.startTime)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">End:</span> {formatDateTime(selectedRide.endTime)}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Avg time:</span> {selectedRide.averageTime || 0} mins
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 p-4">
                  <p className="mb-2 font-semibold">Payment & Users</p>
                  <div className="space-y-1">
                    <p>
                      <span className="text-muted-foreground">Payment method:</span> {selectedRide.paymentMethod}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Payment status:</span> {selectedRide.paymentStatus}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Passenger:</span> {selectedRide.riderName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Driver:</span> {selectedRide.driverName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Vehicle:</span> {selectedRide.vehicleType}
                    </p>
                  </div>
                </div>
              </div>

              {(selectedRide.cancelledBy || selectedRide.cancellationReason || selectedRide.specialRequest) && (
                <div className="rounded-lg border border-border/70 p-4">
                  <p className="mb-2 font-semibold">Notes</p>
                  <div className="space-y-1">
                    <p>
                      <span className="text-muted-foreground">Cancelled by:</span> {selectedRide.cancelledBy ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Reason:</span> {selectedRide.cancellationReason ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Special request:</span> {selectedRide.specialRequest || "—"}
                    </p>
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

