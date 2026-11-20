import type { ReactNode } from "react"

export default function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="empty" role="status">
      {children}
    </div>
  )
}
