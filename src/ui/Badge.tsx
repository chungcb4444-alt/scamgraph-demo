import type { ReactNode } from "react"

export default function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode
  tone?: "blue" | "red" | "orange" | "green" | "gray" | "purple"
}) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  )
}
