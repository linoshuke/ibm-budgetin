import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  label: string;
  active: boolean;
  icon: ReactNode;
  variant: "bottom" | "sidebar";
  onClick: () => void;
}

export default function NavItem({ label, active, icon, variant, onClick }: NavItemProps) {
  if (variant === "bottom") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-all",
          active ? "font-semibold text-[var(--accent-indigo)]" : "text-[var(--text-dimmed)]",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-all",
            active && "-translate-y-3 bg-[var(--accent-indigo)]/12",
          )}
        >
          {icon}
        </span>
        <span className={cn("transition-transform", active && "-translate-y-3")}>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
        active
          ? "border border-[var(--accent-indigo)]/40 bg-[var(--accent-indigo)]/10 text-white"
          : "text-[var(--text-dimmed)] hover:bg-white/5",
      )}
    >
      {icon}
      <span className="text-base font-medium">{label}</span>
    </button>
  );
}
