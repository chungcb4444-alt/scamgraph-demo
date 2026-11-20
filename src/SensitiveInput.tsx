import { Field } from "./ui"
import { useReportPrivacy } from "./ReportPrivacy"

export default function SensitiveInput({
  label,
  name,
  value,
  canEdit,
  onChange,
}: {
  label: string
  name: string
  value: string
  canEdit: boolean
  onChange: (value: string) => void
}) {
  const { visible, toggle } = useReportPrivacy()
  const revealed = visible.has(name)
  return (
    <div className="sensitive-field" data-revealed={revealed}>
      <Field label={label}>
        <input
          type="text"
          value={revealed || !value ? value : "•••• ••••"}
          readOnly={!canEdit || !revealed}
          onChange={(e) => {
            if (revealed && canEdit) onChange(e.target.value)
          }}
        />
      </Field>
      <button
        type="button"
        className="sensitive-input-toggle"
        aria-label={`${revealed ? "Ẩn" : "Hiện"} ${label} trích xuất`}
        aria-pressed={revealed}
        onClick={() => toggle(name, `${label} trích xuất`)}
      >
        {revealed ? "Ẩn" : "Xem"}
      </button>
    </div>
  )
}
