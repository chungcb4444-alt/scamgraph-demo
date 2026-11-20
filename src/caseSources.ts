import type { CaseFile, StaffAccount } from "./types"
import { canReadCase } from "./access.ts"

export const sortedReportIds = (ids: string[]) => [...new Set(ids)].sort()
export const sameReportIds = (left: string[], right: string[]) =>
  JSON.stringify(sortedReportIds(left)) ===
  JSON.stringify(sortedReportIds(right))

export function relatedSourceCases(
  cases: CaseFile[],
  actor: StaffAccount,
  clusterId: string,
) {
  return cases.filter((c) => c.clusterId === clusterId && canReadCase(actor, c))
}

// An acknowledgement applies to precisely this source and the duplicate cases seen.
// Creating another case or changing source membership invalidates an old acknowledgement.
export function duplicateConsentKey(
  clusterId: string,
  reportIds: string[],
  related: CaseFile[],
) {
  return JSON.stringify({
    clusterId,
    reportIds: sortedReportIds(reportIds),
    duplicates: related
      .filter((c) => sameReportIds(c.reportIds, reportIds))
      .map((c) => c.id)
      .sort(),
  })
}
