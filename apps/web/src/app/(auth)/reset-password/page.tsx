"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Button, Input, Label, OtpInput } from "@datarango/ui";

import { AuthCard } from "@/components/auth/auth-card";

type Stage = "otp" | "password";

const schema = z.object({
  otp: z.string().length(6),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  otp: "",
  password: "",
  confirmPassword: "",
};

const Page = () => {
  const [stage, setStage] = useState<Stage>("otp");

  const { setValue, watch } = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(schema),
  });

  if (stage === "otp") {
    return (
      <AuthCard
        cell="verify"
        title="Check your email"
        subtitle="We sent a 6-digit code to your email address. Enter it below to continue."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setStage("password");
          }}
        >
          <OtpInput length={6} onChange={(otp) => setValue("otp", otp)} value={watch().otp} />
          <Button className="w-full" type="submit">
            Continue
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      cell="reset"
      title="Set a new password"
      subtitle="Choose a strong password you haven't used here before."
    >
      <form className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input autoComplete="new-password" id="password" type="password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input autoComplete="new-password" id="confirm-password" type="password" />
        </div>
        <Button className="w-full" type="submit">
          Set new password
        </Button>
      </form>
    </AuthCard>
  );
};

export default Page;
