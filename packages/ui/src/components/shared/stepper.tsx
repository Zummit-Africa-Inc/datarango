import { LucideIcon } from "lucide-react";

import { cn } from "../../lib";

export type StepProps = {
  index: number;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

interface StepperProps {
  current: number;
  steps: StepProps[];
  className?: string;
  onStepChange?: (step: number) => void;
  stepperClassName?: string;
}

export function Stepper({
  current,
  steps,
  className,
  onStepChange,
  stepperClassName,
}: StepperProps) {
  return (
    <div className={cn("relative flex w-full items-center justify-center gap-x-0.5", className)}>
      {steps.map(({ index, label, description, icon: Icon }) => (
        <div
          key={index}
          onClick={() => onStepChange?.(index)}
          role="button"
          className={cn(
            "flex flex-1 flex-col gap-y-0.5 p-2",
            current === index && "bg-warning-soft text-warning",
            current < index && "bg-border-strong text-foreground-muted",
            current > index && "bg-success-soft text-success",
            onStepChange ? "cursor-pointer" : "cursor-default",
            stepperClassName,
          )}
        >
          <div className="flex items-center gap-x-2">
            {Icon && <Icon className="size-4" />}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className="text-xs">{description}</span>
        </div>
      ))}
    </div>
  );
}
