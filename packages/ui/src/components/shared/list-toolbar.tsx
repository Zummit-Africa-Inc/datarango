"use client";

import { ChevronDown, LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

import { useDebouncedCallback } from "../../hooks/use-debounce";
import { cn } from "../../lib";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export interface ListOption {
  value: string;
  label: string;
}

export interface ListFilter {
  key: string;
  label: string;
  options: ListOption[];
  value: string[];
  /** Checkboxes when true, radios otherwise. */
  multiple?: boolean;
  onChange: (value: string[]) => void;
}

export type ListView = "grid" | "list";

export interface ListToolbarProps {
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
  filters?: ListFilter[];
  sort?: { value: string; options: ListOption[]; onChange: (value: string) => void };
  view?: { value: ListView; onChange: (value: ListView) => void };
  onClearAll?: () => void;
  /** Far right, e.g. "New course". */
  actions?: ReactNode;
  className?: string;
}

const ToolbarSearch = ({
  value,
  onChange,
  placeholder = "Search…",
}: NonNullable<ListToolbarProps["search"]>) => {
  const [draft, setDraft] = useState(value);
  const commit = useDebouncedCallback((next: string) => onChange(next.trim()), 300);

  // Follow outside changes (Clear all, back button) without clobbering typing.
  useEffect(() => {
    setDraft((current) => (current.trim() === value ? current : value));
  }, [value]);

  return (
    <div className="relative w-full md:max-w-xs">
      <Search
        aria-hidden="true"
        className="text-foreground-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <input
        type="search"
        data-list-search=""
        aria-label={placeholder.replace(/…$/, "")}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && draft) {
            e.stopPropagation();
            setDraft("");
            onChange("");
          }
        }}
        className="border-input bg-surface text-foreground placeholder:text-foreground-subtle focus-visible:border-ring focus-visible:ring-ring/20 h-10 w-full rounded-md border pr-10 pl-9 text-sm outline-none focus-visible:ring-3 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="border-border text-foreground-subtle pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded-xs border px-1.5 font-mono text-[0.6875rem] md:block">
        /
      </kbd>
    </div>
  );
};

const FilterOptions = ({ filter }: { filter: ListFilter }) => {
  const id = useId();

  if (filter.multiple) {
    return (
      <div className="flex flex-col gap-0.5">
        {filter.options.map((option) => {
          const checked = filter.value.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={`${id}-${option.value}`}
              className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-sm"
            >
              <Checkbox
                id={`${id}-${option.value}`}
                checked={checked}
                onCheckedChange={(next) =>
                  filter.onChange(
                    next
                      ? [...filter.value, option.value]
                      : filter.value.filter((v) => v !== option.value),
                  )
                }
              />
              {option.label}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <RadioGroup
      value={filter.value[0] ?? ""}
      onValueChange={(next) => filter.onChange(next ? [next] : [])}
      className="gap-0.5"
    >
      {filter.options.map((option) => (
        <label
          key={option.value}
          htmlFor={`${id}-${option.value}`}
          className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-sm"
        >
          <RadioGroupItem id={`${id}-${option.value}`} value={option.value} />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  );
};

const FilterButton = ({ filter }: { filter: ListFilter }) => {
  const count = filter.value.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn(count > 0 && "border-primary/50")}>
          {filter.label}
          {count > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full px-1.5 font-mono text-[0.6875rem] leading-4">
              {count}
            </span>
          )}
          <ChevronDown aria-hidden="true" className="text-foreground-subtle size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1.5">
        <FilterOptions filter={filter} />
        {count > 0 && (
          <button
            type="button"
            onClick={() => filter.onChange([])}
            className="text-foreground-muted hover:text-foreground mt-1 w-full border-t px-2 pt-2 pb-1 text-left text-xs"
          >
            Clear {filter.label.toLowerCase()}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

const SortSelect = ({ sort }: { sort: NonNullable<ListToolbarProps["sort"]> }) => (
  <Select value={sort.value} onValueChange={sort.onChange}>
    <SelectTrigger size="sm" aria-label="Sort by" className="w-auto gap-1.5">
      <span className="text-foreground-muted">Sort:</span>
      <SelectValue />
    </SelectTrigger>
    <SelectContent align="end">
      {sort.options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const ViewToggle = ({ view }: { view: NonNullable<ListToolbarProps["view"]> }) => (
  <div role="group" aria-label="View" className="border-border flex rounded-md border p-0.5">
    {(
      [
        { value: "grid", label: "Grid view", Icon: LayoutGrid },
        { value: "list", label: "List view", Icon: List },
      ] as const
    ).map(({ value, label, Icon }) => (
      <button
        key={value}
        type="button"
        aria-label={label}
        aria-pressed={view.value === value}
        onClick={() => view.onChange(value)}
        className="text-foreground-subtle hover:text-foreground aria-pressed:bg-muted aria-pressed:text-foreground focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-sm outline-none focus-visible:ring-2"
      >
        <Icon className="size-4" />
      </button>
    ))}
  </div>
);

/**
 * The shared list toolbar (§8): debounced search (`/` focuses it), filter
 * popovers with removable chips, sort, grid/list toggle and a primary action.
 * Below `md` the filters move into a bottom sheet behind "Filters (n)".
 */
export const ListToolbar = ({
  search,
  filters = [],
  sort,
  view,
  onClearAll,
  actions,
  className,
}: ListToolbarProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const active = filters.flatMap((filter) =>
    filter.value.map((value) => ({
      filter,
      value,
      label: filter.options.find((o) => o.value === value)?.label ?? value,
    })),
  );
  const clearAll = () =>
    onClearAll ? onClearAll() : filters.forEach((filter) => filter.onChange([]));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {search && <ToolbarSearch {...search} />}

        {filters.length > 0 && (
          <>
            <div className="hidden flex-wrap items-center gap-2 md:flex">
              {filters.map((filter) => (
                <FilterButton key={filter.key} filter={filter} />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setSheetOpen(true)}
            >
              <SlidersHorizontal className="size-4" />
              Filters{active.length > 0 && ` (${active.length})`}
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {sort && <SortSelect sort={sort} />}
          {view && <ViewToggle view={view} />}
          {actions}
        </div>
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map(({ filter, value, label }) => (
            <span
              key={`${filter.key}:${value}`}
              className="bg-primary-soft text-primary-soft-foreground inline-flex h-7 items-center gap-1 rounded-full pr-1 pl-3 text-xs font-medium"
            >
              <span className="opacity-70">{filter.label}:</span> {label}
              <button
                type="button"
                aria-label={`Remove ${filter.label} ${label}`}
                onClick={() => filter.onChange(filter.value.filter((v) => v !== value))}
                className="hover:bg-primary/15 focus-visible:ring-ring inline-flex size-5 items-center justify-center rounded-full outline-none focus-visible:ring-2"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-foreground-muted hover:text-foreground text-xs font-medium underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {filters.length > 0 && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-lg p-0 md:hidden">
            <SheetHeader className="border-b p-4">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription className="sr-only">Narrow down the list</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              {filters.map((filter) => (
                <fieldset key={filter.key} className="mb-4 last:mb-0">
                  <legend className="text-foreground-subtle mb-1 text-xs font-medium tracking-[0.06em] uppercase">
                    {filter.label}
                  </legend>
                  <FilterOptions filter={filter} />
                </fieldset>
              ))}
            </div>
            <SheetFooter className="flex-row border-t p-4">
              <Button variant="outline" className="flex-1" onClick={clearAll}>
                Clear all
              </Button>
              <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                Show results
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

/** Focuses the page's list search, if there is one. Used by the global `/` shortcut. */
export const focusListSearch = () => {
  const input = document.querySelector<HTMLInputElement>("input[data-list-search]");
  if (!input || input.offsetParent === null) return false;
  input.focus();
  input.select();
  return true;
};
