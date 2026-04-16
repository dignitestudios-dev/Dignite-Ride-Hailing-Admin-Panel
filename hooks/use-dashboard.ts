import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getRideAnalytics } from "@/lib/api/dashboard.api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });
}

export function useRideAnalytics() {
  return useQuery({
    queryKey: ["ride-analytics"],
    queryFn: getRideAnalytics,
  });
}
