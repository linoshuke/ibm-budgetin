import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  className,
  icon,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-60";

  const styles: Record<Variant, string> = {
    primary:
      "bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-indigo)] to-[#0ea5e9] text-white px-4 py-2 shadow-lg shadow-[#0ea5e9]/30 hover:brightness-110",
    ghost: "px-3 py-2 text-[var(--text-primary)] hover:bg-white/5 hover:text-white",
    outline:
      "px-4 py-2 border border-[var(--border-soft)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-white/5",
    danger: "px-4 py-2 bg-[var(--accent-rose)]/90 text-white hover:bg-[var(--accent-rose)]",
  };

  return (
    <button className={cn(base, styles[variant], className)} {...props}>
      {icon}
      {children}
    </button>
  );
}
