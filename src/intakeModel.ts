import type { Report } from "./types"
export const REPORT_TYPES = [
  "Giả danh ngân hàng",
  "Giả danh cơ quan nhà nước",
  "Lừa đảo đầu tư trực tuyến",
  "Lừa đảo mua bán trực tuyến",
  "Lừa đảo tuyển dụng/cộng tác viên",
  "Chiếm đoạt tài khoản mạng xã hội",
  "Khác",
  "Chưa xác định",
] as const
const aliases: Record<string, string> = {
  "Đầu tư trực tuyến": "Lừa đảo đầu tư trực tuyến",
  "Mua bán trực tuyến": "Lừa đảo mua bán trực tuyến",
  "Việc làm trực tuyến": "Lừa đảo tuyển dụng/cộng tác viên",
}
export const reportTypeLabel = (value: string) => aliases[value] || value
export function nextReportId(reports: Report[]) {
  let next =
    Math.max(
      12,
      ...reports.map((r) => Number(r.id.match(/^PA-(\d+)$/)?.[1]) || 0),
    ) + 1
  while (
    next === 13 ||
    reports.some((r) => r.id === `PA-${String(next).padStart(3, "0")}`)
  )
    next++
  return `PA-${String(next).padStart(3, "0")}`
}
export type IntakePayload = { sample: boolean; report: Omit<Report, "id"> }
export type IntakeResult =
  | { ok: true; report: Report }
  | { ok: false; error: string }
