"use client";

import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/hooks";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib";

export interface AsyncSelectOption {
  value: string;
  label: string;
}

interface AsyncSelectProps {
  endpoint: string;
  onChange: (value: string) => void;
  getItems: (response: unknown) => unknown[];
  getOption: (item: unknown) => AsyncSelectOption;
  addLabel?: string;
  disabled?: boolean;
  displayValue?: string;
  error?: string;
  onAdd?: () => void;
  placeholder?: string;
  searchParam?: string;
  value?: string;
}

export const AsyncSelect = ({
  endpoint,
  onChange,
  getItems,
  getOption,
  addLabel = "Add new",
  disabled,
  displayValue,
  error,
  onAdd,
  placeholder = "Select...",
  searchParam = "search",
  value,
}: AsyncSelectProps) => {
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const flush = useDebouncedCallback((q: string) => setDebouncedSearch(q), 300);

  const handleSearch = (q: string) => {
    setSearch(q);
    flush(q);
  };

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch("");
      setDebouncedSearch("");
    }
  };

  const { data: rawData, isFetching } = useApiQuery({
    endpoint,
    params: { [searchParam]: debouncedSearch, pageSize: 20 },
    enabled: open,
    staleTime: 0,
  });

  const options: AsyncSelectOption[] = rawData ? getItems(rawData).map(getOption) : [];

  // Keep showing the known label while options haven't loaded yet
  const selectedOption =
    options.find((o) => o.value === value) ??
    (value && displayValue ? { value, label: displayValue } : undefined);

  const handleSelect = (optValue: string) => {
    onChange(optValue === value ? "" : optValue);
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  };

  return (
    <Popover open={open} onOpenChange={handleClose}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedOption && "text-muted-foreground",
            error && "border-destructive",
          )}
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              className="h-8 pl-8 text-sm"
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto p-1">
          {isFetching ? (
            <p className="text-muted-foreground py-4 text-center text-xs">Loading...</p>
          ) : options.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-xs">No results found.</p>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  opt.value === value && "bg-accent",
                )}
              >
                <Check
                  className={cn(
                    "size-3.5 shrink-0",
                    opt.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
        {onAdd && (
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAdd();
              }}
              className="text-primary hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
            >
              <Plus className="size-3.5 shrink-0" />
              {addLabel}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
