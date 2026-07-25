"use client";

import Link from "next/link";
import React, { useState } from "react";

import { Button, Input, Label } from "@datarango/ui";

import { AuthCard } from "@/components/auth/auth-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const Page = () => {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const email = new FormData(event.currentTarget).get("email");
    // Always 202 — the response never reveals whether the address is registered.
    await fetch(`${API_URL}/auth/password/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => undefined);
    setSent(true);
    setSubmitting(false);
  };

  if (sent) {
    return (
      <AuthCard
        cell="reset"
        title="Check your email"
        subtitle="If an account exists for that address, we've sent a link to reset your password."
      >
        <Button className="w-full" variant="outline" asChild>
          <Link href="/signin">Back to sign in</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      cell="reset"
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
    >
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
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remembered it?{" "}
        <Link className="link before:bg-ink text-foreground" href="/signin">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default Page;
