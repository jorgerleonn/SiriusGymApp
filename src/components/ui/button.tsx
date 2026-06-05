import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-display text-button tracking-[1.5px] uppercase transition-all duration-200",
          "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" && "bg-canvas border border-primary text-primary hover:bg-primary hover:text-canvas",
          variant === "outline" && "bg-transparent border border-hairline text-primary hover:border-primary",
          variant === "ghost" && "bg-transparent text-muted hover:text-primary border-none",
          variant === "icon" && "bg-surface-card text-primary rounded-full w-12 h-12 flex items-center justify-center hover:bg-surface-elevated border-none",
          size === "sm" && "px-4 py-2 text-[12px]",
          size === "md" && "px-8 py-4",
          size === "lg" && "px-12 py-5",
          variant !== "icon" && "rounded-none",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
