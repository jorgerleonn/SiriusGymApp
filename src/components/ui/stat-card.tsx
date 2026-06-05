import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
  children?: ReactNode;
}

export function StatCard({ label, value, sub, className, children }: StatCardProps) {
  return (
    <div className={cn("bg-surface-card border border-hairline rounded-none p-lg", className)}>
      <p className="text-caption text-muted tracking-[1px] mb-xs">{label}</p>
      <p className="text-display-sm font-display text-primary">{value}</p>
      {sub && (
        <p className="text-body-sm text-muted mt-xxs">{sub}</p>
      )}
      {children}
    </div>
  );
}
