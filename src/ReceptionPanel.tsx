import { useState } from "react"
import type { Report, StaffAccount, CaseFile } from "./types"
import type { Operation } from "./operations"
import { R, permit } from "./access"
import { Card, CardHead, Field, Button, Badge } from "./ui"
import { formatDateTime } from "./demoTime"
export default function ReceptionPanel({
  report,
  actor,
  accounts,
  cases,
  onAction,
  showSupplements = true,
}: {
  report: Report
  actor: StaffAccount
  accounts: StaffAccount[]
  cases: CaseFile[]
  showSupplements?: boolean
  onAction: (op: Operation) => boolean
}) {
  const [note, setNote] = useState(""),
    [assignee, setAssignee] = useState(
      accounts.find(
        (a) => a.active && a.role === R.analyst && a.unitId === actor.unitId,
      )?.id || "",
    ),
    [attachment, setAttachment] = useState(false)
  const receive = permit(actor, "report.receive", report, cases),
    supplement = permit(actor, "report.supplement", report, cases)
  const send = (step: "note" | "request" | "reject" | "transfer") => {
    if (onAction({ type: "receive", id: report.id, step, note, assignee }))
      setNote("")
  }
  return (
    <Card className="role-panel reception-panel">
      <CardHead
        title={
          actor.kind === "citizen"
            ? "Tiến độ tiếp nhận"
            : "Tiếp nhận và bàn giao"
        }
        sub="Lời khai ban đầu được giữ nguyên; thông tin bổ sung được lưu riêng."
      />
      <div className="workflow-track">
        <span>
          Tiếp nhận{" "}
          <Badge tone="blue">{report.intakeStatus || "Mới tiếp nhận"}</Badge>
        </span>
        {actor.kind !== "citizen" && (
          <>
            <span>
              Phân tích{" "}
              <Badge tone="gray">
                {report.analysisStatus || "Chờ phân tích"}
              </Badge>
            </span>
            <span>
              Phụ trách:{" "}
              <b>
                {accounts.find((a) => a.id === report.analysisAssignee)?.name ||
                  "Chưa giao phân tích"}
              </b>
            </span>
          </>
        )}
      </div>
      {actor.kind === "citizen" &&
        report.intakeStatus === "Chuyển phân tích" && (
          <p className="role-note">
            Tiến độ xử lý:{" "}
            {cases.some((c) => c.reportIds.includes(report.id) && c.assignedTo)
              ? "Bộ phận phụ trách đang xác minh thông tin."
              : cases.some((c) => c.reportIds.includes(report.id))
                ? "Đã chuyển sang bộ phận xử lý."
                : "Đã tiếp nhận, đang phân tích thông tin."}
          </p>
        )}
      {actor.kind !== "citizen" && report.intakeNote && (
        <p className="role-note">Ghi chú tiếp nhận: {report.intakeNote}</p>
      )}
      {report.supplementRequest && (
        <p className="role-note">
          Yêu cầu bổ sung gần nhất: {report.supplementRequest}
        </p>
      )}
      {(receive || supplement) && (
        <div className="role-form">
          <Field
            label={
              supplement ? "Nội dung bổ sung" : "Ghi chú tiếp nhận / Lý do"
            }
          >
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          {receive && (
            <Field label="Chuyển cho cán bộ phân tích">
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Chọn cán bộ</option>
                {accounts
                  .filter(
                    (a) =>
                      a.active &&
                      a.role === R.analyst &&
                      a.unitId === actor.unitId,
                  )
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {supplement && (
            <label className="role-checkbox">
              <input
                type="checkbox"
                checked={attachment}
                onChange={(e) => setAttachment(e.target.checked)}
              />
              Đính kèm tài liệu mẫu (mô phỏng)
            </label>
          )}
          <div className="role-actions">
            {receive ? (
              <>
                <Button
                  disabled={!note.trim()}
                  variant="secondary"
                  onClick={() => send("note")}
                >
                  Lưu ghi chú tiếp nhận
                </Button>
                <Button
                  disabled={!note.trim()}
                  variant="secondary"
                  onClick={() => send("request")}
                >
                  Yêu cầu bổ sung
                </Button>
                <Button
                  disabled={!note.trim()}
                  variant="ghost"
                  onClick={() => send("reject")}
                >
                  Đánh dấu không hợp lệ
                </Button>
                <Button
                  disabled={!note.trim() || !assignee}
                  onClick={() => send("transfer")}
                >
                  Chuyển phân tích
                </Button>
              </>
            ) : (
              <Button
                disabled={!note.trim()}
                onClick={() => {
                  if (
                    onAction({
                      type: "supplement",
                      id: report.id,
                      content: note,
                      attachment,
                    })
                  ) {
                    setNote("")
                    setAttachment(false)
                  }
                }}
              >
                Gửi bổ sung
              </Button>
            )}
          </div>
          {!note.trim() && (
            <p className="role-hint">
              Nhập nội dung để thực hiện thao tác và ghi nhận căn cứ xử lý.
            </p>
          )}
        </div>
      )}
      {actor.role === R.reception && !receive && (
        <p className="access-note">
          Phiếu đã chuyển phân tích. Cán bộ tiếp nhận chỉ xem tiến độ và thông
          tin đã lưu.
        </p>
      )}
      {showSupplements && !!report.supplements?.length && (
        <div className="supplement-list">
          <h3>Thông tin bổ sung</h3>
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
      )}
    </Card>
  )
}
