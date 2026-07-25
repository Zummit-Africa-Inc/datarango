"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useState } from "react";

import { Button, Input, Label } from "@datarango/ui";

import { AuthCard } from "@/components/auth/auth-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const Page = () => {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`${API_URL}/auth/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: password }),
    }).catch(() => null);
    setSubmitting(false);

    if (!res?.ok) {
      const problem = res ? await res.json().catch(() => null) : null;
      setError(problem?.title ?? "This reset link is invalid or has expired.");
      return;
    }

    setDone(true);
  };

  if (!token) {
    return (
      <AuthCard
        cell="reset"
        title="Invalid link"
        subtitle="This password reset link is missing or malformed."
      >
        <Button className="w-full" variant="outline" asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard
        cell="reset"
        title="Password updated"
        subtitle="Your password has been changed. Sign in with your new password."
      >
        <Button className="w-full" asChild>
          <Link href="/signin">Back to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      cell="reset"
      title="Set a new password"
      subtitle="Choose a strong password you haven't used here before."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            autoComplete="new-password"
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            autoComplete="new-password"
            id="confirm-password"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Updating…" : "Set new password"}
        </Button>
      </form>
    </AuthCard>
  );
};

export default Page;
