"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useGlobalStore, useUserStore } from "@/store";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

export const ContextSwitcher = () => {
  const { currentContext, onContextChange } = useGlobalStore();
  const {} = useUserStore();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const switchContext = () => {
    const next = currentContext === "admin" ? "ess" : "admin";
    onContextChange(next);
    router.push(next === "admin" ? "/admin" : "/ess");
  };

  return (
    <div className="px-4">
      <div className="flex items-center justify-between gap-x-4 py-2">
        <div>
          <p className="text-sm">Employee View</p>
          <p className="text-muted-foreground text-xs">Access your personal account</p>
        </div>
        <Switch checked={currentContext === "ess"} onCheckedChange={switchContext} />
      </div>
      <hr />
      <div className="flex items-center justify-between gap-x-4 py-2">
        <div className="flex items-center gap-x-2">
          <Avatar className="size-7">
            <AvatarImage />
            <AvatarFallback></AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium"></p>
            <p className="text-muted-foreground text-xs"></p>
          </div>
        </div>
        <Dialog onOpenChange={(open) => setOpen(open)} open={open}>
          <DialogTrigger>
            <Button>
              <LogOut className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription></DialogDescription>
            <div className="grid grid-cols-2 gap-6">
              <Button className="w-full" onClick={() => setOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button className="w-full" variant="destructive">
                Sign Out
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
