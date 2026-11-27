import type { ReactNode } from "react"

export default function DataTable({ children }: { children: ReactNode }) {
  return <table>{children}</table>
}
