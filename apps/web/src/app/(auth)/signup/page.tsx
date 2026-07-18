"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";

import { Button, Input, Label } from "@datarango/ui";

import { AuthCard, AuthDivider } from "@/components/auth/auth-card";

const SignInPrompt = () => (
  <p className="text-muted-foreground mt-6 text-sm text-center">
    Already have an account?{" "}
    <Link className="link before:bg-ink text-foreground" href="/signin">
      Sign in
    </Link>
  </p>
);

const Page = () => {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  if (intent === "org") {
    return (
      <AuthCard
        cell="org"
        title="Create your organization"
        subtitle="Set up a workspace to train your team on real data work."
      >
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" placeholder="Acme Academy" type="text" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input autoComplete="email" id="email" placeholder="you@company.com" type="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input autoComplete="new-password" id="password" type="password" />
          </div>
          <Button className="w-full" type="submit">
            Create organization
          </Button>
        </form>
        <SignInPrompt />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      cell="signup"
      title="Create your account"
      subtitle="Start learning free — run your first notebook in minutes."
    >
      <div className="space-y-2">
        <Button className="w-full" type="button" variant="outline">
          Continue with Google
        </Button>
        <Button className="w-full" type="button" variant="outline">
          Continue with GitHub
        </Button>
      </div>
      <AuthDivider />
      <form className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input autoComplete="name" id="name" placeholder="Ada Obi" type="text" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input autoComplete="email" id="email" placeholder="you@example.com" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input autoComplete="new-password" id="password" type="password" />
        </div>
        <Button className="w-full" type="submit">
          Create account
        </Button>
      </form>
      <SignInPrompt />
    </AuthCard>
  );
};

export default Page;
