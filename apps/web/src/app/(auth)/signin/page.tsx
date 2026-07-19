import Link from "next/link";
import React from "react";

import { Button, Checkbox, Input, Label } from "@datarango/ui";

import { AuthCard, AuthDivider } from "@/components/auth/auth-card";

const Page = () => {
  return (
    <AuthCard cell="signin" title="Welcome back" subtitle="Sign in to pick up where you stopped.">
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
          <Label htmlFor="email">Email</Label>
          <Input autoComplete="email" id="email" placeholder="you@example.com" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input autoComplete="current-password" id="password" type="password" />
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-x-2">
              <Checkbox id="remember" />
              <Label className="font-normal" htmlFor="remember">
                Keep me signed in
              </Label>
            </div>
            <Link className="link before:bg-ink text-sm" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button className="w-full" type="submit">
          Sign in
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        New to Datarango?{" "}
        <Link className="link before:bg-ink text-foreground" href="/signup">
          Create account
        </Link>
      </p>
    </AuthCard>
  );
};

export default Page;
