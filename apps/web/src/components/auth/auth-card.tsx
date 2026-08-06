import type { ReactNode } from "react";

interface AuthCardProps {
  cell: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthCard = ({ cell, title, subtitle, children }: AuthCardProps) => (
  <div className="w-full max-w-md p-8">
    <p className="mono-data text-muted-foreground text-xs">dr [{cell}]</p>
    <h1 className="font-heading mt-4 text-3xl tracking-tight">{title}</h1>
    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{subtitle}</p>
    <div className="mt-8">{children}</div>
  </div>
);

export const AuthDivider = () => (
  <div className="before:bg-border relative my-6 flex items-center justify-center before:absolute before:top-1/2 before:left-0 before:h-px before:w-full">
    <span className="bg-card text-muted-foreground relative px-3 text-xs">or</span>
  </div>
);
