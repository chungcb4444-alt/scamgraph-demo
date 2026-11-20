import { useEffect, useLayoutEffect, useState } from "react"
import type { CaseFile, StaffAccount, ReportVersion } from "./types"
import type { Operation } from "./operations"
import { R, permit } from "./access"
import { Card, CardHead, Field, Button, Badge } from "./ui"
import { caseReceiptLabel, currentAssignment } from "./receiptWorkflow"
import { reportSnapshotStale } from "./reportSnapshot"
import type { Report } from "./types"
import { formatDateTime } from "./demoTime"
export default function CaseWorkPanel({
  item,
  reports,
  actor,
  accounts,
  onAction,
  onPreview,
  onDraftChange,
}: {
  item: CaseFile
  reports: Report[]
  actor: StaffAccount
  accounts: StaffAccount[]
  onAction: (op: Operation) => boolean
  onPreview: (v?: ReportVersion) => void
  onDraftChange: (value: boolean) => void
}) {
  const [assignedTo, setAssignedTo] = useState(item.assignedTo || ""),
    [priority, setPriority] = useState(item.priority),
    [directive, setDirective] = useState(""),
    [note, setNote] = useState(item.note),
    [status, setStatus] = useState(item.status),
    [content, setContent] = useState(""),
    [attachment, setAttachment] = useState(false),
    [request, setRequest] = useState(""),
    [body, setBody] = useState(
      item.reportVersions?.at(-1)?.content || item.note,
    ),
    [review, setReview] = useState(""),
    [newVersion, setNewVersion] = useState(false)
  const [bodyBaseline, setBodyBaseline] = useState(body)
  const latest = item.reportVersions?.at(-1),
    assign = permit(actor, "case.assign", item),
    work = permit(actor, "case.work", item),
    report = permit(actor, "case.report", item),
    canReview = permit(actor, "case.review", item),
    own = actor.role === R.worker && actor.id === item.assignedTo
  useEffect(() => {
    setNote(item.note)
    setStatus(item.status)
    setAssignedTo(item.assignedTo || "")
    setPriority(item.priority)
  }, [item.assignedTo, item.note, item.status, item.priority])
  useEffect(() => {
    const saved = latest?.content || item.note
    setBody(saved)
    setBodyBaseline(saved)
    setNewVersion(false)
  }, [latest?.id, latest?.updated, latest?.content])
  const isDirty =
    (assign &&
      (assignedTo !== (item.assignedTo || "") ||
        priority !== item.priority ||
        directive !== "")) ||
    (own &&
      (note !== item.note ||
        status !== item.status ||
        content !== "" ||
        attachment)) ||
    (permit(actor, "case.request", item) && request !== "") ||
    (canReview && review !== "") ||
    (own && body !== bodyBaseline)
  useLayoutEffect(() => {
    onDraftChange(isDirty)
  }, [isDirty, onDraftChange])
  const stale = reportSnapshotStale(item, reports, latest)
  const assignment = currentAssignment(item)
  return (
    <div className="page-stack case-work">
      <Card className="role-panel receipt-summary">
        <b>{caseReceiptLabel(item)}</b>
        {assignment && (
          <span>
            Phân công: {assignment.assigned.name} ·{" "}
            {formatDateTime(assignment.assigned.at)}
          </span>
        )}
        {assignment?.received && (
          <span>
            Người nhận: {assignment.received.name} ·{" "}
            {formatDateTime(assignment.received.at)}
          </span>
        )}
        {permit(actor, "case.accept", item) && (
          <>
            <p>
              Nhận việc để cập nhật xử lý và lập báo cáo. Việc nhận không xác
              nhận nội dung nguồn là đúng.
            </p>
            <Button
              onClick={() => onAction({ type: "case-accept", id: item.id })}
            >
              Nhận xử lý hồ sơ
            </Button>
          </>
        )}
        {!!item.assignments?.length && (
          <details>
            <summary>Lịch sử phân công và nhận việc</summary>
            {item.assignments.map((a) => (
              <p key={a.id}>
                {a.id} ·{" "}
                {a.assigneeName ||
                  accounts.find((x) => x.id === a.assignee)?.name ||
                  a.assignee}{" "}
                · {formatDateTime(a.assigned.at)} ·{" "}
                {a.received
                  ? `Đã nhận ${formatDateTime(a.received.at)}`
                  : "Chưa ghi nhận nhận việc"}
              </p>
            ))}
          </details>
        )}
      </Card>
      <Card className="role-panel">
        <CardHead
          title={
            assign
              ? "Phân công và chỉ đạo"
              : own
                ? "Xử lý hồ sơ được giao"
                : "Thông tin xử lý"
          }
          sub={`${item.unitId} · Phụ trách: ${item.officer}`}
        />
        {assign ? (
          <div className="role-form">
            <div className="two-col">
              <Field label="Cán bộ phụ trách">
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Chưa phân công</option>
                  {accounts
                    .filter(
                      (a) =>
                        a.active &&
                        a.role === R.worker &&
                        a.unitId === actor.unitId,
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Mức ưu tiên">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {["Cao", "Trung bình", "Thấp"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Ý kiến chỉ đạo">
              <textarea
                rows={3}
                value={directive}
                onChange={(e) => setDirective(e.target.value)}
              />
            </Field>
            <Button
              disabled={!assignedTo}
              onClick={() => {
                if (
                  onAction({
                    type: "assign",
                    id: item.id,
                    assignedTo,
                    priority,
                    directive,
                  })
                )
                  setDirective("")
              }}
            >
              Lưu phân công và chỉ đạo
            </Button>
          </div>
        ) : (
          <p className="access-note">
            {actor.role === R.leader
              ? latest?.state === "Chờ xem xét"
                ? "Thông tin xử lý đang khóa trong lúc xem xét. Bạn có thể duyệt hoặc yêu cầu chỉnh sửa báo cáo ở phần bên dưới."
                : "Báo cáo đã phê duyệt; cần lưu phiên bản mới trước khi thay đổi phân công."
              : own
                ? latest?.state === "Chờ xem xét"
                  ? "Báo cáo đang trình; dữ liệu xử lý được khóa trong lúc xem xét."
                  : latest?.state === "Đã phê duyệt"
                    ? "Báo cáo đã phê duyệt. Tạo phiên bản báo cáo mới trước khi cập nhật tiếp."
                    : "Bạn được cập nhật tiến độ và nhận định của hồ sơ này."
                : "Chỉ xem. Quyền phân công thuộc lãnh đạo; quyền cập nhật xử lý thuộc cán bộ được giao."}
          </p>
        )}
        {work ? (
          <div className="role-form">
            <Field label="Trạng thái xử lý">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {[
                  "Mới tạo",
                  "Đang xác minh",
                  "Chờ bổ sung",
                  "Hoàn tất phân tích",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Nhận định cán bộ">
              <textarea
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <Field label="Nội dung tiến độ / Kết quả xác minh">
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </Field>
            <label className="role-checkbox">
              <input
                type="checkbox"
                checked={attachment}
                onChange={(e) => setAttachment(e.target.checked)}
              />
              Bổ sung tài liệu mẫu (mô phỏng)
            </label>
            <Button
              onClick={() => {
                if (
                  onAction({
                    type: "work",
                    id: item.id,
                    note,
                    status,
                    content,
                    attachment,
                  })
                ) {
                  setContent("")
                  setAttachment(false)
                }
              }}
            >
              Lưu tiến độ và nhận định
            </Button>
          </div>
        ) : (
          <dl className="role-readonly">
            <div>
              <dt>Trạng thái</dt>
              <dd>{item.status}</dd>
            </div>
            <div>
              <dt>Mức ưu tiên</dt>
              <dd>{item.priority}</dd>
            </div>
            <div>
              <dt>Nhận định đã lưu</dt>
              <dd>{item.note || "Chưa có nhận định"}</dd>
            </div>
          </dl>
        )}
        {!!item.directives?.length && (
          <div className="supplement-list">
            <h3>Ý kiến chỉ đạo</h3>
            {item.directives.map((d, i) => (
              <article key={i}>
                <b>
                  {d.author} · {formatDateTime(d.time)}
                </b>
                <p>{d.content}</p>
              </article>
            ))}
          </div>
        )}
      </Card>
      <Card className="role-panel">
        <CardHead
          title="Báo cáo hồ sơ"
          sub="Bản báo cáo lưu ảnh chụp dữ liệu nguồn; phiên bản đã phê duyệt được giữ nguyên."
        />
        <div className="report-versions">
          {item.reportVersions?.map((v) => (
            <div key={v.id}>
              <div className="work-queue-row">
                <span>
                  <b>Phiên bản {v.version}</b>
                  <small>
                    {v.author} · {formatDateTime(v.updated)}
                  </small>
                </span>
                <Badge tone={v.state === "Đã phê duyệt" ? "green" : "blue"}>
                  {v.state}
                </Badge>
                <Button variant="secondary" onClick={() => onPreview(v)}>
                  Xem bản {v.version}
                </Button>
              </div>
              {!!v.previousSubmissions?.length && (
                <details>
                  <summary>Các lần trình trước của bản {v.version}</summary>
                  {v.previousSubmissions.map((old, index) => (
                    <div className="work-queue-row" key={index}>
                      <span>
                        Lần trình {index + 1} · {old.state} ·{" "}
                        {formatDateTime(old.submittedAt)}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          onPreview({
                            ...v,
                            ...old,
                            previousSubmissions: undefined,
                          })
                        }
                      >
                        Xem lần trình {index + 1} của bản {v.version}
                      </Button>
                    </div>
                  ))}
                </details>
              )}
            </div>
          ))}
        </div>
        {!latest && (
          <p className="role-hint">
            Chưa có bản báo cáo được lưu. Có thể xem bản tổng hợp hiện tại từ dữ
            liệu hồ sơ.
          </p>
        )}
        <p className="role-note">
          Xem xét kết quả hồ sơ: {latest?.state || "Chưa trình báo cáo"}. Phê
          duyệt áp dụng cho phiên bản báo cáo, không tự đóng hồ sơ.
        </p>
        {latest?.state === "Bản nháp" && stale && (
          <div className="workflow-warning" role="status">
            Hồ sơ hoặc nguồn đã thay đổi sau lần lưu nháp. Kiểm tra nội dung rồi
            bấm “Lưu bản nháp báo cáo” để chủ động cập nhật dữ liệu trước khi
            trình.
          </div>
        )}
        {latest?.reviewNote && (
          <p className="role-note">Ý kiến xem xét: {latest.reviewNote}</p>
        )}
        {own && latest?.state === "Đã phê duyệt" && !newVersion && (
          <Button variant="secondary" onClick={() => setNewVersion(true)}>
            Soạn phiên bản mới
          </Button>
        )}
        {(report || newVersion) && (
          <div className="role-form">
            <Field label="Nội dung báo cáo">
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <div className="role-actions">
              <Button
                variant="secondary"
                disabled={!body.trim()}
                onClick={() =>
                  onAction({
                    type: "report-draft",
                    id: item.id,
                    content: body,
                    newVersion,
                  })
                }
              >
                {newVersion ? "Lưu phiên bản mới" : "Lưu bản nháp báo cáo"}
              </Button>
              {latest && latest.state !== "Đã phê duyệt" && (
                <Button
                  disabled={
                    stale ||
                    body !== latest.content ||
                    !body.trim() ||
                    latest.state !== "Bản nháp"
                  }
                  onClick={() =>
                    onAction({ type: "report-submit", id: item.id })
                  }
                >
                  Trình báo cáo
                </Button>
              )}
            </div>
            {latest && body !== latest.content && (
              <p className="role-hint">
                Lưu nội dung mới trước khi trình báo cáo.
              </p>
            )}
          </div>
        )}
        {canReview && (
          <div className="role-form">
            <Field label="Ý kiến xem xét báo cáo">
              <textarea
                rows={3}
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </Field>
            <div className="role-actions">
              <Button
                variant="secondary"
                disabled={!review.trim()}
                onClick={() => {
                  if (
                    onAction({
                      type: "report-review",
                      id: item.id,
                      approve: false,
                      note: review,
                    })
                  )
                    setReview("")
                }}
              >
                Yêu cầu chỉnh sửa
              </Button>
              <Button
                onClick={() => {
                  if (
                    onAction({
                      type: "report-review",
                      id: item.id,
                      approve: true,
                      note: review,
                    })
                  )
                    setReview("")
                }}
              >
                Phê duyệt báo cáo
              </Button>
            </div>
          </div>
        )}
      </Card>
      {permit(actor, "case.request", item) && (
        <Card className="role-panel role-form">
          <h2>Yêu cầu xem xét lại dữ liệu nguồn</h2>
          <Field label="Nội dung yêu cầu xem xét lại">
            <textarea
              rows={3}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
            />
          </Field>
          <Button
            disabled={!request.trim()}
            onClick={() => {
              if (
                onAction({
                  type: "source-request",
                  id: item.id,
                  content: request,
                })
              )
                setRequest("")
            }}
          >
            Gửi yêu cầu xem xét lại
          </Button>
        </Card>
      )}
      {!!item.workItems?.some((w) => w.kind === "Tiến độ") && (
        <Card className="role-panel supplement-list">
          <h2>Tiến độ đã ghi nhận</h2>
          {item.workItems
            .filter((w) => w.kind === "Tiến độ")
            .map((w, i) => (
              <article key={i}>
                <b>
                  {w.kind} · {w.author} · {formatDateTime(w.time)}
                </b>
                <p>{w.content}</p>
                {w.attachment && <small>01 tài liệu bổ sung giả lập</small>}
              </article>
            ))}
        </Card>
      )}
    </div>
  )
}
