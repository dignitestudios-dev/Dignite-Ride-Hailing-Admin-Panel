import { API } from "./axios";

export type RideType = "economy" | "luxury";

export interface VehicleType {
  id: string;
  model: string;
  rideType: RideType;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export interface PaginatedVehicleTypes {
  data: VehicleType[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface CreateVehicleTypePayload {
  model: string;
  rideType: RideType;
  notes?: string;
  isActive: boolean;
}

export interface UpdateVehicleTypePayload {
  model?: string;
  rideType?: RideType;
  notes?: string;
  isActive?: boolean;
}

function toRideType(value: unknown): RideType {
  const normalized = String(value ?? "").toLowerCase();
  return normalized === "luxury" ? "luxury" : "economy";
}

export async function getVehicleTypes(
  page = 1,
  limit = 10,
  search = "",
  rideType: "all" | RideType = "all"
): Promise<PaginatedVehicleTypes> {
  let url = `/vehicle-types?page=${page}&limit=${limit}`;
  if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
  if (rideType !== "all") url += `&rideType=${encodeURIComponent(rideType)}`;

  const response = await API.get(url);
  const raw = response.data ?? {};

  const source =
    raw?.data?.result ??
    raw?.result ??
    raw?.data ??
    [];

  const rows = Array.isArray(source) ? source : [];
  const data: VehicleType[] = rows.map((item: any) => ({
    id: String(item?._id ?? item?.id ?? ""),
    model: String(item?.model ?? "—"),
    rideType: toRideType(item?.rideType),
    isActive: Boolean(item?.isActive),
    notes: String(item?.notes ?? ""),
    createdAt: String(item?.createdAt ?? ""),
  }));

  const pagination = raw?.pagination ?? {};
  return {
    data,
    pagination: {
      total: Number(pagination?.total ?? data.length),
      totalPages: Math.max(1, Number(pagination?.totalPages ?? 1)),
      page: Number(pagination?.page ?? page),
      limit: Number(pagination?.limit ?? limit),
    },
  };
}

export async function createVehicleType(payload: CreateVehicleTypePayload) {
  const response = await API.post("/vehicle-types", payload);
  return response.data;
}

export async function updateVehicleType(id: string, payload: UpdateVehicleTypePayload) {
  const response = await API.put(`/vehicle-types/${id}`, payload);
  return response.data;
}

export async function deleteVehicleType(id: string) {
  const response = await API.delete(`/vehicle-types/${id}`);
  return response.data;
}
