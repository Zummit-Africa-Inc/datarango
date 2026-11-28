"use client";

import { Suspense } from "react";

import { AuthSplitLayout, Loader } from "@datarango/ui";

import { StaffSignIn } from "@/components/staff-sign-in";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:4000";

/**
 * Staff sign-in. Staff accounts are separate from user accounts and sign in
 * passwordless through Trustaige; accounts sends the admin client's authorize here.
 */
const Page = () => (
  <AuthSplitLayout audience="admin" homeHref={WEB_URL}>
    <Suspense fallback={<Loader />}>
      <StaffSignIn apiUrl={API_URL} />
    </Suspense>
  </AuthSplitLayout>
);

export default Page;
