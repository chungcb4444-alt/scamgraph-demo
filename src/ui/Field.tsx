import {
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
  type ReactElement,
} from "react"

export default function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string
  required?: boolean
  children: ReactNode
  hint?: string
  error?: string
}) {
  const fieldId = useId()
  return (
    <label className="field" htmlFor={fieldId}>
      <span className="field-label">
        {label}
        {required && <b> *</b>}
      </span>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            id: fieldId,
            "aria-label": label,
          })
        : children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}
