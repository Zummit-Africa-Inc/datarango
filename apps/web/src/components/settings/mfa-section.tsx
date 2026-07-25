"use client";

import { useState } from "react";

import { ApiError, getApi } from "@datarango/api";
import { useUser } from "@datarango/auth";
import { Button, OtpInput } from "@datarango/ui";

interface Enrollment {
  secret: string;
  provisioningUri: string;
}

interface RecoveryCodesResponse {
  recoveryCodes: string[];
}

type Stage = "idle" | "setup" | "codes" | "disable";

const message = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

/**
 * TOTP two-factor setup (BACKEND-HANDOFF §4): enrol → scan/enter the secret →
 * confirm with a code → save one-time recovery codes; or disable with a code.
 */
export const MfaSection = () => {
  const user = useUser();
  const enabled = user?.mfaEnabled ?? false;

  const [stage, setStage] = useState<Stage>("idle");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEnrol = async () => {
    setBusy(true);
    setError(null);
    try {
      setEnrollment(await getApi().post<Enrollment>("/auth/mfa/enroll"));
      setStage("setup");
    } catch (e) {
      setError(message(e, "Couldn't start two-factor setup."));
    }
    setBusy(false);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await getApi().post<RecoveryCodesResponse>("/auth/mfa/confirm", { code: otp });
      setCodes(res.recoveryCodes);
      setStage("codes");
      setOtp("");
    } catch (e) {
      setError(message(e, "That code is incorrect or has expired."));
    }
    setBusy(false);
  };

  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      await getApi().post("/auth/mfa/disable", { code: otp });
      window.location.reload(); // refresh the session's mfaEnabled flag
    } catch (e) {
      setError(message(e, "That code is incorrect or has expired."));
      setBusy(false);
    }
  };

  return (
    <section className="border-hairline bg-card space-y-4 rounded-xs border p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-ink text-lg">Two-factor authentication</h2>
          <p className="text-muted-foreground text-sm">
            {enabled
              ? "Two-factor authentication is on. A code from your authenticator app is required at sign-in."
              : "Add a second step at sign-in using an authenticator app."}
          </p>
        </div>
        {stage === "idle" && !enabled && (
          <Button onClick={startEnrol} disabled={busy}>
            {busy ? "…" : "Enable"}
          </Button>
        )}
        {stage === "idle" && enabled && (
          <Button variant="outline" onClick={() => setStage("disable")}>
            Disable
          </Button>
        )}
      </div>

      {stage === "setup" && enrollment && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">1. Add this secret to your authenticator app</p>
            <code className="bg-muted block rounded-xs px-3 py-2 font-mono text-sm break-all">
              {enrollment.secret}
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">2. Enter the 6-digit code it shows</p>
            <OtpInput length={6} value={otp} onChange={setOtp} />
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={confirm} disabled={busy || otp.length !== 6}>
              {busy ? "Confirming…" : "Confirm & enable"}
            </Button>
            <Button variant="ghost" onClick={() => setStage("idle")}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {stage === "codes" && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Save your recovery codes</p>
          <p className="text-muted-foreground text-sm">
            Each code works once if you lose your device. Store them somewhere safe — you won't see
            them again.
          </p>
          <div className="bg-muted grid grid-cols-2 gap-2 rounded-xs p-3 font-mono text-sm">
            {codes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <Button onClick={() => window.location.reload()}>Done</Button>
        </div>
      )}

      {stage === "disable" && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Enter a code to turn off two-factor authentication</p>
          <OtpInput length={6} value={otp} onChange={setOtp} />
          {error && <p className="text-error text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button variant="destructive" onClick={disable} disabled={busy || otp.length !== 6}>
              {busy ? "Disabling…" : "Disable 2FA"}
            </Button>
            <Button variant="ghost" onClick={() => setStage("idle")}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
