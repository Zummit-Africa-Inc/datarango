import { KeyIcon } from "lucide-react";
import React from "react";

import { Button, Input } from "@datarango/ui";

const Page = () => {
  return (
    <div className="bg-background flex w-125 flex-col items-center gap-y-6 rounded-lg border p-4">
      <div className="relative grid size-22 place-items-center">
        <div className="absolute inset-0 rounded-full border [clip-path:inset(0_0_50%_0)]" />
        <div className="grid size-14 place-items-center rounded-full shadow-md">
          <KeyIcon />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Forgot Password</h2>
        <p className="text-muted-foreground text-sm">Welcome back! Please sign in to continue</p>
      </div>
      <form className="w-full space-y-4">
        <Input type="email" />
        <Button className="w-full" type="submit"></Button>
      </form>
    </div>
  );
};

export default Page;
