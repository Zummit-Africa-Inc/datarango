"use client";

import { useState } from "react";

import { useActiveOrg } from "@datarango/auth";
import { Button, Input, Logo } from "@datarango/ui";

import { useCreateOrg } from "@/hooks/orgs";

/**
 * Shown when the signed-in user belongs to no organization: create the first one
 * and switch into its context. The backend makes the creator the owner.
 */
export const CreateFirstOrg = () => {
  const [name, setName] = useState("");
  const { setOrgContext } = useActiveOrg();
  const createOrg = useCreateOrg();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    createOrg.mutate({ name: name.trim() }, { onSuccess: (org) => setOrgContext(org.id) });
  };

  return (
    <div className="grid min-h-screen w-full place-items-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Logo />
        <div className="space-y-1">
          <h1 className="font-heading text-ink text-2xl">Create your organization</h1>
          <p className="text-muted-foreground text-sm">
            Organizations let you invite members, assign courses, and manage seats.
          </p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="org-name">
              Organization name
            </label>
            <Input
              id="org-name"
              autoFocus
              placeholder="Acme Academy"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            type="submit"
            disabled={createOrg.isPending || name.trim().length < 2}
          >
            {createOrg.isPending ? "Creating…" : "Create organization"}
          </Button>
        </form>
      </div>
    </div>
  );
};
