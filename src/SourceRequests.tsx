import { useLayoutEffect, useState } from "react"
import type { CaseFile, StaffAccount } from "./types"
import type { Operation } from "./operations"
import { permit } from "./access"
import { requestKey } from "./receiptWorkflow"
import { formatDateTime } from "./demoTime"
import { Card, CardHead, Field, Button, Badge } from "./ui"
export default function SourceRequests({
  item,
  actor,
  onAction,
  onDraftChange,
}: {
  item: CaseFile
  actor: StaffAccount
  onAction: (op: Operation) => boolean
  onDraftChange: (dirty: boolean) => void
}) {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const dirty = Object.values(responses).some((v) => v !== "")
  useLayoutEffect(() => onDraftChange(dirty), [dirty, onDraftChange])
  const handle = permit(actor, "case.source.handle", item)
  const requests = (item.workItems || [])
    .map((value, index) => ({ value, key: requestKey(item, index) }))
    .filter(({ value }) => value.kind === "Yêu cầu xem xét lại")
  return (
    <Card className="role-panel source-requests">
      <CardHead
        title="Yêu cầu xem xét lại dữ liệu nguồn"
        sub="Tiếp nhận yêu cầu, phản hồi và hoàn thành; dữ liệu nguồn chỉ đổi qua thao tác phân tích có quyền."
      />
      {!requests.length && (
        <p className="role-hint">Chưa có yêu cầu xem xét nguồn.</p>
      )}
      {requests.map(({ value: w, key }) => (
        <article key={key} className="workflow-entry">
          <h3>
            {w.author} · {formatDateTime(w.time)}
          </h3>
          <p>{w.content}</p>
          <Badge tone={w.requestState === "Đã hoàn thành" ? "green" : "blue"}>
            {w.requestState || "Dữ liệu cũ chưa ghi nhận tiếp nhận"}
          </Badge>
          {!w.received && <p>Người nhận: bộ phận phân tích trong đơn vị.</p>}
          {w.received && (
            <p>
              Tiếp nhận: {w.received.name} · {formatDateTime(w.received.at)}
            </p>
          )}
          {w.response && (
            <div className="role-note">
              <b>
                Phản hồi: {w.response.actor.name} ·{" "}
                {formatDateTime(w.response.actor.at)}
              </b>
              <p>{w.response.content}</p>
            </div>
          )}
          {handle && !w.received && w.requestState !== "Đã hoàn thành" && (
            <Button
              onClick={() =>
                onAction({
                  type: "source-receive",
                  id: item.id,
                  requestKey: key,
                })
              }
            >
              Tiếp nhận yêu cầu nguồn
            </Button>
          )}
          {handle &&
            w.requestState === "Đang xử lý" &&
            w.received?.by === actor.id && (
              <div className="role-form">
                <Field label={`Phản hồi yêu cầu ${key}`}>
                  <textarea
                    value={responses[key] || ""}
                    onChange={(e) =>
                      setResponses({ ...responses, [key]: e.target.value })
                    }
                  />
                </Field>
                <Button
                  disabled={!responses[key]?.trim()}
                  onClick={() => {
                    if (
                      onAction({
                        type: "source-complete",
                        id: item.id,
                        requestKey: key,
                        response: responses[key],
                      })
                    )
                      setResponses((current) => ({ ...current, [key]: "" }))
                  }}
                >
                  Hoàn thành yêu cầu nguồn
                </Button>
              </div>
            )}
        </article>
      ))}
    </Card>
  )
}
