import type {
  Report,
  CaseFile,
  LogItem,
  StaffAccount,
  ReportVersion,
  ActionStamp,
  CaseMessage,
} from "./types"
import { R, UNIT, permit, canReadReport, canReadCase } from "./access.ts"
import {
  relatedSourceCases,
  sameReportIds,
  duplicateConsentKey,
} from "./caseSources.ts"
import {
  caseReceiptAllowsWork,
  currentAssignment,
  requestKey,
} from "./receiptWorkflow.ts"
import { reportSnapshotStale } from "./reportSnapshot.ts"
export type Operation =
  | {
      type: "receive"
      id: string
      step: "note" | "request" | "reject" | "transfer"
      note: string
      assignee?: string
    }
  | { type: "report-accept"; id: string }
  | { type: "case-accept"; id: string }
  | { type: "source-receive"; id: string; requestKey: string }
  | {
      type: "source-complete"
      id: string
      requestKey: string
      response: string
    }
  | {
      type: "message-save"
      id: string
      messageId?: string
      kind: "Ghi chú" | "Kiến nghị"
      recipientId: string
      requiresReceipt: boolean
      content: string
    }
  | { type: "message-submit"; id: string; messageId: string }
  | { type: "message-receive"; id: string; messageId: string }
  | {
      type: "message-review"
      id: string
      messageId: string
      decision: "Đã duyệt" | "Yêu cầu chỉnh sửa" | "Không chấp thuận"
      reason: string
    }
  | { type: "supplement"; id: string; content: string; attachment: boolean }
  | { type: "extract-start"; id: string }
  | { type: "extract-save"; id: string; patch: Partial<Report> }
  | { type: "link"; id: string; clusterId: string }
  | { type: "proposal"; id: string; clusterId: string; restore: boolean }
  | {
      type: "create-case"
      name: string
      clusterId: string
      duplicateConsent?: string
    }
  | {
      type: "assign"
      id: string
      assignedTo: string
      priority: string
      directive: string
    }
  | {
      type: "work"
      id: string
      note: string
      status: string
      content: string
      attachment: boolean
    }
  | { type: "source-request"; id: string; content: string }
  | { type: "report-draft"; id: string; content: string; newVersion?: boolean }
  | { type: "report-submit"; id: string }
  | { type: "report-review"; id: string; approve: boolean; note: string }
  | {
      type: "account-update"
      id: string
      role: string
      unitId: string
      active: boolean
    }
export type OperationState = {
  reports: Report[]
  cases: CaseFile[]
  accounts: StaffAccount[]
}
export function applyOperation(
  state: OperationState,
  actorId: string,
  op: Operation,
  time: string,
): OperationState & { log: LogItem } {
  const actor = state.accounts.find((a) => a.id === actorId)
  if (!actor?.active) throw Error("Tài khoản không hoạt động.")
  const stamp = (): ActionStamp => ({
    by: actor.id,
    name: actor.name,
    role: actor.role,
    unitId: actor.unitId,
    at: time,
  })
  let { reports, cases, accounts } = state
  const report = "id" in op ? reports.find((r) => r.id === op.id) : undefined
  const item = "id" in op ? cases.find((c) => c.id === op.id) : undefined
  const requirePermission = (
    p: Parameters<typeof permit>[1],
    subject?: Report | CaseFile,
  ) => {
    if (!permit(actor, p, subject, cases))
      throw Error(
        "Bạn không có quyền thực hiện thao tác này trong phạm vi hoặc trạng thái hiện tại.",
      )
  }
  const nonempty = (
    s: string,
    msg = "Vui lòng nhập nội dung trước khi thực hiện.",
  ) => {
    if (!s.trim()) throw Error(msg)
    return s.trim()
  }
  let action = "",
    target = "id" in op ? op.id : op.clusterId,
    detail = "",
    category: LogItem["category"] = "Nghiệp vụ"
  const updateReport = (patch: Partial<Report>) => {
    if (!report) throw Error("Không tìm thấy phản ánh.")
    reports = reports.map((r) =>
      r.id === report.id ? { ...r, ...patch, updatedAt: time } : r,
    )
  }
  const updateCase = (patch: Partial<CaseFile>) => {
    if (!item) throw Error("Không tìm thấy hồ sơ.")
    cases = cases.map((c) =>
      c.id === item.id
        ? {
            ...c,
            ...patch,
            updated: time,
            history: [`${time} · ${actor.name}: ${action}`, ...c.history],
          }
        : c,
    )
  }
  const latest = item?.reportVersions?.at(-1)
  const snapshot = (): ReportVersion["snapshot"] => {
    if (!item) throw Error("Không tìm thấy hồ sơ.")
    const source = item.reportIds.map((id) => reports.find((r) => r.id === id))
    if (source.some((r) => !r || !canReadReport(actor, r, cases)))
      throw Error("Không đủ quyền hoặc thiếu dữ liệu nguồn của hồ sơ.")
    return JSON.parse(
      JSON.stringify({
        caseId: item.id,
        name: item.name,
        status: item.status,
        priority: item.priority,
        officer: item.officer,
        note: item.note,
        reportIds: item.reportIds,
        reports: source,
      }),
    )
  }
  switch (op.type) {
    case "report-accept":
      requirePermission("report.accept", report)
      action = "Xác nhận tiếp nhận phản ánh"
      detail =
        "Cán bộ tiếp nhận phiếu; không xác nhận tính đúng đắn hoặc liên kết."
      updateReport({
        intakeReceipt: stamp(),
        ...(report?.intakeStatus === "Mới tiếp nhận"
          ? { intakeStatus: "Đang kiểm tra" as const }
          : {}),
      })
      break
    case "case-accept": {
      requirePermission("case.accept", item)
      const assignment = currentAssignment(item!)!
      action = "Nhận xử lý hồ sơ"
      detail = `Nhận lần phân công ${assignment.id}; người nhận ${actor.id}`
      updateCase({
        assignments: item!.assignments!.map((a) =>
          a.id === assignment.id ? { ...a, received: stamp() } : a,
        ),
      })
      break
    }
    case "source-receive":
    case "source-complete": {
      requirePermission("case.source.handle", item)
      const index =
        item!.workItems?.findIndex(
          (_, i) => requestKey(item!, i) === op.requestKey,
        ) ?? -1
      const request = item!.workItems?.[index]
      if (!request || request.kind !== "Yêu cầu xem xét lại")
        throw Error("Yêu cầu không tồn tại.")
      if (op.type === "source-receive") {
        if (request.received || request.requestState === "Đã hoàn thành")
          throw Error("Yêu cầu đã được tiếp nhận.")
        action = "Tiếp nhận yêu cầu xem xét nguồn"
        detail = op.requestKey
        updateCase({
          workItems: item!.workItems!.map((w, i) =>
            i === index
              ? {
                  ...w,
                  requestId: op.requestKey,
                  requestState: "Đang xử lý",
                  received: stamp(),
                }
              : w,
          ),
        })
      } else {
        if (
          request.requestState !== "Đang xử lý" ||
          request.received?.by !== actor.id
        )
          throw Error("Chỉ cán bộ đã tiếp nhận được hoàn thành yêu cầu.")
        const content = nonempty(
          op.response,
          "Nhập phản hồi trước khi hoàn thành.",
        )
        action = "Hoàn thành yêu cầu xem xét nguồn"
        detail = op.requestKey
        updateCase({
          workItems: item!.workItems!.map((w, i) =>
            i === index
              ? {
                  ...w,
                  requestState: "Đã hoàn thành",
                  response: { actor: stamp(), content },
                }
              : w,
          ),
        })
      }
      break
    }
    case "message-save": {
      requirePermission("case.discuss", item)
      if (!["Ghi chú", "Kiến nghị"].includes(op.kind))
        throw Error("Loại ý kiến không hợp lệ.")
      const receiver = accounts.find(
        (a) =>
          a.id === op.recipientId &&
          a.active &&
          canReadCase(a, item!) &&
          [R.analyst, R.worker, R.leader].includes(a.role as never),
      )
      if (
        !receiver ||
        receiver.id === actor.id ||
        (op.kind === "Kiến nghị" && receiver.role !== R.leader)
      )
        throw Error("Chọn người nhận phù hợp trong đơn vị và phạm vi hồ sơ.")
      const content = nonempty(op.content, "Nhập nội dung ý kiến.")
      const old = item!.messages?.find((m) => m.id === op.messageId)
      const last = old?.versions.at(-1)
      if (
        op.messageId &&
        (!old ||
          old.kind !== "Kiến nghị" ||
          op.kind !== old.kind ||
          last?.created.by !== actor.id)
      )
        throw Error("Không được sửa ý kiến của tài khoản khác.")
      if (last && ["Đã gửi", "Đã tiếp nhận"].includes(last.state))
        throw Error("Nội dung đã trình đang chờ xem xét, không được sửa đè.")
      const freshVersion = last && last.state !== "Bản nháp"
      const version = {
        version: !last ? 1 : freshVersion ? last.version + 1 : last.version,
        recipientId: receiver.id,
        content,
        state:
          op.kind === "Ghi chú" ? ("Đã gửi" as const) : ("Bản nháp" as const),
        created: stamp(),
        ...(op.kind === "Ghi chú" ? { submitted: stamp() } : {}),
      }
      const message: CaseMessage = {
        id: old?.id || `YK-${item!.id}-${(item!.messages?.length || 0) + 1}`,
        kind: op.kind,
        recipientId: receiver.id,
        requiresReceipt: op.kind === "Kiến nghị" || op.requiresReceipt,
        versions: !old
          ? [version]
          : freshVersion
            ? [...old.versions, version]
            : old.versions.map((v) =>
                v.version === version.version ? version : v,
              ),
      }
      updateCase({
        messages: old
          ? item!.messages!.map((m) => (m.id === old.id ? message : m))
          : [...(item!.messages || []), message],
      })
      action =
        op.kind === "Ghi chú" ? "Gửi ghi chú nội bộ" : "Lưu bản nháp kiến nghị"
      detail = `${message.id}; phiên bản ${version.version}; người nhận ${receiver.id}`
      break
    }
    case "message-submit":
    case "message-receive":
    case "message-review": {
      if (!item || !canReadCase(actor, item))
        throw Error("Không có quyền xem ý kiến của hồ sơ.")
      const message = item.messages?.find((m) => m.id === op.messageId)
      const last = message?.versions.at(-1)
      if (!message || !last) throw Error("Ý kiến không tồn tại.")
      let patch: Partial<typeof last> = {}
      if (op.type === "message-submit") {
        requirePermission("case.discuss", item)
        const receiver = accounts.find(
          (a) =>
            a.id === last.recipientId &&
            a.active &&
            a.role === R.leader &&
            canReadCase(a, item),
        )
        if (
          message.kind !== "Kiến nghị" ||
          last.state !== "Bản nháp" ||
          last.created.by !== actor.id ||
          !receiver ||
          receiver.id === actor.id
        )
          throw Error("Chỉ tác giả được trình bản nháp đến lãnh đạo hợp lệ.")
        patch = { state: "Đã gửi", submitted: stamp() }
        action = "Trình kiến nghị"
      } else if (op.type === "message-receive") {
        if (
          last.recipientId !== actor.id ||
          ![R.analyst, R.worker, R.leader].includes(actor.role as never) ||
          last.state !== "Đã gửi" ||
          !message.requiresReceipt ||
          (message.kind === "Kiến nghị" && actor.role !== R.leader)
        )
          throw Error("Chỉ người nhận có trách nhiệm được xác nhận tiếp nhận.")
        patch = { state: "Đã tiếp nhận", received: stamp() }
        action = "Tiếp nhận ý kiến"
      } else {
        if (
          actor.role !== R.leader ||
          last.recipientId !== actor.id ||
          last.created.by === actor.id ||
          message.kind !== "Kiến nghị" ||
          last.state !== "Đã tiếp nhận"
        )
          throw Error(
            "Lãnh đạo được giao phải tiếp nhận trước khi xem xét kiến nghị.",
          )
        if (
          !["Đã duyệt", "Yêu cầu chỉnh sửa", "Không chấp thuận"].includes(
            op.decision,
          )
        )
          throw Error("Kết quả xem xét không hợp lệ.")
        const reason =
          op.decision === "Đã duyệt"
            ? op.reason.trim()
            : nonempty(op.reason, "Nhập lý do trả sửa hoặc không chấp thuận.")
        patch = { state: op.decision, decision: { actor: stamp(), reason } }
        action = `Xem xét kiến nghị: ${op.decision}`
      }
      updateCase({
        messages: item.messages!.map((m) =>
          m.id === message.id
            ? {
                ...m,
                versions: m.versions.map((v) =>
                  v.version === last.version ? { ...v, ...patch } : v,
                ),
              }
            : m,
        ),
      })
      detail = `${message.id}; phiên bản ${last.version}`
      break
    }

    case "receive": {
      requirePermission("report.receive", report)
      if (!report) throw Error("Không tìm thấy phản ánh.")
      action = {
        note: "Ghi chú tiếp nhận",
        request: "Yêu cầu bổ sung",
        reject: "Đánh dấu không hợp lệ",
        transfer: "Chuyển phân tích",
      }[op.step]
      const note = nonempty(op.note)
      if (op.step === "transfer") {
        const analyst = accounts.find(
          (a) =>
            a.id === op.assignee &&
            a.active &&
            a.role === R.analyst &&
            a.unitId === actor.unitId,
        )
        if (!analyst)
          throw Error("Chọn cán bộ phân tích đang hoạt động trong đơn vị.")
        if (!report.title.trim() || !report.content.trim())
          throw Error("Phiếu còn thiếu tiêu đề hoặc nội dung.")
        updateReport({
          intakeStatus: "Chuyển phân tích",
          intakeNote: note,
          analysisAssignee: analyst.id,
          analysisStatus: "Chờ phân tích",
        })
      } else
        updateReport({
          intakeStatus:
            op.step === "request"
              ? "Chờ bổ sung"
              : op.step === "reject"
                ? "Không hợp lệ"
                : report.intakeStatus,
          intakeNote: note,
          ...(op.step === "request" ? { supplementRequest: note } : {}),
        })
      detail = `Tiếp nhận: ${report.intakeStatus} → ${op.step === "transfer" ? "Chuyển phân tích" : op.step === "request" ? "Chờ bổ sung" : op.step === "reject" ? "Không hợp lệ" : report.intakeStatus}. ${note}${op.assignee ? `; giao phân tích: ${op.assignee}` : ""}`
      break
    }
    case "supplement":
      requirePermission("report.supplement", report)
      action = "Bổ sung phản ánh"
      updateReport({
        intakeStatus: report?.intakeReceipt ? "Đang kiểm tra" : "Mới tiếp nhận",
        supplements: [
          ...(report?.supplements || []),
          {
            id: `BS-${time}`,
            time,
            author: actor.id,
            content: nonempty(op.content),
            attachment: op.attachment,
          },
        ],
      })
      detail = "Lưu bản bổ sung riêng; giữ nguyên lời khai ban đầu."
      break
    case "extract-start":
      requirePermission("report.analyze", report)
      action = "Trích xuất mô phỏng"
      updateReport({
        extracted: true,
        analysisStatus: "Đang phân tích",
        analysisAssignee: actor.id,
      })
      break
    case "extract-save": {
      requirePermission("report.analyze", report)
      if (!report) throw Error("Không tìm thấy phản ánh.")
      const p = op.patch
      if (!Number.isFinite(p.amount) || Number(p.amount) < 0)
        throw Error("Số tiền phải là số không âm.")
      if (
        !p.behavior?.trim() ||
        (p.behavior === "Khác" && !p.behaviorOther?.trim())
      )
        throw Error("Thiếu loại phản ánh hoặc mô tả loại khác.")
      action = "Kiểm tra thông tin trích xuất"
      const keys = [
        "account",
        "bank",
        "phone",
        "website",
        "amount",
        "behavior",
        "behaviorOther",
        "socialAccount",
        "analysisNote",
      ] as const
      const patch: Partial<Report> = {}
      for (const k of keys) if (k in p) Object.assign(patch, { [k]: p[k] })
      const changed = (["account", "phone", "website"] as const).some(
        (k) => report[k] !== patch[k],
      )
      detail = keys
        .filter((k) => String(report[k] || "") !== String(patch[k] || ""))
        .map(
          (k) => `${k}: ${report[k] ?? "Chưa có"} → ${patch[k] ?? "Chưa có"}`,
        )
        .join("; ")
      updateReport({
        ...patch,
        people: {
          ...report.people,
          ...(p.people?.subjectName !== undefined
            ? { subjectName: p.people.subjectName }
            : {}),
          ...(p.people?.subjectSocial !== undefined
            ? { subjectSocial: p.people.subjectSocial }
            : {}),
        },
        initialBehavior: report.initialBehavior || report.behavior,
        initialBehaviorOther:
          report.initialBehaviorOther ?? report.behaviorOther,
        extracted: true,
        reviewed: true,
        analysisStatus: "Đã kiểm tra",
        analysisAssignee: actor.id,
        status: "Đã kiểm tra",
        rejectedClusters: [],
        ...(changed ? { cluster: undefined } : {}),
      })
      if (changed && report.cluster)
        detail += `; bỏ liên kết cũ ${report.cluster}, cần xác nhận lại.`
      break
    }
    case "link": {
      requirePermission("report.link", report)
      if (!report) throw Error("Không tìm thấy phản ánh.")
      if (!["CUM-001", "CUM-002"].includes(op.clusterId))
        throw Error("Cụm liên kết không tồn tại.")
      if (report.rejectedClusters?.includes(op.clusterId))
        throw Error("Đề xuất đang bị loại bỏ; cần xem xét lại trước.")
      const matches = reports.filter(
        (r) =>
          r.cluster === op.clusterId &&
          r.id !== report.id &&
          r.unitId === report.unitId &&
          canReadReport(actor, r, cases) &&
          (["account", "phone", "website"] as const).some(
            (k) =>
              report[k]?.trim() &&
              report[k]?.trim().toLowerCase() === r[k]?.trim().toLowerCase(),
          ),
      )
      if (!matches.length)
        throw Error("Không có căn cứ thực thể trùng khớp đã lưu.")
      action = "Xác nhận liên kết"
      detail = `${report.cluster || "Chưa liên kết"} → ${op.clusterId}; căn cứ: ${matches.map((r) => r.id).join(", ")}`
      updateReport({ cluster: op.clusterId, status: "Có liên quan" })
      break
    }
    case "proposal":
      requirePermission("report.link", report)
      action = op.restore ? "Khôi phục đề xuất" : "Loại bỏ đề xuất liên kết"
      detail = op.clusterId
      updateReport({
        rejectedClusters: op.restore
          ? (report?.rejectedClusters || []).filter((x) => x !== op.clusterId)
          : [...new Set([...(report?.rejectedClusters || []), op.clusterId])],
      })
      break
    case "create-case": {
      requirePermission("case.create")
      if (!["CUM-001", "CUM-002"].includes(op.clusterId))
        throw Error("Cụm nguồn không tồn tại.")
      nonempty(op.name)
      const source = reports.filter(
        (r) => r.cluster === op.clusterId && r.unitId === actor.unitId,
      )
      if (
        !source.length ||
        source.some(
          (r) =>
            !canReadReport(actor, r, cases) ||
            r.intakeStatus !== "Chuyển phân tích",
        )
      )
        throw Error("Nguồn cụm chưa đủ điều kiện tạo hồ sơ.")
      const sourceIds = source.map((r) => r.id)
      const related = relatedSourceCases(cases, actor, op.clusterId)
      const duplicates = related.filter((c) =>
        sameReportIds(c.reportIds, sourceIds),
      )
      const expectedConsent = duplicateConsentKey(
        op.clusterId,
        sourceIds,
        related,
      )
      if (op.duplicateConsent && op.duplicateConsent !== expectedConsent)
        throw Error(
          "Nguồn hoặc hồ sơ liên quan đã thay đổi. Hãy xem lại và xác nhận mới.",
        )
      if (duplicates.length && op.duplicateConsent !== expectedConsent)
        throw Error(
          "Đã có hồ sơ cùng cụm và cùng bộ phản ánh. Cần xác nhận tạo hồ sơ mới có chủ đích.",
        )
      const id = `HS-${String(Math.max(0, ...cases.map((c) => Number(c.id.match(/^HS-(\d+)$/)?.[1]) || 0)) + 1).padStart(3, "0")}`
      const c: CaseFile = {
        id,
        receiptWorkflow: 2,
        name: op.name.trim(),
        unitId: actor.unitId,
        assignedTo: undefined,
        officer: "Chưa phân công",
        priority: op.clusterId === "CUM-001" ? "Cao" : "Trung bình",
        status: "Mới tạo",
        updated: time,
        note: "",
        reportIds: source.map((r) => r.id),
        clusterId: op.clusterId,
        history: [`${time} · ${actor.name}: Tạo hồ sơ chờ phân công`],
        directives: [],
        workItems: [],
        reportVersions: [],
      }
      cases = [c, ...cases]
      target = id
      action = "Tạo hồ sơ"
      detail = `Nguồn ${op.clusterId}; ${source.length} phản ánh; ${source.reduce((n, r) => n + r.amount, 0)} triệu. Chờ lãnh đạo phân công.`
      break
    }
    case "assign": {
      requirePermission("case.assign", item)
      const worker = accounts.find(
        (a) =>
          a.id === op.assignedTo &&
          a.active &&
          a.role === R.worker &&
          a.unitId === actor.unitId,
      )
      if (!worker || !["Cao", "Trung bình", "Thấp"].includes(op.priority))
        throw Error(
          "Chọn cán bộ xử lý đang hoạt động trong đơn vị và mức ưu tiên hợp lệ.",
        )
      action = "Phân công cán bộ"
      detail = `${item?.assignedTo || "Chưa phân công"} → ${worker.id}; ưu tiên: ${item?.priority} → ${op.priority}${op.directive.trim() ? `; chỉ đạo: ${op.directive.trim()}` : ""}`
      const changedAssignee = item?.assignedTo !== worker.id
      const newAssignment = changedAssignee
        ? {
            id: `PC-${item!.id}-${(item!.assignments?.length || 0) + 1}`,
            assignee: worker.id,
            assigneeName: worker.name,
            assigned: stamp(),
          }
        : undefined
      updateCase({
        ...(newAssignment
          ? {
              receiptWorkflow: 2,
              assignments: [...(item!.assignments || []), newAssignment],
            }
          : {}),
        assignedTo: worker.id,
        officer: worker.name,
        priority: op.priority,
        ...(op.directive.trim()
          ? {
              directives: [
                ...(item?.directives || []),
                { time, author: actor.id, content: op.directive.trim() },
              ],
            }
          : {}),
      })
      break
    }
    case "work":
      requirePermission("case.work", item)
      if (
        ![
          "Mới tạo",
          "Đang xác minh",
          "Chờ bổ sung",
          "Hoàn tất phân tích",
        ].includes(op.status)
      )
        throw Error("Trạng thái hồ sơ không hợp lệ.")
      action = "Cập nhật tiến độ và nhận định"
      detail = `Trạng thái: ${item?.status} → ${op.status}; nhận định: ${item?.note || "Chưa có"} → ${op.note.trim()}; tiến độ: ${op.content.trim() || "Không bổ sung"}; tài liệu mẫu: ${op.attachment ? 1 : 0}`
      updateCase({
        status: op.status,
        note: op.note.trim(),
        ...(op.content.trim() || op.attachment
          ? {
              workItems: [
                ...(item?.workItems || []),
                {
                  time,
                  author: actor.id,
                  content: op.content.trim() || "Bổ sung tài liệu mẫu",
                  attachment: op.attachment,
                  kind: "Tiến độ",
                },
              ],
            }
          : {}),
      })
      break
    case "source-request":
      requirePermission("case.request", item)
      action = "Yêu cầu xem xét lại dữ liệu nguồn"
      detail = nonempty(op.content)
      updateCase({
        workItems: [
          ...(item?.workItems || []),
          {
            time,
            author: actor.id,
            content: detail,
            attachment: false,
            kind: "Yêu cầu xem xét lại",
            requestId: `YC-${item!.id}-${(item!.workItems?.length || 0) + 1}`,
            requestState: "Chờ tiếp nhận",
          },
        ],
      })
      break
    case "report-draft": {
      if (
        !item ||
        !canReadCase(actor, item) ||
        actor.role !== R.worker ||
        item.assignedTo !== actor.id ||
        item.status === "Đã đóng" ||
        !caseReceiptAllowsWork(item)
      )
        throw Error("Chỉ cán bộ được giao mới được lập báo cáo.")
      if (latest?.state === "Chờ xem xét")
        throw Error("Báo cáo đang chờ xem xét; không thể sửa.")
      if (latest?.state === "Đã phê duyệt" && !op.newVersion)
        throw Error("Báo cáo đã duyệt; cần tạo phiên bản mới.")
      if (op.newVersion && latest?.state !== "Đã phê duyệt")
        throw Error("Chỉ tạo phiên bản mới khi bản trước đã phê duyệt.")
      const content = nonempty(
        op.content,
        "Nhập nội dung báo cáo trước khi lưu.",
      )
      const fresh = !latest || latest.state === "Đã phê duyệt"
      const v: ReportVersion = {
        id: fresh ? `${item.id}-BC-${(latest?.version || 0) + 1}` : latest.id,
        version: fresh ? (latest?.version || 0) + 1 : latest.version,
        state: "Bản nháp",
        author: actor.id,
        updated: time,
        content,
        snapshot: snapshot(),
        ...(!fresh && latest
          ? {
              previousSubmissions: [
                ...(latest.previousSubmissions || []),
                ...(latest.state === "Yêu cầu chỉnh sửa"
                  ? [
                      {
                        author: latest.author,
                        content: latest.content,
                        snapshot: latest.snapshot,
                        submittedAt: latest.submittedAt,
                        reviewedAt: latest.reviewedAt,
                        reviewer: latest.reviewer,
                        reviewNote: latest.reviewNote,
                        state: latest.state,
                        updated: latest.updated,
                      },
                    ]
                  : []),
              ],
            }
          : {}),
      }
      action = fresh ? "Tạo phiên bản báo cáo" : "Lưu bản nháp báo cáo"
      detail = `${v.id}; ${v.snapshot.reports.length} phản ánh; bản duyệt cũ được giữ nguyên.`
      updateCase({
        reportVersions: fresh
          ? [...(item.reportVersions || []), v]
          : (item.reportVersions || []).map((x) => (x.id === v.id ? v : x)),
      })
      break
    }
    case "report-submit":
      requirePermission("case.report", item)
      if (!latest || latest.state !== "Bản nháp" || !latest.content.trim())
        throw Error("Cần lưu bản nháp báo cáo trước khi trình.")
      if (reportSnapshotStale(item!, reports, latest))
        throw Error(
          "Hồ sơ hoặc nguồn đã thay đổi sau lần lưu nháp. Kiểm tra và lưu lại bản nháp trước khi trình.",
        )
      action = "Trình báo cáo"
      detail = latest.id
      updateCase({
        reportVersions: item!.reportVersions!.map((v) =>
          v.id === latest.id
            ? { ...v, state: "Chờ xem xét", submittedAt: time, updated: time }
            : v,
        ),
      })
      break
    case "report-review":
      requirePermission("case.review", item)
      if (!latest) throw Error("Không tìm thấy báo cáo đang trình.")
      if (!op.approve) nonempty(op.note, "Nhập ý kiến yêu cầu chỉnh sửa.")
      action = op.approve ? "Phê duyệt báo cáo" : "Yêu cầu chỉnh sửa báo cáo"
      detail = `${latest.id}; ${op.note.trim()}`
      updateCase({
        reportVersions: item!.reportVersions!.map((v) =>
          v.id === latest.id
            ? {
                ...v,
                state: op.approve ? "Đã phê duyệt" : "Yêu cầu chỉnh sửa",
                reviewer: actor.id,
                reviewNote: op.note.trim(),
                reviewedAt: time,
                updated: time,
              }
            : v,
        ),
      })
      break
    case "account-update": {
      requirePermission("account.manage")
      category = "Quản trị"
      const account = accounts.find((a) => a.id === op.id)
      if (
        !account ||
        account.kind !== "staff" ||
        !Object.values(R)
          .filter((r) => r !== R.citizen)
          .includes(op.role as never)
      )
        throw Error(
          "Chỉ quản lý vai trò cán bộ nội bộ; không chuyển đổi tài khoản người dân.",
        )
      if (!op.unitId.trim()) throw Error("Nhập đơn vị phụ trách.")
      if (
        account.role === R.admin &&
        account.active &&
        (!op.active || op.role !== R.admin) &&
        accounts.filter((a) => a.active && a.role === R.admin).length <= 1
      )
        throw Error("Cần giữ ít nhất một tài khoản quản trị đang hoạt động.")
      action = "Cập nhật tài khoản và quyền"
      detail = `${account.role} → ${op.role}; đơn vị ${account.unitId} → ${op.unitId.trim()}; hoạt động ${account.active} → ${op.active}`
      accounts = accounts.map((a) =>
        a.id === op.id
          ? { ...a, role: op.role, unitId: op.unitId.trim(), active: op.active }
          : a,
      )
      break
    }
  }
  return {
    reports,
    cases,
    accounts,
    log: {
      time,
      user: actor.id,
      role: actor.role,
      unitId: actor.unitId,
      category,
      action,
      target,
      result: "Thành công",
      detail,
    },
  }
}
