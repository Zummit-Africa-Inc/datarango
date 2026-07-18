"use client";

import { useSearchParams } from "next/navigation";
import { UserIcon } from "lucide-react";
import React from "react";

import { Button } from "@datarango/ui";

const Page = () => {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  if (intent === "org") {
    return (
      <div className="bg-background flex w-125 flex-col items-center gap-y-6 rounded-lg border p-4">
        <div className="relative grid size-22 place-items-center">
          <div className="absolute inset-0 rounded-full border [clip-path:inset(0_0_50%_0)]" />
          <div className="grid size-14 place-items-center rounded-full shadow-md">
            <UserIcon />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Create Organization</h2>
          <p className="text-muted-foreground text-sm">Welcome back! Please sign in to continue</p>
        </div>
        <form className="w-full space-y-4">
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
          <UserIcon />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Create Account</h2>
        <p className="text-muted-foreground text-sm">Welcome back! Please sign in to continue</p>
      </div>
      <div className="w-full space-y-2">
        <Button className="w-full" type="button" variant="outline">
          Sign in with Google
        </Button>
        <Button className="w-full" type="button" variant="outline">
          Sign in with Github
        </Button>
      </div>
      <div className="relative flex w-full items-center justify-center before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:translate-y-1/2 before:bg-gray-300">
        <span className="z-1! bg-white px-3 text-xs text-gray-600">OR</span>
      </div>
      <form className="w-full space-y-4">
        <Button className="w-full" type="submit"></Button>
      </form>
    </div>
  );
};

export default Page;
