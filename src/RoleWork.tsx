import type { StaffAccount, Report, CaseFile } from "./types"
import { R, roleTask } from "./access"
import { Card, PageHeader, Badge, Button, EmptyState } from "./ui"
export default function RoleWork({
  actor,
  reports,
  cases,
  onReport,
  onCase,
}: {
  actor: StaffAccount
  reports: Report[]
  cases: CaseFile[]
  onReport: (id: string) => void
  onCase: (id: string) => void
}) {
  const waiting = reports.filter((r) => r.intakeStatus === "Mới tiếp nhận"),
    analysis = reports.filter(
      (r) =>
        r.intakeStatus === "Chuyển phân tích" &&
        r.analysisStatus !== "Đã kiểm tra" &&
        (!r.analysisAssignee || r.analysisAssignee === actor.id),
    ),
    unassigned = cases.filter((c) => !c.assignedTo),
    pending = cases.filter(
      (c) => c.reportVersions?.at(-1)?.state === "Chờ xem xét",
    )
  const cards =
    actor.role === R.leader
      ? [
          ["Chờ phân công", unassigned.length],
          [
            "Đang xử lý",
            cases.filter((c) => c.status === "Đang xác minh").length,
          ],
          ["Báo cáo chờ xem xét", pending.length],
          ["Tổng hồ sơ trong đơn vị", cases.length],
        ]
      : actor.role === R.analyst
        ? [
            ["Chờ phân tích", analysis.length],
            ["Đã kiểm tra", reports.filter((r) => r.reviewed).length],
            ["Hồ sơ đã tạo", cases.length],
          ]
        : actor.role === R.worker
          ? [
              ["Được giao cho tôi", cases.length],
              [
                "Chờ bổ sung",
                cases.filter((c) => c.status === "Chờ bổ sung").length,
              ],
              [
                "Báo cáo cần sửa",
                cases.filter(
                  (c) =>
                    c.reportVersions?.at(-1)?.state === "Yêu cầu chỉnh sửa",
                ).length,
              ],
            ]
          : [
              ["Phản ánh mới", waiting.length],
              [
                "Chờ bổ sung",
                reports.filter((r) => r.intakeStatus === "Chờ bổ sung").length,
              ],
              [
                "Đã bàn giao",
                reports.filter((r) => r.intakeStatus === "Chuyển phân tích")
                  .length,
              ],
            ]
  const queue = actor.role === R.analyst ? analysis : waiting
  return (
    <div className="page-stack">
      <PageHeader
        title={
          actor.role === R.leader ? "Điều hành xử lý" : "Công việc cần xử lý"
        }
        description={roleTask[actor.role]}
      />
      <div className="stats-grid role-stats">
        {cards.map(([label, n]) => (
          <div className="stat-card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{n}</div>
          </div>
        ))}
      </div>
      {actor.role === R.leader || actor.role === R.worker ? (
        <Card className="role-panel">
          <h2>
            {actor.role === R.leader ? "Hồ sơ cần theo dõi" : "Hồ sơ được giao"}
          </h2>
          {(actor.role === R.leader
            ? [
                ...unassigned,
                ...pending,
                ...cases.filter(
                  (c) => !unassigned.includes(c) && !pending.includes(c),
                ),
              ]
            : cases
          ).map((c) => (
            <div className="work-queue-row" key={c.id}>
              <div>
                <b>
                  {c.id} · {c.name}
                </b>
                <p>
                  {c.officer} · {c.reportIds.length} phản ánh
                </p>
              </div>
              <Badge tone="blue">
                {!c.assignedTo
                  ? "Chờ phân công"
                  : c.reportVersions?.at(-1)?.state || c.status}
              </Badge>
              <Button variant="secondary" onClick={() => onCase(c.id)}>
                Mở hồ sơ
              </Button>
            </div>
          ))}
          {!cases.length && (
            <EmptyState>Chưa có hồ sơ trong phạm vi phụ trách.</EmptyState>
          )}
        </Card>
      ) : (
        <Card className="role-panel">
          <h2>
            {actor.role === R.analyst
              ? "Hàng đợi phân tích"
              : "Hàng đợi tiếp nhận"}
          </h2>
          {queue.map((r) => (
            <div className="work-queue-row" key={r.id}>
              <div>
                <b>
                  {r.id} · {r.title}
                </b>
                <p>
                  {r.senderName || "Chưa cung cấp người gửi"} · {r.area}
                </p>
              </div>
              <Button variant="secondary" onClick={() => onReport(r.id)}>
                Xử lý phản ánh
              </Button>
            </div>
          ))}
          {!queue.length && (
            <EmptyState>Không có công việc chờ xử lý.</EmptyState>
          )}
        </Card>
      )}
    </div>
  )
}
