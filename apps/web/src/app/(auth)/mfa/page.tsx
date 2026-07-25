"use client";

import { useSearchParams } from "next/navigation";
import React, { useState } from "react";

import { Button, OtpInput } from "@datarango/ui";

import { AuthCard } from "@/components/auth/auth-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const Page = () => {
  const searchParams = useSearchParams();
  const challenge = searchParams.get("challenge");
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challenge || (code.length !== 6 && code.length < 8)) return;
    setSubmitting(true);
    setError(null);

    // Second factor: completes the sign-in the password step held. Accepts a TOTP
    // code or a recovery code; on success the SSO session cookie is set.
    const res = await fetch(`${API_URL}/auth/mfa/verify-login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeToken: challenge, code }),
    }).catch(() => null);
    setSubmitting(false);

    if (!res?.ok) {
      const problem = res ? await res.json().catch(() => null) : null;
      setError(problem?.title ?? "That code is incorrect or has expired.");
      return;
    }

    window.location.assign(
      returnTo.startsWith("http")
        ? returnTo
        : `/api/auth/signin?returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  if (!challenge) {
    return (
      <AuthCard
        cell="mfa"
        title="Two-factor authentication"
        subtitle="This verification link has expired. Start signing in again."
      >
        <Button className="w-full" variant="outline" asChild>
          <a href="/signin">Back to sign in</a>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      cell="mfa"
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app, or a recovery code."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <OtpInput length={6} onChange={setCode} value={code} />
        {error && <p className="text-error text-sm">{error}</p>}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Verifying…" : "Verify code"}
        </Button>
      </form>
    </AuthCard>
  );
};

export default Page;
