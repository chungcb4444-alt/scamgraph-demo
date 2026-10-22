import assert from "node:assert/strict"
import { nextReportId, reportTypeLabel } from "../src/intakeModel.ts"
const ids = (list) => list.map((id) => ({ id }))
assert.equal(nextReportId(ids(["PA-001", "PA-012"])), "PA-014")
assert.equal(nextReportId(ids(["PA-013"])), "PA-014")
assert.equal(nextReportId(ids(["PA-013", "PA-014", "PA-016"])), "PA-017")
assert.equal(nextReportId(ids(["PA-999"])), "PA-1000")
assert.equal(reportTypeLabel("Đầu tư trực tuyến"), "Lừa đảo đầu tư trực tuyến")
assert.equal(reportTypeLabel("Mạo danh người quen"), "Mạo danh người quen")
console.log(
  JSON.stringify({
    result: "PASS",
    checks: [
      "reserve-PA013",
      "unique-next-ID-gaps-large-IDs",
      "compatible-legacy-type-labels-without-reclassifying-identity",
    ],
  }),
)
