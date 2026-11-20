import { useId, useState, type ReactNode } from "react"
import { useReportPrivacy } from "./ReportPrivacy"

export type ReportSection = "information" | "processing" | "history"
const sections: [ReportSection, string][] = [
  ["information", "Thông tin phản ánh"],
  ["processing", "Xử lý nghiệp vụ"],
  ["history", "Lịch sử"],
]

// Keep panels mounted: changing the presentation must never reset a form draft.
export default function ReportTabs({
  initialTab = "information",
  pending,
  information,
  processing,
  history,
}: {
  initialTab?: ReportSection
  pending?: string
  information: ReactNode
  processing: ReactNode
  history: ReactNode
}) {
  const [active, setActive] = useState<ReportSection>(initialTab)
  const id = useId()
  const { hide } = useReportPrivacy()
  const change = (section: ReportSection) => {
    hide()
    setActive(section)
  }
  return (
    <div className="report-sections">
      {pending && (
        <div className="report-pending">
          <span>{pending}</span>
          <button type="button" onClick={() => change("processing")}>
            Mở xử lý nghiệp vụ →
          </button>
        </div>
      )}
      <div
        className="report-section-tabs"
        role="tablist"
        aria-label="Các phần phản ánh"
      >
        {sections.map(([key, label], index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${id}-${key}-tab`}
            aria-selected={active === key}
            aria-controls={`${id}-${key}-panel`}
            tabIndex={active === key ? 0 : -1}
            onClick={() => change(key)}
            onKeyDown={(event) => {
              let next = index
              if (event.key === "ArrowRight")
                next = (index + 1) % sections.length
              else if (event.key === "ArrowLeft")
                next = (index + sections.length - 1) % sections.length
              else if (event.key === "Home") next = 0
              else if (event.key === "End") next = sections.length - 1
              else return
              event.preventDefault()
              change(sections[next][0])
              document.getElementById(`${id}-${sections[next][0]}-tab`)?.focus()
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {sections.map(([key]) => (
        <section
          key={key}
          role="tabpanel"
          id={`${id}-${key}-panel`}
          aria-labelledby={`${id}-${key}-tab`}
          hidden={active !== key}
          tabIndex={0}
          className="report-section-panel"
        >
          {key === "information"
            ? information
            : key === "processing"
              ? processing
              : history}
        </section>
      ))}
    </div>
  )
}
