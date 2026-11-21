import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "../../lib/utils";

const secondary =
  "border-border bg-surface text-foreground hover:border-border-strong hover:bg-muted aria-expanded:bg-muted";

const buttonVariants = cva(
  "group/button focus-visible:ring-ring focus-visible:ring-offset-background aria-invalid:border-danger inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] duration-150 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
        secondary,
        outline: secondary,
        ghost:
          "text-foreground hover:bg-muted aria-expanded:bg-muted hover:text-foreground aria-expanded:text-foreground",
        soft: "bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft/70",
        danger: "bg-danger-solid hover:bg-danger-solid/90 text-white",
        destructive: "bg-danger-solid hover:bg-danger-solid/90 text-white",
        success: "bg-success-solid hover:bg-success-solid/90 text-white",
        link: "text-primary h-auto px-0 underline-offset-4 hover:underline",
        band: "bg-band text-on-band hover:bg-band-elevated",
        ink: "bg-band text-on-band hover:bg-band-elevated",
        "default-inverse": "text-primary bg-white hover:bg-white/90",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        md: "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-sm px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-sm px-3 text-[0.8125rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xl: "h-14 gap-2 px-7 text-base",
        "2xl": "h-16 gap-2 px-8 text-lg",
        icon: "size-10",
        "icon-xs": "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-sm",
        "icon-lg": "size-12",
      },
      shape: {
        default: "",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      shape: "default",
    },
  },
);

function Button({
  className,
  variant = "primary",
  size = "default",
  shape = "default",
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
      className={cn(buttonVariants({ variant, size, shape, className }))}
      type={type}
      {...props}
    />
  );
}

/** Trailing circular arrow chip for marketing CTAs (`<Button shape="pill">Get started <ButtonArrow /></Button>`). */
function ButtonArrow({ className }: { className?: string }) {
  return (
    <span
      data-icon="inline-end"
      aria-hidden="true"
      className={cn(
        "-mr-2 inline-flex size-7 items-center justify-center rounded-full bg-current/15 transition-transform duration-150 ease-out group-hover/button:translate-x-0.5 motion-reduce:transition-none",
        className,
      )}
    >
      <ArrowRight className="size-4" />
    </span>
  );
}

export { Button, ButtonArrow, buttonVariants };
