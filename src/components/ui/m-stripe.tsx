import { cn } from "@/lib/utils";

export function MStripe({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1 w-full", className)}>
      <div className="flex-1 bg-m-blue-light" />
      <div className="flex-1 bg-m-blue-dark" />
      <div className="flex-1 bg-m-red" />
    </div>
  );
}
