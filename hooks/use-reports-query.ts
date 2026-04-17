import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getReportById,
  getReports,
  resolveReport,
} from "@/lib/api/reports.api";
import { updateUserStatus } from "@/lib/api/users.api";

export function useReportsQuery(
  page: number,
  limit: number,
  status: "all" | "pending" | "resolved" | "rejected"
) {
  return useQuery({
    queryKey: ["reports", page, limit, status],
    queryFn: () => getReports(page, limit, status),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useReportDetailsQuery(reportId: string) {
  return useQuery({
    queryKey: ["report-details", reportId],
    queryFn: () => getReportById(reportId),
    enabled: Boolean(reportId),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useResolveReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, adminNotes }: { reportId: string; adminNotes?: string }) =>
      resolveReport(reportId, adminNotes ?? ""),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report-details", variables.reportId] });
    },
  });
}

export function useReportUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      userId,
      userType,
      currentIsDeactivatedByAdmin,
    }: {
      reportId: string;
      userId: string;
      userType: string;
      currentIsDeactivatedByAdmin: boolean;
    }) => {
      const mappedType =
        String(userType).toLowerCase() === "driver" ? "driver" : "rider";
      const nextStatus = currentIsDeactivatedByAdmin ? "active" : "deactivated";
      return updateUserStatus(userId, mappedType, nextStatus);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["report-details", variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
