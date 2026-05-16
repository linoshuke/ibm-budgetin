export function formatFullDateTime(dateValue: string) {
  const date = new Date(dateValue);
  const weekday = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
  const day = new Intl.DateTimeFormat("id-ID", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(date);
  const year = new Intl.DateTimeFormat("id-ID", { year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${weekday}, ${day} ${month} ${year} • ${time}`;
}

export function getMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
