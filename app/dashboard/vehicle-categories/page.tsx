"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateVehicleTypeMutation,
  useDeleteVehicleTypeMutation,
  useUpdateVehicleTypeMutation,
  useVehicleTypesQuery,
} from "@/hooks/use-vehicle-types-query";
import { type RideType, type VehicleType } from "@/lib/api/vehicle-types.api";

type FormState = {
  model: string;
  rideType: RideType;
  isActive: "true" | "false";
  notes: string;
};

const DEFAULT_FORM: FormState = {
  model: "",
  rideType: "economy",
  isActive: "true",
  notes: "",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

function getRideTypeBadge(type: RideType) {
  if (type === "luxury") {
    return (
      <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-600">
        Luxury
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
      Economy
    </Badge>
  );
}

function getStatusBadge(isActive: boolean) {
  if (isActive) {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
        <ShieldCheck className="size-3.5" />
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600">
      <ShieldX className="size-3.5" />
      Inactive
    </Badge>
  );
}

export default function VehicleCategoriesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [search, setSearch] = useState("");
  const [localSearch, setLocalSearch] = useState("");
  const [rideTypeFilter, setRideTypeFilter] = useState<"all" | RideType>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleType | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<{ model?: string }>({});

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useVehicleTypesQuery(page, limit, search, rideTypeFilter);
  const createMutation = useCreateVehicleTypeMutation();
  const updateMutation = useUpdateVehicleTypeMutation();
  const deleteMutation = useDeleteVehicleTypeMutation();
  const isFormSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [localSearch, search]);

  const vehicleTypes = data?.data ?? [];
  const pagination = data?.pagination;
  const totalCount = pagination?.total ?? vehicleTypes.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  const activeCount = useMemo(
    () => vehicleTypes.filter((vehicle) => vehicle.isActive).length,
    [vehicleTypes]
  );
  const inactiveCount = Math.max(0, vehicleTypes.length - activeCount);
  const luxuryCount = useMemo(
    () => vehicleTypes.filter((vehicle) => vehicle.rideType === "luxury").length,
    [vehicleTypes]
  );

  function resetForm() {
    setForm(DEFAULT_FORM);
    setFormErrors({});
  }

  function openCreateDialog() {
    setEditingVehicle(null);
    resetForm();
    setIsFormOpen(true);
  }

  function openEditDialog(vehicle: VehicleType) {
    setEditingVehicle(vehicle);
    setForm({
      model: vehicle.model,
      rideType: vehicle.rideType,
      isActive: vehicle.isActive ? "true" : "false",
      notes: vehicle.notes ?? "",
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  async function submitForm() {
    if (!form.model.trim()) {
      setFormErrors({ model: "Model is required." });
      return;
    }

    const payload = {
      model: form.model.trim(),
      rideType: form.rideType,
      isActive: form.isActive === "true",
      notes: form.notes.trim(),
    };

    try {
      if (editingVehicle) {
        await updateMutation.mutateAsync({
          id: editingVehicle.id,
          payload,
        });
        toast.success("Vehicle category updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Vehicle category created successfully.");
      }
      setIsFormOpen(false);
      resetForm();
    } catch {
      toast.error("Unable to save vehicle category.");
    }
  }

  async function confirmDelete() {
    if (!vehicleToDelete) return;

    try {
      await deleteMutation.mutateAsync(vehicleToDelete.id);
      toast.success("Vehicle category deleted successfully.");
      setIsDeleteOpen(false);
      setVehicleToDelete(null);
    } catch {
      toast.error("Unable to delete vehicle category.");
    }
  }

  function handleExportCSV() {
    if (!vehicleTypes.length) return;
    const rows = [
      ["Model", "Ride Type", "Status", "Notes", "Created At"],
      ...vehicleTypes.map((vehicle) => [
        vehicle.model,
        vehicle.rideType,
        vehicle.isActive ? "Active" : "Inactive",
        vehicle.notes || "N/A",
        formatDate(vehicle.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vehicle-categories.csv";
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
          <h2 className="text-lg font-semibold">Failed to load vehicle categories</h2>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching vehicle category data.
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
            <CarFront className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vehicle Categories</h1>
            <p className="text-sm text-muted-foreground">
              Manage vehicle models, ride types, and category status for your fleet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isFetching}
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreateDialog}>
            <Plus className="size-4" />
            Create Vehicle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Categories" value={totalCount.toLocaleString()} icon={CarFront} />
        <StatsCard title="Active" value={activeCount.toLocaleString()} icon={ShieldCheck} />
        <StatsCard title="Inactive" value={inactiveCount.toLocaleString()} icon={ShieldX} />
        <StatsCard title="Luxury Types" value={luxuryCount.toLocaleString()} icon={Clock3} />
      </div>

      <div className="rounded-xl border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Filter by ride type, search by model, and manage category lifecycle.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full min-w-[220px] md:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={localSearch}
                onChange={(event) => setLocalSearch(event.target.value)}
                placeholder="Search by model..."
                className="pl-9"
              />
            </div>

            <Select
              value={rideTypeFilter}
              onValueChange={(value: "all" | RideType) => {
                setRideTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              title="Export CSV"
              onClick={handleExportCSV}
              disabled={!vehicleTypes.length}
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
                Model
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Ride Type
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Status
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Notes
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Created
              </TableHead>
              <TableHead className="sticky top-0 z-20 h-12 bg-muted/35 px-4 text-right text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase backdrop-blur supports-[backdrop-filter]:bg-muted/75">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`vehicle-skeleton-${index}`} className="border-border/50">
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-36 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-7 w-24 rounded-full bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-7 w-24 rounded-full bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-52 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4"><Skeleton className="h-4 w-24 bg-muted/90" /></TableCell>
                  <TableCell className="px-4 py-4 text-right"><Skeleton className="ml-auto h-8 w-20 bg-muted/90" /></TableCell>
                </TableRow>
              ))
            ) : vehicleTypes.length ? (
              vehicleTypes.map((vehicle) => (
                <TableRow key={vehicle.id} className="border-border/50 hover:bg-muted/30">
                  <TableCell className="px-4 py-4 font-medium">
                    <p className="max-w-[220px] truncate" title={vehicle.model || "—"}>{vehicle.model || "—"}</p>
                  </TableCell>
                  <TableCell className="px-4 py-4">{getRideTypeBadge(vehicle.rideType)}</TableCell>
                  <TableCell className="px-4 py-4">{getStatusBadge(vehicle.isActive)}</TableCell>
                  <TableCell className="max-w-[320px] px-4 py-4 text-muted-foreground">
                    <p className="truncate">{vehicle.notes || "N/A"}</p>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">{formatDate(vehicle.createdAt)}</TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 border-primary/25 bg-primary/5 text-primary hover:bg-primary/10"
                        onClick={() => openEditDialog(vehicle)}
                        title="Edit"
                      >
                        <Edit className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 border-rose-500/30 bg-rose-500/5 text-rose-600 hover:bg-rose-500/10"
                        title="Delete"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          setVehicleToDelete(vehicle);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  No vehicle categories found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="vehicle-category-limit" className="text-sm text-muted-foreground">
            Rows per page
          </Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger id="vehicle-category-limit" className="h-9 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="mr-1">Page {page} of {totalPages}</span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || isFetching}
            title="Previous"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages || isFetching}
            title="Next"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            resetForm();
            setEditingVehicle(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit Vehicle Category" : "Create Vehicle Category"}</DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? "Update ride type, notes, and status for this category."
                : "Create a new vehicle category to support fleet operations."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="grid gap-2">
              <Label htmlFor="vehicle-model">Model</Label>
                <Input
                  id="vehicle-model"
                  value={form.model}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, model: event.target.value }));
                    if (formErrors.model) setFormErrors((prev) => ({ ...prev, model: undefined }));
                  }}
                  placeholder="e.g. Camry"
                  disabled={isFormSubmitting}
                />
              {formErrors.model ? (
                <p className="text-xs text-rose-600">{formErrors.model}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Ride Type</Label>
                <Select
                  value={form.rideType}
                  onValueChange={(value: RideType) => setForm((prev) => ({ ...prev, rideType: value }))}
                  disabled={isFormSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.isActive}
                  onValueChange={(value: "true" | "false") =>
                    setForm((prev) => ({ ...prev, isActive: value }))
                  }
                  disabled={isFormSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vehicle-notes">Notes</Label>
              <Textarea
                id="vehicle-notes"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Add category notes..."
                rows={5}
                className="min-h-32"
                disabled={isFormSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isFormSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitForm}
              disabled={isFormSubmitting}
              className="min-w-[128px]"
            >
              {isFormSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingVehicle ? (
                "Update Category"
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle Category</DialogTitle>
            <DialogDescription>
              This action cannot be undone and will permanently remove this category.
            </DialogDescription>
          </DialogHeader>

          {vehicleToDelete ? (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="font-medium">{vehicleToDelete.model}</p>
              <p className="text-sm text-muted-foreground">
                {vehicleToDelete.rideType === "luxury" ? "Luxury" : "Economy"} ·{" "}
                {vehicleToDelete.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="min-w-[90px]"
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
