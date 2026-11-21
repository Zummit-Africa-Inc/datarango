"use client";

import { ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { cn } from "../../../lib";
import { UserAvatar } from "../../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

export interface ShellUser {
  name: string;
  email: string;
  avatarUrl?: string;
  /** Shown under the name, e.g. "Learner", "Creator", "Org admin". */
  role?: string;
}

export interface UserMenuProps {
  user: ShellUser;
  onSignOut: () => void | Promise<void>;
  settingsHref?: string;
  /** Extra items (e.g. an org-context toggle), rendered above "Sign out". */
  items?: ReactNode;
}

const UserMenuContent = ({
  user,
  onSignOut,
  settingsHref,
  items,
  side,
}: UserMenuProps & { side: "top" | "bottom" }) => {
  const { theme, setTheme } = useTheme();
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    setPending(true);
    try {
      await onSignOut();
    } catch {
      setPending(false);
    }
  };

  return (
    <DropdownMenuContent side={side} align={side === "top" ? "start" : "end"} className="w-60">
      <DropdownMenuLabel className="font-normal">
        <p className="text-foreground truncate text-sm font-medium">{user.name}</p>
        <p className="text-foreground-muted truncate text-xs">{user.email}</p>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        {settingsHref && (
          <DropdownMenuItem asChild>
            <Link href={settingsHref}>
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun /> Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon /> Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor /> System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {items}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        disabled={pending}
        onSelect={(e) => {
          e.preventDefault();
          void signOut();
        }}
      >
        <LogOut />
        {pending ? "Signing out…" : "Sign out"}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

/** Sidebar footer card: avatar, name, role and a chevron menu (§9). */
export const UserCard = ({ collapsed, ...props }: UserMenuProps & { collapsed?: boolean }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label={`Account menu for ${props.user.name}`}
        className={cn(
          "hover:bg-muted focus-visible:ring-ring data-[state=open]:bg-muted flex w-full items-center gap-3 rounded-sm text-left outline-none focus-visible:ring-2",
          collapsed ? "justify-center p-1.5" : "p-2",
        )}
      >
        <UserAvatar name={props.user.name} src={props.user.avatarUrl} />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="text-foreground block truncate text-sm font-medium">
                {props.user.name}
              </span>
              <span className="text-foreground-muted block truncate text-xs">
                {props.user.role ?? props.user.email}
              </span>
            </span>
            <ChevronsUpDown aria-hidden="true" className="text-foreground-subtle size-4 shrink-0" />
          </>
        )}
      </button>
    </DropdownMenuTrigger>
    <UserMenuContent {...props} side="top" />
  </DropdownMenu>
);

/** Avatar-only trigger for the top bar on small screens, where the sidebar is hidden. */
export const UserAvatarMenu = (props: UserMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label={`Account menu for ${props.user.name}`}
        className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <UserAvatar name={props.user.name} src={props.user.avatarUrl} />
      </button>
    </DropdownMenuTrigger>
    <UserMenuContent {...props} side="bottom" />
  </DropdownMenu>
);
