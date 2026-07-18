"use client";

import { GitHubIcon, GoogleIcon, MicrosoftIcon } from "../../assets/icons";
import { Button } from "../ui/button";

export type SsoProvider = "google" | "github" | "microsoft";

interface Props {
  onLogin: (provider: SsoProvider) => void;
  providers?: SsoProvider[];
  isLoading?: boolean;
}

const PROVIDER_META: Record<SsoProvider, { label: string; icon: React.ReactNode }> = {
  google: { label: "Google", icon: <GoogleIcon /> },
  github: { label: "GitHub", icon: <GitHubIcon /> },
  microsoft: { label: "Microsoft", icon: <MicrosoftIcon /> },
};

/** Social login buttons — Google + GitHub by default (platform), Microsoft for org SSO. */
export const SsoLogin = ({
  onLogin,
  providers = ["google", "github"],
  isLoading = false,
}: Props) => (
  <div className="grid w-full gap-2">
    {providers.map((provider) => (
      <Button
        className="w-full"
        disabled={isLoading}
        key={provider}
        onClick={() => onLogin(provider)}
        variant="outline"
      >
        {PROVIDER_META[provider].icon} Continue with {PROVIDER_META[provider].label}
      </Button>
    ))}
  </div>
);
