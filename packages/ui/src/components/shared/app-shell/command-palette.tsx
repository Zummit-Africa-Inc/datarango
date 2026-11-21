"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { flattenNav, type NavGroup } from "../../../config/nav";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "../../ui/command";

export interface PaletteCommand {
  id: string;
  label: string;
  icon?: ReactNode;
  keywords?: string[];
  shortcut?: string;
  onSelect: () => void;
}

export interface PaletteCommandGroup {
  heading: string;
  commands: PaletteCommand[];
}

export interface CommandPaletteConfig {
  nav: NavGroup[];
  groups?: PaletteCommandGroup[];
  /** Free-text fallback ("Search for …"), e.g. a results page. */
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const PaletteContext = createContext<{ open: () => void } | null>(null);

/** Opens the command palette from anywhere inside the app shell. */
export const useCommandPalette = () => {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  return ctx;
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.closest("[role=textbox], .cm-editor") !== null
  );
};

/** Platform-appropriate shortcut label for the palette. */
export const usePaletteShortcut = () => {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.userAgent));
  }, []);
  return mac ? "⌘K" : "Ctrl K";
};

/**
 * ⌘K / Ctrl K toggles the palette anywhere; `/` opens it when the user isn't typing (§5).
 * Lists every nav destination, any extra command groups, and a free-text search fallback.
 */
export const CommandPaletteProvider = ({
  config,
  children,
}: {
  config: CommandPaletteConfig;
  children: ReactNode;
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const open = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const destinations = useMemo(
    () => flattenNav(config.nav).filter((item) => !item.disabled),
    [config.nav],
  );

  const run = (action: () => void) => {
    setIsOpen(false);
    setQuery("");
    action();
  };

  const trimmed = query.trim();

  return (
    <PaletteContext.Provider value={useMemo(() => ({ open }), [open])}>
      {children}
      <CommandDialog
        open={isOpen}
        onOpenChange={(next) => {
          setIsOpen(next);
          if (!next) setQuery("");
        }}
        title="Command palette"
        description="Jump to a page or run a command"
      >
        <Command loop className="rounded-none! bg-transparent p-0">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={config.placeholder ?? "Search or jump to…"}
          />
          <CommandList>
            <CommandEmpty>No matches.</CommandEmpty>
            {config.onSearch && trimmed && (
              <CommandGroup heading="Search">
                <CommandItem
                  forceMount
                  value={`search ${trimmed}`}
                  onSelect={() => run(() => config.onSearch?.(trimmed))}
                >
                  <Search />
                  <span className="truncate">
                    Search for <span className="font-medium">“{trimmed}”</span>
                  </span>
                  <CommandShortcut>
                    <CornerDownLeft className="size-3.5" />
                  </CommandShortcut>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Go to">
              {destinations.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.parent ?? ""} ${item.label} ${item.href}`}
                    keywords={item.keywords}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    {Icon ? <Icon /> : <span className="size-4" aria-hidden="true" />}
                    <span>{item.label}</span>
                    {item.parent && (
                      <span className="text-foreground-subtle ml-auto text-xs">{item.parent}</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {config.groups?.map((group) => (
              <CommandGroup key={group.heading} heading={group.heading}>
                {group.commands.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={`${group.heading} ${command.label}`}
                    keywords={command.keywords}
                    onSelect={() => run(command.onSelect)}
                  >
                    {command.icon}
                    <span>{command.label}</span>
                    {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </PaletteContext.Provider>
  );
};
