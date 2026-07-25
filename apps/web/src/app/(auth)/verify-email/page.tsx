"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@datarango/ui";

import { AuthCard } from "@/components/auth/auth-card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type State = "verifying" | "success" | "error";

const COPY: Record<State, { title: string; subtitle: string }> = {
  verifying: {
    title: "Verifying your email",
    subtitle: "One moment while we confirm your address.",
  },
  success: {
    title: "Email verified",
    subtitle: "Your email address is confirmed — you're all set.",
  },
  error: {
    title: "Verification failed",
    subtitle: "This link is invalid or has expired. You can request a new one from your account.",
  },
};

const Page = () => {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<State>("verifying");

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }

    fetch(`${API_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setState(res.ok ? "success" : "error"))
      .catch(() => setState("error"));
  }, [token]);

  const copy = COPY[state];

  return (
    <AuthCard cell="verify-email" title={copy.title} subtitle={copy.subtitle}>
      {state === "verifying" && <p className="text-muted-foreground text-sm">Verifying…</p>}
      {state === "success" && (
        <Button className="w-full" asChild>
          <Link href="/dashboard">Continue to dashboard</Link>
        </Button>
      )}
      {state === "error" && (
        <Button className="w-full" variant="outline" asChild>
          <Link href="/signin">Back to sign in</Link>
        </Button>
      )}
    </AuthCard>
  );
};

export default Page;
