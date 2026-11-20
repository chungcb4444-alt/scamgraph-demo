import type { CaseFile, Report, ReportVersion } from "./types"
// Compare meaningful source values, not timestamps, acknowledgements or discussion activity.
const ordered = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(ordered)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .filter(([, v]) => v !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => [k, ordered(v)]),
        )
      : value
const sourceValue = (report: Report) => {
  const {
    updatedAt,
    timeMigration,
    intakeReceipt,
    receiptWorkflow,
    ...business
  } = report
  return business
}
export function reportSnapshotStale(
  item: CaseFile,
  reports: Report[],
  version: ReportVersion | undefined,
) {
  if (!version) return false
  const old = version.snapshot
  const live = {
    caseId: item.id,
    name: item.name,
    status: item.status,
    priority: item.priority,
    officer: item.officer,
    note: item.note,
    reportIds: [...item.reportIds].sort(),
    reports: item.reportIds
      .map((id) => reports.find((r) => r.id === id))
      .sort((a, b) => (a?.id || "").localeCompare(b?.id || "")),
  }
  if (live.reports.some((r) => !r)) return true
  const normalized = (value: typeof old) => ({
    ...value,
    reportIds: [...value.reportIds].sort(),
    reports: value.reports
      .map(sourceValue)
      .sort((a, b) => a.id.localeCompare(b.id)),
  })
  return (
    JSON.stringify(ordered(normalized(old))) !==
    JSON.stringify(ordered(normalized(live as typeof old)))
  )
}
