import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

type Screen =
  | "dashboard"
  | "reports"
  | "new-report"
  | "report-detail"
  | "graph"
  | "alerts"
  | "cases"
  | "case-detail"
  | "accounts"
  | "logs"

import type { Report, CaseFile, LogItem, Cluster, AlertItem } from "./types"
import {
  dayKey,
  formatDateTime,
  fromVietnamInput,
  lastSevenDays,
  migrateStoredData,
  nowISO,
  seedTimestamp,
  vietnamInput,
} from "./demoTime"
import LinkGraph from "./LinkGraph"
import { WorkflowBadge, workflowLabel } from "./workflow"

const demoText =
  "Tôi nhận được cuộc gọi của người tự xưng là nhân viên ngân hàng, yêu cầu truy cập xacminh-demo.example để xác minh tài khoản. Sau đó tôi chuyển 15.000.000 đồng vào tài khoản DEMO-TK-001 tại Ngân hàng mẫu A. Người liên hệ sử dụng số DEMO-SDT-001. Sau khi chuyển tiền, tôi không liên lạc được."

const reportTemplates: Report[] = [
  {
    id: "PA-001",
    title: "Cuộc gọi yêu cầu xác minh tài khoản",
    source: "Cổng trực tuyến",
    area: "Hà Nội",
    amount: 10,
    status: "Đã phân tích",
    behavior: "Giả danh ngân hàng",
    content:
      "Người gọi tự xưng nhân viên ngân hàng, hướng dẫn chuyển tiền để xác minh.",
    account: "DEMO-TK-001",
    bank: "Ngân hàng mẫu A",
    phone: "DEMO-SDT-001",
    website: "xacminh-demo.example",
    cluster: "CUM-001",
    attachment: true,
  },
  {
    id: "PA-002",
    title: "Yêu cầu chuyển tiền để khóa giao dịch",
    source: "Đường dây nóng",
    area: "Đà Nẵng",
    amount: 20,
    status: "Đã phân tích",
    behavior: "Giả danh ngân hàng",
    content:
      "Đối tượng yêu cầu chuyển tiền tới tài khoản mẫu để ngăn giao dịch lạ.",
    account: "DEMO-TK-001",
    bank: "Ngân hàng mẫu A",
    phone: "DEMO-SDT-001",
    cluster: "CUM-001",
  },
  {
    id: "PA-003",
    title: "Trang xác minh tài khoản đáng ngờ",
    source: "Ứng dụng di động",
    area: "TP. Hồ Chí Minh",
    amount: 15,
    status: "Có liên quan",
    behavior: "Giả danh ngân hàng",
    content:
      "Truy cập website theo hướng dẫn và chuyển tiền vào tài khoản được cung cấp.",
    account: "DEMO-TK-001",
    bank: "Ngân hàng mẫu A",
    website: "xacminh-demo.example",
    cluster: "CUM-001",
  },
  {
    id: "PA-004",
    title: "Giả danh cán bộ yêu cầu nộp phạt",
    source: "Cổng trực tuyến",
    area: "Hải Phòng",
    amount: 8,
    status: "Cần xác minh",
    behavior: "Giả danh cơ quan nhà nước",
    content: "Cuộc gọi tự xưng cán bộ điều tra, yêu cầu nộp khoản tiền mẫu.",
    account: "DEMO-TK-002",
    phone: "DEMO-SDT-002",
    cluster: "CUM-002",
  },
  {
    id: "PA-005",
    title: "Thông báo vi phạm hành chính giả",
    source: "Đường dây nóng",
    area: "Cần Thơ",
    amount: 12,
    status: "Có liên quan",
    behavior: "Giả danh cơ quan nhà nước",
    content: "Nhận thông báo giả và đường dẫn nộp phạt.",
    website: "nopphat-demo.example",
    phone: "DEMO-SDT-002",
    cluster: "CUM-002",
  },
  {
    id: "PA-006",
    title: "Cuộc gọi tự xưng cơ quan điều tra",
    source: "Tiếp nhận trực tiếp",
    area: "Bắc Ninh",
    amount: 5,
    status: "Đã phân tích",
    behavior: "Giả danh cơ quan nhà nước",
    content: "Người gọi yêu cầu cung cấp thông tin và chuyển khoản.",
    account: "DEMO-TK-002",
    cluster: "CUM-002",
  },
  {
    id: "PA-007",
    title: "Đơn hàng trực tuyến không được giao",
    source: "Ứng dụng di động",
    area: "Hà Nội",
    amount: 3,
    status: "Mới tiếp nhận",
    behavior: "Mua bán trực tuyến",
    content: "Đã thanh toán cho một gian hàng mẫu nhưng không nhận được hàng.",
  },
  {
    id: "PA-008",
    title: "Mời đầu tư lợi nhuận cao",
    source: "Cổng trực tuyến",
    area: "Lâm Đồng",
    amount: 30,
    status: "Cần xác minh",
    behavior: "Đầu tư trực tuyến",
    content: "Nhóm chat mời tham gia nền tảng đầu tư giả lập.",
  },
  {
    id: "PA-009",
    title: "Tin nhắn nhận quà trúng thưởng",
    source: "Đường dây nóng",
    area: "Nghệ An",
    amount: 2,
    status: "Mới tiếp nhận",
    behavior: "Trúng thưởng giả",
    content: "Tin nhắn yêu cầu đóng phí để nhận phần thưởng.",
  },
  {
    id: "PA-010",
    title: "Tuyển cộng tác viên xử lý đơn",
    source: "Ứng dụng di động",
    area: "Thanh Hóa",
    amount: 7,
    status: "Cần xác minh",
    behavior: "Việc làm trực tuyến",
    content: "Yêu cầu ứng tiền làm nhiệm vụ xử lý đơn hàng.",
  },
  {
    id: "PA-011",
    title: "Tài khoản mạng xã hội mạo danh",
    source: "Tiếp nhận trực tiếp",
    area: "Quảng Ninh",
    amount: 4,
    status: "Đã phân tích",
    behavior: "Mạo danh người quen",
    content: "Tài khoản mạng xã hội giả lập nhắn mượn tiền.",
  },
  {
    id: "PA-012",
    title: "Đường dẫn cập nhật dịch vụ giả",
    source: "Cổng trực tuyến",
    area: "Huế",
    amount: 0,
    status: "Mới tiếp nhận",
    behavior: "Đường dẫn giả mạo",
    content: "Tin nhắn chứa đường dẫn yêu cầu cập nhật dịch vụ.",
  },
]

const caseTemplates: CaseFile[] = [
  {
    id: "HS-001",
    name: "Xác minh nhóm giả danh cơ quan nhà nước",
    priority: "Cao",
    officer: "Lê Minh Anh",
    status: "Đang xác minh",
    updated: "",
    note: "Đối chiếu các đầu mối chung trong CUM-002.",
    reportIds: ["PA-004", "PA-005", "PA-006"],
    clusterId: "CUM-002",
    history: ["Chuyển trạng thái sang Đang xác minh", "Tạo hồ sơ từ CUM-002"],
  },
  {
    id: "HS-002",
    name: "Rà soát phản ánh đầu tư trực tuyến",
    priority: "Trung bình",
    officer: "Trần Quốc Huy",
    status: "Chờ bổ sung",
    updated: "",
    note: "Chờ bổ sung tài liệu giao dịch giả lập.",
    reportIds: ["PA-008"],
    history: [
      "Chuyển trạng thái sang Chờ bổ sung",
      "Tạo hồ sơ từ phản ánh PA-008",
    ],
  },
]

const clusters: Cluster[] = [
  {
    id: "CUM-001",
    name: "Dấu hiệu giả danh ngân hàng",
    risk: "Cao",
    score: 72,
  },
  {
    id: "CUM-002",
    name: "Giả danh cơ quan nhà nước",
    risk: "Trung bình",
    score: 61,
  },
]

function getAlerts(reports: Report[]): AlertItem[] {
  const hasNew = reports.some(
    (r) => r.id === "PA-013" && r.cluster === "CUM-001",
  )
  return [
    {
      id: "CB-001",
      subjectId: "CUM-001",
      clusterId: "CUM-001",
      title: "Cụm có nhiều liên kết chung",
      level: "Cao",
      score: hasNew ? 85 : 72,
      description: hasNew
        ? "Có thêm phản ánh liên quan trong thời gian ngắn."
        : "Nhiều phản ánh cùng nhắc tới một tài khoản.",
    },
    {
      id: "CB-002",
      subjectId: "CUM-002",
      clusterId: "CUM-002",
      title: "Thực thể xuất hiện lặp lại",
      level: "Trung bình",
      score: 61,
      description: "Số điện thoại xuất hiện trong nhiều phản ánh.",
    },
    {
      id: "CB-003",
      subjectId: "PA-008",
      reportId: "PA-008",
      title: "Số tiền phản ánh đáng chú ý",
      level: "Thấp",
      score: 34,
      description: "Phản ánh độc lập cần tiếp tục theo dõi.",
    },
  ]
}

function getEntities(items: Report[]) {
  return {
    accounts: Array.from(
      new Set(items.flatMap((r) => (r.account ? [r.account] : []))),
    ),
    phones: Array.from(
      new Set(items.flatMap((r) => (r.phone ? [r.phone] : []))),
    ),
    websites: Array.from(
      new Set(items.flatMap((r) => (r.website ? [r.website] : []))),
    ),
  }
}

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      const parsed = stored ? JSON.parse(stored) : initial
      if (parsed === null || typeof parsed !== typeof initial) return initial
      if (Array.isArray(initial)) {
        if (!Array.isArray(parsed)) return initial
        if (
          key.endsWith("reports") &&
          !parsed.every(
            (r) =>
              r &&
              typeof r.id === "string" &&
              typeof r.title === "string" &&
              typeof r.amount === "number" &&
              Number.isFinite(r.amount),
          )
        )
          return initial
        if (
          key.endsWith("cases") &&
          !parsed.every(
            (c) =>
              c &&
              typeof c.id === "string" &&
              Array.isArray(c.reportIds) &&
              Array.isArray(c.history),
          )
        )
          return initial
        if (
          key.endsWith("logs") &&
          !parsed.every(
            (l) =>
              l && typeof l.action === "string" && typeof l.target === "string",
          )
        )
          return initial
      }
      if (key.endsWith("wizard-step") && ![1, 2, 3, 4].includes(parsed))
        return initial
      const migrated = migrateStoredData(key, parsed)
      if (stored && JSON.stringify(migrated) !== JSON.stringify(parsed)) {
        try {
          if (!localStorage.getItem(`${key}:migration-backup-v1`))
            localStorage.setItem(`${key}:migration-backup-v1`, stored)
        } catch {
          /* Keep loaded data even if backup storage is unavailable. */
        }
      }
      return migrated as T
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.warn("Không thể lưu trạng thái demo trên trình duyệt này.")
    }
  }, [key, value])
  return [value, setValue] as const
}

const logTemplates: LogItem[] = [
  {
    time: "",
    user: "phan.tich.demo",
    role: "Cán bộ phân tích",
    action: "Trích xuất mô phỏng",
    target: "PA-001",
    result: "Thành công",
    detail: "Nhận diện 5 thực thể từ nội dung và tài liệu giả lập.",
  },
  {
    time: "",
    user: "le.minh.anh",
    role: "Cán bộ xử lý hồ sơ",
    action: "Đổi trạng thái",
    target: "HS-001",
    result: "Thành công",
    detail: "Trước: Mới tạo → Sau: Đang xác minh",
  },
  {
    time: "",
    user: "tiep.nhan.demo",
    role: "Cán bộ tiếp nhận",
    action: "Tạo phản ánh",
    target: "PA-002",
    result: "Thành công",
  },
]

function makeSampleData(now = new Date()) {
  const reports = reportTemplates.map((report, index) => {
    const receivedAt = seedTimestamp(index, 9, 24, now)
    return {
      ...report,
      time: undefined,
      receivedAt,
      occurredAt: new Date(
        new Date(receivedAt).getTime() - 30 * 60000,
      ).toISOString(),
      updatedAt: receivedAt,
    }
  })
  const cases = caseTemplates.map((item, index) => ({
    ...item,
    updated: seedTimestamp(index, 8, 40, now),
    history: item.history.map(
      (entry, i) => `${seedTimestamp(index + i, 8, 40, now)} · ${entry}`,
    ),
  }))
  const logs = logTemplates.map((item, index) => ({
    ...item,
    time: item.target === "HS-001" ? cases[0].updated : item.action === "Tạo phản ánh" ? reports.find(report => report.id === item.target)?.receivedAt || seedTimestamp(1, 9, 24, now) : seedTimestamp(0, 10, 5, now),
  }))
  return { reports, cases, logs }
}

const roles = [
  "Quản trị hệ thống",
  "Cán bộ tiếp nhận",
  "Cán bộ phân tích",
  "Cán bộ xử lý hồ sơ",
  "Lãnh đạo theo dõi",
  "Kiểm tra, giám sát",
]
const navItems: {
  screen: Screen
  label: string
  icon: string
}[] = [
  { screen: "dashboard", label: "Tổng quan", icon: "TQ" },
  { screen: "reports", label: "Phản ánh", icon: "PA" },
  { screen: "graph", label: "Phân tích liên kết", icon: "LK" },
  { screen: "alerts", label: "Cảnh báo", icon: "CB" },
  { screen: "cases", label: "Hồ sơ vụ việc", icon: "HS" },
  { screen: "accounts", label: "Tài khoản và phân quyền", icon: "PQ" },
  { screen: "logs", label: "Nhật ký hệ thống", icon: "NK" },
]

const actorForRole = (role: string) =>
  ({
    "Người dân / Tổ chức": "cong.dan.demo",
    "Quản trị hệ thống": "quan.tri.demo",
    "Cán bộ tiếp nhận": "tiep.nhan.demo",
    "Cán bộ phân tích": "phan.tich.demo",
    "Cán bộ xử lý hồ sơ": "xu.ly.demo",
    "Lãnh đạo theo dõi": "lanh.dao.demo",
    "Kiểm tra, giám sát": "giam.sat.demo",
  })[role] || "demo"

function NetworkMark() {
  return (
    <div className="brand-mark" aria-label="Biểu tượng mạng liên kết">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <line x1="8" y1="9" x2="23" y2="7" />
        <line x1="8" y1="9" x2="14" y2="23" />
        <line x1="23" y1="7" x2="25" y2="22" />
        <line x1="14" y1="23" x2="25" y2="22" />
        <circle cx="8" cy="9" r="3" />
        <circle cx="23" cy="7" r="3" />
        <circle cx="14" cy="23" r="3" />
        <circle cx="25" cy="22" r="3" />
      </svg>
    </div>
  )
}

function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
  className?: string
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode
  tone?: "blue" | "red" | "orange" | "green" | "gray" | "purple"
}) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  )
}

function Modal({
  title,
  children,
  onClose,
  footer,
  wide = false,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  footer?: React.ReactNode
  wide?: boolean
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== "Tab" || !dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      )
      const first = focusable[0],
        last = focusable[focusable.length - 1]
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault()
        last?.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener("keydown", keydown)
    return () => {
      document.removeEventListener("keydown", keydown)
      previous?.focus()
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "modal-wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <div className="eyebrow">
              Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao
            </div>
            <div className="modal-title">{title}</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
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
        ? cloneElement(
            children as React.ReactElement<Record<string, unknown>>,
            { id: fieldId, "aria-label": label },
          )
        : children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

function statusTone(
  value: string,
): "blue" | "red" | "orange" | "green" | "gray" | "purple" {
  if (["Cao", "Cần xác minh"].includes(value)) return "red"
  if (["Trung bình", "Có liên quan", "Chờ bổ sung"].includes(value))
    return "orange"
  if (["Đã phân tích", "Hoàn tất phân tích", "Thành công"].includes(value))
    return "green"
  if (["Đang xác minh", "Mới tạo"].includes(value)) return "blue"
  return "gray"
}

const reportWorkflowStatus = workflowLabel

function OperationsTabs({
  active,
  onReports,
  onCases,
  onDetail,
}: {
  active: "reports" | "cases" | "detail"
  onReports: () => void
  onCases: () => void
  onDetail: () => void
}) {
  return (
    <div className="operations-tabs">
      <button
        className={active === "reports" ? "active" : ""}
        onClick={onReports}
      >
        Tiếp nhận và xác minh
      </button>
      <button className={active === "cases" ? "active" : ""} onClick={onCases}>
        Danh sách hồ sơ
      </button>
      <button
        className={active === "detail" ? "active" : ""}
        onClick={onDetail}
      >
        Chi tiết hồ sơ đang mở
      </button>
    </div>
  )
}

export default function App() {
  const [sampleData] = useState(() => makeSampleData())
  const [loggedIn, setLoggedIn] = useStoredState(
    "scamgraph-demo-session",
    false,
  )
  const [screen, setScreen] = useStoredState<Screen>(
    "scamgraph-demo-screen",
    "dashboard",
  )
  const [reports, setReports] = useStoredState<Report[]>(
    "scamgraph-demo-reports",
    sampleData.reports,
  )
  const [cases, setCases] = useStoredState<CaseFile[]>(
    "scamgraph-demo-cases",
    sampleData.cases,
  )
  const [logs, setLogs] = useStoredState<LogItem[]>(
    "scamgraph-demo-logs",
    sampleData.logs,
  )
  const [selectedReport, setSelectedReport] = useStoredState(
    "scamgraph-demo-selected-report",
    "PA-001",
  )
  const [selectedCase, setSelectedCase] = useStoredState(
    "scamgraph-demo-selected-case",
    "HS-001",
  )
  const [selectedCluster, setSelectedCluster] = useStoredState(
    "scamgraph-demo-selected-cluster",
    "CUM-001",
  )
  const [selectedAlert, setSelectedAlert] = useState("CB-001")
  const [role, setRole] = useStoredState(
    "scamgraph-demo-role",
    "Cán bộ phân tích",
  )
  const [accountRoles, setAccountRoles] = useStoredState<
    Record<string, string>
  >("scamgraph-demo-account-roles", {})
  const [editingAccount, setEditingAccount] = useState("tiep.nhan.demo")
  const [editingRole, setEditingRole] = useState("Cán bộ tiếp nhận")
  const citizen = role === "Người dân / Tổ chức"
  const admin = role === "Quản trị hệ thống"
  const canEdit = [
    "Cán bộ phân tích",
    "Cán bộ xử lý hồ sơ",
    "Cán bộ tiếp nhận",
  ].includes(role)
  const [toast, setToast] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [caseModal, setCaseModal] = useState(false)
  const [alertModal, setAlertModal] = useState(false)
  const [logModal, setLogModal] = useState<LogItem | null>(null)
  const [accountModal, setAccountModal] = useState(false)
  const [wizardVersion, setWizardVersion] = useState(0)
  const [previousAccountRole, setPreviousAccountRole] = useState("")

  const hasNew = reports.some((r) => r.id === "PA-013")
  const alerts = getAlerts(reports)
  const activeCluster =
    clusters.find((cluster) => cluster.id === selectedCluster) || clusters[0]
  const clusterReports = reports.filter((r) => r.cluster === activeCluster.id)
  const clusterTotal = clusterReports.reduce((sum, r) => sum + r.amount, 0)
  const activeAlert =
    alerts.find((alert) => alert.id === selectedAlert) || alerts[0]
  const notify = (message: string, type: "success" | "error" = "success") => {
    setToastType(type)
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }
  const addLog = (
    action: string,
    target: string,
    detail?: string,
    result = "Thành công",
  ) =>
    setLogs((v) => [
      {
        time: nowISO(),
        user: actorForRole(role),
        role,
        action,
        target,
        result,
        detail,
      },
      ...v,
    ])
  const go = (next: Screen) => {
    if (citizen && !["new-report"].includes(next))
      return notify("Người dân chỉ sử dụng cổng gửi phản ánh mô phỏng", "error")
    setScreen(next)
  }
  const openReport = (id: string) => {
    setSelectedReport(id)
    setScreen("report-detail")
  }
  const openCase = (id: string) => {
    setSelectedCase(id)
    setScreen("case-detail")
  }
  const openGraph = (clusterId: string) => {
    setSelectedCluster(clusterId)
    setScreen("graph")
  }
  const openAlert = (alertId: string) => {
    const alert = alerts.find((item) => item.id === alertId)
    setSelectedAlert(alertId)
    if (alert?.clusterId) setSelectedCluster(alert.clusterId)
    setAlertModal(true)
  }
  const reset = () => {
    if (
      !window.confirm("Khôi phục toàn bộ dữ liệu demo về trạng thái ban đầu?")
    )
      return
    try {
      localStorage.removeItem("scamgraph-demo-wizard-form")
      localStorage.removeItem("scamgraph-demo-wizard-step")
    } catch {
      /* In-memory reset remains available. */
    }
    setWizardVersion((v) => v + 1)
    const fresh = makeSampleData()
    setReports(fresh.reports)
    setCases(fresh.cases)
    setAccountRoles({})
    setLogs([
      {
        time: nowISO(),
        user: "demo",
        role,
        action: "Đặt lại demo",
        target: "Toàn bộ dữ liệu",
        result: "Thành công",
      },
      ...fresh.logs,
    ])
    setCaseModal(false)
    setAlertModal(false)
    setAccountModal(false)
    setLogModal(null)
    setScreen(citizen ? "new-report" : "dashboard")
    setSelectedReport("PA-001")
    setSelectedCase("HS-001")
    setSelectedCluster("CUM-001")
    setSelectedAlert("CB-001")
    notify("Đã đặt lại toàn bộ dữ liệu demo")
  }

  if (!loggedIn)
    return (
      <Login
        onLogin={(nextRole, nextScreen) => {
          setRole(nextRole)
          setScreen(nextScreen)
          setLoggedIn(true)
          setLogs((v) => [
            {
              time: nowISO(),
              user: actorForRole(nextRole),
              role: nextRole,
              action: "Đăng nhập mô phỏng",
              target: "Phiên demo",
              result: "Thành công",
            },
            ...v,
          ])
        }}
      />
    )

  return (
    <div
      className={`app-shell ${citizen ? "citizen-shell" : ""} ${
        admin ? "admin-shell" : ""
      }`}
    >
      <aside className="sidebar">
        <div className="brand">
          <NetworkMark />
          <div>
            <div className="brand-name">
              Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao
            </div>
            <div className="brand-sub">Phân tích & truy vết</div>
          </div>
        </div>
        <div className="demo-label">Demo — dữ liệu giả lập</div>
        <nav className="nav">
          {(citizen
            ? [
                {
                  screen: "new-report" as Screen,
                  label: "Gửi phản ánh",
                  icon: "PA",
                },
              ]
            : navItems
          ).map((item) => (
            <button
              key={item.screen}
              className={`nav-item ${
                screen === item.screen ||
                (item.screen === "reports" &&
                  ["new-report", "report-detail"].includes(screen)) ||
                (item.screen === "cases" && screen === "case-detail")
                  ? "active"
                  : ""
              }`}
              onClick={() => go(item.screen)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-avatar">PT</div>
          <div className="sidebar-user">
            <strong>{actorForRole(role)}</strong>
            <span>{role}</span>
          </div>
          <button
            className="more-btn"
            aria-label="Đăng xuất"
            onClick={() => {
              addLog("Đăng xuất", role)
              setLoggedIn(false)
            }}
          >
            ↪
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <div className="top-title">
              {citizen
                ? "CỔNG PHẢN ÁNH · VNeID MÔ PHỎNG"
                : admin
                  ? "TRUNG TÂM QUẢN TRỊ"
                  : pageTitle(screen)}
            </div>
            <div className="top-desc">
              Demo — dữ liệu giả lập · Phân quyền chỉ mô phỏng trên giao diện
            </div>
          </div>
          <div className="top-actions">
            <select
              aria-label="Chuyển vai trò demo"
              value={role}
              onChange={(e) => {
                addLog("Chuyển vai trò", e.target.value, `Từ ${role}`)
                setRole(e.target.value)
                setScreen(
                  e.target.value === "Người dân / Tổ chức"
                    ? "new-report"
                    : e.target.value === "Quản trị hệ thống"
                      ? "accounts"
                      : "dashboard",
                )
              }}
            >
              {["Người dân / Tổ chức", ...roles].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <Button
              variant="ghost"
              onClick={() => {
                addLog("Đăng xuất", role)
                setLoggedIn(false)
              }}
            >
              Đăng xuất
            </Button>
            <Button variant="ghost" onClick={reset}>
              Đặt lại demo
            </Button>
            <div className="notification">{alerts.length}</div>
          </div>
        </header>
        <main className="content">
          {reports.some((r) => r.timeMigration) && (
            <div className="migration-note">
              Dữ liệu phiên cũ đã được chuyển cấu trúc thời gian và giữ nguyên
              bản ghi, số tiền, hồ sơ, nhật ký. Mốc phát sinh/tiếp nhận cũ dùng
              thời gian đã có vì phiên cũ chưa tách hai trường. Đặt lại demo có
              xác nhận để tạo bộ mẫu theo ngày hôm nay.
            </div>
          )}
          {["reports", "report-detail", "cases", "case-detail"].includes(
            screen,
          ) && (
            <OperationsTabs
              active={
                screen === "reports" || screen === "report-detail"
                  ? "reports"
                  : screen === "case-detail"
                    ? "detail"
                    : "cases"
              }
              onReports={() => go("reports")}
              onCases={() => go("cases")}
              onDetail={() => openCase(selectedCase)}
            />
          )}
          {screen === "dashboard" && (
            <Dashboard
              reports={reports}
              cases={cases}
              hasNew={reports.some(
                (r) => r.id === "PA-013" && r.cluster === "CUM-001",
              )}
              alerts={alerts}
              onReports={() => go("reports")}
              onNew={() =>
                canEdit || citizen
                  ? go("new-report")
                  : notify("Vai trò này chỉ được xem dữ liệu", "error")
              }
              onReport={openReport}
              onGraph={openGraph}
              onAlert={openAlert}
            />
          )}
          {screen === "reports" && (
            <Reports
              reports={reports}
              onNew={() =>
                canEdit || citizen
                  ? go("new-report")
                  : notify("Vai trò này chỉ được xem dữ liệu", "error")
              }
              onOpen={openReport}
            />
          )}
          {screen === "new-report" && (
            <NewReport
              key={wizardVersion}
              hasNew={hasNew}
              reports={reports}
              onCancel={() =>
                citizen
                  ? notify("Bạn đang ở cổng gửi phản ánh mô phỏng")
                  : go("reports")
              }
              onSubmit={(report) => {
                setReports((v) =>
                  v.some((r) => r.id === report.id) ? v : [report, ...v],
                )
                addLog(
                  "Tạo phản ánh",
                  "PA-013",
                  "Tạo từ biểu mẫu demo; chưa xác nhận liên kết.",
                )
                setSelectedReport("PA-013")
                setScreen(citizen ? "new-report" : "report-detail")
                notify("Tạo phản ánh PA-013 thành công")
              }}
            />
          )}
          {screen === "report-detail" && (
            <ReportDetail
              key={selectedReport}
              reports={reports}
              canEdit={canEdit}
              report={
                reports.find((r) => r.id === selectedReport) || reports[0]
              }
              onBack={() => go("reports")}
              onGraph={() => {
                const report = reports.find((r) => r.id === selectedReport)
                if (report?.cluster) openGraph(report.cluster)
              }}
              onLog={addLog}
              onUpdate={(next) =>
                setReports((items) =>
                  items.map((item) => (item.id === next.id ? next : item)),
                )
              }
              notify={notify}
            />
          )}
          {screen === "graph" && (
            <LinkGraph
              key={activeCluster.id}
              cluster={activeCluster}
              reports={clusterReports}
              total={clusterTotal}
              hasNew={reports.some(
                (r) => r.id === "PA-013" && r.cluster === "CUM-001",
              )}
              onReport={openReport}
              onAlert={() =>
                openAlert(
                  alerts.find((item) => item.clusterId === activeCluster.id)
                    ?.id || "CB-001",
                )
              }
              onCreateCase={() =>
                canEdit
                  ? setCaseModal(true)
                  : notify("Vai trò này chỉ được xem hồ sơ", "error")
              }
            />
          )}
          {screen === "alerts" && (
            <Alerts
              alerts={alerts}
              reports={reports}
              selectedId={selectedAlert}
              onOpen={openAlert}
              onGraph={(clusterId) => openGraph(clusterId)}
              onCreate={(clusterId) => {
                if (!canEdit)
                  return notify("Vai trò này chỉ được xem dữ liệu", "error")
                if (clusterId) setSelectedCluster(clusterId)
                setCaseModal(true)
              }}
            />
          )}
          {screen === "cases" && (
            <Cases
              cases={cases}
              reports={reports}
              onOpen={openCase}
              onCreate={() =>
                canEdit
                  ? setCaseModal(true)
                  : notify("Vai trò này chỉ được xem dữ liệu", "error")
              }
            />
          )}
          {screen === "case-detail" && (
            <CaseDetail
              item={cases.find((c) => c.id === selectedCase) || cases[0]}
              reports={reports}
              key={selectedCase}
              canEdit={canEdit}
              onReport={openReport}
              onBack={() => go("cases")}
              onSave={(next, detail) => {
                const previous = cases.find((c) => c.id === next.id)
                setCases((v) => v.map((c) => (c.id === next.id ? next : c)))
                if (previous?.officer !== next.officer)
                  addLog(
                    "Phân công cán bộ",
                    next.id,
                    `Trước: ${previous?.officer} → Sau: ${next.officer}`,
                  )
                if (previous?.status !== next.status)
                  addLog(
                    "Đổi trạng thái",
                    next.id,
                    `Trước: ${previous?.status} → Sau: ${next.status}`,
                  )
                if (previous?.note !== next.note)
                  addLog(
                    "Chỉnh sửa nhận định",
                    next.id,
                    `Trước: ${previous?.note || "Chưa có"} → Sau: ${next.note || "Chưa có"}`,
                  )
                if (
                  previous?.officer === next.officer &&
                  previous?.status === next.status &&
                  previous?.note === next.note
                )
                  addLog("Cập nhật hồ sơ", next.id, detail)
                notify("Đã lưu thay đổi hồ sơ")
              }}
              onDenied={() => {
                addLog(
                  "Cập nhật hồ sơ",
                  selectedCase,
                  `Vai trò ${role} không có quyền chỉnh sửa hồ sơ.`,
                  "Bị từ chối",
                )
                notify("Bạn không có quyền thực hiện thao tác này", "error")
              }}
              onLogs={() => go("logs")}
            />
          )}
          {screen === "accounts" && (
            <Accounts
              role={role}
              accountRoles={accountRoles}
              setRole={(r) => {
                addLog("Chuyển vai trò", r, `Từ ${role}`)
                setRole(r)
                notify(`Đã chuyển sang vai trò: ${r}`)
              }}
              onEdit={(account, currentRole) => {
                if (role !== "Quản trị hệ thống")
                  return notify(
                    "Bạn không có quyền thực hiện thao tác này",
                    "error",
                  )
                setEditingAccount(account)
                setPreviousAccountRole(currentRole)
                setEditingRole(currentRole)
                setAccountModal(true)
              }}
            />
          )}
          {screen === "logs" && <Logs logs={logs} onOpen={setLogModal} />}
        </main>
      </div>
      {toast && (
        <div className={`toast toast-${toastType}`}>
          <span>{toastType === "success" ? "✓" : "!"}</span>
          {toast}
        </div>
      )}
      {caseModal && (
        <CreateCaseModal
          key={selectedCluster}
          onClusterChange={setSelectedCluster}
          cluster={activeCluster}
          reportIds={clusterReports.map((report) => report.id)}
          reportCount={clusterReports.length}
          total={clusterTotal}
          onClose={() => setCaseModal(false)}
          onCreate={(data) => {
            const id = `HS-${String(cases.length + 1).padStart(3, "0")}`
            const item = {
              id,
              ...data,
              status: "Mới tạo",
              updated: nowISO(),
              note: "",
              reportIds: data.reportIds,
              clusterId: data.clusterId,
              history: [`${nowISO()} · Tạo hồ sơ từ ${data.clusterId}`],
            }
            setCases((v) => [item, ...v])
            addLog("Tạo hồ sơ", id, `Tạo từ cụm ${data.clusterId}.`)
            setCaseModal(false)
            setSelectedCase(id)
            setScreen("case-detail")
            notify(`Đã tạo hồ sơ ${id}`)
          }}
        />
      )}
      {alertModal && (
        <AlertDetail
          alert={activeAlert}
          reports={reports}
          onClose={() => setAlertModal(false)}
          onGraph={() => {
            setAlertModal(false)
            if (activeAlert.clusterId) openGraph(activeAlert.clusterId)
          }}
          onCreate={() => {
            if (!canEdit)
              return notify("Vai trò này chỉ được xem dữ liệu", "error")
            setAlertModal(false)
            if (activeAlert.clusterId) setSelectedCluster(activeAlert.clusterId)
            setCaseModal(true)
          }}
        />
      )}
      {logModal && (
        <Modal
          title={`Chi tiết nhật ký — ${logModal.action}`}
          onClose={() => setLogModal(null)}
        >
          <DetailRows
            rows={[
              ["Thời gian", formatDateTime(logModal.time)],
              ["Tài khoản", logModal.user],
              ["Vai trò", logModal.role],
              ["Đối tượng", logModal.target],
              ["Kết quả", logModal.result],
              ["Chi tiết", logModal.detail || "Không có thay đổi dữ liệu."],
            ]}
          />
        </Modal>
      )}
      {accountModal && (
        <Modal
          title="Sửa vai trò tài khoản"
          onClose={() => setAccountModal(false)}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setAccountModal(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={() => {
                  setAccountModal(false)
                  addLog(
                    "Sửa quyền",
                    editingAccount,
                    `Trước: ${previousAccountRole} → Sau: ${editingRole}`,
                  )
                  setAccountRoles((v) => ({
                    ...v,
                    [editingAccount]: editingRole,
                  }))
                  notify("Đã cập nhật vai trò tài khoản")
                }}
              >
                Lưu thay đổi
              </Button>
            </>
          }
        >
          <Field label="Tài khoản">
            <input value={editingAccount} readOnly />
          </Field>
          <Field label="Vai trò">
            <select
              value={editingRole}
              onChange={(e) => setEditingRole(e.target.value)}
            >
              {["Người dân / Tổ chức", ...roles].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </Modal>
      )}
    </div>
  )
}

function pageTitle(screen: Screen) {
  return (
    {
      dashboard: "Tổng quan",
      reports: "Quản lý phản ánh",
      "new-report": "Tạo phản ánh mới",
      "report-detail": "Chi tiết phản ánh",
      graph: "Phân tích liên kết",
      alerts: "Cảnh báo và điểm rủi ro",
      cases: "Hồ sơ vụ việc",
      "case-detail": "Chi tiết hồ sơ",
      accounts: "Tài khoản và phân quyền",
      logs: "Nhật ký hệ thống",
    } as Record<Screen, string>
  )[screen]
}

function Login({
  onLogin,
}: {
  onLogin: (role: string, screen: Screen) => void
}) {
  const loginRoles = [
    ["Người dân / Tổ chức", "Người dân / Tổ chức", "new-report"],
    ["Cán bộ nghiệp vụ", "Cán bộ phân tích", "dashboard"],
    ["Lãnh đạo", "Lãnh đạo theo dõi", "dashboard"],
    ["Quản trị", "Quản trị hệ thống", "accounts"],
  ] as const
  const [loginRole, setLoginRole] = useState<(typeof loginRoles)[number][1]>(
    loginRoles[1][1],
  )
  const [qrOpen, setQrOpen] = useState(false)
  return (
    <div className="login-page">
      <div className="login-aside">
        <div className="login-grid" />
        <div className="login-copy">
          <div className="login-logo">
            <NetworkMark /> Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao
          </div>
          <div className="login-kicker">NỀN TẢNG NGHIỆP VỤ</div>
          <div className="login-heading">
            PHÂN TÍCH VÀ TRUY VẾT
            <br />
            TỘI PHẠM CÔNG NGHỆ CAO
          </div>
          <p>
            Nền tảng phân tích và hỗ trợ truy vết lừa đảo trực tuyến từ nguồn
            phản ánh xã hội.
          </p>
          <div className="login-feature">
            <b>01</b>
            <span>Tiếp nhận và chuẩn hóa phản ánh</span>
          </div>
          <div className="login-feature">
            <b>02</b>
            <span>Phân tích mạng lưới liên kết</span>
          </div>
          <div className="login-feature">
            <b>03</b>
            <span>Hỗ trợ lập hồ sơ xác minh</span>
          </div>
        </div>
      </div>
      <div className="login-panel">
        <div className="login-card">
          <div className="mobile-logo">
            Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao
          </div>
          <div className="demo-label login-demo">Demo — dữ liệu giả lập</div>
          <div className="eyebrow">CỔNG TRUY CẬP · VNeID MÔ PHỎNG</div>
          <div className="login-role-tabs">
            {loginRoles.map(([label, value]) => (
              <button
                key={label}
                className={loginRole === value ? "active" : ""}
                onClick={() => setLoginRole(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="login-title">Đăng nhập hệ thống</div>
          <p className="muted">
            Sử dụng tài khoản demo để trải nghiệm toàn bộ luồng nghiệp vụ.
          </p>
          <Field label="Tài khoản">
            <input
              value={
                loginRole === "Người dân / Tổ chức"
                  ? "cong.dan.demo"
                  : "can.bo.demo"
              }
              readOnly
            />
          </Field>
          <Field label="Mật khẩu">
            <input type="password" value="demo1234" readOnly />
          </Field>
          <Button
            onClick={() =>
              onLogin(
                loginRole,
                loginRoles.find((item) => item[1] === loginRole)?.[2] ||
                  "dashboard",
              )
            }
            className="full"
          >
            Đăng nhập demo <span>→</span>
          </Button>
          <div className="login-divider">HOẶC TRẢI NGHIỆM LUỒNG KHÁC</div>
          <Button
            variant="secondary"
            className="full"
            onClick={() => setQrOpen(true)}
          >
            ▦ Quét mã QR · mô phỏng
          </Button>
          {qrOpen && (
            <Modal
              title="Quét mã QR mô phỏng"
              onClose={() => setQrOpen(false)}
              footer={
                <Button
                  onClick={() =>
                    onLogin(
                      loginRole,
                      loginRoles.find((item) => item[1] === loginRole)?.[2] ||
                        "dashboard",
                    )
                  }
                >
                  Tiếp tục bằng tài khoản demo
                </Button>
              }
            >
              <div className="qr-simulation">▦</div>
              <p>
                Đây là minh họa luồng đăng nhập; không chứa mã định danh và
                không kết nối VNeID. Không cần quét hoặc nhập thông tin thật.
              </p>
            </Modal>
          )}
          <div className="login-note">
            <span>i</span>
            <p>
              <b>Môi trường trình diễn</b>
              <br />
              VNeID chỉ là mô phỏng. Không sử dụng thông tin tài khoản thật.
            </p>
          </div>
          <div className="secure">
            Phiên truy cập mô phỏng · Dữ liệu hoàn toàn giả lập
          </div>
        </div>
      </div>
    </div>
  )
}

function Dashboard({
  reports,
  cases,
  hasNew,
  alerts,
  onReports,
  onNew,
  onReport,
  onGraph,
  onAlert,
}: {
  reports: Report[]
  cases: CaseFile[]
  hasNew: boolean
  alerts: AlertItem[]
  onReports: () => void
  onNew: () => void
  onReport: (id: string) => void
  onGraph: (id: string) => void
  onAlert: (id: string) => void
}) {
  const clusterData = clusters.map((cluster) => {
    const related = reports.filter((report) => report.cluster === cluster.id)
    return {
      ...cluster,
      reports: related,
      total: related.reduce((sum, report) => sum + report.amount, 0),
      score: cluster.id === "CUM-001" && hasNew ? 85 : cluster.score,
    }
  })
  const behaviorCount = (behavior: string) =>
    reports.filter((report) => report.behavior === behavior).length
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  const recentDays = lastSevenDays(reports, clock)
  const largestDailyCount = Math.max(1, ...recentDays.map((item) => item.count))
  const behaviorShare = [
    behaviorCount("Giả danh ngân hàng"),
    behaviorCount("Giả danh cơ quan nhà nước"),
    behaviorCount("Đầu tư trực tuyến"),
  ].map((count) => (count / Math.max(1, reports.length)) * 100)
  const stats = [
    [
      String(reports.length),
      "Tổng phản ánh",
      reports.some((r) => r.id === "PA-013")
        ? "Đã tiếp nhận PA-013"
        : "Bộ dữ liệu ban đầu",
      "blue",
    ],
    [
      String(clusterData.filter((c) => c.reports.length > 0).length),
      "Cụm có liên quan",
      `${clusterData.filter((c) => c.risk === "Cao" && c.reports.length > 0).length} cụm rủi ro cao`,
      "purple",
    ],
    [
      String(alerts.length),
      "Cảnh báo cần xem",
      hasNew ? "Đã cập nhật theo liên kết" : "Cần ưu tiên",
      "red",
    ],
    [
      String(cases.filter((c) => c.status !== "Hoàn tất phân tích").length),
      "Hồ sơ đang xử lý",
      `${cases.filter((c) => c.status === "Chờ bổ sung").length} chờ bổ sung`,
      "orange",
    ],
  ]
  return (
    <div className="page-stack">
      <div className="welcome-row">
        <div>
          <div className="page-heading">Tổng quan phân tích và xác minh</div>
          <p className="muted">
            Thống kê tính trực tiếp từ bộ dữ liệu giả lập đang lưu trên trình
            duyệt
          </p>
        </div>
        <Button onClick={onNew}>＋ Tạo phản ánh</Button>
      </div>
      {hasNew && (
        <div className="inline-alert">
          <div className="alert-symbol">!</div>
          <div>
            <b>CUM-001 vừa có thêm phản ánh liên quan</b>
            <span>
              PA-013 đã được cán bộ xác nhận liên kết theo thực thể trùng khớp.
              Xem căn cứ cụ thể trong chi tiết phản ánh.
            </span>
          </div>
          <Button variant="secondary" onClick={() => onAlert("CB-001")}>
            Xem cảnh báo
          </Button>
        </div>
      )}
      <div className="stats-grid">
        {stats.map(([n, label, sub, tone]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-accent ${tone}`} />
            <div className="stat-label">{label}</div>
            <div className="stat-value">{n}</div>
            <div className={`stat-sub ${tone}`}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="card chart-card">
          <CardHead
            title="Phản ánh theo ngày"
            sub={`7 ngày lịch gần nhất, gồm hôm nay · Tiếp nhận: ${recentDays.reduce((sum, item) => sum + item.count, 0)} phản ánh · Giờ Việt Nam`}
          />
          <div className="daily-chart" aria-label="Thống kê phản ánh theo ngày">
            {recentDays.map(({ day, count }) => (
              <div className="daily-column" key={day}>
                <b>{count}</b>
                <div className="daily-track">
                  <span
                    style={{ height: `${(count / largestDailyCount) * 100}%` }}
                  />
                </div>
                <small>
                  {day.slice(8)}/{day.slice(5, 7)}
                </small>
              </div>
            ))}
          </div>
        </div>
        <div className="card behavior-card">
          <CardHead title="Nhóm hành vi" sub="Theo số phản ánh" />
          <div className="donut-row">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#7053b3 0 ${behaviorShare[0]}%, #3781ca ${behaviorShare[0]}% ${behaviorShare[0] + behaviorShare[1]}%, #d58335 ${behaviorShare[0] + behaviorShare[1]}% ${behaviorShare.reduce((a, b) => a + b, 0)}%, #53627c ${behaviorShare.reduce((a, b) => a + b, 0)}% 100%)`,
              }}
            >
              <div>
                <b>{reports.length}</b>
                <span>Phản ánh</span>
              </div>
            </div>
            <div className="legend-list">
              {[
                [
                  "Giả danh ngân hàng",
                  behaviorCount("Giả danh ngân hàng"),
                  "navy",
                ],
                [
                  "Giả danh cơ quan",
                  behaviorCount("Giả danh cơ quan nhà nước"),
                  "blue",
                ],
                [
                  "Đầu tư trực tuyến",
                  behaviorCount("Đầu tư trực tuyến"),
                  "orange",
                ],
                [
                  "Nhóm khác",
                  reports.length -
                    behaviorCount("Giả danh ngân hàng") -
                    behaviorCount("Giả danh cơ quan nhà nước") -
                    behaviorCount("Đầu tư trực tuyến"),
                  "gray",
                ],
              ].map(([x, n, c]) => (
                <div className="legend-line" key={x}>
                  <i className={String(c)} />
                  <span>{x}</span>
                  <b>{n}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-grid lower">
        <div className="card table-card">
          <CardHead
            title="Phản ánh mới nhất"
            sub="Dữ liệu tiếp nhận gần đây"
            action="Xem tất cả →"
            onAction={onReports}
          />
          <ReportTable
            reports={reports.slice(0, 5)}
            onOpen={onReport}
            compact
          />
        </div>
        <div className="card">
          <CardHead title="Cụm đáng chú ý" sub="Sắp xếp theo mức rủi ro" />
          <div className="cluster-list">
            {clusterData.map((cluster) => (
              <button
                className="cluster-item"
                onClick={() => onGraph(cluster.id)}
                key={cluster.id}
              >
                <div className="cluster-top">
                  <span className="cluster-id">{cluster.id}</span>
                  <Badge tone={cluster.risk === "Cao" ? "red" : "orange"}>
                    {cluster.risk}
                  </Badge>
                </div>
                <b>{cluster.name}</b>
                <div className="cluster-meta">
                  <span>{cluster.reports.length} phản ánh</span>
                  <span>{cluster.total} triệu đồng</span>
                </div>
                <div
                  className={`risk-line ${
                    cluster.risk !== "Cao" ? "orange" : ""
                  }`}
                >
                  <span style={{ width: `${cluster.score}%` }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CardHead({
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

function Reports({
  reports,
  onNew,
  onOpen,
}: {
  reports: Report[]
  onNew: () => void
  onOpen: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Tất cả trạng thái")
  const [behavior, setBehavior] = useState("Tất cả nhóm hành vi")
  const [source, setSource] = useState("")
  const [area, setArea] = useState("")
  const filtered = reports.filter(
    (r) =>
      `${r.id} ${r.title} ${r.account || ""} ${r.phone || ""} ${r.website || ""} ${r.area}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (status.startsWith("Tất cả") ||
        reportWorkflowStatus(r.status) === status) &&
      (behavior.startsWith("Tất cả") || r.behavior === behavior) &&
      (!source || r.source === source) &&
      (!area || r.area === area),
  )
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <div className="page-heading">Danh sách phản ánh</div>
          <p className="muted">
            Quản lý, tra cứu và theo dõi toàn bộ phản ánh đã tiếp nhận.
          </p>
        </div>
        <Button onClick={onNew}>＋ Tạo phản ánh</Button>
      </div>
      <div className="status-tabs">
        {[
          "Tất cả trạng thái",
          "Chờ kiểm tra",
          "Đã kiểm tra",
          "Không hợp lệ",
        ].map((value) => (
          <button
            key={value}
            className={status === value ? "active" : ""}
            onClick={() => setStatus(value)}
          >
            {value} (
            {
              reports.filter(
                (r) =>
                  value === "Tất cả trạng thái" ||
                  reportWorkflowStatus(r.status) === value,
              ).length
            }
            )
          </button>
        ))}
      </div>
      <div className="card filter-card reports-filter">
        <div className="search-wrap">
          <span>⌕</span>
          <input
            placeholder="Tìm theo mã hoặc tiêu đề..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Tất cả trạng thái</option>
          <option>Chờ kiểm tra</option>
          <option>Đã kiểm tra</option>
          <option>Không hợp lệ</option>
        </select>
        <select value={behavior} onChange={(e) => setBehavior(e.target.value)}>
          <option>Tất cả nhóm hành vi</option>
          {Array.from(new Set(reports.map((r) => r.behavior))).map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Nguồn tiếp nhận"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">Mọi nguồn tin</option>
          {Array.from(new Set(reports.map((r) => r.source))).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Địa bàn phản ánh"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">Mọi địa bàn</option>
          {Array.from(new Set(reports.map((r) => r.area))).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <div className="card table-card">
        <div className="table-summary">
          <span>
            Hiển thị <b>{filtered.length}</b> phản ánh
          </span>
          <span>Thống kê theo thời gian tiếp nhận · Asia/Ho_Chi_Minh</span>
        </div>
        <ReportTable reports={filtered} onOpen={onOpen} />
      </div>
    </div>
  )
}

function ReportTable({
  reports,
  onOpen,
  compact = false,
}: {
  reports: Report[]
  onOpen: (id: string) => void
  compact?: boolean
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Mã phản ánh</th>
            <th>Người gửi mẫu</th>
            <th>Nội dung / Loại hành vi</th>
            {!compact && (
              <>
                <th>Nguồn</th>
              </>
            )}
            <th>Thời gian</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
            {!compact && <th>Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r.id)}>
              <td>
                <b className="id-link">{r.id}</b>
              </td>
              <td>
                <b>Người gửi mẫu</b>
                <span className="cell-sub">{r.area}</span>
              </td>
              <td>
                <div className="cell-title">{r.title}</div>
                <span className="cell-sub">{r.behavior}</span>
              </td>
              {!compact && (
                <>
                  <td>{r.source}</td>
                </>
              )}
              <td>
                <span>{formatDateTime(r.receivedAt)}</span>
                <span className="cell-sub">Tiếp nhận · giờ Việt Nam</span>
              </td>
              <td>
                <b>{r.amount ? `${r.amount} triệu` : "—"}</b>
              </td>
              <td>
                <WorkflowBadge value={r.status} />
              </td>
              {!compact && (
                <td>
                  <Button variant="ghost" onClick={() => onOpen(r.id)}>
                    Kiểm tra phản ánh
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 && (
        <div className="empty">Không tìm thấy phản ánh phù hợp.</div>
      )}
    </div>
  )
}

function NewReport({
  onCancel,
  onSubmit,
  hasNew,
  reports,
}: {
  onCancel: () => void
  onSubmit: (r: Report) => void
  hasNew: boolean
  reports: Report[]
}) {
  const [step, setStep] = useStoredState("scamgraph-demo-wizard-step", 1)
  const [form, setForm] = useStoredState("scamgraph-demo-wizard-form", {
    sender: "",
    phone: "",
    title: "",
    content: "",
    source: "",
    area: "",
    time: "",
    amount: "",
    attachment: false,
  })
  const [errors, setErrors] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const submittingRef = useRef(false)
  const fill = () => {
    setErrors([])
    setForm({
      sender: "Nguyễn Hoàng Minh",
      phone: "0900 000 013",
      title: "Yêu cầu xác minh tài khoản qua website đáng ngờ",
      content: demoText,
      source: "Cổng trực tuyến",
      area: "Hà Nội",
      time: vietnamInput(new Date(Date.now() - 30 * 60000)),
      amount: "15000000",
      attachment: form.attachment,
    })
  }
  const submit = () => {
    if (submittingRef.current) return
    const missing = [
      ["Tiêu đề", form.title],
      ["Nội dung", form.content],
      ["Nguồn tiếp nhận", form.source],
      ["Địa bàn", form.area],
      ["Thời gian phát sinh", form.time],
    ]
      .filter(([, v]) => !String(v).trim())
      .map(([k]) => k)
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) < 0)
      missing.push("Số tiền phải là số không âm")
    if (!fromVietnamInput(form.time))
      missing.push("Thời gian phát sinh không hợp lệ")
    if (missing.length) return setErrors(missing)
    if (hasNew)
      return setErrors([
        "PA-013 đã tồn tại. Vui lòng đặt lại demo trước khi tạo lại",
      ])
    submittingRef.current = true
    setSubmitted(true)
    onSubmit({
      id: "PA-013",
      title: form.title.trim(),
      content: form.content.trim(),
      source: form.source,
      area: form.area,
      occurredAt: fromVietnamInput(form.time),
      receivedAt: nowISO(),
      updatedAt: nowISO(),
      amount: Number(form.amount) / 1000000,
      status: "Mới tiếp nhận",
      behavior: "Giả danh ngân hàng",
      account: "DEMO-TK-001",
      bank: "Ngân hàng mẫu A",
      phone: "DEMO-SDT-001",
      website: "xacminh-demo.example",
      extracted: false,
      reviewed: false,
      attachment: form.attachment,
    })
  }
  return (
    <div className="form-layout report-wizard">
      <div className="form-main card">
        <div className="wizard-steps">
          {[
            "Thông tin người gửi",
            "Chi tiết vụ việc",
            "Bằng chứng",
            "Xác nhận",
          ].map((label, index) => (
            <button
              key={label}
              className={
                step === index + 1 ? "active" : step > index + 1 ? "done" : ""
              }
              onClick={() => setStep(index + 1)}
            >
              <span>{index + 1}</span>
              {label}
            </button>
          ))}
        </div>
        <div className="section-head">
          <div>
            <div className="section-title">
              {
                [
                  "Thông tin người gửi",
                  "Chi tiết vụ việc",
                  "Bằng chứng",
                  "Xác nhận",
                ][step - 1]
              }
            </div>
            <p>
              Nhập nội dung do người phản ánh cung cấp. Các trường có dấu * là
              bắt buộc.
            </p>
          </div>
          <Button variant="secondary" onClick={fill}>
            Dùng tình huống mẫu
          </Button>
        </div>
        {errors.length > 0 && (
          <div className="error-box">
            <b>Chưa thể gửi phản ánh</b>
            <span>Vui lòng kiểm tra: {errors.join(", ")}.</span>
          </div>
        )}
        {step === 1 && (
          <div className="form-grid sender-grid">
            <Field label="Họ và tên mẫu">
              <input
                placeholder="Nhập tên người gửi mẫu"
                value={form.sender}
                onChange={(e) => setForm({ ...form, sender: e.target.value })}
              />
            </Field>
            <Field label="Định danh mô phỏng">
              <input value="DEMO-CCCD-013" readOnly />
            </Field>
            <Field label="Tỉnh / Thành phố mẫu">
              <select
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              >
                <option value="">Chọn địa bàn</option>
                <option>Hà Nội</option>
                <option>Đà Nẵng</option>
                <option>TP. Hồ Chí Minh</option>
              </select>
            </Field>
            <Field label="Số điện thoại liên hệ mẫu">
              <input
                placeholder="Không nhập số điện thoại thật"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <div className="simulation-note">
              Thông tin định danh trong màn hình này chỉ dùng để mô phỏng luồng
              tiếp nhận. Không nhập dữ liệu cá nhân thật.
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="form-grid">
            <Field
              label="Tiêu đề"
              required
              error={
                errors.includes("Tiêu đề")
                  ? "Vui lòng nhập tiêu đề."
                  : undefined
              }
            >
              <input
                placeholder="Nhập tiêu đề ngắn gọn"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field
              label="Nguồn tiếp nhận"
              required
              error={
                errors.includes("Nguồn tiếp nhận")
                  ? "Vui lòng chọn nguồn tiếp nhận."
                  : undefined
              }
            >
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                <option value="">Chọn nguồn</option>
                <option>Cổng trực tuyến</option>
                <option>Đường dây nóng</option>
                <option>Ứng dụng di động</option>
                <option>Tiếp nhận trực tiếp</option>
              </select>
            </Field>
            <Field
              label="Nội dung phản ánh"
              required
              error={
                errors.includes("Nội dung")
                  ? "Vui lòng nhập nội dung phản ánh."
                  : undefined
              }
            >
              <textarea
                rows={7}
                placeholder="Mô tả diễn biến, thông tin liên hệ và giao dịch..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Field>
            <div className="split-fields">
              <Field
                label="Địa bàn"
                required
                error={
                  errors.includes("Địa bàn")
                    ? "Vui lòng chọn địa bàn."
                    : undefined
                }
              >
                <select
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                >
                  <option value="">Chọn địa bàn</option>
                  <option>Hà Nội</option>
                  <option>Đà Nẵng</option>
                  <option>TP. Hồ Chí Minh</option>
                </select>
              </Field>
              <Field
                label="Thời gian phát sinh"
                required
                error={
                  errors.includes("Thời gian phát sinh")
                    ? "Vui lòng chọn thời gian phát sinh."
                    : undefined
                }
              >
                <input
                  type="datetime-local"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Số tiền được phản ánh" hint="Đơn vị: đồng">
              <input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="evidence-step">
            {form.attachment ? (
              <div className="receipt-preview">
                <div className="receipt-top">
                  <span>NGÂN HÀNG MẪU A</span>
                  <b>ẢNH XEM TRƯỚC</b>
                </div>
                <div className="receipt-amount">15.000.000 đ</div>
                <div className="receipt-row">
                  <span>Tài khoản nhận</span>
                  <b>DEMO-TK-001</b>
                </div>
                <div className="watermark">TÀI LIỆU GIẢ LẬP</div>
              </div>
            ) : (
              <div className="upload-empty">
                <div className="upload-icon">↑</div>
                <b>Chọn ảnh bằng chứng mẫu</b>
                <span>Ảnh sẽ được xem trước trước khi gửi.</span>
              </div>
            )}
            <Button
              variant="secondary"
              onClick={() => setForm({ ...form, attachment: true })}
            >
              Chọn ảnh chuyển khoản mẫu
            </Button>
          </div>
        )}
        {step === 4 && (
          <div className="review-grid">
            <DetailRows
              rows={[
                ["Người gửi mẫu", form.sender || "Chưa cung cấp"],
                ["Tiêu đề", form.title || "Chưa nhập"],
                ["Nguồn tiếp nhận", form.source || "Chưa chọn"],
                ["Địa bàn", form.area || "Chưa chọn"],
                [
                  "Số tiền",
                  form.amount
                    ? `${Number(form.amount).toLocaleString("vi-VN")} đồng`
                    : "0 đồng",
                ],
                ["Bằng chứng", form.attachment ? "01 ảnh giả lập" : "Chưa có"],
              ]}
            />
            <p>{form.content || "Chưa nhập nội dung phản ánh."}</p>
          </div>
        )}
        {hasNew && (
          <div className="simulation-note">
            PA-013 đã được tiếp nhận. Đổi sang vai trò cán bộ phân tích để tiếp
            tục kiểm tra; đặt lại demo nếu muốn tạo lại.
          </div>
        )}
        <div className="wizard-actions">
          <Button
            variant="secondary"
            onClick={() => (step === 1 ? onCancel() : setStep(step - 1))}
          >
            {step === 1 ? "Hủy" : "Quay lại"}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)}>Tiếp tục →</Button>
          ) : (
            <Button onClick={submit} disabled={submitted || hasNew}>
              {hasNew || submitted ? "Đã gửi PA-013" : "Gửi phản ánh"}
            </Button>
          )}
        </div>
      </div>
      <div className="form-side">
        <div className="card citizen-guide">
          <CardHead
            title="CẨM NANG AN TOÀN TRỰC TUYẾN"
            sub="Thông tin hướng dẫn trong demo"
          />
          <ul>
            <li>Không chuyển tiền theo cuộc gọi yêu cầu xác minh tài khoản.</li>
            <li>Không cung cấp mật khẩu hoặc mã OTP cho người khác.</li>
            <li>
              Lưu lại nội dung và chứng từ để cơ quan có thẩm quyền xác minh.
            </li>
          </ul>
          <p>
            Chỉ nhập tình huống giả lập. Không tiếp nhận tố giác thật trên bản
            demo này.
          </p>
        </div>
        <div className="card upload-card">
          <div className="section-title">Tài liệu đính kèm</div>
          <p className="muted">Chỉ sử dụng tài liệu giả lập trong demo.</p>
          {form.attachment ? (
            <div className="receipt-preview">
              <div className="receipt-top">
                <span>NGÂN HÀNG MẪU A</span>
                <b>GIAO DỊCH THÀNH CÔNG</b>
              </div>
              <div className="receipt-amount">15.000.000 đ</div>
              <div className="receipt-row">
                <span>Tài khoản nhận</span>
                <b>DEMO-TK-001</b>
              </div>
              <div className="receipt-row">
                <span>Thời gian</span>
                <b>{formatDateTime(fromVietnamInput(form.time))}</b>
              </div>
              <div className="watermark">TÀI LIỆU GIẢ LẬP</div>
            </div>
          ) : (
            <div className="upload-empty">
              <div className="upload-icon">↑</div>
              <b>Chưa có tài liệu</b>
              <span>Thêm ảnh chuyển khoản mẫu để trình diễn.</span>
            </div>
          )}
          <Button
            variant="secondary"
            className="full"
            onClick={() => setForm({ ...form, attachment: true })}
          >
            Dùng ảnh chuyển khoản mẫu
          </Button>
        </div>
        <div className="card privacy-note">
          <b>Lưu ý nghiệp vụ</b>
          <p>
            Dữ liệu trong prototype hoàn toàn giả lập. Không nhập thông tin cá
            nhân thật.
          </p>
        </div>
      </div>
      <div className="card submission-history">
        <CardHead
          title="Lịch sử phản ánh gần đây"
          sub="Dữ liệu demo đã tiếp nhận"
        />
        <div className="citizen-history">
          {reports
            .filter((r) => r.id === "PA-013")
            .map((r) => (
              <p key={r.id}>
                <b>{r.id}</b> · {r.title} · {r.amount} triệu đồng · Đã tiếp nhận
                mô phỏng
              </p>
            ))}
          {!hasNew && (
            <p className="muted">
              Chưa có phản ánh của người gửi mẫu trong phiên demo.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportDetail({
  report,
  reports,
  canEdit,
  onBack,
  onGraph,
  onLog,
  onUpdate,
  notify,
}: {
  report: Report
  reports: Report[]
  canEdit: boolean
  onBack: () => void
  onGraph: () => void
  onLog: (a: string, t: string, d?: string) => void
  onUpdate: (report: Report) => void
  notify: (x: string) => void
}) {
  const [extracted, setExtracted] = useState(
    report.extracted ?? report.id !== "PA-013",
  )
  const [preview, setPreview] = useState(false)
  const [draft, setDraft] = useState({
    account: report.account || "",
    bank: report.bank || "",
    phone: report.phone || "",
    website: report.website || "",
    amount: String(report.amount),
  })
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState("")
  const evidence = clusters
    .map((cluster) => ({
      cluster,
      matches: reports
        .filter((r) => r.cluster === cluster.id && r.id !== report.id)
        .map((r) => ({
          report: r,
          fields: (["account", "phone", "website"] as const).filter(
            (key) =>
              report[key]?.trim() &&
              report[key]?.trim().toLowerCase() ===
                r[key]?.trim().toLowerCase(),
          ),
        }))
        .filter((match) => match.fields.length > 0),
    }))
    .filter((candidate) => candidate.matches.length > 0)
  const save = () => {
    if (!Number.isFinite(Number(draft.amount)) || Number(draft.amount) < 0)
      return setError("Số tiền phải là số không âm.")
    const next = {
      ...report,
      ...draft,
      amount: Number(draft.amount),
      extracted: true,
      reviewed: true,
      status: "Đã kiểm tra",
      updatedAt: nowISO(),
      rejectedClusters: [],
    }
    const entityChanged = (["account", "phone", "website"] as const).some(
      (key) => draft[key] !== (report[key] || ""),
    )
    if (entityChanged && report.cluster) {
      next.cluster = undefined
      next.status = "Đã kiểm tra"
    }
    onUpdate(next)
    onLog(
      "Kiểm tra thông tin trích xuất",
      report.id,
      (["account", "bank", "phone", "website", "amount"] as const)
        .map(
          (key) =>
            `${{ account: "Tài khoản", bank: "Ngân hàng", phone: "Điện thoại", website: "Website", amount: "Số tiền (triệu)" }[key]} — trước: ${report[key] ?? "Chưa có"}; sau: ${next[key] ?? "Chưa có"}`,
        )
        .join(". ") +
        (entityChanged && report.cluster
          ? ` Liên kết — trước: ${report.cluster}; sau: chưa liên kết, cần xác nhận lại.`
          : ""),
    )
    setDirty(false)
    setError("")
    notify("Đã lưu thông tin đã kiểm tra")
  }
  return (
    <div className="page-stack">
      <button className="back-link" onClick={onBack}>
        ← Quay lại danh sách phản ánh
      </button>
      <div className="detail-hero">
        <div>
          <div className="detail-code">{report.id}</div>
          <h1 className="page-heading">{report.title}</h1>
          <div className="hero-meta">
            <WorkflowBadge value={report.status} />
            <span>
              {report.source} · Tiếp nhận {formatDateTime(report.receivedAt)}
            </span>
          </div>
        </div>
        {report.cluster && (
          <Button onClick={onGraph}>Xem sơ đồ {report.cluster} →</Button>
        )}
      </div>
      <div className="detail-grid">
        <div className="page-stack">
          <div className="card detail-card">
            <CardHead
              title="Nội dung gốc"
              sub="Dữ liệu giả lập do người gửi cung cấp"
            />
            <div className="quote-content">{report.content}</div>
            <DetailRows
              rows={[
                ["Phát sinh sự việc", formatDateTime(report.occurredAt)],
                ["Tiếp nhận phản ánh", formatDateTime(report.receivedAt)],
                ["Địa bàn", report.area],
                ["Số tiền", `${report.amount} triệu đồng`],
                ["Nhóm hành vi", report.behavior],
              ]}
            />
          </div>
          <div className="card detail-card">
            <CardHead title="Tài liệu đính kèm" />
            {report.attachment ? (
              <div className="file-row">
                <b>anh-chuyen-khoan-mau.png</b>
                <Button variant="secondary" onClick={() => setPreview(true)}>
                  Xem trước
                </Button>
              </div>
            ) : (
              <div className="empty">Không có tài liệu đính kèm.</div>
            )}
          </div>
          {extracted && report.reviewed && !dirty && (
            <div className="card detail-card evidence-card">
              <CardHead
                title="Căn cứ liên kết mô phỏng"
                sub="Đối chiếu chính xác thực thể đã lưu; cần cán bộ xác nhận, không tự động gán cụm."
              />
              {evidence.map(({ cluster, matches }) => (
                <div className="candidate" key={cluster.id}>
                  <b>
                    {cluster.id} · {cluster.name}
                  </b>
                  {matches.map((match) => (
                    <p key={match.report.id}>
                      <strong>{match.report.id}</strong> ·{" "}
                      {match.fields
                        .map(
                          (key) =>
                            `${{ account: "Tài khoản", phone: "Điện thoại", website: "Website" }[key]}: ${report[key]}`,
                        )
                        .join("; ")}
                    </p>
                  ))}
                  {report.cluster === cluster.id ? (
                    <Badge tone="green">Đã xác nhận liên kết</Badge>
                  ) : report.rejectedClusters?.includes(cluster.id) ? (
                    <>
                      <Badge tone="gray">Đã loại bỏ đề xuất</Badge>
                      <Button
                        variant="ghost"
                        disabled={!canEdit}
                        onClick={() => {
                          onUpdate({
                            ...report,
                            rejectedClusters: report.rejectedClusters?.filter(
                              (id) => id !== cluster.id,
                            ),
                          })
                          onLog(
                            "Khôi phục đề xuất",
                            report.id,
                            `Trước: loại bỏ ${cluster.id}; sau: chờ xem xét`,
                          )
                        }}
                      >
                        Xem xét lại {cluster.id}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        disabled={!canEdit || !report.reviewed || dirty}
                        onClick={() => {
                          onUpdate({
                            ...report,
                            cluster: cluster.id,
                            updatedAt: nowISO(),
                            status: "Có liên quan",
                          })
                          onLog(
                            "Xác nhận liên kết",
                            report.id,
                            `Trước: ${report.cluster || "chưa liên kết"}; sau: ${cluster.id}; căn cứ ${matches.map((m) => m.report.id).join(", ")}`,
                          )
                          notify(`Đã xác nhận ${report.id} vào ${cluster.id}`)
                        }}
                      >
                        Xác nhận liên kết {cluster.id}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={!canEdit}
                        onClick={() => {
                          onUpdate({
                            ...report,
                            rejectedClusters: [
                              ...(report.rejectedClusters || []),
                              cluster.id,
                            ],
                          })
                          onLog(
                            "Loại bỏ đề xuất liên kết",
                            report.id,
                            `Trước: đề xuất ${cluster.id}; sau: loại bỏ. Không thay đổi thành viên cụm.`,
                          )
                          notify(`Đã loại bỏ đề xuất ${cluster.id}`)
                        }}
                      >
                        Loại bỏ đề xuất {cluster.id}
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {!evidence.length && (
                <p className="muted">
                  Chưa có thực thể trùng khớp. Phản ánh được theo dõi độc lập.
                </p>
              )}
              {(!report.reviewed || dirty) && (
                <p className="extraction-note">
                  Lưu thông tin đã kiểm tra trước khi xác nhận liên kết.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="card extraction">
          <CardHead
            title="Thông tin trích xuất"
            sub="Mô phỏng theo kịch bản mẫu, không sử dụng OCR/AI hay API."
          />
          {!extracted ? (
            <Button
              disabled={!canEdit}
              onClick={() => {
                setExtracted(true)
                onUpdate({ ...report, extracted: true })
                onLog("Trích xuất mô phỏng", report.id)
                notify("Đã trích xuất theo kịch bản mẫu")
              }}
            >
              Trích xuất thông tin
            </Button>
          ) : (
            <div className="entity-form">
              {(
                [
                  ["account", "Tài khoản ngân hàng"],
                  ["bank", "Ngân hàng"],
                  ["phone", "Số điện thoại"],
                  ["website", "Website"],
                  ["amount", "Số tiền (triệu đồng)"],
                ] as const
              ).map(([key, label]) => (
                <Field label={label} key={key}>
                  <input
                    type={key === "amount" ? "number" : "text"}
                    min={key === "amount" ? 0 : undefined}
                    step={key === "amount" ? "any" : undefined}
                    value={draft[key]}
                    readOnly={!canEdit}
                    onChange={(e) => {
                      setDraft({ ...draft, [key]: e.target.value })
                      setDirty(true)
                    }}
                  />
                </Field>
              ))}
              {error && (
                <div role="alert" className="error-box">
                  {error}
                </div>
              )}
              <p className="extraction-note">
                Lưu thông tin đã kiểm tra để xem đề xuất liên kết. Kết quả chỉ
                hỗ trợ xác minh; không phải kết luận vi phạm.
              </p>
              <Button disabled={!canEdit} onClick={save}>
                Lưu thông tin đã kiểm tra
              </Button>
            </div>
          )}
        </div>
      </div>
      {preview && (
        <Modal
          title="Bằng chứng giao dịch mô phỏng"
          onClose={() => setPreview(false)}
        >
          <div className="receipt-preview">
            <b>NGÂN HÀNG MẪU A</b>
            <div className="receipt-amount">15.000.000 đ</div>
            <p>DEMO-TK-001 · {formatDateTime(report.occurredAt)}</p>
            <div className="watermark">TÀI LIỆU GIẢ LẬP</div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Alerts({
  alerts,
  reports,
  selectedId,
  onOpen,
  onGraph,
  onCreate,
}: {
  alerts: AlertItem[]
  reports: Report[]
  selectedId: string
  onOpen: (id: string) => void
  onGraph: (clusterId: string) => void
  onCreate: (clusterId?: string) => void
}) {
  const [level, setLevel] = useState("Tất cả mức độ")
  const filtered = alerts.filter(
    (alert) => level === "Tất cả mức độ" || alert.level === level,
  )
  const requested = alerts.find((alert) => alert.id === selectedId)
  const selected =
    filtered.find((alert) => alert.id === requested?.id) ||
    filtered[0] ||
    requested ||
    alerts[0]
  const related = selected.clusterId
    ? reports.filter((report) => report.cluster === selected.clusterId)
    : reports.filter((report) => report.id === selected.reportId)
  const total = related.reduce((sum, report) => sum + report.amount, 0)
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <div className="page-heading">Cảnh báo cần xem xét</div>
          <p className="muted">
            Điểm minh họa dùng để ưu tiên xác minh, không phải kết luận vi phạm.
          </p>
        </div>
      </div>
      <div className="alert-layout">
        <div className="card alert-list">
          <div className="alert-list-head">
            <span>{alerts.length} cảnh báo đang mở</span>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              <option>Tất cả mức độ</option>
              <option>Cao</option>
              <option>Trung bình</option>
              <option>Thấp</option>
            </select>
          </div>
          {filtered.map((alert) => {
            const items = alert.clusterId
              ? reports.filter((report) => report.cluster === alert.clusterId)
              : reports.filter((report) => report.id === alert.reportId)
            const amount = items.reduce((sum, report) => sum + report.amount, 0)
            return (
              <button
                className={`alert-row ${
                  selected.id === alert.id ? "active" : ""
                }`}
                onClick={() => onOpen(alert.id)}
                key={alert.id}
              >
                <div
                  className={`score ${
                    alert.level === "Cao"
                      ? "high"
                      : alert.level === "Trung bình"
                        ? "medium"
                        : "low"
                  }`}
                >
                  {alert.score}
                </div>
                <div>
                  <div className="alert-row-top">
                    <b>
                      {alert.subjectId} · {alert.title}
                    </b>
                    <Badge
                      tone={
                        alert.level === "Cao"
                          ? "red"
                          : alert.level === "Trung bình"
                            ? "orange"
                            : "green"
                      }
                    >
                      {alert.level}
                    </Badge>
                  </div>
                  <p>{alert.description}</p>
                  <span>
                    {items.length} phản ánh · {amount} triệu đồng
                  </span>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="empty">Không có kết quả phù hợp.</div>
          )}
        </div>
        <div className="card alert-side">
          <div
            className="score-ring"
            style={{
              background: `conic-gradient(var(--red) 0 ${selected.score}%,#e9edf1 ${selected.score}%)`,
            }}
          >
            <div>
              <b>{selected.score}</b>
              <span>/100</span>
            </div>
          </div>
          <div className="risk-title">Mức rủi ro {selected.level}</div>
          <p className="muted center">
            {selected.subjectId} · {selected.title}
          </p>
          <div className="factor-mini">
            <span>{selected.description}</span>
            <b>Đã ghi nhận</b>
          </div>
          <div className="factor-mini">
            <span>Số phản ánh liên quan</span>
            <b>{related.length}</b>
          </div>
          <div className="factor-mini">
            <span>Tổng số tiền phản ánh</span>
            <b>{total} triệu</b>
          </div>
          <Button className="full" onClick={() => onOpen(selected.id)}>
            Xem lý do cảnh báo
          </Button>
          {selected.clusterId && (
            <>
              <Button
                variant="secondary"
                className="full"
                onClick={() => onGraph(selected.clusterId!)}
              >
                Mở sơ đồ liên kết
              </Button>
              <Button
                variant="ghost"
                className="full"
                onClick={() => onCreate(selected.clusterId)}
              >
                Tạo hồ sơ
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AlertDetail({
  alert,
  reports,
  onClose,
  onGraph,
  onCreate,
}: {
  alert: AlertItem
  reports: Report[]
  onClose: () => void
  onGraph: () => void
  onCreate: () => void
}) {
  const related = alert.clusterId
    ? reports.filter((report) => report.cluster === alert.clusterId)
    : reports.filter((report) => report.id === alert.reportId)
  const total = related.reduce((sum, report) => sum + report.amount, 0)
  const entityCount = Object.values(getEntities(related)).flat().length
  const factors =
    alert.subjectId === "CUM-001"
      ? [
          ["Nhiều phản ánh cùng nhắc đến một tài khoản", "35 điểm"],
          ["Đối chiếu nguồn và nhóm hành vi trong kịch bản", "12 điểm"],
          ...(reports.some(
            (report) => report.id === "PA-013" && report.cluster === "CUM-001",
          )
            ? [["Có thêm phản ánh đã được cán bộ xác nhận liên kết", "13 điểm"]]
            : []),
          [`Tổng số tiền được phản ánh đạt ${total} triệu đồng`, "15 điểm"],
          ["Dùng chung website và số điện thoại trong dữ liệu mẫu", "10 điểm"],
        ]
      : alert.subjectId === "CUM-002"
        ? [
            ["Nhiều phản ánh có thực thể xuất hiện lặp lại", "30 điểm"],
            [
              `Có ${related.length} phản ánh trong cùng nhóm hành vi`,
              "20 điểm",
            ],
            [`Tổng số tiền được phản ánh là ${total} triệu đồng`, "11 điểm"],
          ]
        : [["Số tiền của phản ánh cần được ưu tiên rà soát", "34 điểm"]]
  return (
    <Modal
      title={`Lý do cảnh báo ${alert.subjectId}`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          {alert.clusterId && (
            <Button variant="secondary" onClick={onGraph}>
              Mở sơ đồ liên kết
            </Button>
          )}
          {alert.clusterId && <Button onClick={onCreate}>Tạo hồ sơ</Button>}
        </>
      }
    >
      <div className="alert-detail-top">
        <div className="score-box">
          <b>{alert.score}</b>
          <span>/100</span>
        </div>
        <div>
          <Badge
            tone={
              alert.level === "Cao"
                ? "red"
                : alert.level === "Trung bình"
                  ? "orange"
                  : "green"
            }
          >
            Mức {alert.level}
          </Badge>
          <div className="section-title">{alert.title}</div>
          <p>
            {related.length} phản ánh · {entityCount} thực thể · {total} triệu
            đồng
          </p>
        </div>
      </div>
      <div className="factor-list">
        {factors.map(([label, point]) => (
          <div className="factor" key={label}>
            <span className="factor-check">✓</span>
            <div>
              <b>{label}</b>
              <span>Dựa trên dữ liệu phản ánh giả lập đã tiếp nhận.</span>
            </div>
            <strong>+{point}</strong>
          </div>
        ))}
      </div>
      <div className="warning-note">
        <b>Nguyên tắc sử dụng</b>
        <span>
          Điểm minh họa dùng để ưu tiên xác minh. Cảnh báo không tự động kết
          luận cá nhân hoặc tổ chức vi phạm.
        </span>
      </div>
    </Modal>
  )
}

function CreateCaseModal({
  cluster,
  reportIds,
  reportCount,
  total,
  onClose,
  onCreate,
  onClusterChange,
}: {
  onClusterChange: (id: string) => void
  cluster: Cluster
  reportIds: string[]
  reportCount: number
  total: number
  onClose: () => void
  onCreate: (value: {
    name: string
    officer: string
    priority: string
    clusterId: string
    reportIds: string[]
  }) => void
}) {
  const [name, setName] = useState(
    `Xác minh ${cluster.name.toLowerCase()} ${cluster.id}`,
  )
  const [officer, setOfficer] = useState("Nguyễn Phân Tích")
  const [priority, setPriority] = useState(cluster.risk)
  return (
    <Modal
      title={`Tạo hồ sơ từ cụm ${cluster.id}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            disabled={!name.trim() || !reportIds.length}
            onClick={() =>
              onCreate({
                name: name.trim(),
                officer,
                priority,
                clusterId: cluster.id,
                reportIds,
              })
            }
          >
            Xác nhận tạo hồ sơ
          </Button>
        </>
      }
    >
      <Field label="Chọn cụm nguồn">
        <select
          value={cluster.id}
          onChange={(e) => onClusterChange(e.target.value)}
        >
          {clusters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} · {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="linked-cluster">
        <span>CỤM LIÊN KẾT</span>
        <b>
          {cluster.id} · {cluster.name}
        </b>
        <small>
          {reportCount} phản ánh · {total} triệu đồng · Mức rủi ro{" "}
          {cluster.risk}
        </small>
      </div>
      <Field label="Tên hồ sơ" required>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Cán bộ phụ trách" required>
        <select
          value={officer}
          onChange={(event) => setOfficer(event.target.value)}
        >
          <option>Nguyễn Phân Tích</option>
          <option>Lê Minh Anh</option>
          <option>Trần Quốc Huy</option>
        </select>
      </Field>
      <Field label="Mức ưu tiên">
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option>Cao</option>
          <option>Trung bình</option>
          <option>Thấp</option>
        </select>
      </Field>
    </Modal>
  )
}

function Cases({
  cases,
  reports,
  onOpen,
  onCreate,
}: {
  cases: CaseFile[]
  reports: Report[]
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Tất cả trạng thái")
  const filtered = cases.filter(
    (item) =>
      `${item.id} ${item.name}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "Tất cả trạng thái" || item.status === status),
  )
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <div className="page-heading">Hồ sơ vụ việc</div>
          <p className="muted">
            Theo dõi quá trình xác minh và tổng hợp nhận định nghiệp vụ.
          </p>
        </div>
        <Button onClick={onCreate}>＋ Tạo hồ sơ phân tích</Button>
      </div>
      <div className="stats-grid case-stats">
        <div className="stat-card">
          <div className="stat-label">Tổng hồ sơ</div>
          <div className="stat-value">{cases.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đang xác minh</div>
          <div className="stat-value">
            {cases.filter((x) => x.status === "Đang xác minh").length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Chờ bổ sung</div>
          <div className="stat-value">
            {cases.filter((x) => x.status === "Chờ bổ sung").length}
          </div>
        </div>
      </div>
      <div className="card filter-card case-filter">
        <div className="search-wrap">
          <span>⌕</span>
          <input
            placeholder="Tìm mã hoặc tên hồ sơ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Tất cả trạng thái</option>
          <option>Mới tạo</option>
          <option>Đang xác minh</option>
          <option>Chờ bổ sung</option>
          <option>Hoàn tất phân tích</option>
        </select>
      </div>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Mã hồ sơ</th>
              <th>Tên hồ sơ</th>
              <th>Nhóm hành vi</th>
              <th>Tổng tiền phản ánh</th>
              <th>Mức ưu tiên</th>
              <th>Cán bộ phụ trách</th>
              <th>Trạng thái</th>
              <th>Ngày cập nhật</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const related = reports.filter((report) =>
                c.reportIds.includes(report.id),
              )
              const total = related.reduce(
                (sum, report) => sum + report.amount,
                0,
              )
              return (
                <tr key={c.id} onClick={() => onOpen(c.id)}>
                  <td>
                    <b className="id-link">{c.id}</b>
                  </td>
                  <td>
                    <div className="cell-title">{c.name}</div>
                    <span className="cell-sub">
                      Nguồn:{" "}
                      {c.clusterId ||
                        `Phản ánh độc lập ${c.reportIds.join(", ")}`}
                    </span>
                  </td>
                  <td>{related[0]?.behavior || "Đang phân loại"}</td>
                  <td>
                    <b>{total} triệu</b>
                  </td>
                  <td>
                    <Badge tone={statusTone(c.priority)}>{c.priority}</Badge>
                  </td>
                  <td>{c.officer}</td>
                  <td>
                    <Badge tone={statusTone(c.status)}>
                      {c.status === "Hoàn tất phân tích"
                        ? "Hoàn tất rà soát"
                        : c.status}
                    </Badge>
                  </td>
                  <td>{formatDateTime(c.updated)}</td>
                  <td>
                    <Button variant="ghost" onClick={() => onOpen(c.id)}>
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CaseDetail({
  item,
  reports,
  canEdit,
  onBack,
  onSave,
  onDenied,
  onLogs,
  onReport,
}: {
  item: CaseFile
  reports: Report[]
  canEdit: boolean
  onBack: () => void
  onSave: (item: CaseFile, detail: string) => void
  onDenied: () => void
  onLogs: () => void
  onReport: (id: string) => void
}) {
  const [tab, setTab] = useState("Tổng quan")
  const [officer, setOfficer] = useState(item.officer)
  const [status, setStatus] = useState(item.status)
  const [note, setNote] = useState(item.note)
  const [reportOpen, setReportOpen] = useState(false)
  const inferredClusterId = item.clusterId
  const reportIds = item.reportIds
  const related = reports.filter((report) => reportIds.includes(report.id))
  const entities = getEntities(related)
  const entityCount =
    entities.accounts.length + entities.phones.length + entities.websites.length
  const total = related.reduce((sum, report) => sum + report.amount, 0)
  const cluster = inferredClusterId
    ? clusters.find((value) => value.id === inferredClusterId)
    : undefined
  const tabs = [
    "Tổng quan",
    "Phản ánh liên quan",
    "Thực thể",
    "Tài liệu",
    "Lịch sử xử lý",
  ]
  const save = () => {
    if (!canEdit) return onDenied()
    const detail = `Cán bộ phụ trách — trước: ${item.officer}; sau: ${officer}. Trạng thái — trước: ${item.status}; sau: ${status}. Nhận định — trước: ${item.note || "Chưa có"}; sau: ${note || "Chưa có"}.`
    onSave(
      {
        ...item,
        reportIds,
        officer,
        status,
        note,
        updated: nowISO(),
        history: [
          `${nowISO()} · Cập nhật cán bộ, trạng thái và nhận định`,
          ...(item.history || []),
        ],
      },
      detail,
    )
  }
  return (
    <div className="page-stack">
      <button className="back-link" onClick={onBack}>
        ← Quay lại danh sách hồ sơ
      </button>
      <div className="detail-hero case-hero">
        <div>
          <div className="detail-code">{item.id}</div>
          <div className="page-heading">{item.name}</div>
          <div className="hero-meta">
            <Badge tone={statusTone(status)}>{status}</Badge>
            <Badge tone={statusTone(item.priority)}>
              Ưu tiên {item.priority}
            </Badge>
            <span>Cập nhật {formatDateTime(item.updated)}</span>
          </div>
        </div>
        <div className="hero-buttons">
          <Button variant="secondary" onClick={onLogs}>
            Xem nhật ký
          </Button>
          <Button onClick={() => setReportOpen(true)}>Xem báo cáo</Button>
        </div>
      </div>
      <div className="tabs">
        {tabs.map((value) => (
          <button
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
            key={value}
          >
            {value}
          </button>
        ))}
      </div>
      {tab === "Tổng quan" ? (
        <div className="case-detail-grid">
          <div className="card detail-card">
            <div className="section-title">Thông tin xử lý</div>
            <div className="two-col">
              <Field label="Cán bộ phụ trách">
                <select
                  value={officer}
                  onChange={(event) => setOfficer(event.target.value)}
                >
                  <option>Nguyễn Phân Tích</option>
                  <option>Lê Minh Anh</option>
                  <option>Trần Quốc Huy</option>
                </select>
              </Field>
              <Field label="Trạng thái">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option>Mới tạo</option>
                  <option>Đang xác minh</option>
                  <option>Chờ bổ sung</option>
                  <option>Hoàn tất phân tích</option>
                </select>
              </Field>
            </div>
            <Field label="Nhận định cán bộ">
              <textarea
                rows={8}
                value={note}
                placeholder="Thêm nhận định nghiệp vụ..."
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
            <div className="save-row">
              <span>Mọi thay đổi sẽ được ghi vào nhật ký hệ thống.</span>
              <Button onClick={save}>Lưu thay đổi</Button>
            </div>
          </div>
          <div className="card case-summary">
            <div className="section-title">Nguồn hồ sơ</div>
            <div className="linked-cluster">
              <span>{cluster ? "CỤM LIÊN KẾT" : "PHẢN ÁNH ĐỘC LẬP"}</span>
              <b>
                {cluster
                  ? `${cluster.id} · ${cluster.name}`
                  : `Phản ánh ${reportIds[0] || "—"}`}
              </b>
              <small>
                {cluster ? `Mức rủi ro ${cluster.risk}` : related[0]?.title}
              </small>
            </div>
            <DetailRows
              rows={[
                ["Phản ánh liên quan", `${related.length} phản ánh`],
                ["Thực thể", `${entityCount} thực thể`],
                ["Tổng số tiền", `${total} triệu đồng`],
                ["Mức ưu tiên", item.priority],
              ]}
            />
          </div>
        </div>
      ) : (
        <CaseTab
          tab={tab}
          item={item}
          related={related}
          entities={entities}
          onReport={onReport}
        />
      )}
      {reportOpen && (
        <ReportModal
          item={{ ...item, clusterId: inferredClusterId, reportIds }}
          reports={related}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}

function CaseTab({
  tab,
  item,
  related,
  entities,
  onReport,
}: {
  tab: string
  item: CaseFile
  related: Report[]
  entities: ReturnType<typeof getEntities>
  onReport: (id: string) => void
}) {
  if (tab === "Phản ánh liên quan")
    return (
      <div className="card table-card">
        <ReportTable reports={related} onOpen={onReport} />
        {related.length === 0 && (
          <div className="empty">Không có kết quả phù hợp.</div>
        )}
      </div>
    )
  if (tab === "Thực thể") {
    const list = [
      ...entities.accounts.map((value) => [
        "TK",
        value,
        related.find((report) => report.account === value)?.bank ||
          "Ngân hàng chưa xác định",
      ]),
      ...entities.phones.map((value) => [
        "SĐT",
        value,
        "Số điện thoại giả lập",
      ]),
      ...entities.websites.map((value) => ["WEB", value, "Website giả lập"]),
    ]
    return (
      <div className="card entity-list">
        {list.map(([type, value, detail]) => (
          <div key={value}>
            <span>{type}</span>
            <b>{value}</b>
            <small>{detail} · Cần xác minh</small>
          </div>
        ))}
        {list.length === 0 && (
          <div className="empty">Không có thực thể được ghi nhận.</div>
        )}
      </div>
    )
  }
  if (tab === "Tài liệu") {
    const documents = related.filter((report) => report.attachment)
    return (
      <div className="card detail-card">
        {documents.map((report) => (
          <div className="file-row" key={report.id}>
            <div className="file-icon">PNG</div>
            <div>
              <b>anh-chuyen-khoan-mau-{report.id}.png</b>
              <span>Tài liệu giả lập · Đính kèm từ {report.id}</span>
            </div>
            <details>
              <summary>Xem bằng chứng mẫu</summary>
              <p>
                Ảnh chuyển khoản mô phỏng · {report.amount} triệu đồng ·{" "}
                {report.account || "Chưa có tài khoản"}. Không phải chứng từ
                thật.
              </p>
            </details>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="empty">Hồ sơ chưa có tài liệu đính kèm.</div>
        )}
      </div>
    )
  }
  return (
    <div className="card timeline">
      {(item.history || []).map((entry) => (
        <div key={entry}>
          <i />
          <b>{entry.split(" · ")[1] || entry}</b>
          <span>{formatDateTime(entry.split(" · ")[0])}</span>
        </div>
      ))}
    </div>
  )
}

function ReportModal({
  item,
  reports,
  onClose,
}: {
  item: CaseFile
  reports: Report[]
  onClose: () => void
}) {
  const entities = getEntities(reports)
  const total = reports.reduce((sum, report) => sum + report.amount, 0)
  const entityText =
    [...entities.accounts, ...entities.phones, ...entities.websites].join(
      ", ",
    ) || "Không có thực thể được ghi nhận"
  const source = item.clusterId
    ? `cụm ${item.clusterId}`
    : `phản ánh ${reports[0]?.id || "—"}`
  return (
    <Modal
      title={`Báo cáo tổng hợp ${item.id}`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={() => window.print()}>In báo cáo</Button>
        </>
      }
    >
      <div className="report-doc">
        <div className="report-header">
          <NetworkMark />
          <div>
            <b>Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao</b>
            <span>BÁO CÁO TỔNG HỢP HỒ SƠ</span>
          </div>
          <small>Demo — dữ liệu giả lập</small>
        </div>
        <div className="report-title">{item.name}</div>
        <DetailRows
          rows={[
            ["Mã hồ sơ", item.id],
            ["Nguồn hồ sơ", source],
            ["Trạng thái", item.status],
            ["Mức ưu tiên", item.priority],
            ["Cán bộ phụ trách", item.officer],
            ["Tổng số tiền", `${total} triệu đồng`],
          ]}
        />
        <div className="report-section">
          <b>Phản ánh liên quan</b>
          <p>
            {reports.length} phản ánh:{" "}
            {reports.map((report) => report.id).join(", ") || "Không có"}.
          </p>
        </div>
        <div className="report-section">
          <b>Thực thể được ghi nhận</b>
          <p>{entityText}.</p>
        </div>
        <div className="report-section">
          <b>Lý do ưu tiên xác minh</b>
          <p>
            Hồ sơ được ưu tiên theo mức {item.priority.toLowerCase()}, dựa trên
            dữ liệu của {source} với tổng số tiền được phản ánh là {total} triệu
            đồng.
          </p>
        </div>
        <div className="report-section">
          <b>Nhận định cán bộ</b>
          <p>
            {item.note ||
              "Chưa có nhận định. Cần tiếp tục đối chiếu tài liệu và xác minh các đầu mối liên quan."}
          </p>
        </div>
        <div className="report-disclaimer">
          Kết quả hỗ trợ phân tích; cần cán bộ xác minh. Báo cáo không phải kết
          luận vi phạm.
        </div>
      </div>
    </Modal>
  )
}

function Accounts({
  role,
  setRole,
  onEdit,
  accountRoles,
}: {
  accountRoles: Record<string, string>
  role: string
  setRole: (r: string) => void
  onEdit: (account: string, role: string) => void
}) {
  const [query, setQuery] = useState("")
  const accounts = [
    [
      "cong.dan.demo",
      "Người dân / Tổ chức",
      "Cổng phản ánh mẫu",
      "Đang hoạt động",
    ],
    [
      "quan.tri.demo",
      "Quản trị hệ thống",
      "Trung tâm quản trị mẫu",
      "Đang hoạt động",
    ],
    ["tiep.nhan.demo", "Cán bộ tiếp nhận", "Đội tiếp nhận A", "Đang hoạt động"],
    [
      "phan.tich.demo",
      "Cán bộ phân tích",
      "Đội phân tích mạng lưới",
      "Đang hoạt động",
    ],
    ["xu.ly.demo", "Cán bộ xử lý hồ sơ", "Đội xác minh mẫu", "Đang hoạt động"],
    [
      "lanh.dao.demo",
      "Lãnh đạo theo dõi",
      "Đơn vị chỉ đạo mẫu",
      "Đang hoạt động",
    ],
    [
      "giam.sat.demo",
      "Kiểm tra, giám sát",
      "Bộ phận giám sát",
      "Đang hoạt động",
    ],
  ]
  return (
    <div className="page-stack">
      <div className="role-switcher">
        <div>
          <div className="section-title">Vai trò demo hiện tại</div>
          <p>Mô phỏng quyền thao tác trên giao diện theo từng vai trò.</p>
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <details className="role-help">
        <summary>Ma trận vai trò và phạm vi mô phỏng</summary>
        <div className="role-grid">
          {roles.map((r, i) => (
            <div
              className={`role-card ${r === role ? "selected" : ""}`}
              key={r}
            >
              <div className="role-code">{String(i + 1).padStart(2, "0")}</div>
              <b>{r}</b>
              <p>
                {
                  [
                    "Quản lý tài khoản và cấu hình; không mặc nhiên xem toàn bộ nội dung nghiệp vụ.",
                    "Tiếp nhận và tạo phản ánh; không chỉnh sửa phân quyền.",
                    "Trích xuất, phân tích liên kết và đánh giá cảnh báo.",
                    "Phân công, cập nhật và hoàn thiện hồ sơ vụ việc.",
                    "Theo dõi số liệu tổng hợp và tiến độ xử lý.",
                    "Xem nhật ký; không chỉnh sửa hồ sơ.",
                  ][i]
                }
              </p>
              {r === role && <Badge tone="blue">Đang sử dụng</Badge>}
            </div>
          ))}
        </div>
      </details>
      <div className="card table-card">
        <CardHead
          title="Danh sách tài khoản giả lập"
          sub="07 tài khoản giả lập · Thay đổi quyền chỉ tác động giao diện demo"
        />
        <div className="account-search">
          <input
            aria-label="Tìm tài khoản"
            placeholder="Tìm tài khoản, vai trò hoặc đơn vị..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Vai trò</th>
              <th>Đơn vị mẫu</th>
              <th>Trạng thái</th>
              <th>Lần truy cập cuối</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts
              .filter((a) =>
                `${a[0]} ${accountRoles[a[0]] || a[1]} ${a[2]}`
                  .toLowerCase()
                  .includes(query.trim().toLowerCase()),
              )
              .map((a, i) => (
                <tr key={a[0]}>
                  <td>
                    <b>{a[0]}</b>
                  </td>
                  <td>{accountRoles[a[0]] || a[1]}</td>
                  <td>{a[2]}</td>
                  <td>
                    <Badge tone="green">{a[3]}</Badge>
                  </td>
                  <td>
                    {i === 2 ? "Phiên mô phỏng" : "Chưa ghi nhận phiên thật"}
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      onClick={() => onEdit(a[0], accountRoles[a[0]] || a[1])}
                    >
                      Sửa vai trò
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Logs({
  logs,
  onOpen,
}: {
  logs: LogItem[]
  onOpen: (x: LogItem) => void
}) {
  const [q, setQ] = useState("")
  const [action, setAction] = useState("Tất cả thao tác")
  const actions = Array.from(new Set(logs.map((x) => x.action)))
  const filtered = useMemo(
    () =>
      logs.filter(
        (x) =>
          `${x.user} ${x.target} ${x.action} ${x.detail || ""}`
            .toLowerCase()
            .includes(q.toLowerCase()) &&
          (action === "Tất cả thao tác" || x.action === action),
      ),
    [logs, q, action],
  )
  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <div className="page-heading">Nhật ký hệ thống</div>
          <p className="muted">
            Theo dõi các thao tác nghiệp vụ và thay đổi dữ liệu trong môi trường
            demo.
          </p>
        </div>
        <Badge tone="green">Ghi nhận tự động</Badge>
      </div>
      <div className="card filter-card">
        <div className="search-wrap">
          <span>⌕</span>
          <input
            placeholder="Tìm tài khoản, đối tượng..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select value={action} onChange={(e) => setAction(e.target.value)}>
          <option>Tất cả thao tác</option>
          {actions.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="card table-card audit-card">
        <table>
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Tài khoản</th>
              <th>Vai trò</th>
              <th>Thao tác</th>
              <th>Đối tượng tác động</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x, i) => (
              <tr key={`${x.time}-${i}`} onClick={() => onOpen(x)}>
                <td>{formatDateTime(x.time)}</td>
                <td>
                  <b>{x.user}</b>
                </td>
                <td>{x.role}</td>
                <td>
                  <span className="action-tag">{x.action}</span>
                </td>
                <td>
                  <b className="id-link">{x.target}</b>
                </td>
                <td>
                  <Badge
                    tone={
                      x.result === "Thành công"
                        ? "green"
                        : x.result === "Cảnh báo"
                          ? "orange"
                          : "red"
                    }
                  >
                    {x.result}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DetailRows({ rows }: { rows: string[][] }) {
  return (
    <div className="detail-rows">
      {rows.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  )
}
