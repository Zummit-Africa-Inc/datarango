"use client";

import { addMonths, format, subMonths, isAfter, isBefore, isSameDay, startOfMonth } from "date-fns";
import { ChevronLeftIcon } from "lucide-react";
import React from "react";

import { cn } from "@/lib";

interface CalendarProps {
  onSelect: (date: Date | undefined) => void;
  value: Date | undefined;
  className?: string;
  maxDate?: Date;
  minDate?: Date;
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export const Calendar = ({ onSelect, value, className, maxDate, minDate }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(() => new Date());

  const isDateDisabled = React.useCallback(
    (date?: Date): boolean => {
      if (!date) return false;
      if (minDate && isBefore(date, minDate)) return true;
      if (maxDate && isAfter(date, maxDate)) return true;
      return false;
    },
    [minDate, maxDate],
  );

  const isSelected = React.useCallback(
    (day?: Date): boolean => {
      return !!day && !!value && isSameDay(day, value);
    },
    [value],
  );

  const handlePreviousMonth = React.useCallback(() => {
    const prevMonth = subMonths(currentMonth, 1);
    if (minDate && isBefore(prevMonth, startOfMonth(minDate))) return;
    setCurrentMonth(prevMonth);
  }, [currentMonth, minDate]);

  const handleNextMonth = React.useCallback(() => {
    const nextMonth = addMonths(currentMonth, 1);
    if (maxDate && isAfter(nextMonth, startOfMonth(maxDate))) return;
    setCurrentMonth(nextMonth);
  }, [currentMonth, maxDate]);

  const { calendarDays, isPrevDisabled, isNextDisabled } = React.useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days: (Date | undefined)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(undefined);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const isPrevDisabled = minDate
      ? isBefore(subMonths(currentMonth, 1), startOfMonth(minDate))
      : false;
    const isNextDisabled = maxDate
      ? isAfter(addMonths(currentMonth, 1), startOfMonth(maxDate))
      : false;

    return { calendarDays: days, isPrevDisabled, isNextDisabled };
  }, [currentMonth, minDate, maxDate]);

  const handleDayClick = React.useCallback(
    (day: Date | undefined) => {
      onSelect(day);
    },
    [onSelect],
  );

  return (
    <div className={cn("w-full max-w-72 space-y-2", className)}>
      <div className="flex w-full items-center justify-between gap-x-4">
        <button
          className={cn(
            "grid size-7 place-items-center rounded border border-neutral-400 transition-opacity",
            isPrevDisabled && "cursor-not-allowed opacity-50",
          )}
          onClick={handlePreviousMonth}
          disabled={isPrevDisabled}
          type="button"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="size-4" />
        </button>

        <div className="flex-1 text-center text-sm font-medium">
          {format(currentMonth, "MMMM, yyyy")}
        </div>

        <button
          className={cn(
            "grid size-7 place-items-center rounded border border-neutral-400 transition-opacity",
            isNextDisabled && "cursor-not-allowed opacity-50",
          )}
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          type="button"
          aria-label="Next month"
        >
          <ChevronLeftIcon className="size-4 rotate-180" />
        </button>
      </div>

      <div className="grid w-full grid-cols-7 gap-x-1">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="flex aspect-square items-center justify-center text-sm font-medium text-neutral-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid w-full grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const disabled = isDateDisabled(day);
          const selected = isSelected(day);

          return (
            <button
              key={`${currentMonth.getMonth()}-${index}`}
              className={cn(
                "aspect-square rounded text-sm transition-colors",
                day && !disabled && !selected && "hover:bg-neutral-300",
                selected && "bg-primary-300/50",
                disabled && "cursor-not-allowed text-neutral-300 hover:bg-transparent",
              )}
              disabled={!day || disabled}
              onClick={() => handleDayClick(day)}
              type="button"
              aria-label={day ? format(day, "EEEE, MMMM do, yyyy") : undefined}
            >
              {day && format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
};
