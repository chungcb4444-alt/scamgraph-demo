import type { Report, CaseFile, CaseMessage, CaseMessageVersion } from "./types"
export const currentAssignment = (item: CaseFile) => {
  const last = item.assignments?.at(-1)
  return last?.assignee === item.assignedTo ? last : undefined
}
export const caseReceiptAllowsWork = (item: CaseFile) =>
  item.receiptWorkflow !== 2 ||
  !!(
    currentAssignment(item)?.received?.by === item.assignedTo && item.assignedTo
  )
export const reportReceiptLabel = (report: Report) =>
  report.intakeReceipt
    ? "Đã tiếp nhận"
    : report.receiptWorkflow === 2
      ? "Chờ cán bộ tiếp nhận"
      : "Dữ liệu cũ chưa ghi nhận xác nhận tiếp nhận"
export const caseReceiptLabel = (item: CaseFile) =>
  !item.assignedTo
    ? "Chưa phân công"
    : currentAssignment(item)?.received
      ? "Đã nhận xử lý"
      : item.receiptWorkflow === 2
        ? "Chờ nhận xử lý"
        : "Dữ liệu cũ chưa ghi nhận nhận việc"
export const requestKey = (item: CaseFile, index: number) => {
  const request = item.workItems?.[index]
  return (
    request?.requestId || `YC-CU-${index}-${request?.time}-${request?.author}`
  )
}
export const openSourceRequests = (item: CaseFile) =>
  (item.workItems || []).filter(
    (w) =>
      w.kind === "Yêu cầu xem xét lại" && w.requestState !== "Đã hoàn thành",
  )
export const pendingOpinions = (item: CaseFile) =>
  (item.messages || []).filter(
    (m) =>
      m.kind === "Kiến nghị" &&
      ["Đã gửi", "Đã tiếp nhận"].includes(m.versions.at(-1)?.state || ""),
  )
export const visibleMessageVersions = (
  message: CaseMessage,
  actorId: string,
): CaseMessageVersion[] =>
  message.versions.filter(
    (v) => v.state !== "Bản nháp" || v.created.by === actorId,
  )
