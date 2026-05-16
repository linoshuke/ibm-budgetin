import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export default function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-card-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]",
        className,
      )}
      {...props}
    />
  );
}
