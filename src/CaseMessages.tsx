import { useLayoutEffect, useState } from "react"
import type { CaseFile, StaffAccount, CaseMessage } from "./types"
import type { Operation } from "./operations"
import { R, permit, canReadCase } from "./access"
import { visibleMessageVersions } from "./receiptWorkflow"
import { formatDateTime } from "./demoTime"
import { Card, CardHead, Field, Button, Badge } from "./ui"
type Editor = {
  kind: CaseMessage["kind"]
  recipientId: string
  requiresReceipt: boolean
  content: string
  messageId?: string
}
export default function CaseMessages({
  item,
  actor,
  accounts,
  onAction,
  onDraftChange,
}: {
  item: CaseFile
  actor: StaffAccount
  accounts: StaffAccount[]
  onAction: (op: Operation) => boolean
  onDraftChange: (dirty: boolean) => void
}) {
  const recipients = accounts.filter(
    (a) =>
      a.active &&
      a.id !== actor.id &&
      canReadCase(a, item) &&
      [R.analyst, R.worker, R.leader].includes(a.role as never),
  )
  const blank = (): Editor => ({
    kind: "Ghi chú",
    recipientId:
      recipients.find((a) => a.role === R.leader)?.id ||
      recipients[0]?.id ||
      "",
    requiresReceipt: false,
    content: "",
  })
  const [editor, setEditor] = useState<Editor>(blank),
    [baseline, setBaseline] = useState<Editor>(blank),
    [reasons, setReasons] = useState<Record<string, string>>({})
  const editorDirty = JSON.stringify(editor) !== JSON.stringify(baseline)
  const dirty = editorDirty || Object.values(reasons).some((v) => v !== "")
  useLayoutEffect(() => onDraftChange(dirty), [dirty, onDraftChange])
  const canSend = permit(actor, "case.discuss", item)
  const reset = () => {
    const value = blank()
    setEditor(value)
    setBaseline(value)
  }
  const save = () => {
    if (onAction({ type: "message-save", id: item.id, ...editor })) reset()
  }
  const edit = (message: CaseMessage) => {
    if (
      editorDirty &&
      !window.confirm(
        "Thay nội dung đang soạn bằng phiên bản kiến nghị này? Phần chưa lưu sẽ bị bỏ.",
      )
    )
      return
    const last = message.versions.at(-1)!
    const value: Editor = {
      kind: message.kind,
      recipientId: last.recipientId,
      requiresReceipt: true,
      content: last.content,
      messageId: message.id,
    }
    setEditor(value)
    setBaseline(value)
  }
  const entries = (item.messages || [])
    .map((message) => ({
      message,
      versions: visibleMessageVersions(message, actor.id),
    }))
    .filter((entry) => entry.versions.length)
  return (
    <Card className="role-panel case-messages">
      <CardHead
        title="Ý kiến nội bộ và kiến nghị"
        sub="Ghi chú không yêu cầu phê duyệt. Kiến nghị riêng có người nhận và phiên bản; nhận định trong báo cáo dùng luồng duyệt báo cáo."
      />
      {canSend && (
        <div className="role-form opinion-editor">
          <div className="two-col">
            <Field label="Loại ý kiến">
              <select
                value={editor.kind}
                disabled={!!editor.messageId}
                onChange={(e) => {
                  const kind = e.target.value as Editor["kind"]
                  setEditor({
                    ...editor,
                    kind,
                    requiresReceipt: kind === "Kiến nghị",
                    recipientId:
                      kind === "Kiến nghị"
                        ? recipients.find((a) => a.role === R.leader)?.id || ""
                        : editor.recipientId,
                  })
                }}
              >
                <option>Ghi chú</option>
                <option disabled={!recipients.some(a=>a.role===R.leader)}>Kiến nghị</option>
              </select>
            </Field>
            <Field label="Người nhận ý kiến">
              <select
                value={editor.recipientId}
                onChange={(e) =>
                  setEditor({ ...editor, recipientId: e.target.value })
                }
              >
                <option value="">Chọn người nhận</option>
                {recipients
                  .filter(
                    (a) => editor.kind !== "Kiến nghị" || a.role === R.leader,
                  )
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.role}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <Field label="Nội dung ý kiến">
            <textarea
              rows={4}
              value={editor.content}
              onChange={(e) =>
                setEditor({ ...editor, content: e.target.value })
              }
            />
          </Field>
          {editor.kind === "Ghi chú" && (
            <label className="role-checkbox">
              <input
                type="checkbox"
                checked={editor.requiresReceipt}
                onChange={(e) =>
                  setEditor({ ...editor, requiresReceipt: e.target.checked })
                }
              />
              Yêu cầu người nhận xác nhận tiếp nhận
            </label>
          )}
          <div className="role-actions">
            <Button
              disabled={!editor.content.trim() || !editor.recipientId}
              onClick={save}
            >
              {editor.kind === "Ghi chú"
                ? "Gửi ghi chú nội bộ"
                : "Lưu nháp kiến nghị"}
            </Button>
            {editor.messageId && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (
                    !editorDirty ||
                    window.confirm("Bỏ phần ý kiến chưa lưu?")
                  )
                    reset()
                }}
              >
                Đóng soạn ý kiến
              </Button>
            )}
          </div>
          <small>
            {editor.kind === "Ghi chú"
              ? "Gửi để trao đổi; không chuyển hồ sơ sang trạng thái chờ duyệt."
              : "Lưu nháp trước, sau đó trình phiên bản đã lưu cho lãnh đạo."}
          </small>
        </div>
      )}
      {!entries.length && (
        <p className="role-hint">Chưa có ý kiến được phép hiển thị.</p>
      )}
      {entries.map(({ message: m, versions }) => {
        const v = versions.at(-1)!,
          actual = m.versions.at(-1)!,
          latest = v.version === actual.version,
          reasonKey = `${m.id}:${v.version}`,
          isAuthor = v.created.by === actor.id
        const editAllowed =
          canSend &&
          latest &&
          isAuthor &&
          m.kind === "Kiến nghị" &&
          !["Đã gửi", "Đã tiếp nhận"].includes(v.state)
        const receive =
          latest &&
          v.recipientId === actor.id &&
          v.state === "Đã gửi" &&
          m.requiresReceipt &&
          [R.analyst, R.worker, R.leader].includes(actor.role as never) &&
          (m.kind !== "Kiến nghị" || actor.role === R.leader)
        const review =
          latest &&
          v.recipientId === actor.id &&
          actor.role === R.leader &&
          m.kind === "Kiến nghị" &&
          v.state === "Đã tiếp nhận" &&
          !isAuthor
        return (
          <article className="workflow-entry" key={m.id}>
            <div className="workflow-entry-title">
              <h3>
                {m.id} · {m.kind} · Phiên bản {v.version}
              </h3>
              <Badge tone={v.state === "Đã duyệt" ? "green" : "blue"}>
                {v.state}
              </Badge>
            </div>
            <p>
              {v.created.name} · {v.created.role} ·{" "}
              {formatDateTime(v.created.at)}
            </p>
            <p>
              Người nhận:{" "}
              {accounts.find((a) => a.id === v.recipientId)?.name ||
                v.recipientId}
            </p>
            <p className="opinion-content">{v.content}</p>
            {m.kind === "Ghi chú" && (
              <small>
                Không yêu cầu phê duyệt ·{" "}
                {m.requiresReceipt
                  ? v.received
                    ? "Đã xác nhận tiếp nhận"
                    : "Chờ người nhận xác nhận"
                  : "Không yêu cầu xác nhận tiếp nhận"}
              </small>
            )}
            {v.received && (
              <p>
                Đã tiếp nhận: {v.received.name} ·{" "}
                {formatDateTime(v.received.at)}
              </p>
            )}
            {v.decision && (
              <p className="role-note">
                {v.decision.actor.name} · {formatDateTime(v.decision.actor.at)}{" "}
                · {v.decision.reason || "Đã chấp thuận kiến nghị nội bộ."}
              </p>
            )}
            <div className="role-actions">
              {editAllowed && (
                <Button variant="secondary" onClick={() => edit(m)}>
                  {v.state === "Bản nháp"
                    ? "Sửa nháp kiến nghị"
                    : "Soạn phiên bản kiến nghị mới"}
                </Button>
              )}
              {canSend &&
                latest &&
                isAuthor &&
                m.kind === "Kiến nghị" &&
                v.state === "Bản nháp" && (
                  <Button
                    disabled={editor.messageId === m.id && editorDirty}
                    onClick={() =>
                      onAction({
                        type: "message-submit",
                        id: item.id,
                        messageId: m.id,
                      })
                    }
                  >
                    Trình kiến nghị
                  </Button>
                )}
              {receive && (
                <Button
                  onClick={() =>
                    onAction({
                      type: "message-receive",
                      id: item.id,
                      messageId: m.id,
                    })
                  }
                >
                  Xác nhận tiếp nhận ý kiến
                </Button>
              )}
            </div>
            {review && (
              <div className="role-form">
                <Field label={`Ý kiến xem xét ${m.id}`}>
                  <textarea
                    value={reasons[reasonKey] || ""}
                    onChange={(e) =>
                      setReasons({ ...reasons, [reasonKey]: e.target.value })
                    }
                  />
                </Field>
                <div className="role-actions">
                  {(
                    [
                      "Đã duyệt",
                      "Yêu cầu chỉnh sửa",
                      "Không chấp thuận",
                    ] as const
                  ).map((decision) => (
                    <Button
                      key={decision}
                      variant={
                        decision === "Đã duyệt" ? "primary" : "secondary"
                      }
                      disabled={
                        decision !== "Đã duyệt" && !reasons[reasonKey]?.trim()
                      }
                      onClick={() => {
                        if (
                          onAction({
                            type: "message-review",
                            id: item.id,
                            messageId: m.id,
                            decision,
                            reason: reasons[reasonKey] || "",
                          })
                        )
                          setReasons((current) => ({
                            ...current,
                            [reasonKey]: "",
                          }))
                      }}
                    >
                      {decision === "Đã duyệt"
                        ? "Duyệt kiến nghị"
                        : decision === "Yêu cầu chỉnh sửa"
                          ? "Trả sửa kiến nghị"
                          : "Không chấp thuận kiến nghị"}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {versions.length > 1 && (
              <details>
                <summary>Các phiên bản trước của ý kiến</summary>
                {versions.slice(0, -1).map((old) => (
                  <section key={old.version}>
                    <h4>
                      Phiên bản {old.version} · {old.state}
                    </h4>
                    <p>
                      {old.created.name} · {formatDateTime(old.created.at)} ·
                      Người nhận {old.recipientId}
                    </p>
                    <p className="opinion-content">{old.content}</p>
                    {old.decision && (
                      <p>
                        {old.decision.actor.name}: {old.decision.reason}
                      </p>
                    )}
                  </section>
                ))}
              </details>
            )}
          </article>
        )
      })}
    </Card>
  )
}
