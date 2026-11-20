import type { Report, LogItem } from "./types"
import { Card, CardHead, Badge } from "./ui"
import { formatDateTime } from "./demoTime"

export default function ReportHistory({
  report,
  logs,
}: {
  report: Report
  logs: LogItem[]
}) {
  // Logs are already restricted by visibleLogs and the selected report in App.
  // Do not reconstruct past events from the report's current state.
  return (
    <div className="page-stack report-history">
      <Card className="detail-card">
        <CardHead
          title="Thông tin bổ sung"
          sub="Nội dung bổ sung được lưu riêng, giữ nguyên lời khai ban đầu."
        />
        {report.supplements?.length ? (
          <div className="supplement-list">
            {report.supplements.map((s) => (
              <article key={s.id}>
                <b>
                  {formatDateTime(s.time)} · {s.author}
                </b>
                <p>{s.content}</p>
                {s.attachment && <small>01 tài liệu giả lập</small>}
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Chưa có lần bổ sung nào được lưu.</p>
        )}
      </Card>
      {!!logs.length && (
        <Card className="detail-card">
          <CardHead
            title="Lịch sử thao tác của phản ánh"
            sub="Chỉ hiển thị sự kiện trong phạm vi quyền xem nhật ký hiện tại."
          />
          <ol className="report-audit-list">
            {logs.map((log, index) => (
              <li key={`${log.time}-${index}`}>
                <div>
                  <b>{log.action}</b>
                  <Badge tone={log.result === "Bị từ chối" ? "gray" : "blue"}>
                    {log.result}
                  </Badge>
                </div>
                <p>
                  {formatDateTime(log.time)} · {log.user} · {log.role}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      )}
      {!logs.length && (
        <p className="muted">
          Không có sự kiện thao tác được phép hiển thị cho phản ánh này.
        </p>
      )}
    </div>
  )
}
