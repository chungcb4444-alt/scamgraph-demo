import type { Report } from "../../types/types"
import { migrateReport } from "../authentication/access.ts"

// Read-only fallback for legacy records; never persist a display correction.
export function reportStages(report: Report) {
  const compatible = migrateReport(report)
  return {
    intake: compatible.intakeStatus!,
    analysis: compatible.analysisStatus!,
    cluster: report.cluster,
  }
}
