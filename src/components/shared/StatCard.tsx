import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Accent = "teal" | "emerald" | "rose";

interface Props {
  title: string;
  value: ReactNode;
  helper?: string;
  accent?: Accent;
}

export default function StatCard({
  title,
  value,
  helper,
  accent = "teal",
}: Props) {
  const accentClass: Record<Accent, string> = {
    teal: "from-teal-500/20 to-blue-500/20",
    emerald: "from-emerald-500/20 to-emerald-400/10",
    rose: "from-rose-500/20 to-rose-400/10",
  };

  return (
    <article className="glass-panel relative overflow-hidden p-4">
      <div className={cn("absolute inset-0 bg-gradient-to-br blur-2xl", accentClass[accent])} />
      <div className="relative space-y-1">
        <p className="text-sm text-[var(--text-dimmed)]">{title}</p>
        <div className="text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
        {helper ? <p className="text-xs text-[var(--text-dimmed)]">{helper}</p> : null}
      </div>
    </article>
  );
}
