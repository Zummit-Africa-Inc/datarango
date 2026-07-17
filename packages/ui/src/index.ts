/**
 * @datarango/ui — design tokens + shared components + motion primitives.
 *
 * The visual identity pass (FRONTEND-HANDOFF §7) lands here as CSS variables in
 * `styles/tokens.css`; components and motion primitives are added from Phase F0/F1.
 */

/** Joins conditional class names, dropping falsy values. */
export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");
