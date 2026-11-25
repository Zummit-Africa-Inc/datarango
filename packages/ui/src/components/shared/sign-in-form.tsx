"use client";

import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, type ReactNode } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AuthHeading, type AuthHeadingProps } from "./auth-layout";
import { OtpInput } from "./otp-input";

/**
 * What accounts and the auth BFF can send back as `?error=`. Rendering the
 * raw slug tells somebody locked out of work nothing, and these differ in
 * what you'd do next: retrying helps an expired flow, never a domain mismatch.
 */
export const SIGN_IN_ERRORS: Record<string, string> = {
  sso_email_required: "Enter your email address first.",
  sso_unavailable: "Single sign-on isn't available for that organisation.",
  sso_idp_unreachable:
    "We couldn't reach your organisation's identity provider. Try again shortly.",
  sso_state_missing: "That sign-in didn't start here, or it expired. Please try again.",
  sso_idp_denied: "Your identity provider refused the sign-in.",
  sso_state_mismatch: "We couldn't verify that sign-in. Please start again.",
  sso_expired: "That sign-in took too long. Please try again.",
  sso_token_exchange_failed: "We couldn't complete sign-in with your identity provider.",
  sso_token_invalid: "Your identity provider's response couldn't be verified.",
  sso_no_email: "Your identity provider didn't share an email address with us.",
  sso_domain_mismatch:
    "That account's email domain isn't verified for the organisation you signed in to.",
  org_suspended:
    "Your organisation's access to Datarango is suspended. Contact your organisation's administrator.",
  // From the app's own /api/auth/callback.
  missing_flow_state: "That sign-in expired. Please sign in again.",
  invalid_flow_state: "That sign-in expired. Please sign in again.",
  state_mismatch: "We couldn't verify that sign-in. Please sign in again.",
  token_exchange_failed: "We couldn't finish signing you in. Please try again.",
};

/** Enough of an address to be worth asking about, not a validity check. */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Where to go once the accounts session exists.
 *
 * - A resume of the issuer's own `/connect/authorize` (how accounts sends
 *   people here) is followed as is: it finishes the OIDC flow for this app.
 * - A same-site path starts this app's flow with that path as the destination.
 * - Anything else is ignored. Following any absolute `returnTo` would make the
 *   page an open redirect.
 */
export const resolveSignInReturn = (
  returnTo: string | null,
  { apiUrl, fallback }: { apiUrl: string; fallback: string },
): string => {
  const start = (path: string) => `/api/auth/signin?returnTo=${encodeURIComponent(path)}`;
  if (!returnTo) return start(fallback);

  if (/^https?:\/\//i.test(returnTo)) {
    try {
      const url = new URL(returnTo);
      const issuer = new URL(apiUrl);
      const authorize = `${issuer.pathname.replace(/\/$/, "")}/connect/authorize`;
      return url.origin === issuer.origin && url.pathname === authorize
        ? returnTo
        : start(fallback);
    } catch {
      return start(fallback);
    }
  }

  const sameSite =
    returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/\\");
  return start(sameSite ? returnTo : fallback);
};

type Step = "email" | "password" | "mfa";

export interface SignInFormProps {
  /** Gateway / issuer origin (`NEXT_PUBLIC_API_URL`). */
  apiUrl: string;
  /** Destination inside this app when no `returnTo` is given. */
  fallbackReturnTo: string;
  heading: AuthHeadingProps;
  /**
   * Ask for the email first and offer the organisation's single sign-on before
   * a password (console). Otherwise the email and password share one step and
   * SSO is offered alongside when the domain federates.
   */
  emailFirst?: boolean;
  /** Offer org single sign-on when the email's domain has it (default true). */
  sso?: boolean;
  /** Social buttons or anything else above the form (learner). */
  social?: ReactNode;
  /** "Forgot password?" target; absolute for apps without their own reset flow. */
  forgotPasswordHref?: string;
  /** Under the form, e.g. "New to Datarango? Create account". */
  footer?: ReactNode;
  /** Email field label and placeholder (default "Email", "you@example.com"). */
  emailLabel?: string;
  emailPlaceholder?: string;
}

/**
 * The sign-in form every app uses, configured per audience: password sign-in
 * against accounts (`/auth/login`), the two-factor step inline, and org single
 * sign-on. Success sets the accounts session cookie, then hands over to this
 * app's PKCE flow (see `resolveSignInReturn`). Access is decided by the
 * server, not by which page someone used.
 */
export const SignInForm = ({
  apiUrl,
  fallbackReturnTo,
  heading,
  emailFirst = false,
  sso = true,
  social,
  forgotPasswordHref,
  footer,
  emailLabel = "Email",
  emailPlaceholder = "you@example.com",
}: SignInFormProps) => {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const errorParam = searchParams.get("error");

  const [step, setStep] = useState<Step>(emailFirst ? "email" : "password");
  const [email, setEmail] = useState("");
  const [ssoOrg, setSsoOrg] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (errorParam)
      setError(SIGN_IN_ERRORS[errorParam] ?? "Sign-in didn't complete. Please try again.");
  }, [errorParam]);

  const discover = async (address: string, signal?: AbortSignal): Promise<string | null> => {
    // Answers a domain question only (has an org claimed this domain and
    // enabled SSO?), never whether an account exists. A failed lookup just
    // means no SSO offer: it must never block password sign-in.
    const res = await fetch(
      `${apiUrl}/auth/sso/discover?email=${encodeURIComponent(address.trim())}`,
      { signal },
    ).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    return data?.ssoAvailable ? (data.organization ?? "your organisation") : null;
  };

  // Combined step: offer SSO as the address is typed (debounced).
  useEffect(() => {
    if (!sso || emailFirst || !looksLikeEmail(email)) {
      if (!emailFirst) setSsoOrg(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSsoOrg(await discover(email, controller.signal));
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [email, sso, emailFirst]);

  const finish = () =>
    window.location.assign(resolveSignInReturn(returnTo, { apiUrl, fallback: fallbackReturnTo }));

  const ssoHref = `${apiUrl}/auth/sso/start?email=${encodeURIComponent(email.trim())}&returnTo=${encodeURIComponent(returnTo ?? fallbackReturnTo)}`;

  const problemTitle = async (res: Response | null, fallback: string) => {
    const problem = res ? await res.json().catch(() => null) : null;
    return (problem?.title as string | undefined) ?? fallback;
  };

  const submitEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const org = sso ? await discover(email) : null;
    setBusy(false);
    setSsoOrg(org);
    if (!org) setStep("password");
  };

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password: form.get("password") }),
    }).catch(() => null);

    if (!res?.ok) {
      setError(await problemTitle(res, "Something went wrong. Please try again."));
      setBusy(false);
      return;
    }

    const data = await res.json().catch(() => null);
    if (data?.mfaRequired && data?.challengeToken) {
      setChallenge(data.challengeToken as string);
      setStep("mfa");
      setBusy(false);
      return;
    }
    finish();
  };

  const submitCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = code.trim();
    if (!challenge || (useRecovery ? value.length < 8 : value.length !== 6)) return;
    setError(null);
    setBusy(true);
    const res = await fetch(`${apiUrl}/auth/mfa/verify-login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeToken: challenge, code: value }),
    }).catch(() => null);

    if (!res?.ok) {
      setError(await problemTitle(res, "That code is incorrect or has expired."));
      setBusy(false);
      return;
    }
    finish();
  };

  const errorLine = error && (
    <p className="text-danger text-sm" role="alert">
      {error}
    </p>
  );

  const emailField = (
    <div className="space-y-1.5">
      <Label htmlFor="email">{emailLabel}</Label>
      <Input
        autoComplete="email"
        autoFocus
        id="email"
        name="email"
        onChange={(e) => setEmail(e.target.value)}
        placeholder={emailPlaceholder}
        required
        type="email"
        value={email}
      />
    </div>
  );

  const ssoOffer = ssoOrg && (
    <div className="border-border bg-background-subtle rounded-lg border p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Building2 className="size-3.5 shrink-0" />
        {ssoOrg} uses single sign-on
      </p>
      <Button asChild className="mt-2 w-full" variant={emailFirst ? "primary" : "secondary"}>
        <a href={ssoHref}>Continue with {ssoOrg}</a>
      </Button>
    </div>
  );

  const back = (to: Step, label: string) => (
    <button
      className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      onClick={() => {
        setError(null);
        setCode("");
        setStep(to);
      }}
      type="button"
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );

  if (step === "mfa") {
    return (
      <div>
        {back("password", "Back")}
        <AuthHeading
          title="Two-factor authentication"
          subtitle={
            useRecovery
              ? "Enter one of the recovery codes you saved when you set up two-factor authentication."
              : "Enter the 6-digit code from your authenticator app."
          }
        />
        <form className="space-y-4" onSubmit={submitCode}>
          {useRecovery ? (
            <div className="space-y-1.5">
              <Label htmlFor="recovery">Recovery code</Label>
              <Input
                autoComplete="one-time-code"
                autoFocus
                id="recovery"
                onChange={(e) => setCode(e.target.value)}
                value={code}
              />
            </div>
          ) : (
            <OtpInput length={6} onChange={setCode} value={code} />
          )}
          {errorLine}
          <Button className="w-full" disabled={busy} type="submit">
            {busy ? "Verifying…" : "Verify"}
          </Button>
          <button
            className="text-muted-foreground hover:text-foreground w-full text-center text-sm"
            onClick={() => {
              setCode("");
              setUseRecovery((v) => !v);
            }}
            type="button"
          >
            {useRecovery ? "Use your authenticator app" : "Use a recovery code"}
          </button>
        </form>
      </div>
    );
  }

  if (step === "email") {
    return (
      <div>
        <AuthHeading {...heading} />
        <form className="space-y-4" onSubmit={submitEmail}>
          {emailField}
          {ssoOffer ? (
            <>
              {ssoOffer}
              <button
                className="text-muted-foreground hover:text-foreground w-full text-center text-sm"
                onClick={() => setStep("password")}
                type="button"
              >
                Sign in with a password instead
              </button>
            </>
          ) : (
            <Button className="w-full" disabled={busy || !looksLikeEmail(email)} type="submit">
              {busy ? "Checking…" : "Continue"}
            </Button>
          )}
          {errorLine}
        </form>
        {footer && <div className="text-muted-foreground mt-8 text-center text-sm">{footer}</div>}
      </div>
    );
  }

  return (
    <div>
      {emailFirst && back("email", "Use a different email")}
      <AuthHeading {...heading} />
      {social && (
        <>
          {social}
          <div className="before:bg-border relative my-6 flex items-center justify-center before:absolute before:top-1/2 before:left-0 before:h-px before:w-full">
            <span className="bg-background text-muted-foreground relative px-3 text-xs">or</span>
          </div>
        </>
      )}
      <form className="space-y-4" onSubmit={submitPassword}>
        {emailFirst ? (
          <p className="border-border rounded-lg border px-3 py-2 text-sm">{email}</p>
        ) : (
          emailField
        )}
        {!emailFirst && ssoOffer}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {forgotPasswordHref && (
              <Link
                className="text-muted-foreground hover:text-foreground text-sm"
                href={forgotPasswordHref}
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            autoComplete="current-password"
            autoFocus={emailFirst}
            id="password"
            name="password"
            required
            type="password"
          />
        </div>
        {errorLine}
        <Button className="w-full" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      {footer && <div className="text-muted-foreground mt-8 text-center text-sm">{footer}</div>}
    </div>
  );
};
