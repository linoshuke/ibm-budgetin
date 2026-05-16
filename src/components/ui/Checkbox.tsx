import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-[var(--border-soft)] bg-[var(--bg-card-muted)] text-[var(--accent-indigo)] focus:ring-2 focus:ring-[var(--accent-indigo)]/40",
        className,
      )}
      {...props}
    />
  ),
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
