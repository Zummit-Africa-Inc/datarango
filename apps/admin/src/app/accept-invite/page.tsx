"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { AuthHeading, AuthSplitLayout, Button, Input, Label, Loader } from "@datarango/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:4000";
const MIN_LENGTH = 12;

/** The page a staff invite email links to: choose a password, then sign in. */
const AcceptInvite = () => {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }

    setError(null);
    setBusy(true);
    const res = await fetch(`${API_URL}/auth/staff/invites/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).catch(() => null);
    setBusy(false);

    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { title?: string } | null;
      setError(body?.title ?? "That invite link is invalid or has expired. Ask for a new one.");
      return;
    }
    setDone(true);
  };

  if (!token) {
    return (
      <AuthHeading
        title="This link is incomplete"
        subtitle="Open the link from your invite email again, or ask a Super admin to resend it."
      />
    );
  }

  if (done) {
    return (
      <div>
        <AuthHeading
          title="Password set"
          subtitle="Sign in now. You'll set up an authenticator app for two-factor on the way in."
        />
        <Button asChild className="w-full">
          <Link href="/signin">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeading
        title="Join Datarango Admin"
        subtitle="Choose a password for your staff account. It's separate from any Datarango learner account."
      />
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            autoComplete="new-password"
            autoFocus
            id="password"
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
          <p className="text-muted-foreground text-xs">At least {MIN_LENGTH} characters.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            autoComplete="new-password"
            id="confirm"
            onChange={(e) => setConfirm(e.target.value)}
            required
            type="password"
            value={confirm}
          />
        </div>
        {error && (
          <p className="text-danger text-sm" role="alert">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={busy} type="submit">
          {busy ? "Saving…" : "Set password"}
        </Button>
      </form>
    </div>
  );
};

const Page = () => (
  <AuthSplitLayout audience="admin" homeHref={WEB_URL}>
    <Suspense fallback={<Loader />}>
      <AcceptInvite />
    </Suspense>
  </AuthSplitLayout>
);

export default Page;
