import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getUsers, updateUserStatus } from "@/lib/api/users.api";

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
