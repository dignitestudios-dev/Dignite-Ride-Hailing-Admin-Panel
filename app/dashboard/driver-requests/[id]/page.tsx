"use client";

import { useEffect, useMemo, useState, type MouseEvent, type WheelEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  Star,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useRespondDriverRequestMutation,
  useRespondDriverVerificationItemMutation,
  useUserDetailsQuery,
} from "@/hooks/use-users-query";

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

function formatPhone(phone?: string) {
  if (!phone) return "—";
  if (phone.startsWith("+")) return phone;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+1${digits}`;
}

function formatAddress(value: unknown) {
  if (typeof value !== "string") return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(trimmed)) return "—";
  return trimmed;
}

function getDocumentStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "approved") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600";
  if (normalized === "rejected") return "border-rose-500/30 bg-rose-500/10 text-rose-600";
  if (normalized === "pending") return "border-amber-500/30 bg-amber-500/10 text-amber-600";
  return "border-slate-400/30 bg-slate-500/10 text-slate-600";
}

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

type VerificationDoc = {
  id: string;
  key: string;
  label: string;
  status: string;
  frontImage: string | null;
  backImage: string | null;
  submittedAt: string;
  decisionAt: string;
  rejectReason: string | null;
  licenseNumber: string;
  expiryDate: string;
  metadata?: {
    vehicleIdentificationNumber?: string;
    registrationNumber?: string;
  };
};

function ImageViewer({
  images,
  initialIndex,
  title,
  onClose,
}: {
  images: { src: string; label: string }[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const reset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const goTo = (i: number) => {
    setIdx(i);
    reset();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (images.length <= 1) return;
      if (event.key === "ArrowLeft") goTo((idx - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") goTo((idx + 1) % images.length);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [idx, images.length, onClose]);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(0.3, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragging || !dragStart) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const onMouseUp = () => {
    setDragging(false);
    setDragStart(null);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: "rgba(4,6,14,0.97)" }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono tracking-widest text-white/30 uppercase">{title}</span>
          {images.length > 1 ? (
            <span className="text-[11px] font-mono text-white/20">{idx + 1}/{images.length}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button title="Zoom Out" onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.25).toFixed(2)))} className="flex size-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white">
            <ZoomOut className="size-3.5" />
          </button>
          <button onClick={reset} className="min-w-[42px] rounded-md border-0 bg-white/6 px-2 py-0.5 text-center text-[11px] font-mono text-white/40 transition-colors hover:text-white/70">
            {Math.round(zoom * 100)}%
          </button>
          <button title="Zoom In" onClick={() => setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))} className="flex size-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white">
            <ZoomIn className="size-3.5" />
          </button>
          <div className="mx-1 h-4 w-px bg-white/10" />
          <button title="Rotate Left" onClick={() => setRotation((r) => r - 90)} className="flex size-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white">
            <RotateCcw className="size-3.5" />
          </button>
          <button title="Rotate Right" onClick={() => setRotation((r) => r + 90)} className="flex size-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white">
            <RotateCw className="size-3.5" />
          </button>
          <div className="mx-1 h-4 w-px bg-white/10" />
          <button title="Close" onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white">
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={{
          cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
          userSelect: "none",
        }}
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
      >
        {images.length > 1 ? (
          <button
            onClick={() => goTo((idx - 1 + images.length) % images.length)}
            className="absolute top-1/2 left-4 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-2xl text-white/70 transition-colors hover:bg-white/15"
          >
            ‹
          </button>
        ) : null}

        <Image
          src={images[idx].src}
          alt={images[idx].label}
          width={1800}
          height={1200}
          draggable={false}
          className="pointer-events-none select-none object-contain"
          style={{
            maxWidth: "88vw",
            maxHeight: "74vh",
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: dragging ? "none" : "transform 0.2s cubic-bezier(0.34,1.4,0.64,1)",
            borderRadius: 8,
            boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          }}
        />

        {images.length > 1 ? (
          <button
            onClick={() => goTo((idx + 1) % images.length)}
            className="absolute top-1/2 right-4 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-2xl text-white/70 transition-colors hover:bg-white/15"
          >
            ›
          </button>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex shrink-0 justify-center gap-2 py-2">
          {images.map((im, i) => (
            <button
              key={`${im.src}-${i}`}
              onClick={() => goTo(i)}
              className={`h-9 w-14 overflow-hidden rounded-lg transition-all ${i === idx ? "ring-2 ring-white/50 opacity-100" : "opacity-35 hover:opacity-60"}`}
            >
              <Image src={im.src} alt={im.label} width={80} height={56} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <p className="pb-2 text-center text-[10px] tracking-wide text-white/15">
        Scroll to zoom · Drag to pan{images.length > 1 ? " · ← → navigate" : ""} · Esc to close
      </p>
    </div>
  );
}

export default function DriverRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  const { data, isLoading, isFetching, isError, refetch } = useUserDetailsQuery(id, "driver");
  const respondAllMutation = useRespondDriverRequestMutation();
  const respondItemMutation = useRespondDriverVerificationItemMutation();

  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
  const [imageViewer, setImageViewer] = useState<{
    open: boolean;
    images: { src: string; label: string }[];
    index: number;
    title: string;
  }>({ open: false, images: [], index: 0, title: "" });
  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    mode: "all" | "single";
    doc: VerificationDoc | null;
  }>({ open: false, mode: "all", doc: null });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    mode: "all" | "single";
    doc: VerificationDoc | null;
  }>({ open: false, mode: "all", doc: null });
  const [rejectReason, setRejectReason] = useState("");

  const detailsRoot = useMemo(() => {
    const raw = data as any;
    if (raw?.data?.personalInfo || raw?.data?.fullDetails) return raw.data;
    return raw?.data ?? raw?.user ?? raw ?? null;
  }, [data]);

  const personalInfo =
    detailsRoot?.personalInfo ?? detailsRoot?.fullDetails ?? detailsRoot ?? {};
  const fullDetails = detailsRoot?.fullDetails ?? detailsRoot ?? {};
  const activityLogs = detailsRoot?.activityLogs ?? {};
  const approvedDocuments = detailsRoot?.approvedDocuments ?? {};
  const vehicleDetails = detailsRoot?.vehicleDetails ?? fullDetails?.vehicleDetails ?? {};

  const documents = useMemo<VerificationDoc[]>(() => {
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
      {
        key: "vehicle",
        label: "Vehicle Verification",
        raw: vehicleDetails?._id ? vehicleDetails : null,
      },
    ];

    return sourceDocs
      .filter((doc) => Boolean(doc.raw))
      .map((doc) => {
        const raw = doc.raw as any;
        return {
          id: String(raw?._id ?? raw?.id ?? ""),
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
          metadata:
            doc.key === "vehicle"
              ? {
                  vehicleIdentificationNumber: raw?.vehicleIdentificationNumber ?? "",
                  registrationNumber: raw?.registrationNumber ?? "",
                }
              : undefined,
        };
      });
  }, [approvedDocuments, fullDetails, vehicleDetails]);

  const pendingDocs = useMemo(
    () => documents.filter((doc) => String(doc.status).toLowerCase() === "pending"),
    [documents]
  );
  const pendingCount = pendingDocs.length;

  const name = personalInfo?.name ?? fullDetails?.name ?? "Unknown Driver";
  const email = personalInfo?.email ?? fullDetails?.email ?? "—";
  const phone = formatPhone(personalInfo?.phone ?? fullDetails?.phone ?? "");
  const address = formatAddress(
    personalInfo?.address ?? fullDetails?.address ?? fullDetails?.city ?? detailsRoot?.address ?? ""
  );
  const profilePicture = personalInfo?.profilePicture ?? fullDetails?.profilePicture ?? "";
  const joinedDate = activityLogs?.accountCreationDate ?? fullDetails?.createdAt ?? undefined;
  const rating = toNumber(detailsRoot?.ratingAndFeedback?.rating ?? fullDetails?.rating ?? 0);
  const reviewsCount = toNumber(
    detailsRoot?.ratingAndFeedback?.reviewsCount ?? fullDetails?.reviewsReceived ?? 0
  );
  const requestStatus = pendingCount > 0 ? "pending" : "approved";

  const isMutating = respondAllMutation.isPending || respondItemMutation.isPending;

  function openImageViewerForDoc(doc: VerificationDoc, startIndex: number) {
    const images = [
      doc.frontImage ? { src: doc.frontImage, label: `${doc.label} — Front` } : null,
      doc.backImage ? { src: doc.backImage, label: `${doc.label} — Back` } : null,
    ].filter(Boolean) as { src: string; label: string }[];

    if (!images.length) return;
    setImageViewer({
      open: true,
      images,
      index: Math.max(0, Math.min(startIndex, images.length - 1)),
      title: doc.label,
    });
  }

  async function handleConfirmApprove() {
    if (approveDialog.mode === "all") {
      try {
        await respondAllMutation.mutateAsync({ id, status: "approved" });
        toast.success("All pending verification items approved.");
        setApproveDialog({ open: false, mode: "all", doc: null });
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to approve request.");
      }
      return;
    }

    const target = approveDialog.doc;
    if (!target) return;
    try {
      await respondItemMutation.mutateAsync({
        driverId: id,
        itemId: target.id,
        status: "approved",
        metadata: target.metadata,
      });
      toast.success(`${target.label} approved.`);
      setApproveDialog({ open: false, mode: "all", doc: null });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to approve document.");
    }
  }

  async function handleConfirmReject() {
    const reason = rejectReason.trim();
    if (!reason) {
      toast.error("Please enter rejection reason.");
      return;
    }

    if (rejectDialog.mode === "all") {
      try {
        await respondAllMutation.mutateAsync({ id, status: "rejected", reason });
        toast.success("All pending verification items rejected.");
        setRejectDialog({ open: false, mode: "all", doc: null });
        setRejectReason("");
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to reject request.");
      }
      return;
    }

    const target = rejectDialog.doc;
    if (!target) return;
    try {
      await respondItemMutation.mutateAsync({
        driverId: id,
        itemId: target.id,
        status: "rejected",
        reason,
        metadata: target.metadata,
      });
      toast.success(`${target.label} rejected.`);
      setRejectDialog({ open: false, mode: "all", doc: null });
      setRejectReason("");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to reject document.");
    }
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to load request details</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching driver request details.
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
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/dashboard/driver-requests">
            <ArrowLeft className="size-4" />
            Back to Driver Requests
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
                <Badge variant="outline" className="border-white/40 bg-white/15 text-white">
                  Driver Request
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    requestStatus === "pending"
                      ? "border-amber-300/70 bg-amber-500/20 text-white"
                      : "border-emerald-300/70 bg-emerald-500/20 text-white"
                  }
                >
                  {requestStatus === "pending" ? "Pending" : "Approved"}
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
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-1.5">
              <Star className="size-4 fill-amber-300 text-amber-300" />
              <span className="font-semibold text-white">{rating.toFixed(1)}</span>
              <span className="text-white/80">({reviewsCount})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Verification Documents</h3>
              <p className="text-xs text-muted-foreground">Approve/reject individually or in bulk</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={isMutating || pendingCount === 0}
              onClick={() => setApproveDialog({ open: true, mode: "all", doc: null })}
            >
              <CheckCircle2 className="size-4" />
              Approve All Pending
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-2"
              disabled={isMutating || pendingCount === 0}
              onClick={() => {
                setRejectReason("");
                setRejectDialog({ open: true, mode: "all", doc: null });
              }}
            >
              <ShieldAlert className="size-4" />
              Reject All Pending
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.length ? (
            documents.map((doc) => {
              const isPending = String(doc.status).toLowerCase() === "pending";
              const isCurrentItemMutating =
                respondItemMutation.isPending &&
                respondItemMutation.variables?.itemId === doc.id;
              return (
                <div key={doc.key} className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-gradient-to-r from-primary/10 to-secondary/10 p-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/15 p-1.5 text-primary">
                        <CarFront className="size-4" />
                      </div>
                      <h4 className="font-semibold">{doc.label}</h4>
                    </div>
                    <Badge variant="outline" className={`capitalize ${getDocumentStatusBadgeClass(String(doc.status))}`}>
                      {String(doc.status)}
                    </Badge>
                  </div>

                  <div className="space-y-3 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {doc.frontImage ? (
                        <button
                          type="button"
                          onClick={() => openImageViewerForDoc(doc, 0)}
                          className="group relative h-28 overflow-hidden rounded-lg border border-border/60"
                        >
                          <Image src={doc.frontImage} alt={`${doc.label} front`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                            <Eye className="size-5 text-white" />
                          </div>
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">Front</span>
                        </button>
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                          No front image
                        </div>
                      )}

                      {doc.backImage ? (
                        <button
                          type="button"
                          onClick={() => openImageViewerForDoc(doc, doc.frontImage ? 1 : 0)}
                          className="group relative h-28 overflow-hidden rounded-lg border border-border/60"
                        >
                          <Image src={doc.backImage} alt={`${doc.label} back`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                            <Eye className="size-5 text-white" />
                          </div>
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">Back</span>
                        </button>
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                          No back image
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-xs text-muted-foreground">License no.</span><p className="font-medium">{doc.licenseNumber}</p></div>
                      <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-xs text-muted-foreground">Expiry</span><p className="font-medium">{formatDate(doc.expiryDate)}</p></div>
                      <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-xs text-muted-foreground">Submitted</span><p className="font-medium">{formatDateTime(doc.submittedAt)}</p></div>
                      <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-xs text-muted-foreground">Updated</span><p className="font-medium">{formatDateTime(doc.decisionAt)}</p></div>
                      <div className="rounded-md bg-muted/45 px-3 py-2"><span className="text-xs text-muted-foreground">Reject reason</span><p className="font-medium">{doc.rejectReason || "—"}</p></div>
                    </div>

                    {isPending ? (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="h-8 flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={isMutating}
                          onClick={() => setApproveDialog({ open: true, mode: "single", doc })}
                        >
                          {isCurrentItemMutating && respondItemMutation.variables?.status === "approved" ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Approve"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 flex-1"
                          disabled={isMutating}
                          onClick={() => {
                            setRejectReason("");
                            setRejectDialog({ open: true, mode: "single", doc });
                          }}
                        >
                          {isCurrentItemMutating && respondItemMutation.variables?.status === "rejected" ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Reject"
                          )}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No verification documents found for this driver.
            </div>
          )}
        </div>
      </div>

      <Dialog open={profilePreviewOpen} onOpenChange={setProfilePreviewOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          {profilePicture ? (
            <div className="relative h-[85vh] overflow-hidden rounded-xl bg-black">
              <Image src={profilePicture} alt={`${name} profile`} fill className="object-contain" sizes="100vw" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {imageViewer.open && imageViewer.images.length ? (
        <ImageViewer
          images={imageViewer.images}
          initialIndex={imageViewer.index}
          title={imageViewer.title}
          onClose={() => setImageViewer({ open: false, images: [], index: 0, title: "" })}
        />
      ) : null}

      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) =>
          setApproveDialog((prev) => ({ ...prev, open, doc: open ? prev.doc : null }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
            <DialogDescription>
              {approveDialog.mode === "all"
                ? "Approve all pending verification items for this driver?"
                : `Approve "${approveDialog.doc?.label ?? "this item"}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, mode: "all", doc: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={isMutating}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          setRejectDialog((prev) => ({ ...prev, open, doc: open ? prev.doc : null }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              {rejectDialog.mode === "all"
                ? "Provide rejection reason for all pending items."
                : `Provide rejection reason for "${rejectDialog.doc?.label ?? "this item"}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="driver-request-reject-reason">Rejection reason</Label>
            <Textarea
              id="driver-request-reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason"
              className="min-h-24"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, mode: "all", doc: null });
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject} disabled={isMutating} className="gap-2">
              {isMutating ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

