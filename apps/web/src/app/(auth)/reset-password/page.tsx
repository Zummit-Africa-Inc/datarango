"use client";

import { LockIcon, RotateCcwKeyIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Button, Input, OtpInput } from "@datarango/ui";

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
      <div className="bg-background flex w-125 flex-col items-center gap-y-6 rounded-lg border p-4">
        <div className="relative grid size-22 place-items-center">
          <div className="absolute inset-0 rounded-full border [clip-path:inset(0_0_50%_0)]" />
          <div className="grid size-14 place-items-center rounded-full shadow-md">
            <LockIcon />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Enter OTP</h2>
          <p className="text-muted-foreground text-sm">Welcome back! Please sign in to continue</p>
        </div>
        <form className="w-full space-y-4">
          <OtpInput onChange={(otp) => setValue("otp", otp)} value={watch().otp} length={6} />
          <Button className="w-full" type="submit"></Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-background flex w-125 flex-col items-center gap-y-6 rounded-lg border p-4">
      <div className="relative grid size-22 place-items-center">
        <div className="absolute inset-0 rounded-full border [clip-path:inset(0_0_50%_0)]" />
        <div className="grid size-14 place-items-center rounded-full shadow-md">
          <RotateCcwKeyIcon />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Create New Password</h2>
        <p className="text-muted-foreground text-sm">Welcome back! Please sign in to continue</p>
      </div>
      <form className="w-full space-y-4">
        <Input type="password" placeholder="New Password" />
        <Input type="password" placeholder="Confirm New Password" />
        <Button className="w-full" type="submit"></Button>
      </form>
    </div>
  );
};

export default Page;
