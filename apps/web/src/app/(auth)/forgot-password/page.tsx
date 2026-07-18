import Link from "next/link";
import React from "react";

import { Button, Input, Label } from "@datarango/ui";

import { AuthCard } from "@/components/auth/auth-card";

const Page = () => {
  return (
    <AuthCard
      cell="reset"
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
    >
      <form className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input autoComplete="email" id="email" placeholder="you@example.com" type="email" />
        </div>
        <Button className="w-full" type="submit">
          Send reset link
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remembered it?{" "}
        <Link className="link before:bg-ink text-foreground" href="/signin">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
};

export default Page;
