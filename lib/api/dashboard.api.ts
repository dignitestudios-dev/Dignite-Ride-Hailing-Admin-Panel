import { API } from "./axios";

export interface UserMetrics {
  totalActiveRiders: number;
  totalActiveDrivers: number;
  newRiderRegistrations: { last7Days: number; last30Days: number };
  newDriverRegistrations: { last7Days: number; last30Days: number };
}

export interface RideMetrics {
  totalRidesCompleted: { today: number; thisWeek: number; thisMonth: number };
  totalRidesCancelled: { today: number; thisWeek: number; thisMonth: number };
}

export interface RevenueMetrics {
  subscriptionRevenueUSD: number;
  withdrawalCommissionRevenueUSD: number;
}

export interface PendingActions {
  pendingDriverRequests: number;
  pendingReports: number;
}

export interface DashboardStats {
  userMetrics: UserMetrics;
  rideMetrics: RideMetrics;
  revenueMetrics: RevenueMetrics;
  pendingActions: PendingActions;
}

export interface RideDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface RideAnalytics {
  overview: {
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    completedPercentage: number;
    cancelledPercentage: number;
  };
  rideDistribution: RideDistribution[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await API.get("/dashboard-stats");
  return response.data.data;
}

export async function getRideAnalytics(): Promise<RideAnalytics> {
  const response = await API.get("/ride-analytics");
  return response.data.data;
}
