import type { ReactNode } from "react";

import { AuthHeading } from "@datarango/ui";

interface AuthCardProps {
  /** Kept for existing callers; the redesign dropped the `dr [cell]` kicker. */
  cell?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Heading + body for the learner auth pages inside `AuthSplitLayout`. */
export const AuthCard = ({ title, subtitle, children }: AuthCardProps) => (
  <div className="w-full">
    <AuthHeading title={title} subtitle={subtitle} />
    {children}
  </div>
);

export const AuthDivider = () => (
  <div className="before:bg-border relative my-6 flex items-center justify-center before:absolute before:top-1/2 before:left-0 before:h-px before:w-full">
    <span className="bg-background text-muted-foreground relative px-3 text-xs">or</span>
  </div>
);
