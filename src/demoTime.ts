export const VIETNAM_ZONE = "Asia/Ho_Chi_Minh"
export const nowISO = () => new Date().toISOString()

export function dayKey(value: string | Date): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const get = (name: string) => parts.find((p) => p.type === name)?.value || ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

/** Legacy strings were saved in Vietnamese local time. Never interpret them in the host timezone. */
export function parseLegacyTime(value?: string): string | undefined {
  if (!value) return undefined
  if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d\d:\d\d)$/.test(value)) {
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined
  }
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!match) return undefined
  const remaining = value.replace(match[0], "")
  const clock = remaining.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}T${clock ? clock[1].padStart(2, "0") + ":" + clock[2] + ":" + (clock[3] || "00") : "00:00:00"}+07:00`
  const date = new Date(iso)
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined
}

export function formatDateTime(value?: string): string {
  const iso = parseLegacyTime(value)
  if (!iso) return value ? `${value} (chưa chuẩn hóa)` : "Chưa xác định"
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: VIETNAM_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso))
  const get = (name: string) => parts.find((p) => p.type === name)?.value || ""
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`
}

export function vietnamInput(value = new Date()): string {
  const text = formatDateTime(value.toISOString())
  return `${text.slice(6, 10)}-${text.slice(3, 5)}-${text.slice(0, 2)}T${text.slice(11)}`
}

export function fromVietnamInput(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}:00+07:00`)
  return Number.isFinite(date.getTime()) && vietnamInput(date) === value
    ? date.toISOString()
    : undefined
}

export function shiftDay(day: string, offset: number): string {
  return new Date(new Date(`${day}T12:00:00Z`).getTime() + offset * 86400000)
    .toISOString()
    .slice(0, 10)
}

export function seedTimestamp(
  daysAgo: number,
  hour = 9,
  minute = 0,
  now = new Date(),
): string {
  const candidate = new Date(
    `${shiftDay(dayKey(now), -daysAgo)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+07:00`,
  )
  const upper =
    daysAgo === 0
      ? Math.max(
          new Date(`${dayKey(now)}T00:00:00+07:00`).getTime(),
          now.getTime() - 60000,
        )
      : now.getTime() - 60000
  return new Date(Math.min(candidate.getTime(), upper)).toISOString()
}

export function lastSevenDays<T extends { receivedAt?: string }>(
  reports: T[],
  now = new Date(),
) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(dayKey(now), i - 6)
    return {
      day,
      count: reports.filter((r) => r.receivedAt && dayKey(r.receivedAt) === day)
        .length,
    }
  })
}

/** Add ISO fields without deleting records or overwriting user edits or historic dates. */
export function migrateStoredData(key: string, value: unknown): unknown {
  if (!Array.isArray(value)) return value
  if (key.endsWith("-reports"))
    return value.map((report) => {
      const old = report as Record<string, unknown>
      if (old.receivedAt && old.occurredAt) return old
      const legacy = parseLegacyTime(
        typeof old.time === "string" ? old.time : undefined,
      )
      return {
        ...old,
        occurredAt: old.occurredAt || legacy,
        receivedAt: old.receivedAt || legacy,
        updatedAt: old.updatedAt || legacy,
        timeMigration: "legacy-preserved",
      }
    })
  if (key.endsWith("-cases"))
    return value.map((item) => ({
      ...item,
      updated: parseLegacyTime(item.updated) || item.updated,
      history: (item.history || []).map((entry: string) => {
        const [date, ...detail] = entry.split(" · ")
        return `${parseLegacyTime(date) || date} · ${detail.join(" · ")}`
      }),
    }))
  if (key.endsWith("-logs"))
    return value.map((item) => ({
      ...item,
      time: parseLegacyTime(item.time) || item.time,
    }))
  return value
}
