import Link from "next/link";
import React, { Suspense } from "react";

import { AuthSplitLayout, Loader } from "@datarango/ui";

interface Props {
  children: React.ReactNode;
}

/** §7.7 split screen for every learner auth page (sign-in, sign-up, reset, verify, MFA). */
const AuthLayout = ({ children }: Props) => (
  <AuthSplitLayout
    audience="learner"
    footer={
      <>
        <Link className="hover:text-foreground" href="/terms-of-use">
          Terms
        </Link>
        <span aria-hidden> · </span>
        <Link className="hover:text-foreground" href="/privacy-policy">
          Privacy
        </Link>
      </>
    }
  >
    <Suspense fallback={<Loader />}>{children}</Suspense>
  </AuthSplitLayout>
);

export default AuthLayout;
