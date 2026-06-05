import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "strength" | "cardio" | "m-stripe";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-block text-label-uppercase tracking-[1.5px] uppercase px-md py-xs",
          variant === "default" && "bg-surface-card text-muted border border-hairline",
          variant === "strength" && "bg-[rgba(0,102,177,0.15)] text-m-blue-light border border-m-blue-light/30",
          variant === "cardio" && "bg-[rgba(228,39,24,0.15)] text-m-red border border-m-red/30",
          variant === "m-stripe" && "relative overflow-hidden bg-surface-card text-primary",
          "rounded-none",
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps };
