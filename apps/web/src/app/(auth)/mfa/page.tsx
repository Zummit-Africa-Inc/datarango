"use client";

import React, { useState } from "react";

import { Button, OtpInput } from "@datarango/ui";

import { AuthCard } from "@/components/auth/auth-card";

const Page = () => {
  const [code, setCode] = useState("");

  return (
    <AuthCard
      cell="mfa"
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app."
    >
      <form className="space-y-4">
        <OtpInput length={6} onChange={setCode} value={code} />
        <Button className="w-full" type="submit">
          Verify code
        </Button>
      </form>
    </AuthCard>
  );
};

export default Page;
