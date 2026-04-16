"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { verifyOtp, forgotPassword, clearError } from "@/lib/slices/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const OTP_TIMER_KEY = "otpTimerExpiry";
const TIMER_DURATION = 20; // seconds (set low for testing; use 10 * 60 for production)

export default function VerificationPage() {
  return (
    <React.Suspense fallback={<div className="w-full max-w-md animate-pulse" />}>
      <VerificationContent />
    </React.Suspense>
  );
}

function VerificationContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { loading, error } = useAppSelector((state) => state.auth);

  // Clear any stale errors from other pages on mount
  React.useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  useEffect(() => {
    const stored = localStorage.getItem(OTP_TIMER_KEY);
    if (stored) {
      const remaining = Math.max(
        0,
        Math.floor((parseInt(stored) - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
    } else {
      const expiry = Date.now() + TIMER_DURATION * 1000;
      localStorage.setItem(OTP_TIMER_KEY, expiry.toString());
      setSecondsLeft(TIMER_DURATION);
    }
  }, []);

  // Tick the timer down
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value) || value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const otpCode = otp.join("");
      if (otpCode.length !== 6 || !email) return;

      dispatch(clearError());
      const result = await dispatch(verifyOtp({ email, otp: otpCode }));
      if (verifyOtp.fulfilled.match(result)) {
        localStorage.removeItem(OTP_TIMER_KEY);
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(email)}`
        );
      }
    },
    [otp, email, dispatch, router]
  );

  // Auto-submit when all digits filled
  useEffect(() => {
    if (otp.every((d) => d !== "")) {
      handleSubmit();
    }
  }, [otp, handleSubmit]);

  const handleResend = async () => {
    if (secondsLeft > 0 || !email) return;
    dispatch(clearError());
    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      const expiry = Date.now() + TIMER_DURATION * 1000;
      localStorage.setItem(OTP_TIMER_KEY, expiry.toString());
      setSecondsLeft(TIMER_DURATION);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const isComplete = otp.every((digit) => digit !== "");

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Verify Your Email
        </h2>
        <p className="text-muted-foreground">
          We&apos;ve sent a 6-digit code to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email"
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={loading}
              className="size-12 rounded-lg border border-border bg-background text-center text-2xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        {/* Timer & Resend */}
        <div className="text-center">
          {secondsLeft > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatTime(secondsLeft)}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              Resend verification code
            </button>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!isComplete || loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
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
