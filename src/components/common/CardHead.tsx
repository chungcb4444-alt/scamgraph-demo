import type { ReactNode } from "react"

export default function CardHead({
  title,
  sub,
  action,
  onAction,
}: {
  title: string
  sub?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="card-head">
      <div>
        <div className="card-title">{title}</div>
        {sub && <div className="card-sub">{sub}</div>}
      </div>
      {action && (
        <button className="text-action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}
