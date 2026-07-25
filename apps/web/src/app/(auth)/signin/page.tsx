"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useState } from "react";

import { Button, Checkbox, Input, Label } from "@datarango/ui";

import { AuthCard, AuthDivider } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const Page = () => {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    }).catch(() => null);

    if (!res?.ok) {
      const problem = res ? await res.json().catch(() => null) : null;
      setError(problem?.title ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    const data = await res.json().catch(() => null);
    const returnTo = searchParams.get("returnTo") ?? "/dashboard";

    // MFA-enabled accounts get a challenge instead of a session — finish on /mfa.
    if (data?.mfaRequired && data?.challengeToken) {
      window.location.assign(
        `/mfa?challenge=${encodeURIComponent(data.challengeToken)}&returnTo=${encodeURIComponent(returnTo)}`,
      );
      return;
    }

    window.location.assign(
      returnTo.startsWith("http")
        ? returnTo
        : `/api/auth/signin?returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  return (
    <AuthCard cell="signin" title="Welcome back" subtitle="Sign in to pick up where you stopped.">
      <SocialButtons />
      <AuthDivider />
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            autoComplete="current-password"
            id="password"
            name="password"
            required
            type="password"
          />
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-x-2">
              <Checkbox id="remember" />
              <Label className="font-normal" htmlFor="remember">
                Keep me signed in
              </Label>
            </div>
            <Link className="link before:bg-ink text-sm" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        New to Datarango?{" "}
        <Link className="link before:bg-ink text-foreground" href="/signup">
          Create account
        </Link>
      </p>
    </AuthCard>
  );
};

export default Page;
