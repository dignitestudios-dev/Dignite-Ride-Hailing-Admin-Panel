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
