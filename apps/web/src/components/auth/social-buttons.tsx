"use client";

import { useSearchParams } from "next/navigation";

import { Button } from "@datarango/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Google / GitHub sign-in. Each button hands the browser to the accounts
 * service's external-provider entry point, carrying the post-login
 * destination; the provider dance ends by resuming the normal PKCE flow.
 */
export const SocialButtons = () => {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const start = (provider: "google" | "github") => {
    const dest = returnTo.startsWith("http") ? "/dashboard" : returnTo;
    window.location.assign(
      `${API_URL}/auth/external/${provider}?returnTo=${encodeURIComponent(dest)}`,
    );
  };

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={() => start("google")} type="button" variant="outline">
        Continue with Google
      </Button>
      <Button className="w-full" onClick={() => start("github")} type="button" variant="outline">
        Continue with GitHub
      </Button>
    </div>
  );
};
