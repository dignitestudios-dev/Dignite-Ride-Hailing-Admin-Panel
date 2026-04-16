"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { forgotPassword, clearError } from "@/lib/slices/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((state) => state.auth);

  // Clear any stale errors from other pages on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      setSent(true);
    }
  };

  const handleVerify = () => {
    router.push(`/auth/verification?email=${encodeURIComponent(email)}`);
  };

  if (sent) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Check your email
        </h2>
        <p className="text-muted-foreground mb-6">
          We&apos;ve sent a verification code to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>
        <div className="space-y-3">
          <Button onClick={handleVerify} className="w-full">
            Enter Verification Code
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSent(false);
              dispatch(clearError());
            }}
          >
            Try a different email
          </Button>
          <div className="pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Forgot Password
        </h2>
        <p className="text-muted-foreground">
          Enter your email address and we&apos;ll send you an OTP to reset your
          password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Verification Code"
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
