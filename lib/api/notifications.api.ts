import { API } from "./axios";

export type NotificationSort = "asc" | "desc";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  messagePreview: string;
  recipientType: string;
  dateAndTime: string;
  status: string;
  scheduledFor: string | null;
}

export interface PaginatedNotifications {
  data: NotificationItem[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface SendNotificationPayload {
  title: string;
  message: string;
  recipientType: "both" | "drivers" | "riders";
  scheduledFor?: string;
}

export async function getNotifications(
  page = 1,
  limit = 30,
  search = "",
  sort: NotificationSort = "desc"
): Promise<PaginatedNotifications> {
  let url = `/notifications?page=${page}&limit=${limit}&sort=${sort}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const response = await API.get(url);
  const raw = response.data ?? {};
  const dataRoot = raw?.data ?? {};
  const source = dataRoot?.notifications ?? dataRoot?.results ?? raw?.notifications ?? raw?.results ?? [];
  const rows = Array.isArray(source) ? source : [];

  const data: NotificationItem[] = rows.map((item: any) => {
    const message = String(item?.message ?? item?.body ?? item?.description ?? "");
    return {
      id: String(item?._id ?? item?.id ?? ""),
      title: String(item?.title ?? "—"),
      message,
      messagePreview: String(item?.messagePreview ?? message ?? "—"),
      recipientType: String(item?.recipientType ?? item?.audienceType ?? "both"),
      dateAndTime: String(item?.dateAndTime ?? item?.createdAt ?? item?.scheduledFor ?? ""),
      status: String(item?.status ?? "sent"),
      scheduledFor: item?.scheduledFor ? String(item.scheduledFor) : null,
    };
  });

  const pagination = dataRoot?.pagination ?? raw?.pagination ?? {};
  return {
    data,
    pagination: {
      total: Number(pagination?.total ?? data.length),
      totalPages: Number(pagination?.totalPages ?? 1),
      page: Number(pagination?.currentPage ?? pagination?.page ?? page),
      limit: Number(pagination?.limit ?? limit),
    },
  };
}

export async function sendNotification(payload: SendNotificationPayload) {
  const response = await API.post("/notifications", payload);
  return response.data;
}

