import type { ReactNode } from "react"

export default function FilterField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      {children}
    </label>
  )
}
