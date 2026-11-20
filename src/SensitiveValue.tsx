import { useReportPrivacy } from "./ReportPrivacy"

export default function SensitiveValue({
  value,
  label,
  name,
  inline = false,
}: {
  value?: string
  label: string
  name: string
  inline?: boolean
}) {
  const { visible, toggle } = useReportPrivacy()
  if (!value) return <span className="people-missing">Chưa cung cấp</span>
  const revealed = visible.has(name)
  return (
    <button
      type="button"
      className={`sensitive-value ${inline ? "sensitive-inline" : ""}`}
      data-revealed={revealed}
      aria-label={`${revealed ? "Ẩn" : "Hiện"} ${label}`}
      aria-pressed={revealed}
      onClick={() => toggle(name, label)}
    >
      <span className="sensitive-text">{revealed ? value : "•••• ••••"}</span>
      <span className="sensitive-action" aria-hidden="true">
        {revealed ? "Ẩn" : "Xem"}
      </span>
    </button>
  )
}
