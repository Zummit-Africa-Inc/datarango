import type { ReactNode } from "react";

import { Label, cn } from "@datarango/ui";

/**
 * Form layout for the admin app. A form spans the page; each section is a
 * card whose fields sit in a grid of two or three columns on wider screens
 * (one on phones), so related inputs line up instead of stacking in a narrow
 * column.
 */
export const FormSection = ({
  title,
  description,
  cols = 2,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  cols?: 1 | 2 | 3;
  /** Something for the header's right side, e.g. a switch that turns the section on. */
  action?: ReactNode;
  children?: ReactNode;
}) => (
  <section className="border-hairline bg-card rounded-xs border p-5">
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-ink text-sm font-medium">{title}</h2>
        {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
      </div>
      {action}
    </header>
    {children && (
      <div
        className={cn(
          "grid gap-4",
          cols === 2 && "md:grid-cols-2",
          cols === 3 && "md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {children}
      </div>
    )}
  </section>
);

/** One labelled input. `span="full"` stretches it across every column. */
export const Field = ({
  label,
  htmlFor,
  hint,
  span,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  span?: "full" | 2;
  children: ReactNode;
}) => (
  <div
    className={cn(
      "space-y-1.5",
      span === "full" && "md:col-span-full",
      span === 2 && "md:col-span-2",
    )}
  >
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
  </div>
);

/** The form's buttons, right-aligned under the last section. */
export const FormActions = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
);
