// Shared formatting for the OptimusMarketing sales pages (agents, targets, sales).

const pad2 = (n: number) => String(n).padStart(2, "0")

/** "YYYY-MM-DD" -> "DD/MM/YYYY", without going through Date (no time-zone shift). */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

/** Timestamp -> "DD/MM/YYYY" in the viewer's local time. */
export function formatTimestampDate(timestamp: string): string {
  const d = new Date(timestamp)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** Target period, e.g. "01/11/2026 – 30/11/2026" or "01/11/2026 – …" when open-ended. */
export function formatPeriod(startDate: string, endDate: string | null): string {
  return `${formatIsoDate(startDate)} – ${endDate ? formatIsoDate(endDate) : "…"}`
}

export function formatNumber(value: number): string {
  return value.toLocaleString("de-CH", { maximumFractionDigits: 2 })
}

/** Today's calendar date (YYYY-MM-DD) in Europe/Zurich. */
export function zurichToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich" }).format(new Date())
}

/** Target running today (Zurich); the latest start date wins if several overlap. */
export function findActiveTarget<T extends { start_date: string; end_date: string | null }>(
  targets: T[]
): T | undefined {
  const today = zurichToday()
  return targets
    .filter((t) => t.start_date <= today && (!t.end_date || t.end_date >= today))
    .sort((a, b) => b.start_date.localeCompare(a.start_date))[0]
}
