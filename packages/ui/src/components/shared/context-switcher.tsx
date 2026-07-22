"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";

interface Props {
  user: { name: string; email: string; avatarUrl?: string };
  /** Ends the session. May be async (e.g. a BFF sign-out + redirect). */
  onSignOut: () => void | Promise<void>;
  /** Context toggle (e.g. personal ↔ org view). Omit to hide the toggle row. */
  contextToggle?: {
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  };
}

/** Bottom-of-sidebar user block (ink surface): optional context toggle + profile + sign out. */
export const ContextSwitcher = ({ user, onSignOut, contextToggle }: Props) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);
    try {
      await onSignOut();
      // A successful sign-out redirects away and unmounts this component; the
      // pending state is intentionally left set so the button can't be reused.
    } catch {
      setPending(false);
    }
  };

  const initials = user.name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-4">
      {contextToggle && (
        <>
          <div className="flex items-center justify-between gap-x-4 py-2">
            <div>
              <p className="text-on-ink text-sm">{contextToggle.title}</p>
              <p className="text-on-ink-muted text-xs">{contextToggle.description}</p>
            </div>
            <Switch
              checked={contextToggle.checked}
              onCheckedChange={contextToggle.onCheckedChange}
            />
          </div>
          <hr className="border-white/5" />
        </>
      )}
      <div className="flex items-center justify-between gap-x-4 py-2">
        <div className="flex min-w-0 items-center gap-x-2">
          <Avatar className="size-7">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="bg-ink-elevated text-on-ink text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-on-ink truncate text-sm font-medium">{user.name}</p>
            <p className="text-on-ink-muted truncate text-xs">{user.email}</p>
          </div>
        </div>
        <Dialog onOpenChange={setOpen} open={open}>
          <DialogTrigger asChild>
            <Button
              className="text-on-ink-muted hover:text-on-ink hover:bg-white/10"
              size="icon-sm"
              variant="ghost"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>You can sign back in at any time.</DialogDescription>
            <div className="grid grid-cols-2 gap-6">
              <Button
                className="w-full"
                onClick={() => setOpen(false)}
                variant="outline"
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                className="w-full"
                onClick={handleSignOut}
                variant="destructive"
                disabled={pending}
              >
                {pending ? "Signing out…" : "Sign Out"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
