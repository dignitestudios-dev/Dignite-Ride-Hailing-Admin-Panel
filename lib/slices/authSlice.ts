import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import * as authApi from "@/lib/api/auth.api";

export interface User {
  id?: number;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

function loadInitialState(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, token: null, isAuthenticated: false, loading: false, error: null };
  }
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("userData");
  const user = userData ? (JSON.parse(userData) as User) : null;
  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading: false,
    error: null,
  };
}

// --- Async Thunks ---

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await authApi.login(credentials);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Login failed";
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await authApi.logout();
});

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload: { email: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.forgotPasswordApi(payload);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Request failed";
      return rejectWithValue(message);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (payload: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyOtpApi(payload);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "OTP verification failed";
      return rejectWithValue(message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    payload: { email: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await authApi.resetPasswordApi(payload);
      return data;
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Password reset failed";
      return rejectWithValue(message);
    }
  }
);

// --- Slice ---

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    clearError(state) {
      state.error = null;
    },
    /** Hard logout without API call (used by 401 interceptor) */
    forceLogout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { admin, token } = action.payload.data;
        state.user = admin;
        state.token = token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        localStorage.setItem("authToken", token);
        localStorage.setItem("userData", JSON.stringify(admin));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      })
      .addCase(logoutUser.rejected, (state) => {
        // Clear local state even if API call fails
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      });

    // Forgot password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        // Store reset token if returned
        const token = action.payload?.data?.token;
        if (token) {
          localStorage.setItem("resetToken", token);
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Reset password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        localStorage.removeItem("resetToken");
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, forceLogout } = authSlice.actions;
export default authSlice.reducer;