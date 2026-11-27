"use client";

import { ArrowLeft, Copy, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  AuthHeading,
  Badge,
  Button,
  Input,
  Label,
  OtpInput,
  SIGN_IN_ERRORS,
  resolveSignInReturn,
} from "@datarango/ui";

type Step =
  | { kind: "password" }
  | { kind: "enroll"; challenge: string; secret: string; uri: string }
  | { kind: "verify"; challenge: string }
  | { kind: "codes"; codes: string[] };

/** The problem's title, which accounts writes for people, or a fallback. */
const problemTitle = async (res: Response | null, fallback: string) => {
  if (!res) return "We couldn't reach Datarango. Check your connection and try again.";
  const body = (await res.json().catch(() => null)) as { title?: string } | null;
  return body?.title || fallback;
};

/** Groups a Base32 secret in fours so it can be typed into an app without losing your place. */
const grouped = (secret: string) => secret.replace(/(.{4})/g, "$1 ").trim();

/**
 * Staff sign-in for the admin app. Staff accounts are not user accounts: they
 * sign in here only, with no sign-up, social or SSO, and always with two-factor.
 * The first sign-in sets two-factor up; there is no way past it.
 *
 * Once accounts has set the staff session cookie, the page continues the OIDC
 * flow it was sent here from (or starts one), exactly as the user sign-in does.
 */
export const StaffSignIn = ({ apiUrl }: { apiUrl: string }) => {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const errorParam = searchParams.get("error");

  const [step, setStep] = useState<Step>({ kind: "password" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam
      ? (SIGN_IN_ERRORS[errorParam] ?? "Something went wrong. Please sign in again.")
      : null,
  );

  const post = (path: string, body: unknown) =>
    fetch(`${apiUrl}/auth/staff${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);

  const finish = () =>
    window.location.assign(resolveSignInReturn(returnTo, { apiUrl, fallback: "/overview" }));

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const res = await post("/login", { email: email.trim(), password: form.get("password") });
    if (!res?.ok) {
      setError(await problemTitle(res, "That email and password don't match a staff account."));
      setBusy(false);
      return;
    }

    const { step: next, challengeToken } = (await res.json()) as {
      step: "enroll_mfa" | "verify_mfa";
      challengeToken: string;
    };

    if (next === "verify_mfa") {
      setStep({ kind: "verify", challenge: challengeToken });
      setBusy(false);
      return;
    }

    const enroll = await post("/mfa/enroll", { challengeToken });
    if (!enroll?.ok) {
      setError(await problemTitle(enroll, "We couldn't start two-factor setup. Please try again."));
      setBusy(false);
      return;
    }
    const { secret, provisioningUri } = (await enroll.json()) as {
      secret: string;
      provisioningUri: string;
    };
    setStep({ kind: "enroll", challenge: challengeToken, secret, uri: provisioningUri });
    setBusy(false);
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step.kind !== "enroll" && step.kind !== "verify") return;
    const value = code.trim();
    if (useRecovery ? value.length < 8 : value.length !== 6) return;

    setError(null);
    setBusy(true);
    const res = await post(step.kind === "enroll" ? "/mfa/confirm" : "/mfa/verify", {
      challengeToken: step.challenge,
      code: value,
    });
    if (!res?.ok) {
      setError(await problemTitle(res, "That code is incorrect or has expired."));
      setBusy(false);
      return;
    }

    if (step.kind === "enroll") {
      const { recoveryCodes } = (await res.json()) as { recoveryCodes: string[] };
      setStep({ kind: "codes", codes: recoveryCodes });
      setBusy(false);
      return;
    }
    finish();
  };

  const restart = () => {
    setError(null);
    setCode("");
    setUseRecovery(false);
    setStep({ kind: "password" });
  };

  const errorLine = error && (
    <p className="text-danger text-sm" role="alert">
      {error}
    </p>
  );

  const back = (
    <button
      className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm"
      onClick={restart}
      type="button"
    >
      <ArrowLeft className="size-4" />
      Start again
    </button>
  );

  if (step.kind === "codes") {
    return (
      <div>
        <AuthHeading
          title="Save your recovery codes"
          subtitle="Each code signs you in once if you lose your authenticator. They won't be shown again."
        />
        <ul className="border-border bg-background-subtle grid grid-cols-2 gap-2 rounded-lg border p-4 font-mono text-sm">
          {step.codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="mt-4 space-y-3">
          <Button
            className="w-full"
            variant="secondary"
            onClick={() => navigator.clipboard?.writeText(step.codes.join("\n"))}
            type="button"
          >
            <Copy className="size-4" /> Copy codes
          </Button>
          <Button className="w-full" onClick={finish} type="button">
            I&apos;ve saved them, continue
          </Button>
        </div>
      </div>
    );
  }

  if (step.kind === "enroll" || step.kind === "verify") {
    const enrolling = step.kind === "enroll";
    return (
      <div>
        {back}
        <AuthHeading
          title={enrolling ? "Set up two-factor" : "Two-factor authentication"}
          subtitle={
            enrolling
              ? "Staff accounts always sign in with an authenticator app. Add this account to yours, then enter the 6-digit code it shows."
              : useRecovery
                ? "Enter one of the recovery codes you saved when you set up two-factor."
                : "Enter the 6-digit code from your authenticator app."
          }
        />
        {enrolling && (
          <div className="border-border bg-background-subtle mb-6 space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">Setup key</p>
            <p className="font-mono text-sm break-all select-all">{grouped(step.secret)}</p>
            <a className="text-primary text-sm underline-offset-4 hover:underline" href={step.uri}>
              Open in an authenticator app on this device
            </a>
          </div>
        )}
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
            {busy ? "Verifying…" : enrolling ? "Turn on two-factor" : "Verify"}
          </Button>
          {!enrolling && (
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
          )}
        </form>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        badge={
          <Badge appearance="outline" tone="neutral">
            <ShieldCheck className="size-3.5" /> Staff only
          </Badge>
        }
        title="Admin sign-in"
        subtitle="For Datarango staff accounts. Your Datarango learner account won't work here."
      />
      <form className="space-y-4" onSubmit={submitPassword}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
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
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            autoComplete="current-password"
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
      <p className="text-muted-foreground mt-8 text-center text-sm">
        Forgot your password or lost your authenticator? Ask a Super admin to reset it.
      </p>
    </div>
  );
};
