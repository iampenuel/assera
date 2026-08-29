const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatIsoDate(date: string, longMonth = false): string {
  const [year, month, day] = date.split("-");
  const monthIndex = Number(month) - 1;
  const shortMonth = months[monthIndex];

  if (!year || !shortMonth || !day) return date;

  const monthLabel = longMonth
    ? new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(
        new Date(Date.UTC(Number(year), monthIndex, 1)),
      )
    : shortMonth;

  return `${monthLabel} ${Number(day)}, ${year}`;
}
