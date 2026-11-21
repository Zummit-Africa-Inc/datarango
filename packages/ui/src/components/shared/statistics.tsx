import type { LucideIcon } from "lucide-react";

import { StatCard } from "./stat-card";

interface Props {
  label: string;
  value: string;
  delta?: string;
  description?: string;
  icon?: LucideIcon;
}

/** v1.1 name for `StatCard`, kept until the purge phase. */
export const Statistics = ({ description, ...props }: Props) => (
  <StatCard hint={description} {...props} />
);
