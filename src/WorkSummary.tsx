import type { StaffAccount, Report, CaseFile } from "./types"
import { R } from "./access"
export default function WorkSummary({
  actor,
  reports,
  cases,
}: {
  actor: StaffAccount
  reports: Report[]
  cases: CaseFile[]
}) {
  const stats =
    actor.kind === "citizen"
      ? [
          [reports.length, "phản ánh của tôi"],
          [
            reports.filter((r) => r.intakeStatus === "Chờ bổ sung").length,
            "cần bổ sung",
          ],
        ]
      : actor.role === R.reception
        ? [
            [
              reports.filter((r) => r.intakeStatus === "Mới tiếp nhận").length,
              "phiếu mới",
            ],
            [
              reports.filter((r) => r.intakeStatus === "Chờ bổ sung").length,
              "chờ bổ sung",
            ],
          ]
        : actor.role === R.analyst
          ? [
              [
                reports.filter(
                  (r) =>
                    r.intakeStatus === "Chuyển phân tích" &&
                    r.analysisStatus !== "Đã kiểm tra" &&
                    (!r.analysisAssignee || r.analysisAssignee === actor.id),
                ).length,
                "chờ phân tích",
              ],
              [
                cases.filter((c) =>
                  c.workItems?.some((w) => w.kind === "Yêu cầu xem xét lại"),
                ).length,
                "hồ sơ có yêu cầu xem xét lại",
              ],
            ]
          : [
              [
                cases.length,
                actor.role === R.worker
                  ? "hồ sơ được giao"
                  : "hồ sơ trong đơn vị",
              ],
              [
                cases.filter(
                  (c) => c.reportVersions?.at(-1)?.state === "Chờ xem xét",
                ).length,
                "báo cáo chờ xem xét",
              ],
            ]
  return (
    <div className="work-summary">
      {stats.map(([n, label]) => (
        <span key={label}>
          <b>{n}</b> {label}
        </span>
      ))}
      <small>
        {actor.kind === "citizen"
          ? "Dữ liệu thuộc tài khoản"
          : actor.role === R.worker
            ? "Phạm vi: được giao cho tôi"
            : `Phạm vi: ${actor.unitId}`}
      </small>
    </div>
  )
}
