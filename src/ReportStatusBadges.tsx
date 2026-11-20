import type { Report } from "./types"
import { Badge } from "./ui"
import { reportStages } from "./reportStages"

export default function ReportStatusBadges({
  report,
  detailed = false,
}: {
  report: Report
  detailed?: boolean
}) {
  const stage = reportStages(report)
  return (
    <span className="status-pair" aria-label="Trạng thái phản ánh">
      <span aria-label={`Tiếp nhận: ${stage.intake}`}>
        <Badge tone={stage.intake === "Không hợp lệ" ? "red" : "blue"}>
          {detailed ? "Tiếp nhận: " : ""}
          {stage.intake}
        </Badge>
        {!detailed &&
          (report.receiptWorkflow === 2 || report.intakeReceipt) && (
            <small className="receipt-table-note">
              {report.intakeReceipt
                ? "Đã xác nhận tiếp nhận"
                : "Chờ cán bộ xác nhận"}
            </small>
          )}
      </span>
      <span aria-label={`Phân tích: ${stage.analysis}`}>
        <Badge tone={stage.analysis === "Đã kiểm tra" ? "green" : "gray"}>
          {detailed ? "Phân tích: " : ""}
          {stage.analysis}
        </Badge>
      </span>
      {detailed && (
        <span aria-label={`Liên kết: ${stage.cluster || "Chưa liên kết"}`}>
          <Badge tone={stage.cluster ? "blue" : "gray"}>
            Liên kết: {stage.cluster || "Chưa liên kết"}
          </Badge>
        </span>
      )}
    </span>
  )
}
