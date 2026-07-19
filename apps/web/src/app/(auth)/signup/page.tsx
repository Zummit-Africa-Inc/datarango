"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React, { useState } from "react";

import { Button, Input, Label } from "@datarango/ui";

import { AuthCard, AuthDivider } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const SignInPrompt = () => (
  <p className="text-muted-foreground mt-6 text-center text-sm">
    Already have an account?{" "}
    <Link className="link before:bg-ink text-foreground" href="/signin">
      Sign in
    </Link>
  </p>
);

const Page = () => {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName: form.get("name"), password }),
    }).catch(() => null);

    if (!res?.ok) {
      const problem = res ? await res.json().catch(() => null) : null;
      setError(problem?.title ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    const login = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    if (!login?.ok) {
      window.location.assign("/signin");
      return;
    }

    window.location.assign("/api/auth/signin?returnTo=/dashboard");
  };

  if (intent === "org") {
    return (
      <AuthCard
        cell="org"
        title="Create your organization"
        subtitle="Set up a workspace to train your team on real data work."
      >
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" placeholder="Acme Academy" type="text" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input autoComplete="email" id="email" placeholder="you@company.com" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input autoComplete="new-password" id="password" type="password" />
          </div>
          <Button className="w-full" type="submit">
            Create organization
          </Button>
        </form>
        <SignInPrompt />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      cell="signup"
      title="Create your account"
      subtitle="Start learning free — run your first notebook in minutes."
    >
      <SocialButtons />
      <AuthDivider />
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            autoComplete="name"
            id="name"
            name="name"
            placeholder="Ada Obi"
            required
            type="text"
          />
        </div>
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
            autoComplete="new-password"
            id="password"
            name="password"
            required
            type="password"
          />
        </div>
        {error && <p className="text-error text-sm">{error}</p>}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <SignInPrompt />
    </AuthCard>
  );
};

export default Page;
