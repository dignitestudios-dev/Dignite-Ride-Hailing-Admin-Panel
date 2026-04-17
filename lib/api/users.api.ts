import { API } from "./axios";

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  status: string;
  createdAt: string;
}

export interface PaginatedUsers {
  data: User[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface DriverRequest {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt?: string;
  profilePicture?: string | null;
  requiresApproval?: boolean;
  isDeactivatedByAdmin?: boolean;
  status?: string;
  vehicleCount?: number;
}

export interface PaginatedDriverRequests {
  data: DriverRequest[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export async function getUsers(
  type: "rider" | "driver",
  page = 1,
  limit = 30,
  search = "",
  startDate = "",
  endDate = "",
  status = "all"
): Promise<PaginatedUsers> {
  let url = `/users?type=${type}&page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
  if (status && status !== "all") url += `&status=${encodeURIComponent(status)}`;
  const response = await API.get(url);
  return response.data;
}

export async function getUserDetails(id: string, type: "rider" | "driver") {
  const response = await API.get(`/users/${id}?type=${type}`);
  return response.data;
}

export async function updateUserStatus(
  id: string,
  type: "rider" | "driver",
  status: "active" | "deactivated"
) {
  const response = await API.patch(`/users/${id}/status`, { type, status });
  return response.data;
}

export async function getDriverRequests(
  page = 1,
  limit = 10,
  search = "",
  status = "pending"
): Promise<PaginatedDriverRequests> {
  let url = `/drivers?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") url += `&status=${encodeURIComponent(status)}`;

  const response = await API.get(url);
  const raw = response.data ?? {};
  const source = raw?.data ?? [];
  const rows = Array.isArray(source) ? source : [];

  const data: DriverRequest[] = rows.map((driver: any) => ({
    id: String(driver?._id ?? driver?.id ?? ""),
    name: driver?.name ?? "—",
    email: driver?.email ?? "—",
    phoneNumber: driver?.phone ?? driver?.phoneNumber ?? "",
    createdAt: driver?.createdAt,
    profilePicture: driver?.profilePicture ?? null,
    requiresApproval: driver?.requiresApproval,
    isDeactivatedByAdmin: driver?.isDeactivatedByAdmin,
    status: driver?.status,
    vehicleCount: Number(driver?.vehicleCount ?? 0),
  }));

  const pagination = raw?.pagination ?? {};
  return {
    data,
    pagination: {
      total: Number(pagination?.total ?? data.length),
      totalPages: Number(pagination?.totalPages ?? 1),
      page: Number(pagination?.page ?? page),
      limit: Number(pagination?.limit ?? limit),
    },
  };
}

export async function respondDriverRequest(
  driverId: string,
  status: "approved" | "rejected",
  rejectReason?: string
) {
  if (status === "rejected" && !rejectReason?.trim()) {
    throw new Error("Reject reason is required.");
  }

  const detailsResponse = await getUserDetails(driverId, "driver");
  const detailsRoot = detailsResponse?.data ?? detailsResponse ?? {};
  const approvedDocuments = detailsRoot?.approvedDocuments ?? {};
  const vehicleDetails =
    detailsRoot?.vehicleDetails ?? detailsRoot?.fullDetails?.vehicleDetails ?? null;

  const docsCandidates = [
    approvedDocuments?.license,
    approvedDocuments?.registration,
    approvedDocuments?.insurance,
    vehicleDetails,
  ].filter(Boolean) as any[];

  const pendingStatuses = new Set(["pending", "submitted", "under_review", ""]);
  const documents = docsCandidates
    .filter((doc) => {
      const current = String(doc?.status ?? "").toLowerCase();
      return pendingStatuses.has(current);
    })
    .map((doc) => ({
      id: String(doc?._id ?? doc?.id ?? ""),
      status,
      ...(status === "rejected" && rejectReason?.trim()
        ? { rejectReason: rejectReason.trim() }
        : {}),
    }))
    .filter((doc) => Boolean(doc.id));

  if (!documents.length) {
    throw new Error("No pending verification items found for this driver.");
  }

  const response = await API.put("/docs/respond", { documents });
  return response.data;
}

export async function respondDriverVerificationItem(
  itemId: string,
  status: "approved" | "rejected",
  options?: {
    rejectReason?: string;
    metadata?: {
      vehicleIdentificationNumber?: string;
      registrationNumber?: string;
    };
  }
) {
  if (status === "rejected" && !options?.rejectReason?.trim()) {
    throw new Error("Reject reason is required.");
  }
  const payload: Record<string, unknown> = {
    id: itemId,
    status,
  };
  if (status === "rejected" && options?.rejectReason?.trim()) {
    payload.rejectReason = options.rejectReason.trim();
  }
  if (options?.metadata) {
    payload.metadata = options.metadata;
  }

  const response = await API.put("/docs/respond", {
    documents: [payload],
  });
  return response.data;
}
