"use client";

import React from "react";

interface OtpInputProps {
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
  error?: { touched?: boolean; message?: string };
  helperText?: string;
  length?: number;
  readOnly?: boolean;
}

export const OtpInput = ({
  onChange,
  value,
  disabled,
  error,
  helperText,
  length = 4,
  readOnly,
}: OtpInputProps) => {
  const values = React.useMemo(() => {
    return Array.from({ length: length }, (_, i) => value[i] || "");
  }, [length, value]);

  const focusToNextInput = (target: HTMLElement) => {
    const nextElementSibling = target.nextElementSibling as HTMLInputElement | null;
    if (nextElementSibling) {
      nextElementSibling.focus();
    }
  };

  const focusToLastInput = (target: HTMLElement) => {
    const previousElementSibling = target.previousElementSibling as HTMLInputElement | null;
    if (previousElementSibling) {
      previousElementSibling.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = value.slice(0, index) + e.target.value + value.slice(index + 1);
    onChange(newValue.slice(0, length));
    if (e.target.value !== "" && index < length - 1) {
      focusToNextInput(e.target);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    const lastInputElement = target.previousElementSibling as HTMLInputElement | null;
    if (lastInputElement && lastInputElement.value === "") {
      return lastInputElement.focus();
    }
    target.setSelectionRange(0, target.value.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      return focusToNextInput(target);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      return focusToLastInput(target);
    }
    target.setSelectionRange(0, target.value.length);
    if (e.key !== "Backspace" || target.value !== "") return;
    focusToLastInput(target);
  };

  return (
    <div className="space-y-2 text-center">
      <div className="flex items-center justify-center gap-3">
        {values.map((value, index) => (
          <MemoizedInput
            autoComplete="one-time-code"
            className="focus:border-ring focus:ring-ring/20 text-primary bg-surface read-only:border-border-strong disabled:border-border-strong flex size-14 items-center justify-center rounded-xs border px-3 py-2 text-center text-lg font-medium uppercase outline-none select-none focus:border-2 focus:ring-3"
            disabled={disabled}
            key={index}
            maxLength={length}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            readOnly={readOnly}
            type="text"
            value={value}
          />
        ))}
      </div>
      {error?.touched && error?.message ? (
        <span className="text-danger text-xs">{error.message}</span>
      ) : helperText ? (
        <span className="text-foreground-subtle text-xs">{helperText}</span>
      ) : null}
    </div>
  );
};

const MemoizedInput = React.memo(
  ({ value, ...props }: { value: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} value={value} />
  ),
);

MemoizedInput.displayName = "OTP Input";
