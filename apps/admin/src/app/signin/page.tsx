"use client";

import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";

import { AuthSplitLayout, Badge, Loader, SignInForm } from "@datarango/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:4000";

/**
 * Platform staff sign-in: no sign-up, no social logins, no org SSO. Access
 * still depends on a platform role checked by the server; this page only
 * keeps the public routes off the staff entrance.
 */
const Page = () => (
  <AuthSplitLayout audience="admin" homeHref={WEB_URL}>
    <Suspense fallback={<Loader />}>
      <SignInForm
        apiUrl={API_URL}
        fallbackReturnTo="/overview"
        forgotPasswordHref={`${WEB_URL}/forgot-password`}
        heading={{
          badge: (
            <Badge appearance="outline" tone="neutral">
              <ShieldCheck className="size-3.5" /> Staff only
            </Badge>
          ),
          title: "Admin sign-in",
          subtitle:
            "For Datarango platform staff. Turn on two-factor authentication for your account.",
        }}
        sso={false}
      />
    </Suspense>
  </AuthSplitLayout>
);

export default Page;
