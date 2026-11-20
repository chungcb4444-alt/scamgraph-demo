import type { ReactNode } from "react"

export default function Tabs({
  items,
  active,
  onChange,
}: {
  items: string[]
  active: string
  onChange: (value: string) => void
}) {
  return (
    <div className="tabs" aria-label="Các phần hồ sơ">
      {items.map((value) => (
        <button
          key={value}
          className={active === value ? "active" : ""}
          aria-pressed={active === value}
          onClick={() => onChange(value)}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
