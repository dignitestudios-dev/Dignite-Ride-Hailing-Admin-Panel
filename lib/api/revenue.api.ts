import { API } from "./axios";

export type SubscriptionStatusFilter = "all" | "active" | "expired";

export interface SubscriptionRevenueItem {
  id: string;
  driverId: string;
  driverName: string;
  email: string;
  phone: string;
  subscriptionStatus: string;
  purchaseDate: string;
  expiryDate: string;
  amount: number;
}

export interface WithdrawalCommissionItem {
  id: string;
  driverName: string;
  withdrawalAmount: number;
  adminCommission: number;
  date: string;
}

export interface RevenuePagination {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface SubscriptionRevenueResponse {
  data: SubscriptionRevenueItem[];
  stats: Record<string, number | string | null>;
  pagination: RevenuePagination;
}

export interface WithdrawalCommissionResponse {
  data: WithdrawalCommissionItem[];
  stats: Record<string, number | string | null>;
  pagination: RevenuePagination;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getSubscriptionRevenue(
  page = 1,
  limit = 30,
  search = "",
  startDate = "",
  endDate = "",
  subscriptionStatus: SubscriptionStatusFilter = "all"
): Promise<SubscriptionRevenueResponse> {
  let url = `/subscription-revenue?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
  if (subscriptionStatus !== "all") {
    url += `&subscriptionStatus=${encodeURIComponent(subscriptionStatus)}`;
  }

  const response = await API.get(url);
  const raw = response.data ?? {};
  const results = raw?.data?.results ?? raw?.data ?? [];
  const rows = Array.isArray(results) ? results : [];
  const stats = (raw?.data?.stats ?? {}) as Record<string, number | string | null>;
  const pagination = raw?.pagination ?? {};

  return {
    data: rows.map((item: any) => ({
      id: String(item?._id ?? item?.id ?? item?.driverId ?? ""),
      driverId: String(item?.driverId ?? item?.driver?._id ?? item?.driver?.id ?? ""),
      driverName: String(item?.driverName ?? item?.name ?? item?.driver?.name ?? "—"),
      email: String(item?.email ?? item?.driver?.email ?? "—"),
      phone: String(item?.phone ?? item?.driver?.phone ?? item?.driverPhone ?? "—"),
      subscriptionStatus: String(item?.subscriptionStatus ?? item?.status ?? "—"),
      purchaseDate: String(item?.purchaseDate ?? item?.createdAt ?? ""),
      expiryDate: String(item?.expiryDate ?? item?.endDate ?? ""),
      amount: toNumber(item?.amount ?? item?.subscriptionAmount ?? item?.price ?? 0),
    })),
    stats,
    pagination: {
      total: toNumber(pagination?.total ?? rows.length),
      totalPages: toNumber(pagination?.totalPages ?? 1),
      page: toNumber(pagination?.currentPage ?? pagination?.page ?? page),
      limit: toNumber(pagination?.limit ?? limit),
    },
  };
}

export async function getWithdrawalCommissionRevenue(
  page = 1,
  limit = 30,
  search = "",
  startDate = "",
  endDate = ""
): Promise<WithdrawalCommissionResponse> {
  let url = `/withdrawals?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;

  const response = await API.get(url);
  const raw = response.data ?? {};
  const results = raw?.data?.results ?? raw?.data ?? [];
  const rows = Array.isArray(results) ? results : [];
  const stats = (raw?.data?.stats ?? {}) as Record<string, number | string | null>;
  const pagination = raw?.pagination ?? {};

  return {
    data: rows.map((item: any) => ({
      id: String(item?._id ?? item?.id ?? ""),
      driverName: String(item?.driverName ?? item?.driver?.name ?? "—"),
      withdrawalAmount: toNumber(item?.withdrawalAmount ?? item?.amount ?? 0),
      adminCommission: toNumber(item?.adminCommission ?? item?.commission ?? 0),
      date: String(item?.date ?? item?.createdAt ?? ""),
    })),
    stats,
    pagination: {
      total: toNumber(pagination?.total ?? rows.length),
      totalPages: toNumber(pagination?.totalPages ?? 1),
      page: toNumber(pagination?.currentPage ?? pagination?.page ?? page),
      limit: toNumber(pagination?.limit ?? limit),
    },
  };
}

