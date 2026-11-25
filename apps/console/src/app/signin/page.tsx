"use client";

import { Suspense } from "react";

import { AuthSplitLayout, Loader, SignInForm } from "@datarango/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:4000";

/**
 * Organisation sign-in. Asks for the work email first, so people whose
 * organisation federates go straight to their identity provider; everyone
 * else continues with a password.
 */
const Page = () => (
  <AuthSplitLayout
    audience="org"
    footer={
      <a className="hover:text-foreground" href={`${WEB_URL}/terms-of-use`}>
        Terms
      </a>
    }
    homeHref={`${WEB_URL}/for-teams`}
  >
    <Suspense fallback={<Loader />}>
      <SignInForm
        apiUrl={API_URL}
        emailFirst
        emailLabel="Work email"
        emailPlaceholder="you@company.com"
        fallbackReturnTo="/overview"
        footer={
          <>
            Here to learn?{" "}
            <a className="text-foreground font-medium hover:underline" href={`${WEB_URL}/signin`}>
              Go to Datarango
            </a>
          </>
        }
        forgotPasswordHref={`${WEB_URL}/forgot-password`}
        heading={{
          title: "Sign in to your organisation",
          subtitle: "Manage members, assignments, progress and billing.",
        }}
      />
    </Suspense>
  </AuthSplitLayout>
);

export default Page;
