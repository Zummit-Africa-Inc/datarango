"use client";

import { Suspense } from "react";

import { AuthSplitLayout, Loader, SignInForm } from "@datarango/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:4000";

/**
 * Creator sign-in. One Datarango account works everywhere, so sign-up and
 * password reset stay on web; this page links there.
 */
const Page = () => (
  <AuthSplitLayout
    audience="creator"
    footer={
      <a className="hover:text-foreground" href={`${WEB_URL}/terms-of-use`}>
        Terms
      </a>
    }
    homeHref={WEB_URL}
  >
    <Suspense fallback={<Loader />}>
      <SignInForm
        apiUrl={API_URL}
        fallbackReturnTo="/courses"
        footer={
          <>
            No account yet?{" "}
            <a className="text-foreground font-medium hover:underline" href={`${WEB_URL}/signup`}>
              Create one on Datarango
            </a>
          </>
        }
        forgotPasswordHref={`${WEB_URL}/forgot-password`}
        heading={{
          title: "Sign in to Studio",
          subtitle: "Use your Datarango account to build and manage your courses.",
        }}
      />
    </Suspense>
  </AuthSplitLayout>
);

export default Page;
