"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { resetPassword, clearError } from "@/lib/slices/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-md animate-pulse" />}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { loading, error } = useAppSelector((state) => state.auth);

  // Clear any stale errors from other pages on mount
  React.useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const passwordChecks = [
    { label: "At least 8 characters", isValid: password.length >= 8 },
    { label: "At least one lowercase letter", isValid: /[a-z]/.test(password) },
    { label: "At least one uppercase letter", isValid: /[A-Z]/.test(password) },
    { label: "At least one number", isValid: /\d/.test(password) },
    {
      label: "At least one special character",
      isValid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const isPasswordStrong = passwordChecks.every((check) => check.isValid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearError());

    if (!password || !confirmPassword) {
      setLocalError("Please fill in all fields");
      return;
    }
    if (!isPasswordStrong) {
      setLocalError("Password does not meet all requirements");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (!email) {
      setLocalError("Missing email. Please restart the password reset flow.");
      return;
    }

    const result = await dispatch(
      resetPassword({ email, newPassword: password })
    );
    if (resetPassword.fulfilled.match(result)) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-500/10">
          <ShieldCheck className="size-10 text-emerald-500" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Password Updated!
        </h2>
        <p className="text-muted-foreground mb-2">
          Your password has been successfully reset.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          You can now use your new password to sign in to your account.
        </p>
        <div className="space-y-3">
          <Button onClick={() => router.push("/auth/login")} className="w-full">
            <KeyRound className="size-4" />
            Continue to Sign In
          </Button>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const displayError = localError || error;

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Reset Password
        </h2>
        <p className="text-muted-foreground">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {displayError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Password strength checks */}
        <div className="space-y-2">
          {passwordChecks.map((check) => (
            <div
              key={check.label}
              className={`flex items-center gap-2 text-sm transition-colors ${
                check.isValid ? "text-emerald-600" : "text-muted-foreground"
              }`}
            >
              {check.isValid ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <Circle className="size-4" />
              )}
              <span>{check.label}</span>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
