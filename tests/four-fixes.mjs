import assert from "node:assert/strict"
import { accountSeeds, R, UNIT, migrateReport } from "../src/access.ts"
import { reportStages } from "../src/reportStages.ts"
import {
  relatedSourceCases,
  sameReportIds,
  duplicateConsentKey,
} from "../src/caseSources.ts"
import { applyOperation } from "../src/operations.ts"
const analyst = accountSeeds.find((a) => a.role === R.analyst),
  worker = accountSeeds.find((a) => a.role === R.worker)
const source = (id, amount) =>
  migrateReport({
    id,
    title: id,
    content: "Lời khai gốc",
    source: "Cổng trực tuyến",
    area: "Hà Nội",
    status: "Đã phân tích",
    behavior: "Giả danh ngân hàng",
    amount,
    cluster: "CUM-001",
  })
const legacy = { ...source("PA-001", 10) }
delete legacy.intakeStatus
delete legacy.analysisStatus
delete legacy.reviewed
const before = JSON.stringify(legacy)
assert.deepEqual(reportStages(legacy), {
  intake: "Chuyển phân tích",
  analysis: "Đang phân tích",
  cluster: "CUM-001",
})
assert.equal(JSON.stringify(legacy), before)
assert.equal(legacy.reviewed, undefined)
assert.equal(
  reportStages({ ...legacy, analysisStatus: "Chờ phân tích" }).analysis,
  "Chờ phân tích",
)
assert.equal(
  reportStages({ ...legacy, analysisStatus: "Đã kiểm tra" }).analysis,
  "Đã kiểm tra",
)
assert(sameReportIds(["PA-001", "PA-002"], ["PA-002", "PA-001", "PA-001"]))
let state = {
  reports: [source("PA-001", 10), source("PA-002", 20), source("PA-003", 15)],
  cases: [],
  accounts: structuredClone(accountSeeds),
}
const create = {
  type: "create-case",
  clusterId: "CUM-001",
  name: "Hồ sơ ban đầu",
}
const run = (state, op, actor = analyst.id) =>
  applyOperation(state, actor, op, "2026-10-28T03:00:00Z")
const denied = (state, op, actor) => {
  const raw = JSON.stringify(state)
  assert.throws(() => run(state, op, actor))
  assert.equal(JSON.stringify(state), raw)
}
state = run(state, create)
assert.equal(state.cases.length, 1)
assert.equal(state.cases[0].assignedTo, undefined)
state.cases[0].reportVersions = [
  { id: "BẢN-DUYỆT", content: "Bản cũ bất biến", state: "Đã phê duyệt" },
]
const originalCase = structuredClone(state.cases[0]),
  ids = state.reports.map((r) => r.id)
let related = relatedSourceCases(state.cases, analyst, "CUM-001")
const consent = duplicateConsentKey("CUM-001", ids, related)
denied(state, create)
denied(state, { ...create, duplicateConsent: consent }, worker.id)
const reordered = {
  ...state,
  cases: [{ ...state.cases[0], reportIds: [...ids].reverse() }],
}
assert.equal(
  duplicateConsentKey(
    "CUM-001",
    ids,
    relatedSourceCases(reordered.cases, analyst, "CUM-001"),
  ),
  consent,
)
const duplicate = run(state, {
  ...create,
  name: "Hồ sơ khác có chủ đích",
  duplicateConsent: consent,
})
assert.equal(duplicate.cases.length, 2)
assert.deepEqual(duplicate.cases[1], originalCase)
denied(duplicate, { ...create, duplicateConsent: consent }) // Cannot reuse acknowledgement after another creation.
denied(state, { ...create, clusterId: "CUM-002", duplicateConsent: consent })
const expanded = { ...state, reports: [...state.reports, source("PA-013", 15)] }
denied(expanded, { ...create, duplicateConsent: consent })
const four = run(expanded, create)
assert.equal(four.cases[0].reportIds.length, 4)
assert.deepEqual(four.cases[1], originalCase)
assert.equal(
  four.reports.reduce((n, r) => n + r.amount, 0),
  60,
)
assert.equal(four.cases[0].assignedTo, undefined)
denied(four, create)
const foreign = { ...originalCase, id: "HS-NGOAI", unitId: "Đơn vị khác" }
assert.deepEqual(relatedSourceCases([foreign], analyst, "CUM-001"), [])
console.log(
  JSON.stringify({
    result: "PASS",
    checks: [
      "legacy display is read-only and respects separate stages",
      "order-independent source membership",
      "first creation remains unassigned",
      "explicit duplicate acknowledgement",
      "current-role enforcement",
      "stale consent denied after creation or source/cluster change",
      "three-to-four sources creates separate case without changing approved snapshot",
      "foreign-unit cases excluded",
    ],
  }),
)
