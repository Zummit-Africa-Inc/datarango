"use client";

import { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DIAL_CODES } from "../../constants/dial-code";
import { cn } from "../../lib";

interface Props {
  className?: string;
  label?: string;
  onChange?: (value: string) => void;
  value?: string;
  wrapperClassName?: string;
  error?: string;
  disabled?: boolean;
}

// Sort once at module level — longest dial code first to avoid "+1" matching "+1264"
const SORTED_DIAL_CODES = [...DIAL_CODES].sort((a, b) => b.code.length - a.code.length);
const DEFAULT_DIAL_CODE = DIAL_CODES[0]!.code;

function parse(full: string): { dialCode: string; phoneNumber: string } {
  const match = SORTED_DIAL_CODES.find((c) => full.startsWith(c.code));
  if (match) return { dialCode: match.code, phoneNumber: full.slice(match.code.length) };
  return { dialCode: DEFAULT_DIAL_CODE, phoneNumber: full };
}

export const PhoneInput = ({
  className,
  label,
  onChange,
  value,
  wrapperClassName,
  error,
  disabled,
}: Props) => {
  const isControlled = value !== undefined;

  const [internalDialCode, setInternalDialCode] = useState(DEFAULT_DIAL_CODE);
  const [internalNumber, setInternalNumber] = useState("");

  const { dialCode, phoneNumber } = isControlled
    ? parse(value)
    : { dialCode: internalDialCode, phoneNumber: internalNumber };

  const emit = (code: string, number: string) => {
    const country = DIAL_CODES.find((c) => c.code === code);
    if (!country) return;
    onChange?.(country.code + number);
  };

  const handleDialChange = (code: string) => {
    if (!isControlled) setInternalDialCode(code);
    emit(code, phoneNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 15);
    if (!isControlled) setInternalNumber(raw);
    emit(dialCode, raw);
  };

  const dialEntry = DIAL_CODES.find((c) => c.code === dialCode);
  const isInvalid = phoneNumber.length > 0 && (phoneNumber.length < 7 || phoneNumber.length > 15);

  return (
    <div className={cn("space-y-1", wrapperClassName)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        className={cn(
          "focus-within:border-primary-500 flex h-9 items-center rounded-xs border bg-transparent px-2 transition-colors",
          isInvalid && "border-red-500 focus-within:border-red-500",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <Select onValueChange={handleDialChange} value={dialCode} disabled={disabled}>
          <SelectTrigger className="w-fit gap-1 border-0 px-1 shadow-none focus:ring-0">
            <SelectValue>
              <span className="text-sm">{dialEntry?.code}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {DIAL_CODES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name} ({country.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="bg-border mx-1 h-4 w-px shrink-0" />
        <input
          className="placeholder:text-muted-foreground h-full flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
          type="text"
          inputMode="numeric"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={handleNumberChange}
          disabled={disabled}
          maxLength={15}
        />
      </div>
      {isInvalid && (
        <p className="text-xs text-red-500">Phone number must be between 7 and 15 digits.</p>
      )}
      {error && !isInvalid && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
