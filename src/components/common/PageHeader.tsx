import type { ReactNode } from "react"

export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="page-title-row">
      <div>
        <h1 className="page-heading">{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  )
}
