"use client";

import Link from "next/link";

import { SignInForm } from "@datarango/ui";

import { SocialButtons } from "@/components/auth/social-buttons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Learner sign-in: social logins, org SSO offered by email domain, sign-up link. */
const Page = () => (
  <SignInForm
    apiUrl={API_URL}
    fallbackReturnTo="/dashboard"
    footer={
      <>
        New to Datarango?{" "}
        <Link className="text-foreground font-medium hover:underline" href="/signup">
          Create an account
        </Link>
      </>
    }
    forgotPasswordHref="/forgot-password"
    heading={{ title: "Welcome back", subtitle: "Sign in to pick up where you stopped." }}
    social={<SocialButtons />}
  />
);

export default Page;
