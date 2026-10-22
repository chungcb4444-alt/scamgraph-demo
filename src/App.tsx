import { useEffect, useMemo, useRef, useState } from "react"

type Screen = "dashboard" | "reports" | "new-report" | "report-detail" | "graph" | "alerts" | "cases" | "case-detail" | "accounts" | "logs"

type Report = {
  id: string
  title: string
  source: string
  area: string
  time: string
  amount: number
  status: string
  behavior: string
  content: string
  account?: string
  bank?: string
  phone?: string
  website?: string
  cluster?: string
  attachment?: boolean
}

type CaseFile = {
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

type LogItem = {
  time: string
  user: string
  role: string
  action: string
  target: string
  result: string
  detail?: string
}

type Cluster = {
  id: string
  name: string
  risk: string
  score: number
}

type AlertItem = {
  id: string
  subjectId: string
  clusterId?: string
  reportId?: string
  title: string
  level: "Cao" | "Trung bình" | "Thấp"
  score: number
  description: string
}

const demoText =
  "Tôi nhận được cuộc gọi của người tự xưng là nhân viên ngân hàng, yêu cầu truy cập xacminh-demo.example để xác minh tài khoản. Sau đó tôi chuyển 15.000.000 đồng vào tài khoản DEMO-TK-001 tại Ngân hàng mẫu A. Người liên hệ sử dụng số DEMO-SDT-001. Sau khi chuyển tiền, tôi không liên lạc được."

const initialReports: Report[] = [
  {
    id: "PA-001",
    title: "Cuộc gọi yêu cầu xác minh tài khoản",
    source: "Cổng trực tuyến",
    area: "Hà Nội",
    time: "18/06/2025 09:24",
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
    time: "17/06/2025 15:40",
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
    time: "16/06/2025 11:05",
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
    time: "15/06/2025 14:20",
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
    time: "14/06/2025 10:12",
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
    time: "13/06/2025 16:48",
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
    time: "12/06/2025 09:30",
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
    time: "11/06/2025 13:15",
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
    time: "10/06/2025 08:55",
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
    time: "09/06/2025 19:10",
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
    time: "08/06/2025 10:42",
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
    time: "07/06/2025 12:27",
    amount: 0,
    status: "Mới tiếp nhận",
    behavior: "Đường dẫn giả mạo",
    content: "Tin nhắn chứa đường dẫn yêu cầu cập nhật dịch vụ.",
  },
]

const initialCases: CaseFile[] = [
  {
    id: "HS-001",
    name: "Xác minh nhóm giả danh cơ quan nhà nước",
    priority: "Cao",
    officer: "Lê Minh Anh",
    status: "Đang xác minh",
    updated: "18/06/2025",
    note: "Đối chiếu các đầu mối chung trong CUM-002.",
    reportIds: ["PA-004", "PA-005", "PA-006"],
    clusterId: "CUM-002",
    history: [
      "18/06/2025 08:40 · Chuyển trạng thái sang Đang xác minh",
      "17/06/2025 15:20 · Tạo hồ sơ từ CUM-002",
    ],
  },
  {
    id: "HS-002",
    name: "Rà soát phản ánh đầu tư trực tuyến",
    priority: "Trung bình",
    officer: "Trần Quốc Huy",
    status: "Chờ bổ sung",
    updated: "17/06/2025",
    note: "Chờ bổ sung tài liệu giao dịch giả lập.",
    reportIds: ["PA-008"],
    history: [
      "17/06/2025 14:10 · Chuyển trạng thái sang Chờ bổ sung",
      "17/06/2025 10:05 · Tạo hồ sơ từ phản ánh PA-008",
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
  const hasNew = reports.some((r) => r.id === "PA-013")
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
    accounts: Array.from(new Set(items.flatMap((r) => (r.account ? [r.account] : [])))),
    phones: Array.from(new Set(items.flatMap((r) => (r.phone ? [r.phone] : [])))),
    websites: Array.from(new Set(items.flatMap((r) => (r.website ? [r.website] : [])))),
  }
}

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])
  return [value, setValue] as const
}

const initialLogs: LogItem[] = [
  {
    time: "18/06/2025 09:35",
    user: "phan.tich.demo",
    role: "Cán bộ phân tích",
    action: "Trích xuất mô phỏng",
    target: "PA-001",
    result: "Thành công",
    detail: "Nhận diện 5 thực thể từ nội dung và tài liệu giả lập.",
  },
  {
    time: "18/06/2025 08:40",
    user: "le.minh.anh",
    role: "Cán bộ xử lý hồ sơ",
    action: "Đổi trạng thái",
    target: "HS-001",
    result: "Thành công",
    detail: "Trước: Mới tạo → Sau: Đang xác minh",
  },
  {
    time: "17/06/2025 16:15",
    user: "tiep.nhan.demo",
    role: "Cán bộ tiếp nhận",
    action: "Tạo phản ánh",
    target: "PA-002",
    result: "Thành công",
  },
]

const roles = [
  "Quản trị hệ thống",
  "Cán bộ tiếp nhận",
  "Cán bộ phân tích",
  "Cán bộ xử lý hồ sơ",
  "Lãnh đạo theo dõi",
  "Kiểm tra, giám sát",
]
const navItems: { screen: Screen; label: string; icon: string }[] = [
  { screen: "dashboard", label: "Tổng quan", icon: "TQ" },
  { screen: "reports", label: "Phản ánh", icon: "PA" },
  { screen: "graph", label: "Phân tích liên kết", icon: "LK" },
  { screen: "alerts", label: "Cảnh báo", icon: "CB" },
  { screen: "cases", label: "Hồ sơ vụ việc", icon: "HS" },
  { screen: "accounts", label: "Tài khoản và phân quyền", icon: "PQ" },
  { screen: "logs", label: "Nhật ký hệ thống", icon: "NK" },
]

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
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
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
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <b> *</b>}
      </span>
      {children}
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

function reportWorkflowStatus(value: string) {
  if (["Mới tiếp nhận", "Cần xác minh"].includes(value)) return "Chờ kiểm tra"
  if (value === "Không hợp lệ") return "Không hợp lệ"
  return "Đã kiểm tra"
}

function OperationsTabs({
  active,
  onReports,
  onCases,
}: {
  active: "reports" | "cases" | "detail"
  onReports: () => void
  onCases: () => void
}) {
  return (
    <div className="operations-tabs">
      <button className={active === "reports" ? "active" : ""} onClick={onReports}>
        Tiếp nhận và xác minh
      </button>
      <button className={active === "cases" ? "active" : ""} onClick={onCases}>
        Danh sách hồ sơ
      </button>
      <button className={active === "detail" ? "active" : ""}>
        Chi tiết hồ sơ đang mở
      </button>
    </div>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [screen, setScreen] = useState<Screen>("dashboard")
  const [reports, setReports] = useStoredState<Report[]>(
    "scamgraph-demo-reports",
    initialReports,
  )
  const [cases, setCases] = useStoredState<CaseFile[]>(
    "scamgraph-demo-cases",
    initialCases,
  )
  const [logs, setLogs] = useStoredState<LogItem[]>(
    "scamgraph-demo-logs",
    initialLogs,
  )
  const [selectedReport, setSelectedReport] = useState("PA-001")
  const [selectedCase, setSelectedCase] = useState("HS-001")
  const [selectedCluster, setSelectedCluster] = useState("CUM-001")
  const [selectedAlert, setSelectedAlert] = useState("CB-001")
  const [role, setRole] = useState("Cán bộ phân tích")
  const [toast, setToast] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [caseModal, setCaseModal] = useState(false)
  const [alertModal, setAlertModal] = useState(false)
  const [reportModal, setReportModal] = useState(false)
  const [logModal, setLogModal] = useState<LogItem | null>(null)
  const [accountModal, setAccountModal] = useState(false)

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
        time: `18/06/2025 ${new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        user: "phan.tich.demo",
        role,
        action,
        target,
        result,
        detail,
      },
      ...v,
    ])
  const go = (next: Screen) => setScreen(next)
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
    if (!window.confirm("Khôi phục toàn bộ dữ liệu demo về trạng thái ban đầu?"))
      return
    setReports(initialReports)
    setCases(initialCases)
    setLogs(initialLogs)
    setScreen("dashboard")
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
        }}
      />
    )

  return (
    <div className="app-shell">
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
          {navItems.map((item) => (
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
            <strong>Nguyễn Phân Tích</strong>
            <span>{role}</span>
          </div>
          <button className="more-btn">•••</button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <div className="top-title">{pageTitle(screen)}</div>
            <div className="top-desc">
              Nền tảng phân tích và hỗ trợ truy vết lừa đảo trực tuyến
            </div>
          </div>
          <div className="top-actions">
            <Button variant="ghost" onClick={reset}>
              Đặt lại demo
            </Button>
            <div className="notification">{alerts.length}</div>
          </div>
        </header>
        <main className="content">
          {["reports", "report-detail", "cases", "case-detail"].includes(screen) && (
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
            />
          )}
          {screen === "dashboard" && (
            <Dashboard
              reports={reports}
              cases={cases}
              hasNew={hasNew}
              alerts={alerts}
              onNew={() => go("new-report")}
              onReport={openReport}
              onGraph={openGraph}
              onAlert={openAlert}
            />
          )}
          {screen === "reports" && (
            <Reports
              reports={reports}
              onNew={() => go("new-report")}
              onOpen={openReport}
            />
          )}
          {screen === "new-report" && (
            <NewReport
              hasNew={hasNew}
              reports={reports}
              onCancel={() => go("reports")}
              onSubmit={(report) => {
                setReports((v) => [report, ...v])
                addLog(
                  "Tạo phản ánh",
                  "PA-013",
                  "Tạo từ biểu mẫu demo; liên kết với CUM-001.",
                )
                addLog(
                  "Cảnh báo liên kết",
                  "CUM-001",
                  "PA-013 có tài khoản, website và số điện thoại trùng với cụm.",
                  "Cảnh báo",
                )
                setSelectedReport("PA-013")
                setScreen("report-detail")
                notify("Tạo phản ánh PA-013 thành công")
              }}
            />
          )}
          {screen === "report-detail" && (
            <ReportDetail
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
            <Graph
              cluster={activeCluster}
              reports={clusterReports}
              total={clusterTotal}
              hasNew={hasNew}
              onReport={openReport}
              onAlert={() =>
                openAlert(
                  alerts.find((item) => item.clusterId === activeCluster.id)?.id ||
                    "CB-001",
                )
              }
              onCreateCase={() => setCaseModal(true)}
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
              onCreate={() => setCaseModal(true)}
            />
          )}
          {screen === "case-detail" && (
            <CaseDetail
              item={cases.find((c) => c.id === selectedCase) || cases[0]}
              reports={reports}
              canEdit={role !== "Kiểm tra, giám sát"}
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
              setRole={(r) => {
                setRole(r)
                notify(`Đã chuyển sang vai trò: ${r}`)
              }}
              onEdit={() =>
                role === "Quản trị hệ thống"
                  ? setAccountModal(true)
                  : notify("Bạn không có quyền thực hiện thao tác này", "error")
              }
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
              updated: "18/06/2025 10:00",
              note: "",
              reportIds: data.reportIds,
              clusterId: data.clusterId,
              history: [
                `${new Date().toLocaleString("vi-VN")} · Tạo hồ sơ từ ${data.clusterId}`,
              ],
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
            setAlertModal(false)
            if (activeAlert.clusterId) setSelectedCluster(activeAlert.clusterId)
            setCaseModal(true)
          }}
        />
      )}
      {reportModal && (
        <Modal title="Thông báo" onClose={() => setReportModal(false)}>
          <p>Thông tin đang được cập nhật.</p>
        </Modal>
      )}
      {logModal && (
        <Modal
          title={`Chi tiết nhật ký — ${logModal.action}`}
          onClose={() => setLogModal(null)}
        >
          <DetailRows
            rows={[
              ["Thời gian", logModal.time],
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
                    "tiep.nhan.demo",
                    "Trước: Cán bộ tiếp nhận → Sau: Cán bộ phân tích",
                  )
                  notify("Đã cập nhật vai trò tài khoản")
                }}
              >
                Lưu thay đổi
              </Button>
            </>
          }
        >
          <Field label="Tài khoản">
            <input value="tiep.nhan.demo" readOnly />
          </Field>
          <Field label="Vai trò">
            <select defaultValue="Cán bộ phân tích">
              {roles.map((r) => (
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
  return ({
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
  } as Record<Screen, string>)[screen]
}

function Login({
  onLogin,
}: {
  onLogin: (role: string, screen: Screen) => void
}) {
  const loginRoles = [
    ["Người dân / Tổ chức", "Cán bộ tiếp nhận", "new-report"],
    ["Cán bộ nghiệp vụ", "Cán bộ phân tích", "dashboard"],
    ["Lãnh đạo", "Lãnh đạo theo dõi", "dashboard"],
    ["Quản trị", "Quản trị hệ thống", "accounts"],
  ] as const
  const [loginRole, setLoginRole] = useState<(typeof loginRoles)[number][1]>(
    loginRoles[1][1],
  )
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
            Nhìn thấy mối liên hệ.
            <br />
            Ưu tiên đúng tín hiệu.
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
          <div className="eyebrow">CỔNG TRUY CẬP · MÔ PHỎNG</div>
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
            <input defaultValue="phan.tich.demo" />
          </Field>
          <Field label="Mật khẩu">
            <input type="password" defaultValue="demo1234" />
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
          <div className="login-note">
            <span>i</span>
            <p>
              <b>Môi trường trình diễn</b>
              <br />
              Không sử dụng thông tin tài khoản thật.
            </p>
          </div>
          <div className="secure">
            Bảo mật phiên truy cập · Dữ liệu hoàn toàn giả lập
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
  onNew,
  onReport,
  onGraph,
  onAlert,
}: {
  reports: Report[]
  cases: CaseFile[]
  hasNew: boolean
  alerts: AlertItem[]
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
  const stats = [
    [
      String(reports.length),
      "Tổng phản ánh",
      hasNew ? "+1 hôm nay" : "+3 trong 7 ngày",
      "blue",
    ],
    ["2", "Cụm có liên quan", "1 cụm rủi ro cao", "purple"],
    [
      String(alerts.length),
      "Cảnh báo cần xem",
      hasNew ? "+1 cảnh báo mới" : "Cần ưu tiên",
      "red",
    ],
    [
      String(cases.filter((c) => c.status !== "Hoàn tất phân tích").length),
      "Hồ sơ đang xử lý",
      "1 chờ bổ sung",
      "orange",
    ],
  ]
  return (
    <div className="page-stack">
      <div className="welcome-row">
        <div>
          <div className="page-heading">Chào buổi sáng, Nguyễn Phân Tích</div>
          <p className="muted">
            Tổng hợp dữ liệu nghiệp vụ đến 09:45, ngày 18/06/2025
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
              PA-013 đã được liên kết theo tài khoản, website và số điện thoại
              dùng chung.
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
            title="Phản ánh theo thời gian"
            sub="7 ngày gần nhất"
            action="Tuần này"
          />
          <div className="chart">
            <div className="y-axis">
              <span>6</span>
              <span>4</span>
              <span>2</span>
              <span>0</span>
            </div>
            <svg viewBox="0 0 700 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2878d0" stopOpacity=".25" />
                  <stop offset="100%" stopColor="#2878d0" stopOpacity=".02" />
                </linearGradient>
              </defs>
              <path
                d="M0,142 L110,110 L220,128 L330,62 L440,92 L550,42 L700,70 L700,180 L0,180Z"
                fill="url(#area)"
              />
              <polyline
                points="0,142 110,110 220,128 330,62 440,92 550,42 700,70"
                fill="none"
                stroke="#2878d0"
                strokeWidth="3"
              />
              {[
                [0, 142],
                [110, 110],
                [220, 128],
                [330, 62],
                [440, 92],
                [550, 42],
                [700, 70],
              ].map(([x, y]) => (
                <circle
                  key={x}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke="#2878d0"
                  strokeWidth="3"
                />
              ))}
            </svg>
            <div className="x-axis">
              <span>12/06</span>
              <span>13/06</span>
              <span>14/06</span>
              <span>15/06</span>
              <span>16/06</span>
              <span>17/06</span>
              <span>18/06</span>
            </div>
          </div>
        </div>
        <div className="card behavior-card">
          <CardHead title="Nhóm hành vi" sub="Theo số phản ánh" />
          <div className="donut-row">
            <div className="donut">
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
            onAction={() => {}}
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
                  className={`risk-line ${cluster.risk !== "Cao" ? "orange" : ""}`}
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
  const filtered = reports.filter(
    (r) =>
      `${r.id} ${r.title}`.toLowerCase().includes(query.toLowerCase()) &&
      (status.startsWith("Tất cả") || reportWorkflowStatus(r.status) === status) &&
      (behavior.startsWith("Tất cả") || r.behavior === behavior),
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
      <div className="card filter-card">
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
      </div>
      <div className="card table-card">
        <div className="table-summary">
          <span>
            Hiển thị <b>{filtered.length}</b> phản ánh
          </span>
          <span>Cập nhật vừa xong</span>
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
              <td>{r.time}</td>
              <td>
                <b>{r.amount ? `${r.amount} triệu` : "—"}</b>
              </td>
              <td>
                <Badge tone={statusTone(r.status)}>{reportWorkflowStatus(r.status)}</Badge>
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
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
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
      time: "2025-06-18T09:45",
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
      .filter(([, v]) => !v)
      .map(([k]) => k)
    if (missing.length) return setErrors(missing)
    if (hasNew)
      return setErrors([
        "PA-013 đã tồn tại. Vui lòng đặt lại demo trước khi tạo lại",
      ])
    submittingRef.current = true
    setSubmitted(true)
    onSubmit({
      id: "PA-013",
      title: form.title,
      content: form.content,
      source: form.source,
      area: form.area,
      time: "18/06/2025 09:45",
      amount: 15,
      status: "Có liên quan",
      behavior: "Giả danh ngân hàng",
      account: "DEMO-TK-001",
      bank: "Ngân hàng mẫu A",
      phone: "DEMO-SDT-001",
      website: "xacminh-demo.example",
      cluster: "CUM-001",
      attachment: form.attachment,
    })
  }
  return (
    <div className="form-layout report-wizard">
      <div className="form-main card">
        <div className="wizard-steps">
          {["Thông tin người gửi", "Chi tiết vụ việc", "Bằng chứng", "Xác nhận"].map(
            (label, index) => (
              <button
                key={label}
                className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""}
                onClick={() => setStep(index + 1)}
              >
                <span>{index + 1}</span>
                {label}
              </button>
            ),
          )}
        </div>
        <div className="section-head">
          <div>
            <div className="section-title">
              {["Thông tin người gửi", "Chi tiết vụ việc", "Bằng chứng", "Xác nhận"][
                step - 1
              ]}
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
            <Field label="Số điện thoại liên hệ mẫu">
              <input
                placeholder="Không nhập số điện thoại thật"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <div className="simulation-note">
              Thông tin định danh trong màn hình này chỉ dùng để mô phỏng luồng tiếp
              nhận. Không nhập dữ liệu cá nhân thật.
            </div>
          </div>
        )}
        {step === 2 && <div className="form-grid">
          <Field
            label="Tiêu đề"
            required
            error={errors.includes("Tiêu đề") ? "Vui lòng nhập tiêu đề." : undefined}
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
              error={errors.includes("Địa bàn") ? "Vui lòng chọn địa bàn." : undefined}
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
        </div>}
        {step === 3 && (
          <div className="evidence-step">
            {form.attachment ? (
              <div className="receipt-preview">
                <div className="receipt-top"><span>NGÂN HÀNG MẪU A</span><b>ẢNH XEM TRƯỚC</b></div>
                <div className="receipt-amount">15.000.000 đ</div>
                <div className="receipt-row"><span>Tài khoản nhận</span><b>DEMO-TK-001</b></div>
                <div className="watermark">TÀI LIỆU GIẢ LẬP</div>
              </div>
            ) : (
              <div className="upload-empty">
                <div className="upload-icon">↑</div>
                <b>Chọn ảnh bằng chứng mẫu</b>
                <span>Ảnh sẽ được xem trước trước khi gửi.</span>
              </div>
            )}
            <Button variant="secondary" onClick={() => setForm({ ...form, attachment: true })}>
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
                ["Số tiền", form.amount ? `${Number(form.amount).toLocaleString("vi-VN")} đồng` : "0 đồng"],
                ["Bằng chứng", form.attachment ? "01 ảnh giả lập" : "Chưa có"],
              ]}
            />
            <p>{form.content || "Chưa nhập nội dung phản ánh."}</p>
          </div>
        )}
        <div className="wizard-actions">
          <Button variant="secondary" onClick={() => step === 1 ? onCancel() : setStep(step - 1)}>
            {step === 1 ? "Hủy" : "Quay lại"}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)}>Tiếp tục →</Button>
          ) : (
            <Button onClick={submit} disabled={submitted}>
              {submitted ? "Đang gửi..." : "Gửi phản ánh"}
            </Button>
          )}
        </div>
      </div>
      <div className="form-side">
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
                <b>18/06/2025 09:32</b>
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
        <CardHead title="Lịch sử phản ánh gần đây" sub="Dữ liệu demo đã tiếp nhận" />
        <ReportTable reports={reports.slice(0, 4)} onOpen={() => {}} compact />
      </div>
    </div>
  )
}

function ReportDetail({
  report,
  onBack,
  onGraph,
  onLog,
  onUpdate,
  notify,
}: {
  report: Report
  onBack: () => void
  onGraph: () => void
  onLog: (a: string, t: string, d?: string) => void
  onUpdate: (report: Report) => void
  notify: (x: string) => void
}) {
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(report.id !== "PA-013")
  const [phone, setPhone] = useState(report.phone || "—")
  const run = () => {
    setExtracting(true)
    window.setTimeout(() => {
      setExtracting(false)
      setExtracted(true)
      onLog(
        "Trích xuất mô phỏng",
        report.id,
        "Nhận diện tài khoản, ngân hàng, số điện thoại, website và số tiền.",
      )
      notify("Trích xuất thông tin hoàn tất")
    }, 1100)
  }
  return (
    <div className="page-stack">
      <button className="back-link" onClick={onBack}>
        ← Quay lại danh sách phản ánh
      </button>
      <div className="detail-hero">
        <div>
          <div className="detail-code">{report.id}</div>
          <div className="page-heading">{report.title}</div>
          <div className="hero-meta">
            <Badge tone={statusTone(report.status)}>{report.status}</Badge>
            <span>{report.source}</span>
            <span>{report.time}</span>
          </div>
        </div>
        {report.cluster ? (
          <Button onClick={onGraph}>Xem phản ánh liên quan →</Button>
        ) : (
          <div className="no-related">
            <b>Chưa tìm thấy phản ánh liên quan</b>
            <span>Phản ánh này đang được theo dõi độc lập.</span>
          </div>
        )}
      </div>
      <div className="detail-grid">
        <div className="page-stack">
          <div className="card detail-card">
            <CardHead
              title="Nội dung gốc"
              sub="Thông tin do người phản ánh cung cấp"
            />
            <div className="quote-content">{report.content}</div>
            <div className="meta-grid">
              <div>
                <span>Địa bàn</span>
                <b>{report.area}</b>
              </div>
              <div>
                <span>Số tiền phản ánh</span>
                <b>{report.amount} triệu đồng</b>
              </div>
              <div>
                <span>Nhóm hành vi</span>
                <b>{report.behavior}</b>
              </div>
            </div>
          </div>
          <div className="card detail-card">
            <CardHead
              title="Tài liệu đính kèm"
              sub={
                report.attachment ? "01 tài liệu giả lập" : "Không có tài liệu"
              }
            />
            {report.attachment ? (
              <div className="file-row">
                <div className="file-icon">PNG</div>
                <div>
                  <b>anh-chuyen-khoan-mau.png</b>
                  <span>Tài liệu giả lập · 248 KB</span>
                </div>
                <Button variant="secondary">Xem trước</Button>
              </div>
            ) : (
              <div className="empty">Không có tài liệu đính kèm.</div>
            )}
          </div>
        </div>
        <div className="card extraction">
          <div className="extraction-head">
            <div>
              <div className="section-title">Thông tin trích xuất</div>
              <p className="muted">Kết quả trích xuất mô phỏng</p>
            </div>
            {!extracted && (
              <Button onClick={run} disabled={extracting}>
                {extracting ? "Đang xử lý mô phỏng..." : "Trích xuất thông tin"}
              </Button>
            )}
          </div>
          {extracting && (
            <div className="processing">
              <div className="spinner" />
              <b>Đang xử lý mô phỏng</b>
              <span>Phân tích nội dung và tài liệu đính kèm...</span>
            </div>
          )}
          {extracted && (
            <div className="entity-form">
              <Field label="Tài khoản ngân hàng">
                <input defaultValue={report.account || "Không phát hiện"} />
              </Field>
              <Field label="Ngân hàng">
                <input defaultValue={report.bank || "Không phát hiện"} />
              </Field>
              <Field label="Số điện thoại">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
              <Field label="Website">
                <input defaultValue={report.website || "Không phát hiện"} />
              </Field>
              <Field label="Số tiền">
                <input defaultValue={`${report.amount}.000.000 đồng`} />
              </Field>
              <div className="extraction-note">
                <span>i</span>Kết quả chỉ hỗ trợ phân tích; cần cán bộ kiểm tra
                và xác minh.
              </div>
              <Button
                variant="secondary"
                className="full"
                onClick={() => {
                  onLog(
                    "Chỉnh sửa dữ liệu",
                    report.id,
                    `Trước: ${report.phone || "—"} → Sau: ${phone}`,
                  )
                  onUpdate({ ...report, phone: phone === "—" ? undefined : phone })
                  notify("Đã lưu điều chỉnh")
                }}
              >
                Lưu điều chỉnh
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Graph({
  cluster,
  reports,
  total,
  hasNew,
  onReport,
  onAlert,
  onCreateCase,
}: {
  cluster: Cluster
  reports: Report[]
  total: number
  hasNew: boolean
  onReport: (id: string) => void
  onAlert: () => void
  onCreateCase: () => void
}) {
  const entities = getEntities(reports)
  const initialEntity = entities.accounts[0] || entities.phones[0] || entities.websites[0] || reports[0]?.id || ""
  const [selected, setSelected] = useState(initialEntity)
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState("Tất cả thực thể")
  useEffect(() => {
    setSelected(initialEntity)
    setFilter("Tất cả thực thể")
    setZoom(1)
  }, [cluster.id])
  const showReports = filter === "Tất cả thực thể" || filter === "Phản ánh"
  const showAccounts = filter === "Tất cả thực thể" || filter === "Tài khoản ngân hàng"
  const showPhones = filter === "Tất cả thực thể" || filter === "Số điện thoại"
  const showWebsites = filter === "Tất cả thực thể" || filter === "Website"
  const entityReports = reports.filter(
    (report) =>
      report.account === selected ||
      report.phone === selected ||
      report.website === selected,
  )
  const selectedReport = reports.find((report) => report.id === selected)
  const positions = [
    { left: "12%", top: "16%" },
    { left: "12%", top: "48%" },
    { left: "12%", top: "80%" },
    { left: "35%", top: "80%" },
  ]
  const accountPosition = { left: "48%", top: "25%" }
  const phonePosition = { left: "72%", top: "50%" }
  const websitePosition = { left: "48%", top: "72%" }
  const score = cluster.id === "CUM-001" && hasNew ? 85 : cluster.score
  const tone = cluster.risk === "Cao" ? "red" : "orange"

  return (
    <div className="graph-page">
      <div className="cluster-summary">
        <div>
          <span className="cluster-id">{cluster.id}</span>
          <div className="cluster-name">{cluster.name}</div>
          <p>Kết quả hỗ trợ phân tích; cần cán bộ xác minh.</p>
        </div>
        <div className="cluster-numbers">
          <div><span>Phản ánh</span><b>{reports.length}</b></div>
          <div><span>Tổng số tiền</span><b>{total} triệu</b></div>
          <div><span>Mức rủi ro</span><Badge tone={tone}>{cluster.risk} · {score}/100</Badge></div>
        </div>
        <div className="cluster-actions">
          <Button variant="secondary" onClick={onAlert}>Xem lý do cảnh báo</Button>
          <Button onClick={onCreateCase}>Tạo hồ sơ từ cụm</Button>
        </div>
      </div>
      <div className="graph-toolbar">
        <div className="legend">
          <span><i className="node-report" />Phản ánh</span>
          <span><i className="node-account" />Tài khoản</span>
          <span><i className="node-phone" />Số điện thoại</span>
          <span><i className="node-web" />Website</span>
        </div>
        <div className="graph-controls">
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option>Tất cả thực thể</option><option>Phản ánh</option><option>Tài khoản ngân hàng</option><option>Số điện thoại</option><option>Website</option>
          </select>
          <button onClick={() => setZoom(Math.min(1.3, zoom + 0.1))}>＋</button>
          <button onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}>−</button>
          <button onClick={() => setZoom(1)}>⟲</button>
        </div>
      </div>
      <div className="graph-workspace">
        <div className="graph-canvas">
          <div className="graph-inner" style={{ transform: `scale(${zoom})` }}>
            {filter === "Tất cả thực thể" && (
              <svg className="edges" viewBox="0 0 900 520" preserveAspectRatio="none">
                {reports.map((report, index) => {
                  const y = [83, 250, 416, 416][index] || 250
                  const x = index === 3 ? 315 : 108
                  return <g key={report.id}>
                    {report.account && <line x1={x} y1={y} x2="432" y2="130" />}
                    {report.phone && <line x1={x} y1={y} x2="648" y2="260" />}
                    {report.website && <line x1={x} y1={y} x2="432" y2="374" />}
                  </g>
                })}
              </svg>
            )}
            {showReports && reports.map((report, index) => (
              <button key={report.id} className={`graph-node report-node ${selected === report.id ? "selected" : ""}`} style={positions[index]} onClick={() => setSelected(report.id)}>
                <span>PA</span><b>{report.id}</b><small>{report.amount} triệu đồng</small>
              </button>
            ))}
            {showAccounts && entities.accounts.map((account, index) => (
              <button key={account} className={`graph-node account-node ${selected === account ? "selected" : ""}`} style={{ ...accountPosition, top: `${25 + index * 12}%` }} onClick={() => setSelected(account)}>
                <span>TK</span><b>{account}</b><small>Phản ánh ghi nhận chuyển tiền đến</small>
              </button>
            ))}
            {showPhones && entities.phones.map((phone, index) => (
              <button key={phone} className={`graph-node phone-node ${selected === phone ? "selected" : ""}`} style={{ ...phonePosition, top: `${50 + index * 12}%` }} onClick={() => setSelected(phone)}>
                <span>SĐT</span><b>{phone}</b><small>Liên hệ qua</small>
              </button>
            ))}
            {showWebsites && entities.websites.map((website, index) => (
              <button key={website} className={`graph-node web-node ${selected === website ? "selected" : ""}`} style={{ ...websitePosition, top: `${72 + index * 12}%` }} onClick={() => setSelected(website)}>
                <span>WEB</span><b>{website}</b><small>Nhắc đến</small>
              </button>
            ))}
          </div>
          {filter === "Tất cả thực thể" && <div className="relation-legend">
            <span>Phản ánh ghi nhận chuyển tiền đến</span><span>Liên hệ qua</span><span>Nhắc đến</span>
          </div>}
        </div>
        <div className="info-panel">
          <div className="info-head"><span>THÔNG TIN NÚT</span><Badge tone={selected.startsWith("PA") ? "blue" : "purple"}>{selected.startsWith("PA") ? "Phản ánh" : "Thực thể"}</Badge></div>
          {selectedReport ? (
            <><div className="entity-icon blue">PA</div><div className="info-title">{selectedReport.id}</div><div className="info-sub">{selectedReport.title}</div><p className="info-content">{selectedReport.content}</p><Button variant="secondary" className="full" onClick={() => onReport(selectedReport.id)}>Mở chi tiết phản ánh</Button></>
          ) : (
            <><div className="entity-icon">ID</div><div className="info-title">{selected}</div><div className="info-sub">Thực thể trong dữ liệu mẫu</div><DetailRows rows={[["Số phản ánh", String(entityReports.length)], ["Tổng số tiền", `${entityReports.reduce((sum, report) => sum + report.amount, 0)} triệu đồng`], ["Đánh giá", "Có dấu hiệu liên quan"]]} /><div className="related-title">Nguồn liên kết</div>{entityReports.map((report) => <button className="source-evidence" key={report.id} onClick={() => onReport(report.id)}><b>{report.id}</b><span>{report.content}</span><small>→</small></button>)}</>
          )}
        </div>
      </div>
    </div>
  )
}

function Alerts({ alerts, reports, selectedId, onOpen, onGraph, onCreate }: {
  alerts: AlertItem[]
  reports: Report[]
  selectedId: string
  onOpen: (id: string) => void
  onGraph: (clusterId: string) => void
  onCreate: (clusterId?: string) => void
}) {
  const [level, setLevel] = useState("Tất cả mức độ")
  const filtered = alerts.filter((alert) => level === "Tất cả mức độ" || alert.level === level)
  const requested = alerts.find((alert) => alert.id === selectedId)
  const selected =
    filtered.find((alert) => alert.id === requested?.id) ||
    filtered[0] ||
    requested ||
    alerts[0]
  const related = selected.clusterId ? reports.filter((report) => report.cluster === selected.clusterId) : reports.filter((report) => report.id === selected.reportId)
  const total = related.reduce((sum, report) => sum + report.amount, 0)
  return <div className="page-stack">
    <div className="page-title-row"><div><div className="page-heading">Cảnh báo cần xem xét</div><p className="muted">Điểm minh họa dùng để ưu tiên xác minh, không phải kết luận vi phạm.</p></div></div>
    <div className="alert-layout">
      <div className="card alert-list">
        <div className="alert-list-head"><span>{alerts.length} cảnh báo đang mở</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>Tất cả mức độ</option><option>Cao</option><option>Trung bình</option><option>Thấp</option></select></div>
        {filtered.map((alert) => {
          const items = alert.clusterId ? reports.filter((report) => report.cluster === alert.clusterId) : reports.filter((report) => report.id === alert.reportId)
          const amount = items.reduce((sum, report) => sum + report.amount, 0)
          return <button className={`alert-row ${selected.id === alert.id ? "active" : ""}`} onClick={() => onOpen(alert.id)} key={alert.id}>
            <div className={`score ${alert.level === "Cao" ? "high" : alert.level === "Trung bình" ? "medium" : "low"}`}>{alert.score}</div>
            <div><div className="alert-row-top"><b>{alert.subjectId} · {alert.title}</b><Badge tone={alert.level === "Cao" ? "red" : alert.level === "Trung bình" ? "orange" : "green"}>{alert.level}</Badge></div><p>{alert.description}</p><span>Cập nhật 18/06/2025 09:45 · {items.length} phản ánh · {amount} triệu đồng</span></div>
          </button>
        })}
        {filtered.length === 0 && <div className="empty">Không có kết quả phù hợp.</div>}
      </div>
      <div className="card alert-side">
        <div className="score-ring" style={{ background: `conic-gradient(var(--red) 0 ${selected.score}%,#e9edf1 ${selected.score}%)` }}><div><b>{selected.score}</b><span>/100</span></div></div>
        <div className="risk-title">Mức rủi ro {selected.level}</div><p className="muted center">{selected.subjectId} · {selected.title}</p>
        <div className="factor-mini"><span>{selected.description}</span><b>Đã ghi nhận</b></div>
        <div className="factor-mini"><span>Số phản ánh liên quan</span><b>{related.length}</b></div>
        <div className="factor-mini"><span>Tổng số tiền phản ánh</span><b>{total} triệu</b></div>
        <Button className="full" onClick={() => onOpen(selected.id)}>Xem lý do cảnh báo</Button>
        {selected.clusterId && <><Button variant="secondary" className="full" onClick={() => onGraph(selected.clusterId!)}>Mở sơ đồ liên kết</Button><Button variant="ghost" className="full" onClick={() => onCreate(selected.clusterId)}>Tạo hồ sơ</Button></>}
      </div>
    </div>
  </div>
}

function AlertDetail({ alert, reports, onClose, onGraph, onCreate }: {
  alert: AlertItem
  reports: Report[]
  onClose: () => void
  onGraph: () => void
  onCreate: () => void
}) {
  const related = alert.clusterId ? reports.filter((report) => report.cluster === alert.clusterId) : reports.filter((report) => report.id === alert.reportId)
  const total = related.reduce((sum, report) => sum + report.amount, 0)
  const entityCount = Object.values(getEntities(related)).flat().length
  const factors = alert.subjectId === "CUM-001" ? [
    ["Nhiều phản ánh cùng nhắc đến một tài khoản", "35 điểm"],
    ...(reports.some((report) => report.id === "PA-013") ? [["Có thêm phản ánh liên quan trong khoảng thời gian ngắn", "25 điểm"]] : []),
    [`Tổng số tiền được phản ánh đạt ${total} triệu đồng`, "15 điểm"],
    ["Dùng chung website và số điện thoại trong dữ liệu mẫu", "10 điểm"],
  ] : alert.subjectId === "CUM-002" ? [
    ["Nhiều phản ánh có thực thể xuất hiện lặp lại", "30 điểm"],
    [`Có ${related.length} phản ánh trong cùng nhóm hành vi`, "20 điểm"],
    [`Tổng số tiền được phản ánh là ${total} triệu đồng`, "11 điểm"],
  ] : [["Số tiền của phản ánh cần được ưu tiên rà soát", "34 điểm"]]
  return <Modal title={`Lý do cảnh báo ${alert.subjectId}`} onClose={onClose} wide footer={<><Button variant="secondary" onClick={onClose}>Đóng</Button>{alert.clusterId && <Button variant="secondary" onClick={onGraph}>Mở sơ đồ liên kết</Button>}{alert.clusterId && <Button onClick={onCreate}>Tạo hồ sơ</Button>}</>}>
    <div className="alert-detail-top"><div className="score-box"><b>{alert.score}</b><span>/100</span></div><div><Badge tone={alert.level === "Cao" ? "red" : alert.level === "Trung bình" ? "orange" : "green"}>Mức {alert.level}</Badge><div className="section-title">{alert.title}</div><p>{related.length} phản ánh · {entityCount} thực thể · {total} triệu đồng</p></div></div>
    <div className="factor-list">{factors.map(([label, point]) => <div className="factor" key={label}><span className="factor-check">✓</span><div><b>{label}</b><span>Dựa trên dữ liệu phản ánh giả lập đã tiếp nhận.</span></div><strong>+{point}</strong></div>)}</div>
    <div className="warning-note"><b>Nguyên tắc sử dụng</b><span>Điểm minh họa dùng để ưu tiên xác minh. Cảnh báo không tự động kết luận cá nhân hoặc tổ chức vi phạm.</span></div>
  </Modal>
}

function CreateCaseModal({ cluster, reportIds, reportCount, total, onClose, onCreate }: {
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
  const [name, setName] = useState(`Xác minh ${cluster.name.toLowerCase()} ${cluster.id}`)
  const [officer, setOfficer] = useState("Nguyễn Phân Tích")
  const [priority, setPriority] = useState(cluster.risk)
  return <Modal title={`Tạo hồ sơ từ cụm ${cluster.id}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button onClick={() => onCreate({ name, officer, priority, clusterId: cluster.id, reportIds })}>Xác nhận tạo hồ sơ</Button></>}>
    <div className="linked-cluster"><span>CỤM LIÊN KẾT</span><b>{cluster.id} · {cluster.name}</b><small>{reportCount} phản ánh · {total} triệu đồng · Mức rủi ro {cluster.risk}</small></div>
    <Field label="Tên hồ sơ" required><input value={name} onChange={(event) => setName(event.target.value)} /></Field>
    <Field label="Cán bộ phụ trách" required><select value={officer} onChange={(event) => setOfficer(event.target.value)}><option>Nguyễn Phân Tích</option><option>Lê Minh Anh</option><option>Trần Quốc Huy</option></select></Field>
    <Field label="Mức ưu tiên"><select value={priority} onChange={(event) => setPriority(event.target.value)}><option>Cao</option><option>Trung bình</option><option>Thấp</option></select></Field>
  </Modal>
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
          <input placeholder="Tìm mã hoặc tên hồ sơ..." value={query} onChange={(e) => setQuery(e.target.value)} />
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
              const related = reports.filter((report) => c.reportIds.includes(report.id))
              const total = related.reduce((sum, report) => sum + report.amount, 0)
              return (
              <tr key={c.id} onClick={() => onOpen(c.id)}>
                <td>
                  <b className="id-link">{c.id}</b>
                </td>
                <td>
                  <div className="cell-title">{c.name}</div>
                  <span className="cell-sub">Nguồn: Cụm liên kết</span>
                </td>
                <td>{related[0]?.behavior || "Đang phân loại"}</td>
                <td><b>{total} triệu</b></td>
                <td>
                  <Badge tone={statusTone(c.priority)}>{c.priority}</Badge>
                </td>
                <td>{c.officer}</td>
                <td>
                  <Badge tone={statusTone(c.status)}>
                    {c.status === "Hoàn tất phân tích" ? "Hoàn tất rà soát" : c.status}
                  </Badge>
                </td>
                <td>{c.updated}</td>
                <td><Button variant="ghost" onClick={() => onOpen(c.id)}>Chi tiết</Button></td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CaseDetail({ item, reports, canEdit, onBack, onSave, onDenied, onLogs }: {
  item: CaseFile
  reports: Report[]
  canEdit: boolean
  onBack: () => void
  onSave: (item: CaseFile, detail: string) => void
  onDenied: () => void
  onLogs: () => void
}) {
  const [tab, setTab] = useState("Tổng quan")
  const [officer, setOfficer] = useState(item.officer)
  const [status, setStatus] = useState(item.status)
  const [note, setNote] = useState(item.note)
  const [reportOpen, setReportOpen] = useState(false)
  const inferredClusterId =
    item.clusterId ||
    (item.id !== "HS-001" &&
    item.id !== "HS-002" &&
    item.name.toLowerCase().includes("ngân hàng")
      ? "CUM-001"
      : undefined)
  const reportIds =
    item.reportIds ||
    (item.id === "HS-001"
      ? ["PA-004", "PA-005", "PA-006"]
      : item.id === "HS-002"
        ? ["PA-008"]
        : reports
            .filter((report) => report.cluster === inferredClusterId)
            .map((report) => report.id))
  const related = reports.filter((report) => reportIds.includes(report.id))
  const entities = getEntities(related)
  const entityCount = entities.accounts.length + entities.phones.length + entities.websites.length
  const total = related.reduce((sum, report) => sum + report.amount, 0)
  const cluster = inferredClusterId
    ? clusters.find((value) => value.id === inferredClusterId)
    : undefined
  const tabs = ["Tổng quan", "Phản ánh liên quan", "Thực thể", "Tài liệu", "Lịch sử xử lý"]
  const save = () => {
    if (!canEdit) return onDenied()
    const detail = `Cán bộ phụ trách — trước: ${item.officer}; sau: ${officer}. Trạng thái — trước: ${item.status}; sau: ${status}. Nhận định — trước: ${item.note || "Chưa có"}; sau: ${note || "Chưa có"}.`
    onSave({ ...item, reportIds, officer, status, note, updated: "18/06/2025 10:05", history: [`18/06/2025 10:05 · Cập nhật cán bộ, trạng thái và nhận định`, ...(item.history || [])] }, detail)
  }
  return <div className="page-stack">
    <button className="back-link" onClick={onBack}>← Quay lại danh sách hồ sơ</button>
    <div className="detail-hero case-hero"><div><div className="detail-code">{item.id}</div><div className="page-heading">{item.name}</div><div className="hero-meta"><Badge tone={statusTone(status)}>{status}</Badge><Badge tone={statusTone(item.priority)}>Ưu tiên {item.priority}</Badge><span>Cập nhật {item.updated}</span></div></div><div className="hero-buttons"><Button variant="secondary" onClick={onLogs}>Xem nhật ký</Button><Button onClick={() => setReportOpen(true)}>Xem báo cáo</Button></div></div>
    <div className="tabs">{tabs.map((value) => <button className={tab === value ? "active" : ""} onClick={() => setTab(value)} key={value}>{value}</button>)}</div>
    {tab === "Tổng quan" ? <div className="case-detail-grid">
      <div className="card detail-card"><div className="section-title">Thông tin xử lý</div><div className="two-col"><Field label="Cán bộ phụ trách"><select value={officer} onChange={(event) => setOfficer(event.target.value)}><option>Nguyễn Phân Tích</option><option>Lê Minh Anh</option><option>Trần Quốc Huy</option></select></Field><Field label="Trạng thái"><select value={status} onChange={(event) => setStatus(event.target.value)}><option>Mới tạo</option><option>Đang xác minh</option><option>Chờ bổ sung</option><option>Hoàn tất phân tích</option></select></Field></div><Field label="Nhận định cán bộ"><textarea rows={8} value={note} placeholder="Thêm nhận định nghiệp vụ..." onChange={(event) => setNote(event.target.value)} /></Field><div className="save-row"><span>Mọi thay đổi sẽ được ghi vào nhật ký hệ thống.</span><Button onClick={save}>Lưu thay đổi</Button></div></div>
      <div className="card case-summary"><div className="section-title">Nguồn hồ sơ</div><div className="linked-cluster"><span>{cluster ? "CỤM LIÊN KẾT" : "PHẢN ÁNH ĐỘC LẬP"}</span><b>{cluster ? `${cluster.id} · ${cluster.name}` : `Phản ánh ${reportIds[0] || "—"}`}</b><small>{cluster ? `Mức rủi ro ${cluster.risk}` : related[0]?.title}</small></div><DetailRows rows={[["Phản ánh liên quan", `${related.length} phản ánh`], ["Thực thể", `${entityCount} thực thể`], ["Tổng số tiền", `${total} triệu đồng`], ["Mức ưu tiên", item.priority]]} /></div>
    </div> : <CaseTab tab={tab} item={item} related={related} entities={entities} />}
    {reportOpen && <ReportModal item={{ ...item, clusterId: inferredClusterId, reportIds, officer, status, note }} reports={related} onClose={() => setReportOpen(false)} />}
  </div>
}

function CaseTab({ tab, item, related, entities }: {
  tab: string
  item: CaseFile
  related: Report[]
  entities: ReturnType<typeof getEntities>
}) {
  if (tab === "Phản ánh liên quan") return <div className="card table-card"><ReportTable reports={related} onOpen={() => {}} />{related.length === 0 && <div className="empty">Không có kết quả phù hợp.</div>}</div>
  if (tab === "Thực thể") {
    const list = [
      ...entities.accounts.map((value) => ["TK", value, related.find((report) => report.account === value)?.bank || "Ngân hàng chưa xác định"]),
      ...entities.phones.map((value) => ["SĐT", value, "Số điện thoại giả lập"]),
      ...entities.websites.map((value) => ["WEB", value, "Website giả lập"]),
    ]
    return <div className="card entity-list">{list.map(([type, value, detail]) => <div key={value}><span>{type}</span><b>{value}</b><small>{detail} · Cần xác minh</small></div>)}{list.length === 0 && <div className="empty">Không có thực thể được ghi nhận.</div>}</div>
  }
  if (tab === "Tài liệu") {
    const documents = related.filter((report) => report.attachment)
    return <div className="card detail-card">{documents.map((report) => <div className="file-row" key={report.id}><div className="file-icon">PNG</div><div><b>anh-chuyen-khoan-mau-{report.id}.png</b><span>Tài liệu giả lập · Đính kèm từ {report.id}</span></div><Button variant="secondary">Xem trước</Button></div>)}{documents.length === 0 && <div className="empty">Hồ sơ chưa có tài liệu đính kèm.</div>}</div>
  }
  return <div className="card timeline">{(item.history || []).map((entry) => <div key={entry}><i /><b>{entry.split(" · ")[1] || entry}</b><span>{entry.split(" · ")[0]}</span></div>)}</div>
}

function ReportModal({ item, reports, onClose }: {
  item: CaseFile
  reports: Report[]
  onClose: () => void
}) {
  const entities = getEntities(reports)
  const total = reports.reduce((sum, report) => sum + report.amount, 0)
  const entityText = [...entities.accounts, ...entities.phones, ...entities.websites].join(", ") || "Không có thực thể được ghi nhận"
  const source = item.clusterId ? `cụm ${item.clusterId}` : `phản ánh ${reports[0]?.id || "—"}`
  return <Modal title={`Báo cáo tổng hợp ${item.id}`} onClose={onClose} wide footer={<><Button variant="secondary" onClick={onClose}>Đóng</Button><Button onClick={() => window.print()}>In báo cáo</Button></>}>
    <div className="report-doc"><div className="report-header"><NetworkMark /><div><b>Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao</b><span>BÁO CÁO TỔNG HỢP HỒ SƠ</span></div><small>Demo — dữ liệu giả lập</small></div><div className="report-title">{item.name}</div>
      <DetailRows rows={[["Mã hồ sơ", item.id], ["Nguồn hồ sơ", source], ["Trạng thái", item.status], ["Mức ưu tiên", item.priority], ["Cán bộ phụ trách", item.officer], ["Tổng số tiền", `${total} triệu đồng`]]} />
      <div className="report-section"><b>Phản ánh liên quan</b><p>{reports.length} phản ánh: {reports.map((report) => report.id).join(", ") || "Không có"}.</p></div>
      <div className="report-section"><b>Thực thể được ghi nhận</b><p>{entityText}.</p></div>
      <div className="report-section"><b>Lý do ưu tiên xác minh</b><p>Hồ sơ được ưu tiên theo mức {item.priority.toLowerCase()}, dựa trên dữ liệu của {source} với tổng số tiền được phản ánh là {total} triệu đồng.</p></div>
      <div className="report-section"><b>Nhận định cán bộ</b><p>{item.note || "Chưa có nhận định. Cần tiếp tục đối chiếu tài liệu và xác minh các đầu mối liên quan."}</p></div>
      <div className="report-disclaimer">Kết quả hỗ trợ phân tích; cần cán bộ xác minh. Báo cáo không phải kết luận vi phạm.</div>
    </div>
  </Modal>
}

function Accounts({
  role,
  setRole,
  onEdit,
}: {
  role: string
  setRole: (r: string) => void
  onEdit: () => void
}) {
  const accounts = [
    ["quan.tri.demo", "Quản trị hệ thống", "Trung tâm quản trị mẫu", "Đang hoạt động"],
    ["tiep.nhan.demo", "Cán bộ tiếp nhận", "Đội tiếp nhận A", "Đang hoạt động"],
    ["phan.tich.demo", "Cán bộ phân tích", "Đội phân tích mạng lưới", "Đang hoạt động"],
    ["xu.ly.demo", "Cán bộ xử lý hồ sơ", "Đội xác minh mẫu", "Đang hoạt động"],
    ["lanh.dao.demo", "Lãnh đạo theo dõi", "Đơn vị chỉ đạo mẫu", "Đang hoạt động"],
    ["giam.sat.demo", "Kiểm tra, giám sát", "Bộ phận giám sát", "Đang hoạt động"],
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
      <div className="role-grid">
        {roles.map((r, i) => (
          <div className={`role-card ${r === role ? "selected" : ""}`} key={r}>
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
      <div className="card table-card">
        <CardHead
          title="Danh sách tài khoản giả lập"
          sub="06 tài khoản trong môi trường demo"
        />
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
            {accounts.map((a, i) => (
              <tr key={a[0]}>
                <td>
                  <b>{a[0]}</b>
                </td>
                <td>{a[1]}</td>
                <td>{a[2]}</td>
                <td>
                  <Badge tone="green">{a[3]}</Badge>
                </td>
                <td>
                  {i === 2 ? "Đang hoạt động" : `${i + 8}:20 · 18/06/2025`}
                </td>
                <td>
                  <Button variant="ghost" onClick={onEdit}>
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
          `${x.user} ${x.target} ${x.action}`
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
      <div className="card table-card">
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
                <td>{x.time}</td>
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
