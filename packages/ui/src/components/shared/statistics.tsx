import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta?: string;
  description?: string;
  icon?: LucideIcon;
}

export const Statistics = ({ label, value, delta, description, icon: Icon }: Props) => {
  return (
    <div className="space-y-2 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{label}</p>
        {Icon && <Icon className="text-muted-foreground size-4" />}
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <div className="flex items-center gap-x-2">
        {delta && (
          <span
            className={`text-sm font-medium ${delta.startsWith("+") ? "text-green-500" : "text-red-500"}`}
          >
            {delta}
          </span>
        )}
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
    </div>
  );
};
