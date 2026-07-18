"use client";

import { format } from "date-fns";
import React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarSearchIcon } from "lucide-react";
import { Calendar } from "./calendar";
import { cn } from "../../lib";

interface Props {
  onSelect: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
  error?: string;
  maxDate?: Date;
  minDate?: Date;
  selected?: Date;
  placeholder?: string;
}

export const DatePicker = ({
  onSelect,
  className,
  disabled,
  error,
  maxDate,
  minDate,
  selected,
  placeholder = "Pick a date",
}: Props) => {
  const [open, setOpen] = React.useState(false);

  const handleChange = (date: Date | undefined) => {
    onSelect(date);
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex h-9 w-full min-w-[200px] items-center justify-between gap-2 rounded-xs border border-neutral-400 px-3 text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            className,
          )}
          disabled={disabled}
        >
          {selected ? format(selected, "PPP") : <span>{placeholder || "Pick a date"}</span>}
          <CalendarSearchIcon className="text-primary-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <Calendar onSelect={handleChange} value={selected} maxDate={maxDate} minDate={minDate} />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </PopoverContent>
    </Popover>
  );
};
