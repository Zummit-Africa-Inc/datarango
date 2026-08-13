"use client";

import { useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { Button, Checkbox, Input, Label } from "@datarango/ui";

import { AuthCard, AuthDivider } from "@/components/auth/auth-card";
import { SocialButtons } from "@/components/auth/social-buttons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * What `/auth/sso/*` can redirect back with. Rendering the raw slug would tell
 * somebody locked out of work nothing, and these differ in what you'd do next —
 * retrying helps for an expired flow and never helps for a domain mismatch.
 */
const SSO_ERRORS: Record<string, string> = {
  sso_email_required: "Enter your email address first.",
  sso_unavailable: "Single sign-on isn't available for that organization.",
  sso_idp_unreachable:
    "We couldn't reach your organization's identity provider. Try again shortly.",
  sso_state_missing: "That sign-in didn't start here, or it expired. Please try again.",
  sso_idp_denied: "Your identity provider refused the sign-in.",
  sso_state_mismatch: "We couldn't verify that sign-in. Please start again.",
  sso_expired: "That sign-in took too long. Please try again.",
  sso_token_exchange_failed: "We couldn't complete sign-in with your identity provider.",
  sso_token_invalid: "Your identity provider's response couldn't be verified.",
  sso_no_email: "Your identity provider didn't share an email address with us.",
  sso_domain_mismatch:
    "That account's email domain isn't verified for the organization you signed in to.",
};

/** Enough of an address to be worth asking about — not a validity check. */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const Page = () => {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [ssoOrg, setSsoOrg] = useState<string | null>(null);

  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  // Surface whatever the SSO round trip bounced back with.
  const ssoError = searchParams.get("error");
  useEffect(() => {
    if (ssoError) setError(SSO_ERRORS[ssoError] ?? "Single sign-on didn't complete.");
  }, [ssoError]);

  /**
   * Ask whether this address belongs to an org that federates.
   *
   * Debounced so typing doesn't fire a request per keystroke. Safe to call
   * before anyone is authenticated because the endpoint answers a *domain*
   * question only — it reveals that some org has claimed a domain, never
   * whether an account exists, so it is not a user-enumeration oracle.
   */
  useEffect(() => {
    if (!looksLikeEmail(email)) {
      setSsoOrg(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const res = await fetch(
        `${API_URL}/auth/sso/discover?email=${encodeURIComponent(email.trim())}`,
        { signal: controller.signal },
      ).catch(() => null);

      const data = res?.ok ? await res.json().catch(() => null) : null;
      // A failed lookup leaves the password form exactly as it was — SSO is an
      // additional route in, never the only one, so this must not block sign-in.
      setSsoOrg(data?.ssoAvailable ? (data.organization ?? "your organization") : null);
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [email]);

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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>

        {/* Offered rather than forced. An org member may also hold a password
            here, and the server does not require federation, so this sits
            alongside the form instead of replacing it. */}
        {ssoOrg && (
          <div className="border-hairline bg-card rounded-xs border p-3">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Building2 className="size-3.5 shrink-0" />
              {ssoOrg} uses single sign-on
            </p>
            <Button asChild className="mt-2 w-full" variant="outline">
              <a
                href={`${API_URL}/auth/sso/start?email=${encodeURIComponent(
                  email.trim(),
                )}&returnTo=${encodeURIComponent(returnTo)}`}
              >
                Continue with {ssoOrg}
              </a>
            </Button>
          </div>
        )}
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
