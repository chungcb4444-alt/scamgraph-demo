import assert from "node:assert/strict"
import {
  dayKey,
  formatDateTime,
  fromVietnamInput,
  lastSevenDays,
  migrateStoredData,
  seedTimestamp,
  vietnamInput,
} from "../src/demoTime.ts"

assert.equal(formatDateTime("2026-10-22T16:59:00Z"), "22/10/2026 23:59")
assert.equal(formatDateTime("2026-10-22T17:00:00Z"), "23/10/2026 00:00")
assert.equal(dayKey("2026-10-22T17:00:00Z"), "2026-10-23")
assert.equal(fromVietnamInput("2026-10-23T00:00"), "2026-10-22T17:00:00.000Z")
assert.equal(vietnamInput(new Date("2026-10-22T17:00:00Z")), "2026-10-23T00:00")
assert.equal(fromVietnamInput("2026-02-30T12:00"), undefined)
assert.equal(formatDateTime("09:45:00 18/6/2025"), "18/06/2025 09:45")
const input = [
  { receivedAt: "2026-10-22T16:59:59Z" },
  { receivedAt: "2026-10-22T17:00:00Z" },
  { receivedAt: "2026-10-16T16:59:59Z" },
]
const before = lastSevenDays(input, new Date("2026-10-22T16:59:59Z"))
assert.equal(before.length, 7)
assert.equal(before.at(-1).day, "2026-10-22")
assert.equal(before.at(-1).count, 1)
const after = lastSevenDays(input, new Date("2026-10-22T17:00:00Z"))
assert.equal(after.at(-1).day, "2026-10-23")
assert.equal(after.at(-1).count, 1)
assert.equal(
  after.reduce((s, d) => s + d.count, 0),
  2,
)
assert(after.some((d) => d.count === 0))
const old = [
  {
    id: "PA-013",
    time: "09:45:00 18/6/2025",
    amount: 19,
    cluster: "CUM-001",
    content: "Nội dung do người dùng đã sửa",
  },
]
const migrated = migrateStoredData("scamgraph-demo-reports", old)
assert.equal(migrated.length, 1)
assert.equal(migrated[0].amount, 19)
assert.equal(migrated[0].content, old[0].content)
assert.equal(migrated[0].receivedAt, "2025-06-18T02:45:00.000Z")
assert.deepEqual(
  migrateStoredData("scamgraph-demo-reports", migrated),
  migrated,
)
const caseData = [
  {
    id: "HS-009",
    updated: "18/06/2025 10:05",
    reportIds: ["PA-001", "PA-013"],
    note: "Ghi chú riêng",
    history: ["18/06/2025 10:05 · Đã sửa"],
  },
]
const migratedCases = migrateStoredData("scamgraph-demo-cases", caseData)
assert.deepEqual(migratedCases[0].reportIds, caseData[0].reportIds)
assert.equal(migratedCases[0].note, "Ghi chú riêng")
const logs = migrateStoredData("scamgraph-demo-logs", [
  { time: "18/06/2025 10:05", detail: "trước 15, sau 19" },
])
assert.equal(logs[0].detail, "trước 15, sau 19")
assert.equal(formatDateTime(logs[0].time), "18/06/2025 10:05")
assert.equal(
  dayKey(seedTimestamp(0, 9, 24, new Date("2026-10-22T17:05:00Z"))),
  "2026-10-23",
)
assert.equal(
  dayKey(seedTimestamp(0, 9, 24, new Date("2026-10-22T17:00:01Z"))),
  "2026-10-23",
)
console.log(
  JSON.stringify({
    result: "PASS",
    hostTimezone: process.env.TZ || "default",
    checks: [
      "Vietnam-midnight-boundaries",
      "dd-MM-yyyy-HH-mm-format",
      "local-form-to-ISO",
      "seven-calendar-days-including-zero",
      "window-sum",
      "migration-keeps-user-records-amounts-history",
      "migration-idempotence",
      "seed-relative-to-Vietnam-day",
    ],
  }),
)
