import { API } from "./axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    admin: {
      name: string;
      email: string;
      role?: string;
      permissions?: string[];
    };
    token: string;
  };
  message: string;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await API.post("/login", credentials, {
    headers: {
      deviceuniqueid: typeof navigator !== "undefined" ? navigator.userAgent : "admin-panel",
      devicemodel: "web",
    },
  });
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await API.post("/auth/logout");
  } catch {
    // Silently fail — token will be cleared locally regardless
  } finally {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
  }
}

export async function forgotPasswordApi(payload: { email: string }) {
  const response = await API.post("/forgot-password", payload);
  return response.data;
}

export async function verifyOtpApi(payload: { email: string; otp: string }) {
  const response = await API.post("/verify-otp", payload);
  return response.data;
}

export async function resetPasswordApi(payload: {
  email: string;
  newPassword: string;
}) {
  const resetToken = localStorage.getItem("resetToken");
  const response = await API.post("/reset-password", payload, {
    headers: {
      ...(resetToken && { Authorization: `Bearer ${resetToken}` }),
    },
  });
  return response.data;
}

export async function updatePassword(payload: {
  oldPassword: string;
  newPassword: string;
}) {
  const response = await API.put("/update-password", payload);
  return response.data;
}

export async function getProfile() {
  const response = await API.get("/auth/profile");
  return response.data;
}