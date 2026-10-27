export type Report = {
  unitId?: string
  intakeStatus?:
    | "Mới tiếp nhận"
    | "Chờ bổ sung"
    | "Chuyển phân tích"
    | "Không hợp lệ"
  intakeNote?: string
  supplementRequest?: string
  supplements?: {
    id: string
    time: string
    author: string
    content: string
    attachment: boolean
  }[]
  analysisAssignee?: string
  analysisStatus?: "Chờ phân tích" | "Đang phân tích" | "Đã kiểm tra"
  analysisNote?: string
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
  senderName?: string
  senderContact?: string
  people?: {
    birthYear?: number
    residence?: string
    email?: string
    capacity?: string
    subjectName?: string
    subjectSocial?: string
    currentSituation?: string
    followUp?: string
  }
  submittedBy?: string
  sourceOther?: string
  behaviorOther?: string
  initialBehavior?: string
  initialBehaviorOther?: string
  occurredTimeUnknown?: boolean
  transferStatus?: "Có" | "Không" | "Chưa rõ"
  socialAccount?: string
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
  unitId?: string
  assignedTo?: string
  directives?: { time: string; author: string; content: string }[]
  workItems?: {
    time: string
    author: string
    content: string
    attachment: boolean
    kind: "Tiến độ" | "Yêu cầu xem xét lại"
  }[]
  reportVersions?: ReportVersion[]
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
  unitId?: string
  category?: "Nghiệp vụ" | "Quản trị"
  time: string
  user: string
  role: string
  action: string
  target: string
  result: string
  detail?: string
}

export type StaffAccount = {
  id: string
  name: string
  role: string
  unitId: string
  active: boolean
  kind: "citizen" | "staff"
}

export type ReportVersion = {
  id: string
  version: number
  state: "Bản nháp" | "Chờ xem xét" | "Yêu cầu chỉnh sửa" | "Đã phê duyệt"
  author: string
  updated: string
  submittedAt?: string
  reviewedAt?: string
  reviewer?: string
  reviewNote?: string
  content: string
  snapshot: {
    caseId: string
    name: string
    status: string
    priority: string
    officer: string
    note: string
    reportIds: string[]
    reports: Report[]
  }
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
