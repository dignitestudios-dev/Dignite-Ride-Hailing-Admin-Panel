import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getSubscriptionRevenue,
  getWithdrawalCommissionRevenue,
  type SubscriptionStatusFilter,
} from "@/lib/api/revenue.api";

export function useSubscriptionRevenueQuery(
  page: number,
  limit: number,
  search: string,
  startDate: string,
  endDate: string,
  status: SubscriptionStatusFilter
) {
  return useQuery({
    queryKey: ["subscription-revenue", page, limit, search, startDate, endDate, status],
    queryFn: () => getSubscriptionRevenue(page, limit, search, startDate, endDate, status),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useWithdrawalCommissionQuery(
  page: number,
  limit: number,
  search: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: ["withdrawal-commission-revenue", page, limit, search, startDate, endDate],
    queryFn: () => getWithdrawalCommissionRevenue(page, limit, search, startDate, endDate),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

