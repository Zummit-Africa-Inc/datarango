import * as React from "react";

import { cn } from "../../lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-foreground-subtle focus-visible:border-ring focus-visible:ring-ring/20 disabled:bg-input/50 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 bg-surface flex field-sizing-content min-h-20 w-full resize-none rounded-xs border px-3 py-2 text-base transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
