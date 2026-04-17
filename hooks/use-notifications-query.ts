import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNotifications,
  sendNotification,
  type NotificationSort,
  type SendNotificationPayload,
} from "@/lib/api/notifications.api";

export function useNotificationsQuery(
  page: number,
  limit: number,
  search: string,
  sort: NotificationSort
) {
  return useQuery({
    queryKey: ["notifications", page, limit, search, sort],
    queryFn: () => getNotifications(page, limit, search, sort),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useSendNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendNotificationPayload) => sendNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

