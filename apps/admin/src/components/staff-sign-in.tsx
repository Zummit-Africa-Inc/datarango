"use client";

import { ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  AuthHeading,
  Badge,
  Button,
  Input,
  Label,
  Loader,
  resolveSignInReturn,
} from "@datarango/ui";

/** What accounts offers on this stack (`GET /auth/staff/methods`). */
type Methods = { trustaige: boolean; dev: boolean };

/**
 * Codes accounts puts on `/signin?error=`. Trustaige's own error text is never
 * shown (TRUSTAIGE.md §6.2), and "not a staff account" reads the same whatever
 * the reason, so the page can't be used to find out who is staff.
 */
const STAFF_SIGN_IN_ERRORS: Record<string, string> = {
  "staff.not_staff":
    "That Trustaige account isn't a Datarango staff account. Sign in with the email your invite was sent to, or ask a Super admin.",
  staff_signin_cancelled: "Sign-in was cancelled. Try again when you're ready.",
  staff_signin_failed: "We couldn't complete sign-in with Trustaige. Please try again.",
  staff_signin_unavailable: "Staff sign-in isn't set up on this environment.",
};

/**
 * Staff sign-in for the admin app. Staff accounts are not user accounts: they
 * have no password and no Datarango two-factor. They sign in through the
 * Trustaige members app, which accounts runs as an OIDC client
 * (`/auth/staff/login`), then come back here to continue the admin app's own
 * OIDC flow.
 *
 * Local stacks have no Trustaige app; there accounts offers an email-only dev
 * sign-in instead (never when Trustaige is configured).
 */
export const StaffSignIn = ({ apiUrl }: { apiUrl: string }) => {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const errorParam = searchParams.get("error");

  const [methods, setMethods] = useState<Methods | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam
      ? (STAFF_SIGN_IN_ERRORS[errorParam] ?? "Something went wrong. Please sign in again.")
      : null,
  );

  useEffect(() => {
    let live = true;
    fetch(`${apiUrl}/auth/staff/methods`, { credentials: "include" })
      .then((res) => (res.ok ? (res.json() as Promise<Methods>) : null))
      .catch(() => null)
      .then((m) => {
        if (!live) return;
        setMethods(m ?? { trustaige: false, dev: false });
        if (!m) setError("We couldn't reach Datarango. Check your connection and try again.");
      });
    return () => {
      live = false;
    };
  }, [apiUrl]);

  // Where to go once the staff session exists: the authorize request that sent
  // us here, or a fresh sign-in into this app (a path accounts accepts).
  const next = resolveSignInReturn(returnTo, { apiUrl, fallback: "/overview" });

  const trustaigeHref = `${apiUrl}/auth/staff/login?returnTo=${encodeURIComponent(next)}`;

  const devSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch(`${apiUrl}/auth/staff/dev-login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    }).catch(() => null);
    if (!res?.ok) {
      setError(
        res ? STAFF_SIGN_IN_ERRORS["staff.not_staff"]! : "We couldn't reach Datarango. Try again.",
      );
      setBusy(false);
      return;
    }
    window.location.assign(next);
  };

  const errorLine = error && (
    <p className="text-danger text-sm" role="alert">
      {error}
    </p>
  );

  return (
    <div>
      <AuthHeading
        badge={
          <Badge appearance="outline" tone="neutral">
            <ShieldCheck className="size-3.5" /> Staff only
          </Badge>
        }
        title="Admin sign-in"
        subtitle="For Datarango staff. Your Datarango learner account won't work here."
      />

      {!methods ? (
        <Loader />
      ) : (
        <div className="space-y-6">
          {errorLine}

          {methods.trustaige && (
            <Button asChild className="w-full">
              <a href={trustaigeHref}>Continue with Trustaige</a>
            </Button>
          )}

          {methods.dev && (
            <form className="border-border space-y-4 rounded-lg border p-4" onSubmit={devSignIn}>
              <p className="text-muted-foreground text-sm">
                Local development sign-in: no Trustaige app is configured, so a staff email is
                enough. This never appears on a real environment.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="email">Staff email</Label>
                <Input
                  autoComplete="username"
                  autoFocus
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
              <Button className="w-full" disabled={busy} type="submit" variant="secondary">
                {busy ? "Signing in…" : "Sign in (dev)"}
              </Button>
            </form>
          )}

          {!methods.trustaige && !methods.dev && !error && (
            <p className="text-muted-foreground text-sm">
              {STAFF_SIGN_IN_ERRORS.staff_signin_unavailable}
            </p>
          )}
        </div>
      )}

      <p className="text-muted-foreground mt-8 text-center text-sm">
        Staff sign in with their Trustaige account. No access? Ask a Super admin to invite you.
      </p>
    </div>
  );
};
