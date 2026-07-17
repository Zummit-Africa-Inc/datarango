import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive  dark:aria-invalid:border-destructive/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white [a]:hover:bg-primary-500/80",
        "default-inverse": "bg-white text-primary-500 [a]:hover:bg-white/80",
        outline:
          "border-border bg-background hover:bg-muted dark:bg-neutral-600 hover:text-foreground aria-expanded:bg-muted dark:bg-neutral-600 aria-expanded:text-foreground",
        secondary:
          "bg-muted dark:bg-neutral-600 text-foreground hover:bg-muted dark:bg-neutral-600/80 aria-expanded:bg-muted dark:bg-neutral-600 aria-expanded:text-foreground",
        ghost:
          "hover:bg-muted dark:bg-neutral-600 hover:text-foreground aria-expanded:bg-muted dark:bg-neutral-600 aria-expanded:text-foreground",
        destructive: "bg-destructive/10 text-white hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-500 text-white [a]:hover:bg-green-500/80",
      },
      size: {
        default:
          "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),6px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),8px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-12 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xl: "h-14 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        "2xl":
          "h-16 gap-2 px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 text-lg font-medium",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      type={type}
      {...props}
    />
  );
}

export { Button, buttonVariants };
