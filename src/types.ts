export type Report = {
  id: string
  title: string
  source: string
  area: string
  time?: string // retained only as evidence for older localStorage records
  occurredAt?: string
  receivedAt?: string
  updatedAt?: string
  timeMigration?: string
  amount: number
  status: string
  behavior: string
  content: string
  account?: string
  bank?: string
  phone?: string
  website?: string
  cluster?: string
  extracted?: boolean
  reviewed?: boolean
  rejectedClusters?: string[]
  attachment?: boolean
}

export type CaseFile = {
  id: string
  name: string
  priority: string
  officer: string
  status: string
  updated: string
  note: string
  reportIds: string[]
  clusterId?: string
  history: string[]
}

export type LogItem = {
  time: string
  user: string
  role: string
  action: string
  target: string
  result: string
  detail?: string
}

export type Cluster = {
  id: string
  name: string
  risk: string
  score: number
}

export type AlertItem = {
  id: string
  subjectId: string
  clusterId?: string
  reportId?: string
  title: string
  level: "Cao" | "Trung bình" | "Thấp"
  score: number
  description: string
}
