interface PageIndicatorProps {
  count: number;
  activeIndex: number;
}

export default function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className={
            "h-2 rounded-full transition-all " +
            (index === activeIndex ? "w-6 bg-[var(--accent-indigo)]" : "w-2 bg-white/20")
          }
        />
      ))}
    </div>
  );
}
