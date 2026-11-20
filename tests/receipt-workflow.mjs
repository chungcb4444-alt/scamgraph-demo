import assert from "node:assert/strict"
import {
  accountSeeds,
  R,
  UNIT,
  migrateReport,
  migrateCase,
  permit,
} from "../src/access.ts"
import { applyOperation } from "../src/operations.ts"
import {
  caseReceiptAllowsWork,
  caseReceiptLabel,
  reportReceiptLabel,
  currentAssignment,
  openSourceRequests,
  requestKey,
  visibleMessageVersions,
} from "../src/receiptWorkflow.ts"
import { reportSnapshotStale } from "../src/reportSnapshot.ts"
const ids = {
  citizen: "cong.dan.demo",
  reception: "tiep.nhan.demo",
  analyst: "phan.tich.demo",
  worker: "xu.ly.demo",
  other: "xu.ly.huy",
  leader: "lanh.dao.demo",
  supervisor: "giam.sat.demo",
  admin: "quan.tri.demo",
}
const time = "2026-10-30T08:00:00.000Z"
const base = (id, amount, cluster = "CUM-001") =>
  migrateReport({
    id,
    amount,
    cluster,
    title: id,
    content: "Lời khai gốc giữ nguyên",
    senderName: "Người gửi mẫu",
    source: "Cổng trực tuyến",
    area: "Hà Nội",
    status: cluster ? "Đã phân tích" : "Mới tiếp nhận",
    behavior: "Giả danh ngân hàng",
    receivedAt: time,
    submittedBy: ids.citizen,
    account: "DEMO-TK-001",
    phone: "DEMO-SDT-001",
    website: "demo.example",
  })
const old = migrateCase({
  id: "HS-CU",
  name: "Hồ sơ cũ",
  priority: "Cao",
  officer: "Lê Minh Anh",
  status: "Đang xác minh",
  updated: time,
  note: "Nhận định cũ",
  history: ["Lịch sử cũ"],
  reportIds: ["PA-001"],
  workItems: [
    {
      time,
      author: ids.worker,
      content: "Yêu cầu cũ cần giữ",
      attachment: false,
      kind: "Yêu cầu xem xét lại",
    },
  ],
})
const rawOld = JSON.stringify(old)
assert(caseReceiptAllowsWork(old))
assert(caseReceiptLabel(old).includes("Dữ liệu cũ"))
assert.equal(JSON.stringify(old), rawOld)
let state = {
  reports: [
    base("PA-001", 10),
    base("PA-002", 20),
    base("PA-003", 15),
    {
      ...base("PA-013", 15, undefined),
      cluster: undefined,
      receiptWorkflow: 2,
      intakeStatus: "Mới tiếp nhận",
      analysisStatus: "Chờ phân tích",
    },
  ],
  cases: [old],
  accounts: [
    ...structuredClone(accountSeeds),
    {
      ...accountSeeds.find((a) => a.role === R.analyst),
      id: "phan.tich.hai",
      name: "Cán bộ phân tích khác",
    },
  ],
}
const audit = []
const run = (who, op) => {
  const next = applyOperation(state, ids[who] || who, op, time)
  audit.push(next.log)
  state = { reports: next.reports, cases: next.cases, accounts: next.accounts }
  return next
}
const denied = (who, op) => {
  const before = JSON.stringify(state)
  assert.throws(() => applyOperation(state, ids[who] || who, op, time))
  assert.equal(JSON.stringify(state), before)
}
const report = () => state.reports.find((r) => r.id === "PA-013")
assert.equal(reportReceiptLabel(report()), "Chờ cán bộ tiếp nhận")
denied("reception", {
  type: "receive",
  id: "PA-013",
  step: "transfer",
  note: "Chưa nhận",
  assignee: ids.analyst,
})
for (const who of [
  "citizen",
  "analyst",
  "worker",
  "leader",
  "supervisor",
  "admin",
])
  denied(who, { type: "report-accept", id: "PA-013" })
run("reception", { type: "report-accept", id: "PA-013" })
const receipt = structuredClone(report().intakeReceipt)
assert.equal(report().intakeStatus, "Đang kiểm tra")
assert.equal(report().receivedAt, time)
assert.equal(report().cluster, undefined)
assert.equal(report().reviewed, undefined)
denied("reception", { type: "report-accept", id: "PA-013" })
run("reception", {
  type: "receive",
  id: "PA-013",
  step: "request",
  note: "Bổ sung biên nhận",
})
run("citizen", {
  type: "supplement",
  id: "PA-013",
  content: "Bổ sung riêng",
  attachment: true,
})
assert.deepEqual(report().intakeReceipt, receipt)
assert.equal(report().intakeStatus, "Đang kiểm tra")
run("reception", {
  type: "receive",
  id: "PA-013",
  step: "transfer",
  note: "Đủ thông tin",
  assignee: ids.analyst,
})
run("analyst", { type: "extract-start", id: "PA-013" })
denied("analyst", { type: "link", id: "PA-013", clusterId: "CUM-001" })
run("analyst", {
  type: "extract-save",
  id: "PA-013",
  patch: { ...report(), amount: 15 },
})
run("analyst", { type: "link", id: "PA-013", clusterId: "CUM-001" })
assert.equal(
  state.reports
    .filter((r) => r.cluster === "CUM-001")
    .reduce((n, r) => n + r.amount, 0),
  60,
)
run("analyst", {
  type: "create-case",
  name: "Hồ sơ mới đủ bốn",
  clusterId: "CUM-001",
})
const id = state.cases[0].id
const item = () => state.cases.find((c) => c.id === id)
assert.equal(item().assignedTo, undefined)
assert.equal(item().receiptWorkflow, 2)
run("leader", {
  type: "assign",
  id,
  assignedTo: ids.worker,
  priority: "Cao",
  directive: "Xử lý theo phân công",
})
for (const who of [
  "citizen",
  "reception",
  "analyst",
  "other",
  "leader",
  "supervisor",
  "admin",
])
  denied(who, { type: "case-accept", id })
denied("worker", {
  type: "work",
  id,
  note: "Chưa nhận",
  status: "Đang xác minh",
  content: "",
  attachment: false,
})
denied("worker", { type: "report-draft", id, content: "Chưa nhận" })
denied("worker", { type: "source-request", id, content: "Chưa nhận" })
run("worker", { type: "case-accept", id })
denied("worker", { type: "case-accept", id })
const firstAssignment = structuredClone(currentAssignment(item()))
run("leader", {
  type: "assign",
  id,
  assignedTo: ids.worker,
  priority: "Thấp",
  directive: "Chỉ đổi ưu tiên",
})
assert.deepEqual(currentAssignment(item()), firstAssignment)
run("leader", {
  type: "assign",
  id,
  assignedTo: ids.other,
  priority: "Cao",
  directive: "Phân công lại",
})
assert.equal(currentAssignment(item()).received, undefined)
assert.deepEqual(item().assignments[0], firstAssignment)
denied("worker", { type: "case-accept", id })
run("other", { type: "case-accept", id })
run("leader", {
  type: "assign",
  id,
  assignedTo: ids.worker,
  priority: "Cao",
  directive: "Giao lại người đầu",
})
assert.equal(currentAssignment(item()).received, undefined)
run("worker", { type: "case-accept", id })
// Old source requests get metadata only after an explicit real action.
const legacyKey = requestKey(old, 0)
run("analyst", { type: "source-receive", id: old.id, requestKey: legacyKey })
denied("phan.tich.hai", {
  type: "source-complete",
  id: old.id,
  requestKey: legacyKey,
  response: "Sai người",
})
denied("analyst", {
  type: "source-complete",
  id: old.id,
  requestKey: legacyKey,
  response: "",
})
run("analyst", {
  type: "source-complete",
  id: old.id,
  requestKey: legacyKey,
  response: "Đã đối chiếu nguồn cũ",
})
assert.equal(
  openSourceRequests(state.cases.find((c) => c.id === old.id)).length,
  0,
)
assert.equal(
  state.cases.find((c) => c.id === old.id).workItems[0].content,
  old.workItems[0].content,
)
denied("analyst", {
  type: "source-complete",
  id: old.id,
  requestKey: legacyKey,
  response: "Lặp lại",
})
run("worker", { type: "source-request", id, content: "Kiểm tra lại nguồn mới" })
const key = requestKey(item(), 0)
for (const who of [
  "worker",
  "leader",
  "supervisor",
  "admin",
  "citizen",
  "reception",
])
  denied(who, { type: "source-receive", id, requestKey: key })
run("analyst", { type: "source-receive", id, requestKey: key })
run("analyst", {
  type: "source-complete",
  id,
  requestKey: key,
  response: "Nguồn đã được kiểm tra, không tự sửa dữ liệu",
})
assert.equal(openSourceRequests(item()).length, 0)
const note = {
  type: "message-save",
  id,
  kind: "Ghi chú",
  recipientId: ids.leader,
  requiresReceipt: true,
  content: "Trao đổi nội bộ không cần duyệt",
}
for (const who of ["supervisor", "admin", "citizen", "reception"])
  denied(who, note)
run("worker", note)
let message = item().messages.at(-1),
  mid = message.id
assert.equal(message.versions[0].state, "Đã gửi")
const statusBefore = item().status
run("leader", { type: "message-receive", id, messageId: mid })
denied("leader", {
  type: "message-review",
  id,
  messageId: mid,
  decision: "Đã duyệt",
  reason: "",
})
assert.equal(item().status, statusBefore)
const formal = {
  ...note,
  kind: "Kiến nghị",
  content: "Kiến nghị chính thức cần lãnh đạo xem xét",
}
run("worker", formal)
message = item().messages.at(-1)
mid = message.id
assert.equal(visibleMessageVersions(message, ids.leader).length, 0)
denied("analyst", { type: "message-submit", id, messageId: mid })
run("worker", { type: "message-submit", id, messageId: mid })
denied("worker", { ...formal, messageId: mid, content: "Sửa đè bản đã trình" })
denied("leader", {
  type: "message-review",
  id,
  messageId: mid,
  decision: "Đã duyệt",
  reason: "",
})
run("leader", { type: "message-receive", id, messageId: mid })
denied("leader", { type: "message-receive", id, messageId: mid })
denied("leader", {
  type: "message-review",
  id,
  messageId: mid,
  decision: "Yêu cầu chỉnh sửa",
  reason: "",
})
run("leader", {
  type: "message-review",
  id,
  messageId: mid,
  decision: "Yêu cầu chỉnh sửa",
  reason: "Bổ sung căn cứ",
})
const v1 = structuredClone(item().messages.at(-1).versions[0])
run("worker", { ...formal, messageId: mid, content: "Kiến nghị đã bổ sung" })
assert.deepEqual(item().messages.at(-1).versions[0], v1)
run("worker", { type: "message-submit", id, messageId: mid })
run("leader", { type: "message-receive", id, messageId: mid })
run("leader", {
  type: "message-review",
  id,
  messageId: mid,
  decision: "Đã duyệt",
  reason: "Chấp thuận kiến nghị nội bộ",
})
const v2 = structuredClone(item().messages.at(-1).versions[1])
run("worker", { ...formal, messageId: mid, content: "Phiên bản tiếp theo" })
assert.deepEqual(item().messages.at(-1).versions[1], v2)
assert.equal(item().messages.at(-1).versions[2].version, 3)
run("worker", { type: "message-submit", id, messageId: mid })
run("leader", { type: "message-receive", id, messageId: mid })
run("leader", {
  type: "message-review",
  id,
  messageId: mid,
  decision: "Không chấp thuận",
  reason: "Cần hướng đề xuất khác",
})
// Stale report detection is based on values, not timestamps or discussion events.
run("worker", { type: "report-draft", id, content: "Báo cáo lưu có chủ đích" })
assert.equal(
  reportSnapshotStale(item(), state.reports, item().reportVersions.at(-1)),
  false,
)
const sourceState = state
state = {
  ...state,
  reports: state.reports.map((r) =>
    r.id === "PA-001" ? { ...r, amount: r.amount + 1 } : r,
  ),
}
denied("worker", { type: "report-submit", id })
state = sourceState
run("worker", {
  ...note,
  content: "Ghi chú mới không làm cũ dữ liệu báo cáo",
  requiresReceipt: false,
})
assert.equal(
  reportSnapshotStale(item(), state.reports, item().reportVersions.at(-1)),
  false,
)
run("worker", {
  type: "work",
  id,
  note: "Nhận định thay đổi sau nháp",
  status: "Chờ bổ sung",
  content: "",
  attachment: false,
})
assert(reportSnapshotStale(item(), state.reports, item().reportVersions.at(-1)))
denied("worker", { type: "report-submit", id })
run("worker", { type: "report-draft", id, content: "Báo cáo đã đối chiếu" })
run("worker", { type: "report-submit", id })
run("leader", {
  type: "report-review",
  id,
  approve: false,
  note: "Bổ sung báo cáo",
})
const submitted = structuredClone(item().reportVersions[0])
run("worker", { type: "report-draft", id, content: "Báo cáo chỉnh sửa" })
assert.deepEqual(
  item().reportVersions[0].previousSubmissions[0].snapshot,
  submitted.snapshot,
)
assert.equal(
  item().reportVersions[0].previousSubmissions[0].content,
  submitted.content,
)
run("worker", { type: "report-submit", id })
run("leader", {
  type: "report-review",
  id,
  approve: true,
  note: "Đã kiểm tra bản cụ thể",
})
const approved = structuredClone(item().reportVersions[0])
run("worker", {
  type: "report-draft",
  id,
  content: "Phiên bản báo cáo tiếp",
  newVersion: true,
})
assert.deepEqual(item().reportVersions[0], approved)
const foreign = { ...item(), id: "HS-NGOAI", unitId: "Khác" }
state = { ...state, cases: [...state.cases, foreign] }
for (const who of ["analyst", "worker", "leader", "supervisor", "admin"])
  denied(who, { ...note, id: foreign.id })
assert.equal(
  state.cases.find((c) => c.id === old.id).receiptWorkflow,
  undefined,
)
assert.equal(
  state.reports.find((r) => r.id === "PA-001").receiptWorkflow,
  undefined,
)
assert.equal(
  state.reports.find((r) => r.id === "PA-001").intakeReceipt,
  undefined,
)
assert.equal(report().content, "Lời khai gốc giữ nguyên")
assert(
  audit.every(
    (log) => log.user && log.role && log.unitId && log.target && log.time,
  ),
)
console.log(
  JSON.stringify(
    {
      result: "PASS",
      checks: [
        "new report receipt gate, ownership, double acknowledgement, distinct receivedAt and supplement retention",
        "legacy records remain operational without fabricated receipts",
        "new assignments require correct recipient; reassign history and same-person edits preserved",
        "legacy and new source requests receive/respond/complete with correct owner",
        "ordinary notes never enter approval; recipient-only acknowledgements",
        "formal opinions draft/submit/receive/revise/approve/reject and immutable prior versions",
        "private drafts and wrong roles/units denied without mutation",
        "report staleness detects business values, not discussion or timestamps",
        "returned report submission snapshots archived and approved versions preserved",
        "original sources, testimony, case IDs and audit identities retained",
      ],
    },
    null,
    2,
  ),
)
