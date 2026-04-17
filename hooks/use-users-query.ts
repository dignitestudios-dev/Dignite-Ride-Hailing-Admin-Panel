import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getDriverRequests,
  respondDriverVerificationItem,
  getUserDetails,
  getUsers,
  respondDriverRequest,
  updateUserStatus,
} from "@/lib/api/users.api";

export function useUsersQuery(
  type: "rider" | "driver",
  page: number,
  limit: number,
  search: string,
  startDate: string,
  endDate: string,
  status: "all" | "active" | "inactive" = "all"
) {
  return useQuery({
    queryKey: ["users", type, page, limit, search, startDate, endDate, status],
    queryFn: () => getUsers(type, page, limit, search, startDate, endDate, status),
    placeholderData: keepPreviousData,

    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useUpdateUserStatusMutation(type: "rider" | "driver") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "deactivated";
    }) => updateUserStatus(id, type, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", type] });
    },
  });
}

export function useUserDetailsQuery(id: string, type: "rider" | "driver") {
  return useQuery({
    queryKey: ["user-details", type, id],
    queryFn: () => getUserDetails(id, type),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useDriverRequestsQuery(
  page: number,
  limit: number,
  search: string,
  status: "all" | "pending" | "approved" = "pending"
) {
  return useQuery({
    queryKey: ["driver-requests", page, limit, search, status],
    queryFn: () => getDriverRequests(page, limit, search, status),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useRespondDriverRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "approved" | "rejected";
      reason?: string;
    }) => respondDriverRequest(id, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["driver-requests"] });
      queryClient.invalidateQueries({ queryKey: ["user-details", "driver", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["users", "driver"] });
    },
  });
}

export function useRespondDriverVerificationItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      driverId,
      itemId,
      status,
      reason,
      metadata,
    }: {
      driverId: string;
      itemId: string;
      status: "approved" | "rejected";
      reason?: string;
      metadata?: {
        vehicleIdentificationNumber?: string;
        registrationNumber?: string;
      };
    }) =>
      respondDriverVerificationItem(itemId, status, {
        rejectReason: reason,
        metadata,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-details", "driver", variables.driverId] });
      queryClient.invalidateQueries({ queryKey: ["driver-requests"] });
    },
  });
}
