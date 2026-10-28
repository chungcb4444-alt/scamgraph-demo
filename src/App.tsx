import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import {
  PageHeader,
  FilterField,
  EmptyState,
  Modal,
  Button,
  Badge,
  Field,
  CardHead,
  Card,
  Tabs,
  DataTable,
} from "./ui"
import AppearanceToggle from "./AppearanceToggle"
import Login from "./Login"
import BrandMark from "./BrandMark"
import ReportIntake from "./ReportIntake"
import ReportPeople from "./ReportPeople"
import ReportPrivacy from "./ReportPrivacy"
import SensitiveValue from "./SensitiveValue"
import SensitiveInput from "./SensitiveInput"
import ReportStatement from "./ReportStatement"
import { reportPeople, reportSearchText, samplePeople } from "./reportPeople"
import { REPORT_TYPES, reportTypeLabel, nextReportId } from "./intakeModel"
import type { IntakePayload, IntakeResult } from "./intakeModel"

import type {
  Report,
  CaseFile,
  LogItem,
  Cluster,
  AlertItem,
  StaffAccount,
  ReportVersion,
} from "./types"
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
import ReportStatusBadges from "./ReportStatusBadges"
import { reportStages } from "./reportStages"
import {
  relatedSourceCases,
  sameReportIds,
  duplicateConsentKey,
} from "./caseSources"

import {
  R,
  accountForRole,
  initialAccount,
  migrateAccounts,
  renameStaffAccount,
  migrateReport,
  migrateCase,
  allowedScreens,
  homeScreen,
  screenAllowed,
  canReadReport,
  canReadCase,
  permit,
  visibleLogs,
  roleTask,
} from "./access"
import type { Screen } from "./access"
import { applyOperation } from "./operations"
import type { Operation } from "./operations"
import ReceptionPanel from "./ReceptionPanel"
import RoleWork from "./RoleWork"
import WorkSummary from "./WorkSummary"
import CaseWorkPanel from "./CaseWorkPanel"
import AccountManager from "./AccountManager"
import ReportTabs, { type ReportSection } from "./ReportTabs"
import ReportHistory from "./ReportHistory"

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
      if (key === "scamgraph-demo-reports" && Array.isArray(migrated))
        return migrated.map(migrateReport) as T
      if (key === "scamgraph-demo-cases" && Array.isArray(migrated))
        return migrated.map(migrateCase) as T
      if (key === "scamgraph-demo-accounts" && Array.isArray(migrated))
        return migrated.map(renameStaffAccount) as T
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
      ...samplePeople(report.id),
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
    time:
      item.target === "HS-001"
        ? cases[0].updated
        : item.action === "Tạo phản ánh"
          ? reports.find((report) => report.id === item.target)?.receivedAt ||
            seedTimestamp(1, 9, 24, now)
          : seedTimestamp(0, 10, 5, now),
  }))
  return { reports, cases, logs }
}

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

function NetworkMark() {
  return <BrandMark />
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
  const [accountId, setAccountId] = useStoredState(
    "scamgraph-demo-account",
    initialAccount(),
  )
  const [accounts, setAccounts] = useStoredState<StaffAccount[]>(
    "scamgraph-demo-accounts",
    migrateAccounts(),
  )
  const [reports, setReports] = useStoredState<Report[]>(
    "scamgraph-demo-reports",
    sampleData.reports.map(migrateReport),
  )
  const [cases, setCases] = useStoredState<CaseFile[]>(
    "scamgraph-demo-cases",
    sampleData.cases.map(migrateCase),
  )
  const [logs, setLogs] = useStoredState<LogItem[]>(
    "scamgraph-demo-logs",
    sampleData.logs,
  )
  const [screen, setScreen] = useStoredState<Screen>(
    "scamgraph-demo-screen",
    "reports",
  )
  const [selectedReport, setSelectedReport] = useStoredState(
    "scamgraph-demo-selected-report",
    "PA-001",
  )
  const [reportSection, setReportSection] =
    useState<ReportSection>("information")
  const [selectedCase, setSelectedCase] = useStoredState(
    "scamgraph-demo-selected-case",
    "HS-001",
  )
  const [selectedCluster, setSelectedCluster] = useStoredState(
    "scamgraph-demo-selected-cluster",
    "CUM-001",
  )
  const [selectedAlert, setSelectedAlert] = useState("CB-001"),
    [caseModal, setCaseModal] = useState(false),
    [alertModal, setAlertModal] = useState(false),
    [logModal, setLogModal] = useState<LogItem | null>(null)
  const [toast, setToast] = useState(""),
    [toastType, setToastType] = useState<"success" | "error">("success"),
    [dirty, setDirty] = useState(false),
    [viewVersion, setViewVersion] = useState(0)
  const actor = accounts.find((a) => a.id === accountId) || {
    id: accountId,
    name: "Tài khoản không tồn tại",
    role: "",
    unitId: "",
    kind: "staff" as const,
    active: false,
  }
  const role = actor.role,
    citizen = actor.kind === "citizen",
    admin = role === R.admin
  const permittedReports = reports.filter((r) =>
      canReadReport(actor, r, cases),
    ),
    permittedCases = cases.filter((c) => canReadCase(actor, c)),
    scopedLogs = visibleLogs(actor, logs)
  const activeScreen = screenAllowed(actor, screen) ? screen : homeScreen(actor)
  useLayoutEffect(() => {
    if (!dirty || !["report-detail", "case-detail"].includes(activeScreen))
      return
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", guard)
    return () => window.removeEventListener("beforeunload", guard)
  }, [dirty, activeScreen])
  const report = permittedReports.find((r) => r.id === selectedReport),
    item = permittedCases.find((c) => c.id === selectedCase)
  const alerts = getAlerts(permittedReports).filter((a) =>
    a.clusterId
      ? permittedReports.some((r) => r.cluster === a.clusterId)
      : permittedReports.some((r) => r.id === a.reportId),
  )
  const activeCluster =
      clusters.find((c) => c.id === selectedCluster) || clusters[0],
    clusterReports = permittedReports.filter(
      (r) => r.cluster === activeCluster.id,
    ),
    clusterTotal = clusterReports.reduce((s, r) => s + r.amount, 0),
    activeAlert = alerts.find((a) => a.id === selectedAlert)
  const notify = (message: string, type: "success" | "error" = "success") => {
    setToast(message)
    setToastType(type)
  }
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(""), 3500)
    return () => clearTimeout(id)
  }, [toast])
  useEffect(() => {
    setCaseModal(false)
    setAlertModal(false)
    setLogModal(null)
    setToast("")
    setDirty(false)
    setViewVersion((v) => v + 1)
  }, [accountId, actor.role, actor.unitId, actor.active])
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (e.key === "scamgraph-demo-accounts" && e.newValue) {
        try {
          setAccounts(JSON.parse(e.newValue).map(renameStaffAccount))
        } catch {
          /* Keep current data if malformed. */
        }
      }
    }
    window.addEventListener("storage", changed)
    return () => window.removeEventListener("storage", changed)
  }, [])
  const commit = (
    nextReports: Report[],
    nextCases: CaseFile[],
    nextAccounts: StaffAccount[],
    nextLogs: LogItem[],
  ) => {
    const entries: [string, unknown][] = [
      ["scamgraph-demo-reports", nextReports],
      ["scamgraph-demo-cases", nextCases],
      ["scamgraph-demo-accounts", nextAccounts],
      ["scamgraph-demo-logs", nextLogs],
    ]
    const backups = entries.map(
      ([key]) => [key, localStorage.getItem(key)] as const,
    )
    try {
      for (const [key, value] of entries)
        localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      for (const [key, value] of backups) {
        try {
          if (value === null) localStorage.removeItem(key)
          else localStorage.setItem(key, value)
        } catch {
          /* Preserve memory if storage remains unavailable. */
        }
      }
      throw e
    }
    setReports(nextReports)
    setCases(nextCases)
    setAccounts(nextAccounts)
    setLogs(nextLogs)
  }
  const addLog = (
    action: string,
    target: string,
    detail = "",
    result = "Thành công",
  ) =>
    setLogs((v) => [
      {
        time: nowISO(),
        user: actor.id,
        role: actor.role,
        unitId: actor.unitId,
        category: admin ? "Quản trị" : "Nghiệp vụ",
        action,
        target,
        detail,
        result,
      },
      ...v,
    ])
  const latestAccounts = () => {
    try {
      return (
        (
          JSON.parse(
            localStorage.getItem("scamgraph-demo-accounts") || "null",
          ) as StaffAccount[]
        )?.map(renameStaffAccount) || accounts
      )
    } catch {
      return accounts
    }
  }
  const run = (op: Operation) => {
    try {
      const next = applyOperation(
        { reports, cases, accounts: latestAccounts() },
        accountId,
        op,
        nowISO(),
      )
      commit(next.reports, next.cases, next.accounts, [next.log, ...logs])
      // The case panel owns the aggregate of its independent unsaved forms.
      if (activeScreen !== "case-detail") setDirty(false)
      notify("Đã lưu: " + next.log.action)
      if (op.type === "create-case") {
        setSelectedCase(next.log.target)
        setCaseModal(false)
        setScreen("case-detail")
      }
      return true
    } catch (e) {
      addLog(
        "Thao tác bị từ chối",
        "id" in op ? op.id : op.clusterId,
        e instanceof Error ? e.message : "Không thể lưu",
        "Bị từ chối",
      )
      notify(
        e instanceof Error
          ? e.message
          : "Không thể lưu dữ liệu trên trình duyệt",
        "error",
      )
      return false
    }
  }
  const go = (next: Screen) => {
    if (!screenAllowed(actor, next))
      return notify(
        "Trang này không thuộc quyền truy cập của tài khoản.",
        "error",
      )
    if (
      dirty &&
      !window.confirm(
        "Có nội dung chưa lưu. Rời trang sẽ bỏ thay đổi chưa lưu; bản nháp tiếp nhận vẫn được giữ riêng cho tài khoản.",
      )
    )
      return
    setDirty(false)
    setScreen(next)
  }
  const openReport = (id: string, section: ReportSection = "information") => {
    if (!permittedReports.some((r) => r.id === id))
      return notify("Không có quyền xem phản ánh này.", "error")
    setReportSection(section)
    setSelectedReport(id)
    go("report-detail")
  }
  const openCase = (id: string) => {
    if (!permittedCases.some((c) => c.id === id))
      return notify("Không có quyền xem hồ sơ này.", "error")
    setSelectedCase(id)
    go("case-detail")
  }
  const openGraph = (id: string) => {
    if (
      !screenAllowed(actor, "graph") ||
      !permittedReports.some((r) => r.cluster === id)
    )
      return notify("Không có dữ liệu sơ đồ trong phạm vi tài khoản.", "error")
    setSelectedCluster(id)
    go("graph")
  }
  const openAlert = (id: string) => {
    const a = alerts.find((x) => x.id === id)
    if (!screenAllowed(actor, "alerts") || !a)
      return notify("Không có quyền xem cảnh báo này.", "error")
    setSelectedAlert(id)
    if (a.clusterId) setSelectedCluster(a.clusterId)
    setAlertModal(true)
  }
  const openCreate = () => {
    if (!permit(actor, "case.create"))
      return notify("Chỉ cán bộ phân tích được tạo hồ sơ.", "error")
    if (!clusterReports.length)
      return notify("Không có nguồn cụm trong phạm vi.", "error")
    setCaseModal(true)
  }
  const switchAccount = (id: string) => {
    const next = accounts.find((a) => a.id === id)
    if (!next?.active)
      return notify("Tài khoản đã khóa hoặc không tồn tại.", "error")
    if (
      (dirty || caseModal) &&
      !window.confirm(
        "Chuyển tài khoản sẽ bỏ thay đổi chưa lưu trên hồ sơ/phân tích. Bản nháp tiếp nhận được giữ riêng cho từng tài khoản. Tiếp tục?",
      )
    )
      return
    addLog("Chuyển tài khoản thử nghiệm", id, `Từ ${actor.id}`)
    setCaseModal(false)
    setAlertModal(false)
    setLogModal(null)
    setAccountId(id)
    const firstCluster = reports.find(
      (r) => r.cluster && canReadReport(next, r, cases),
    )?.cluster
    if (firstCluster) setSelectedCluster(firstCluster)
    setScreen(homeScreen(next))
    setDirty(false)
    setViewVersion((v) => v + 1)
  }
  const submitIntake = (payload: IntakePayload): IntakeResult => {
    const currentActor = latestAccounts().find((a) => a.id === accountId)
    if (!currentActor || !permit(currentActor, "report.create"))
      return { ok: false, error: "Tài khoản không có quyền tạo phản ánh." }
    if (
      !payload.report.title.trim() ||
      !payload.report.content.trim() ||
      !Number.isFinite(payload.report.amount) ||
      payload.report.amount < 0 ||
      (payload.report.transferStatus === "Có" && payload.report.amount <= 0)
    )
      return {
        ok: false,
        error: "Kiểm tra tiêu đề, nội dung và số tiền trước khi gửi.",
      }
    try {
      if (payload.sample && reports.some((r) => r.id === "PA-013"))
        return { ok: false, error: "Tình huống mẫu đã được tạo." }
      const r: Report = {
        ...payload.report,
        cluster: undefined,
        extracted: false,
        reviewed: false,
        rejectedClusters: [],
        status: "Mới tiếp nhận",
        source:
          currentActor.kind === "citizen"
            ? "Cổng trực tuyến"
            : payload.report.source,
        id: payload.sample ? "PA-013" : nextReportId(reports),
        submittedBy: actor.id,
        unitId: actor.unitId,
        intakeStatus: "Mới tiếp nhận",
        analysisStatus: "Chờ phân tích",
        people: {
          ...(payload.sample &&
          payload.report.senderName === "Nguyễn Hoàng Minh"
            ? samplePeople("PA-013")?.people
            : {}),
          ...payload.report.people,
        },
      }
      const log: LogItem = {
        time: nowISO(),
        user: actor.id,
        role: actor.role,
        unitId: actor.unitId,
        category: "Nghiệp vụ",
        action: "Tạo phản ánh",
        target: r.id,
        result: "Thành công",
        detail: `${r.amount} triệu; chờ tiếp nhận, chưa liên kết.`,
      }
      commit([r, ...reports], cases, accounts, [log, ...logs])
      setDirty(false)
      return { ok: true, report: r }
    } catch {
      return {
        ok: false,
        error:
          "Chưa lưu được phản ánh trên trình duyệt. Nội dung nhập được giữ để thử lại.",
      }
    }
  }
  const updateReport = (
    next: Report,
    intent?: "extract-save" | "extract-start",
  ) => {
    const old = reports.find((r) => r.id === next.id)
    if (!old) return false
    if (intent === "extract-save")
      return run({ type: "extract-save", id: next.id, patch: next })
    if (intent === "extract-start")
      return run({ type: "extract-start", id: next.id })
    if (next.cluster && next.cluster !== old.cluster)
      return run({ type: "link", id: next.id, clusterId: next.cluster })
    const removed = (old.rejectedClusters || []).find(
        (x) => !next.rejectedClusters?.includes(x),
      ),
      added = next.rejectedClusters?.find(
        (x) => !old.rejectedClusters?.includes(x),
      )
    if (removed || added)
      return run({
        type: "proposal",
        id: next.id,
        clusterId: (removed || added)!,
        restore: !!removed,
      })
    if (next.extracted && !old.extracted && !next.reviewed)
      return run({ type: "extract-start", id: next.id })
    return run({ type: "extract-save", id: next.id, patch: next })
  }
  const reset = () => {
    if (
      !permit(actor, "account.manage") ||
      !window.confirm("Khôi phục dữ liệu thử nghiệm? Nhật ký cũ được giữ lại.")
    )
      return
    try {
      const fresh = makeSampleData()
      commit(
        fresh.reports.map(migrateReport),
        fresh.cases.map(migrateCase),
        accounts,
        [
          {
            time: nowISO(),
            user: actor.id,
            role: actor.role,
            unitId: actor.unitId,
            category: "Quản trị",
            action: "Đặt lại dữ liệu thử nghiệm",
            target: "Dữ liệu thử nghiệm",
            result: "Thành công",
          },
          ...logs,
        ],
      )
      for (const key of Object.keys(localStorage))
        if (key.startsWith("scamgraph-intake:")) localStorage.removeItem(key)
      setViewVersion((v) => v + 1)
      notify("Đã khôi phục dữ liệu; giữ nguyên nhật ký và tài khoản.")
    } catch {
      notify("Không thể khôi phục dữ liệu.", "error")
    }
  }
  if (!loggedIn)
    return (
      <>
        <Login
          onLogin={(requestedRole) => {
            const id = accountForRole(requestedRole),
              a = accounts.find((x) => x.id === id)
            if (!a?.active) {
              notify("Tài khoản đã bị khóa.", "error")
              return
            }
            setAccountId(id)
            setScreen(homeScreen(a))
            setLoggedIn(true)
            setLogs((v) => [
              {
                time: nowISO(),
                user: a.id,
                role: a.role,
                unitId: a.unitId,
                category: "Quản trị",
                action: "Đăng nhập mô phỏng",
                target: a.id,
                result: "Thành công",
              },
              ...v,
            ])
          }}
        />
        {toast && (
          <div className="toast toast-error" role="alert">
            {toast}
          </div>
        )}
      </>
    )
  if (!actor.active)
    return (
      <div className="page-stack role-blocked">
        <Card className="role-panel">
          <h1>Tài khoản không hoạt động</h1>
          <p>
            Không thể truy cập dữ liệu. Liên hệ quản trị hệ thống để kiểm tra
            quyền.
          </p>
          <Button onClick={() => setLoggedIn(false)}>Đăng xuất</Button>
        </Card>
      </div>
    )
  const labels: Partial<Record<Screen, string>> = {
    reports: citizen
      ? "Phản ánh của tôi"
      : role === R.reception
        ? "Tiếp nhận phản ánh"
        : role === R.analyst
          ? "Phản ánh phân tích"
          : "Phản ánh liên quan",
    cases: role === R.worker ? "Hồ sơ được giao" : "Hồ sơ vụ việc",
    dashboard: "Điều hành xử lý",
    "new-report": citizen ? "Gửi phản ánh" : "Tạo phiếu tiếp nhận",
  }
  const notFound = (
    <Card className="role-panel">
      <h2>Không có quyền truy cập đối tượng</h2>
      <p>Đối tượng không tồn tại hoặc nằm ngoài phạm vi tài khoản.</p>
      <Button onClick={() => go(homeScreen(actor))}>Về trang công việc</Button>
    </Card>
  )
  return (
    <div
      className={`app-shell ${activeScreen === "new-report" ? "intake-shell" : ""} ${citizen ? "citizen-shell" : ""} ${admin ? "admin-shell" : ""}`}
    >
      <aside className="sidebar">
        <div className="brand">
          <NetworkMark />
          <div className="brand-name">
            Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao
          </div>
        </div>
        <nav className="nav">
          {allowedScreens(actor).map((s) => {
            const base = navItems.find((n) => n.screen === s)
            return (
              <button
                key={s}
                className={`nav-item ${activeScreen === s || (s === "reports" && activeScreen === "report-detail") || (s === "cases" && activeScreen === "case-detail") ? "active" : ""}`}
                onClick={() => go(s)}
              >
                <span className="nav-icon">{base?.icon || "PA"}</span>
                <span>{labels[s] || base?.label || s}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="user-avatar">
            {actor.name
              .split(" ")
              .slice(-2)
              .map((x) => x[0])
              .join("")}
          </div>
          <div className="sidebar-user">
            <strong>{actor.name}</strong>
            <span>{role}</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="current-unit">{actor.unitId}</span>
          <div className="top-actions">
            <span className="demo-label">Dữ liệu giả lập</span>
            <AppearanceToggle />
            <details className="account-tools">
              <summary>Tài khoản thử nghiệm</summary>
              <div className="account-popover">
                <Field label="Chuyển tài khoản thử nghiệm">
                  <select
                    value={accountId}
                    onChange={(e) => {
                      switchAccount(e.target.value)
                      e.currentTarget
                        .closest("details")
                        ?.removeAttribute("open")
                    }}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} disabled={!a.active}>
                        {a.name} · {a.role}
                        {a.active ? "" : " (Đã khóa)"}
                      </option>
                    ))}
                  </select>
                </Field>
                <small>Tài khoản hiện tại: {actor.id}</small>
                {admin && (
                  <Button variant="ghost" onClick={reset}>
                    Đặt lại dữ liệu thử nghiệm
                  </Button>
                )}
              </div>
            </details>
            <Button
              variant="ghost"
              onClick={() => {
                if (
                  dirty &&
                  !window.confirm(
                    "Đăng xuất và bỏ thay đổi chưa lưu? Bản nháp tiếp nhận được giữ riêng.",
                  )
                )
                  return
                addLog("Đăng xuất", actor.id)
                setLoggedIn(false)
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </header>
        <main
          className={`content ${activeScreen === "reports" ? "reports-workspace" : activeScreen === "report-detail" ? "report-detail-workspace" : ""}`}
          key={`${actor.id}:${actor.role}:${actor.unitId}:${viewVersion}`}
          onChangeCapture={(e) => {
            if (
              (e.target as HTMLElement).closest(
                ".entity-form,.reception-panel .role-form,.report-intake .intake-card,.modal",
              )
            )
              setDirty(true)
          }}
        >
          {citizen && (
            <nav className="citizen-section-nav" aria-label="Cổng phản ánh">
              <a
                href="#reports"
                onClick={(e) => {
                  e.preventDefault()
                  go("reports")
                }}
              >
                Phản ánh của tôi
              </a>
              <a
                href="#new-report"
                onClick={(e) => {
                  e.preventDefault()
                  go("new-report")
                }}
              >
                Gửi phản ánh
              </a>
            </nav>
          )}
          <div className="role-context">
            <b>{role}</b>
            <span>{roleTask[role]}</span>
          </div>
          {activeScreen === "dashboard" && (
            <>
              <RoleWork
                actor={actor}
                reports={permittedReports}
                cases={permittedCases}
                onReport={(id) => openReport(id, "processing")}
                onCase={openCase}
              />
              <details className="role-statistics">
                <summary>
                  Thống kê phản ánh và cụm liên kết trong đơn vị
                </summary>
                <Dashboard
                  reports={permittedReports}
                  cases={permittedCases}
                  hasNew={permittedReports.some(
                    (r) => r.id === "PA-013" && r.cluster === "CUM-001",
                  )}
                  alerts={alerts}
                  onReports={() => go("reports")}
                  onCase={openCase}
                  onReport={openReport}
                  onGraph={openGraph}
                  onAlert={openAlert}
                />
              </details>
            </>
          )}
          {activeScreen === "reports" && (
            <>
              <Reports
                key={accountId}
                citizen={citizen}
                actor={actor}
                canCreate={permit(actor, "report.create")}
                reports={permittedReports}
                summary={
                  <WorkSummary
                    actor={actor}
                    reports={permittedReports}
                    cases={permittedCases}
                  />
                }
                onNew={() => go("new-report")}
                onOpen={openReport}
              />
            </>
          )}
          {activeScreen === "new-report" &&
            (permit(actor, "report.create") ? (
              <ReportIntake
                key={`${accountId}:${viewVersion}`}
                citizen={citizen}
                storagePrefix={`scamgraph-intake:${accountId}`}
                reports={permittedReports}
                onSubmit={submitIntake}
                onOpen={openReport}
                onList={() => go("reports")}
              />
            ) : (
              notFound
            ))}
          {activeScreen === "report-detail" &&
            (report ? (
              citizen ? (
                <CitizenReportView
                  key={report.id}
                  report={report}
                  initialTab={reportSection}
                  onBack={() => go("reports")}
                  processing={
                    <ReceptionPanel
                      report={report}
                      actor={actor}
                      accounts={accounts}
                      cases={cases}
                      onAction={run}
                      showSupplements={false}
                    />
                  }
                />
              ) : (
                <ReportDetail
                  key={report.id}
                  report={report}
                  initialTab={reportSection}
                  logs={scopedLogs.filter((log) => log.target === report.id)}
                  reports={permittedReports}
                  canAnalyze={permit(actor, "report.analyze", report, cases)}
                  canReveal={permit(actor, "sensitive.read", report, cases)}
                  actor={actor}
                  accounts={accounts}
                  cases={cases}
                  onAction={run}
                  onBack={() => go("reports")}
                  onGraph={() => report.cluster && openGraph(report.cluster)}
                  onLog={(a, t, d) => {
                    if (
                      a === "Xem thông tin đã che" &&
                      permit(actor, "sensitive.read", report, cases)
                    )
                      addLog(a, t, d)
                  }}
                  onUpdate={updateReport}
                  notify={notify}
                />
              )
            ) : (
              notFound
            ))}
          {activeScreen === "graph" &&
            (clusterReports.length ? (
              <LinkGraph
                key={activeCluster.id}
                cluster={activeCluster}
                reports={clusterReports}
                total={clusterTotal}
                hasNew={clusterReports.some((r) => r.id === "PA-013")}
                allowCreate={permit(actor, "case.create")}
                onReport={openReport}
                onAlert={() => {
                  const a = alerts.find((a) => a.clusterId === activeCluster.id)
                  if (a) openAlert(a.id)
                }}
                onCreateCase={openCreate}
              />
            ) : (
              <EmptyState>
                Không có cụm liên kết trong phạm vi tài khoản.
              </EmptyState>
            ))}
          {activeScreen === "alerts" && (
            <Alerts
              alerts={alerts}
              reports={permittedReports}
              selectedId={selectedAlert}
              onOpen={openAlert}
              onSelectionChange={setSelectedAlert}
              onGraph={openGraph}
              allowCreate={permit(actor, "case.create")}
              onCreate={(id) => {
                if (id) setSelectedCluster(id)
                if (!permit(actor, "case.create")) return
                setCaseModal(true)
              }}
            />
          )}
          {activeScreen === "cases" && (
            <>
              <WorkSummary
                actor={actor}
                reports={permittedReports}
                cases={permittedCases}
              />
              <Cases
                cases={permittedCases}
                reports={permittedReports}
                canCreate={permit(actor, "case.create")}
                onOpen={openCase}
                onCreate={openCreate}
              />
            </>
          )}
          {activeScreen === "case-detail" &&
            (item ? (
              <CaseDetail
                key={item.id}
                item={item}
                reports={permittedReports}
                actor={actor}
                accounts={accounts}
                onAction={run}
                onReport={openReport}
                onBack={() => go("cases")}
                onLogs={
                  permit(actor, "logs.read") ? () => go("logs") : undefined
                }
                onDraftChange={setDirty}
              />
            ) : (
              notFound
            ))}
          {activeScreen === "accounts" && permit(actor, "account.manage") && (
            <AccountManager accounts={accounts} onAction={run} />
          )}
          {activeScreen === "logs" && permit(actor, "logs.read") && (
            <Logs
              logs={scopedLogs}
              onOpen={(l) => {
                if (scopedLogs.includes(l)) setLogModal(l)
              }}
            />
          )}
        </main>
      </div>
      {toast && (
        <div className={`toast toast-${toastType}`} role="status">
          {toast}
        </div>
      )}
      {caseModal && permit(actor, "case.create") && (
        <CreateCaseModal
          key={selectedCluster}
          cluster={activeCluster}
          reportIds={clusterReports.map((r) => r.id)}
          reportCount={clusterReports.length}
          total={clusterTotal}
          relatedCases={relatedSourceCases(
            permittedCases,
            actor,
            activeCluster.id,
          )}
          onOpenRelated={(id) => {
            setCaseModal(false)
            openCase(id)
          }}
          onClusterChange={setSelectedCluster}
          onClose={() => setCaseModal(false)}
          onCreate={(data) =>
            run({
              type: "create-case",
              name: data.name,
              clusterId: data.clusterId,
              duplicateConsent: data.duplicateConsent,
            })
          }
        />
      )}
      {alertModal && activeAlert && screenAllowed(actor, "alerts") && (
        <AlertDetail
          alert={activeAlert}
          reports={permittedReports}
          allowCreate={permit(actor, "case.create")}
          onClose={() => setAlertModal(false)}
          onGraph={() => {
            setAlertModal(false)
            if (activeAlert.clusterId) openGraph(activeAlert.clusterId)
          }}
          onCreate={() => {
            if (!permit(actor, "case.create")) return
            setAlertModal(false)
            if (activeAlert.clusterId) setSelectedCluster(activeAlert.clusterId)
            setCaseModal(true)
          }}
        />
      )}
      {logModal &&
        permit(actor, "logs.read") &&
        scopedLogs.some((l) => l === logModal) && (
          <Modal
            title={`Chi tiết nhật ký — ${logModal.action}`}
            onClose={() => setLogModal(null)}
          >
            <DetailRows
              rows={[
                ["Thời gian", formatDateTime(logModal.time)],
                ["Tài khoản", logModal.user],
                ["Vai trò tại thời điểm thao tác", logModal.role],
                ["Đối tượng", logModal.target],
                ["Kết quả", logModal.result],
                ["Chi tiết", logModal.detail || "Không có thay đổi dữ liệu."],
              ]}
            />
          </Modal>
        )}
    </div>
  )
}

function pageTitle(screen: Screen) {
  return (
    {
      dashboard: "Tổng quan công việc",
      reports: "Quản lý phản ánh",
      "new-report": "Tạo phản ánh mới",
      "report-detail": "Chi tiết phản ánh",
      graph: "Phân tích liên kết",
      alerts: "Cảnh báo cần rà soát",
      cases: "Hồ sơ vụ việc",
      "case-detail": "Chi tiết hồ sơ",
      accounts: "Tài khoản và phân quyền",
      logs: "Nhật ký hệ thống",
    } as Record<Screen, string>
  )[screen]
}

function Dashboard({
  reports,
  cases,
  hasNew,
  alerts,
  onReports,
  onCase,
  onNew,
  onReport,
  onGraph,
  onAlert,
}: {
  reports: Report[]
  cases: CaseFile[]
  hasNew: boolean
  alerts: AlertItem[]
  onCase: (id: string) => void
  onReports: () => void
  onNew?: () => void
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
    reports.filter(
      (report) =>
        reportTypeLabel(report.behavior) === reportTypeLabel(behavior),
    ).length
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
      <PageHeader
        title="Tổng quan công việc"
        description={
          <>
            {" "}
            Thống kê tính trực tiếp từ bộ dữ liệu giả lập đang lưu trên trình
            duyệt{" "}
          </>
        }
        action={
          <> {onNew && <Button onClick={onNew}>Tiếp nhận phản ánh</Button>} </>
        }
      />
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
      <Card className="work-queue">
        <CardHead
          title="Công việc cần xử lý"
          sub="Ưu tiên kiểm tra phản ánh và tiếp tục hồ sơ đang mở"
        />
        <div className="work-links">
          <button className="btn btn-secondary" onClick={onReports}>
            {
              reports.filter(
                (r) =>
                  reportStages(r).analysis !== "Đã kiểm tra" &&
                  reportStages(r).intake !== "Không hợp lệ",
              ).length
            }{" "}
            phản ánh chờ kiểm tra →
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onAlert(alerts[0]?.id || "CB-001")}
          >
            {alerts.length} cảnh báo cần rà soát →
          </button>
        </div>
      </Card>
      <Card>
        <CardHead title="Hồ sơ gần đây" sub="Theo thời gian cập nhật hồ sơ" />
        <div className="recent-cases">
          {[...cases]
            .sort((a, b) => b.updated.localeCompare(a.updated))
            .slice(0, 3)
            .map((item) => (
              <button
                className="btn btn-secondary recent-case-item"
                key={item.id}
                onClick={() => onCase(item.id)}
              >
                <span className="id-link">{item.id}</span>
                <b>{item.name}</b>
                <span>
                  {item.officer} · {formatDateTime(item.updated)}
                </span>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
              </button>
            ))}
        </div>
      </Card>
      <div className="dashboard-grid">
        <Card className="chart-card">
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
        </Card>
        <Card className="behavior-card">
          <CardHead title="Nhóm hành vi" sub="Theo số phản ánh" />
          <div className="donut-row">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#0284c7 0 ${behaviorShare[0]}%, #3781ca ${behaviorShare[0]}% ${behaviorShare[0] + behaviorShare[1]}%, #d58335 ${behaviorShare[0] + behaviorShare[1]}% ${behaviorShare.reduce((a, b) => a + b, 0)}%, #53627c ${behaviorShare.reduce((a, b) => a + b, 0)}% 100%)`,
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
        </Card>
      </div>
      <div className="dashboard-grid lower">
        <Card className="table-card">
          <CardHead
            title="Phản ánh mới nhất"
            sub="Dữ liệu tiếp nhận gần đây"
            action="Xem tất cả →"
            onAction={onReports}
          />
          <ReportTable
            reports={[...reports]
              .sort((a, b) =>
                (b.receivedAt || "").localeCompare(a.receivedAt || ""),
              )
              .slice(0, 5)}
            onOpen={onReport}
            compact
          />
        </Card>
        <Card>
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
        </Card>
      </div>
    </div>
  )
}

function Reports({
  citizen,
  actor,
  canCreate,
  reports,
  summary,
  onNew,
  onOpen,
}: {
  citizen: boolean
  actor: StaffAccount
  canCreate: boolean
  reports: Report[]
  summary: React.ReactNode
  onNew: () => void
  onOpen: (id: string, section?: ReportSection) => void
}) {
  const [queue, setQueue] = useState(
    actor.role === R.analyst
      ? "mine"
      : actor.role === R.reception
        ? "waiting"
        : "all",
  )
  const [advanced, setAdvanced] = useState(false)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Tất cả trạng thái")
  const [behavior, setBehavior] = useState("Tất cả loại phản ánh")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [source, setSource] = useState("")
  const [area, setArea] = useState("")
  const intakeFilter = actor.kind === "citizen" || actor.role === R.reception
  const statusOptions = intakeFilter
    ? [
        "Tất cả trạng thái",
        "Mới tiếp nhận",
        "Chờ bổ sung",
        "Chuyển phân tích",
        "Không hợp lệ",
      ]
    : ["Tất cả trạng thái", "Chờ phân tích", "Đang phân tích", "Đã kiểm tra"]
  const statusOf = (r: Report) =>
    intakeFilter ? reportStages(r).intake : reportStages(r).analysis
  const filtered = reports.filter(
    (r) =>
      (queue === "all" ||
        (queue === "waiting"
          ? ["Mới tiếp nhận", "Chờ bổ sung"].includes(r.intakeStatus || "")
          : r.intakeStatus === "Chuyển phân tích" &&
            (!r.analysisAssignee || r.analysisAssignee === actor.id))) &&
      reportSearchText(r).includes(
        query
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/gi, "d")
          .toLowerCase(),
      ) &&
      (status.startsWith("Tất cả") || statusOf(r) === status) &&
      (behavior.startsWith("Tất cả") ||
        reportTypeLabel(r.behavior) === behavior) &&
      (!source || r.source === source) &&
      (!area || r.area === area) &&
      (!from || dayKey(r.receivedAt || "") >= from) &&
      (!to || dayKey(r.receivedAt || "") <= to),
  )
  const advancedCount =
    Number(!behavior.startsWith("Tất cả")) +
    Number(!!source) +
    Number(!!area) +
    Number(!!from) +
    Number(!!to)
  const resetFilters = () => {
    setQuery("")
    setStatus("Tất cả trạng thái")
    setBehavior("Tất cả loại phản ánh")
    setSource("")
    setArea("")
    setFrom("")
    setTo("")
    // Work scope is an independent, account-specific choice; keep it intact.
  }
  return (
    <div className="page-stack reports-list-page">
      <PageHeader
        title={
          citizen
            ? "Phản ánh của tôi"
            : actor.role === R.reception
              ? "Tiếp nhận phản ánh"
              : actor.role === R.analyst
                ? "Phản ánh cần phân tích"
                : "Phản ánh liên quan"
        }
        action={
          <>
            {" "}
            {canCreate && (
              <Button onClick={onNew}>
                {citizen ? "Gửi phản ánh" : "Tiếp nhận phản ánh"}
              </Button>
            )}{" "}
          </>
        }
      />
      {summary}
      <div className="status-tabs" aria-label="Lọc trạng thái phản ánh">
        {statusOptions.map((value) => (
          <button
            key={value}
            className={status === value ? "active" : ""}
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {value} (
            {
              reports.filter(
                (r) => value === "Tất cả trạng thái" || statusOf(r) === value,
              ).length
            }
            )
          </button>
        ))}
      </div>
      <Card className="reports-filter-card">
        <div className="reports-primary-filters">
          <FilterField label="Tìm kiếm · Mã, nội dung, tên người gửi">
            <div className="search-wrap">
              <span>⌕</span>
              <input
                placeholder="Tìm theo mã hoặc tiêu đề..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </FilterField>
          <FilterField label="Trạng thái">
            <select
              aria-label="Trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </FilterField>
          <div className="role-queue-filter">
            <Field label="Phạm vi công việc">
              <select value={queue} onChange={(e) => setQueue(e.target.value)}>
                <option value="all">
                  {citizen ? "Tất cả phản ánh của tôi" : "Trong đơn vị"}
                </option>
                {actor.role === R.reception && (
                  <option value="waiting">Chờ tiếp nhận / Bổ sung</option>
                )}
                {actor.role === R.analyst && (
                  <option value="mine">Được giao / Chờ phân tích</option>
                )}
              </select>
            </Field>
          </div>
        </div>
        <div className="reports-filter-actions">
          <button
            type="button"
            className="reports-advanced-toggle"
            aria-expanded={advanced}
            aria-controls="report-advanced-filters"
            onClick={() => setAdvanced(!advanced)}
          >
            Bộ lọc nâng cao{advancedCount ? ` (${advancedCount})` : ""}{" "}
            <span aria-hidden="true">{advanced ? "⌃" : "⌄"}</span>
          </button>
          <button
            type="button"
            className="reports-clear-filters"
            onClick={resetFilters}
          >
            Xóa bộ lọc
          </button>
        </div>
        <div
          id="report-advanced-filters"
          className="reports-advanced-filters"
          hidden={!advanced}
        >
          <FilterField label="Loại phản ánh">
            <select
              aria-label="Loại phản ánh"
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
            >
              <option>Tất cả loại phản ánh</option>
              {Array.from(
                new Set(reports.map((r) => reportTypeLabel(r.behavior))),
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Nguồn tiếp nhận">
            <select
              aria-label="Nguồn tiếp nhận"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">Mọi nguồn tin</option>
              {Array.from(new Set(reports.map((r) => r.source))).map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </FilterField>
          <FilterField label="Địa bàn">
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
          </FilterField>
          <FilterField label="Tiếp nhận từ ngày">
            <input
              type="date"
              aria-label="Tiếp nhận từ ngày"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </FilterField>
          <FilterField label="Đến ngày">
            <input
              type="date"
              aria-label="Đến ngày"
              min={from}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </FilterField>
        </div>
      </Card>
      <Card className="table-card">
        <div className="table-summary">
          <span>
            Hiển thị <b>{filtered.length}</b> phản ánh
          </span>
          <span>Thống kê theo thời gian tiếp nhận · Asia/Ho_Chi_Minh</span>
        </div>
        <ReportTable reports={filtered} onOpen={onOpen} />
      </Card>
    </div>
  )
}

function ReportTable({
  reports,
  onOpen,
  compact = false,
}: {
  reports: Report[]
  onOpen: (id: string, section?: ReportSection) => void
  compact?: boolean
}) {
  return (
    <div className={`table-scroll ${!compact ? "reports-table-scroll" : ""}`}>
      <DataTable>
        <thead>
          <tr>
            <th scope="col">Mã phản ánh</th>
            {!compact && <th scope="col">Người gửi phản ánh</th>}
            <th scope="col">Nội dung / Loại phản ánh</th>
            <th scope="col">Thời gian</th>
            <th scope="col">Số tiền</th>
            <th scope="col">Tiếp nhận / Phân tích</th>
            {!compact && <th scope="col">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r.id)}>
              <td>
                <b className="id-link">{r.id}</b>
              </td>
              {!compact && (
                <td className="sender-cell">
                  <button
                    type="button"
                    className="sender-link"
                    aria-label={`Xem người gửi ${r.id}: ${reportPeople(r).senderName}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpen(r.id)
                    }}
                  >
                    <span className="sender-avatar" aria-hidden="true">
                      {reportPeople(r)
                        .senderName.split(" ")
                        .slice(-2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <span>
                      <strong>{reportPeople(r).senderName}</strong>
                      <small>
                        {reportPeople(r).birthYear
                          ? `${reportPeople(r).birthYear} · `
                          : ""}
                        {reportPeople(r).residence || r.area}
                      </small>
                    </span>
                  </button>
                </td>
              )}
              <td>
                <div className="cell-title" title={r.title}>
                  {r.title}
                </div>
                <span className="cell-sub">
                  {reportTypeLabel(r.behavior)}
                  {r.behaviorOther ? `: ${r.behaviorOther}` : ""}
                </span>
              </td>
              <td>
                <span>{formatDateTime(r.receivedAt)}</span>
              </td>
              <td>
                <b>
                  {r.transferStatus === "Không"
                    ? "Không phát sinh chuyển tiền"
                    : r.transferStatus === "Chưa rõ"
                      ? "Chưa xác định"
                      : r.amount
                        ? `${r.amount} triệu`
                        : "—"}
                </b>
              </td>
              <td>
                <ReportStatusBadges report={r} />
              </td>
              {!compact && (
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpen(r.id, "processing")
                    }}
                  >
                    Kiểm tra phản ánh
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </DataTable>
      {reports.length === 0 && (
        <div className="empty">Không tìm thấy phản ánh phù hợp.</div>
      )}
    </div>
  )
}

function ReportDetail({
  report,
  initialTab,
  logs,
  reports,
  canAnalyze,
  canReveal,
  actor,
  accounts,
  cases,
  onAction,
  onBack,
  onGraph,
  onLog,
  onUpdate,
  notify,
}: {
  report: Report
  initialTab: ReportSection
  logs: LogItem[]
  reports: Report[]
  canAnalyze: boolean
  canReveal: boolean
  actor: StaffAccount
  accounts: StaffAccount[]
  cases: CaseFile[]
  onAction: (op: Operation) => boolean
  onBack: () => void
  onGraph: () => void
  onLog: (a: string, t: string, d?: string) => void
  onUpdate: (
    report: Report,
    intent?: "extract-save" | "extract-start",
  ) => boolean
  notify: (x: string) => void
}) {
  const [extracted, setExtracted] = useState(report.extracted ?? true)
  const [preview, setPreview] = useState(false)
  const [draft, setDraft] = useState({
    analysisNote: report.analysisNote || "",
    subjectName: reportPeople(report).subjectName || "",
    socialAccount:
      report.socialAccount || reportPeople(report).subjectSocial || "",
    account: report.account || "",
    bank: report.bank || "",
    phone: report.phone || "",
    website: report.website || "",
    amount: String(report.amount),
    behavior: report.behavior,
    behaviorOther: report.behaviorOther || "",
  })
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState("")
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
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
    if (draft.behavior === "Khác" && !draft.behaviorOther.trim())
      return setError("Nhập mô tả loại phản ánh khác trước khi lưu.")
    const { subjectName, ...checkedDraft } = draft
    const {
      senderName: _senderName,
      senderContact: _senderContact,
      ...people
    } = reportPeople(report)
    const next = {
      ...report,
      ...checkedDraft,
      people: {
        ...people,
        subjectName: subjectName.trim(),
        subjectSocial: draft.socialAccount.trim(),
      },
      behaviorOther:
        draft.behavior === "Khác" ? draft.behaviorOther.trim() : undefined,
      initialBehavior: report.initialBehavior || report.behavior,
      initialBehaviorOther: report.initialBehaviorOther ?? report.behaviorOther,
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
    if (!canAnalyze || !onUpdate(next, "extract-save")) return
    if (
      subjectName !== (reportPeople(report).subjectName || "") ||
      draft.socialAccount !==
        (report.socialAccount || reportPeople(report).subjectSocial || "")
    )
      onLog(
        "Cập nhật bên bị phản ánh",
        report.id,
        "Đã điều chỉnh tên tự xưng hoặc tài khoản mạng xã hội. Chưa xác minh danh tính.",
      )
    if (
      report.behavior !== next.behavior ||
      report.behaviorOther !== next.behaviorOther
    )
      onLog(
        "Điều chỉnh loại phản ánh",
        report.id,
        `Trước: ${report.behavior}${report.behaviorOther ? ": " + report.behaviorOther : ""}; sau: ${next.behavior}${next.behaviorOther ? ": " + next.behaviorOther : ""}`,
      )
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
  }
  return (
    <ReportPrivacy
      allowReveal={canReveal}
      onReveal={(label) =>
        onLog(
          "Xem thông tin đã che",
          report.id,
          `Trường: ${label}. Không ghi giá trị cá nhân vào nhật ký.`,
        )
      }
    >
      <div className="page-stack report-detail-page">
        <button className="back-link" onClick={onBack}>
          ← Quay lại danh sách phản ánh
        </button>
        <div className="detail-hero">
          <div>
            <div className="detail-code">{report.id}</div>
            <h1 className="page-heading">{report.title}</h1>
            <div className="hero-meta">
              <ReportStatusBadges report={report} detailed />
              <span>
                {report.source} · Tiếp nhận {formatDateTime(report.receivedAt)}
              </span>
            </div>
          </div>
          {report.cluster && screenAllowed(actor, "graph") && (
            <Button onClick={onGraph}>Xem sơ đồ {report.cluster} →</Button>
          )}
        </div>
        <ReportTabs
          initialTab={initialTab}
          pending={
            permit(actor, "report.receive", report, cases)
              ? "Phiếu đang chờ kiểm tra tiếp nhận hoặc bổ sung thông tin."
              : canAnalyze && (!report.reviewed || !report.cluster)
                ? "Phiếu được giao: kiểm tra trích xuất và xem xét căn cứ liên kết."
                : undefined
          }
          information={
            <div className="page-stack">
              <ReportPeople report={report} />
              <div className="report-information-grid">
                <Card className="detail-card">
                  <CardHead
                    title="Nội dung gốc"
                    sub="Dữ liệu giả lập do người gửi cung cấp"
                  />
                  <ReportStatement report={report} />
                </Card>
                <Card className="detail-card">
                  <CardHead title="Thông tin chung" />
                  {report.initialBehavior &&
                    (report.initialBehavior !== report.behavior ||
                      (report.initialBehaviorOther || "") !==
                        (report.behaviorOther || "")) && (
                      <p className="classification-note">
                        Phân loại đã được cán bộ cập nhật; phân loại ban đầu của
                        người gửi được giữ ở thông tin bên dưới.
                      </p>
                    )}
                  <DetailRows
                    rows={[
                      [
                        "Phát sinh sự việc",
                        report.occurredTimeUnknown
                          ? "Không nhớ chính xác"
                          : formatDateTime(report.occurredAt),
                      ],
                      ["Tiếp nhận phản ánh", formatDateTime(report.receivedAt)],
                      ["Địa bàn", report.area],
                      [
                        "Tình trạng theo lời khai",
                        report.transferStatus === "Không"
                          ? "Chưa phát sinh chuyển tiền"
                          : reportPeople(report).currentSituation ||
                            "Chưa cung cấp",
                      ],
                      [
                        "Số tiền",
                        report.transferStatus === "Không"
                          ? "Không phát sinh chuyển tiền"
                          : report.transferStatus === "Chưa rõ"
                            ? "Chưa xác định"
                            : `${report.amount} triệu đồng`,
                      ],
                      [
                        "Loại phản ánh",
                        reportTypeLabel(report.behavior) +
                          (report.behaviorOther
                            ? ": " + report.behaviorOther
                            : ""),
                      ],
                      [
                        "Phân loại ban đầu",
                        reportTypeLabel(
                          report.initialBehavior || report.behavior,
                        ) +
                          (report.initialBehaviorOther
                            ? ": " + report.initialBehaviorOther
                            : ""),
                      ],
                      [
                        "Kênh tiếp nhận",
                        report.source +
                          (report.sourceOther ? ": " + report.sourceOther : ""),
                      ],
                    ]}
                  />
                </Card>
                <Card className="detail-card">
                  <CardHead title="Tài liệu đính kèm" />
                  {report.attachment ? (
                    <div className="file-row">
                      <b>anh-chuyen-khoan-mau.png</b>
                      <Button
                        variant="secondary"
                        onClick={() => setPreview(true)}
                      >
                        Xem trước
                      </Button>
                    </div>
                  ) : (
                    <div className="empty">Không có tài liệu đính kèm.</div>
                  )}
                </Card>
              </div>
            </div>
          }
          processing={
            <div className="page-stack">
              {permit(actor, "report.receive", report, cases) ? (
                <div>
                  <ReceptionPanel
                    report={report}
                    actor={actor}
                    accounts={accounts}
                    cases={cases}
                    onAction={onAction}
                    showSupplements={false}
                  />
                </div>
              ) : (
                <details className="report-handoff-summary">
                  <summary>
                    Tiến độ tiếp nhận · {report.intakeStatus || "Mới tiếp nhận"}
                  </summary>
                  <ReceptionPanel
                    report={report}
                    actor={actor}
                    accounts={accounts}
                    cases={cases}
                    onAction={onAction}
                    showSupplements={false}
                  />
                </details>
              )}

              {!canAnalyze && (
                <p className="access-note">
                  Chỉ xem thông tin phân tích.{" "}
                  {actor.role === R.analyst
                    ? "Phiếu cần được tiếp nhận bàn giao và giao cho tài khoản này trước khi chỉnh sửa."
                    : "Quyền chỉnh sửa thực thể và xác nhận liên kết thuộc cán bộ phân tích được giao."}
                </p>
              )}
              <div className="report-processing-grid">
                <Card className="extraction">
                  <CardHead
                    title="Thông tin trích xuất"
                    sub="Mô phỏng theo kịch bản mẫu, không sử dụng OCR/AI hay API."
                  />
                  {!extracted ? (
                    <>
                      {actor.role === R.analyst && (
                        <Button
                          disabled={!canAnalyze}
                          onClick={() => {
                            setExtracted(true)
                            onUpdate(
                              { ...report, extracted: true },
                              "extract-start",
                            )
                            onLog("Trích xuất mô phỏng", report.id)
                          }}
                        >
                          Trích xuất thông tin
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="entity-form">
                      <p className="people-privacy-note">
                        Bấm Xem ở tài khoản / số điện thoại trước khi kiểm tra
                        hoặc sửa.
                      </p>
                      <Field label="Tên / danh xưng bên bị phản ánh">
                        <input
                          value={draft.subjectName}
                          readOnly={!canAnalyze}
                          onChange={(e) => {
                            setDraft({ ...draft, subjectName: e.target.value })
                            setDirty(true)
                          }}
                        />
                      </Field>
                      <SensitiveInput
                        label="Mạng xã hội bên bị phản ánh"
                        name="subjectSocial"
                        value={draft.socialAccount}
                        canEdit={canAnalyze}
                        onChange={(value) => {
                          setDraft({ ...draft, socialAccount: value })
                          setDirty(true)
                        }}
                      />
                      <Field label="Loại phản ánh">
                        <select
                          value={draft.behavior}
                          disabled={!canAnalyze}
                          onChange={(e) => {
                            setDraft({ ...draft, behavior: e.target.value })
                            setDirty(true)
                          }}
                        >
                          {Array.from(
                            new Set([...REPORT_TYPES, draft.behavior]),
                          ).map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                      </Field>
                      {draft.behavior === "Khác" && (
                        <Field label="Mô tả loại phản ánh">
                          <input
                            value={draft.behaviorOther}
                            readOnly={!canAnalyze}
                            onChange={(e) => {
                              setDraft({
                                ...draft,
                                behaviorOther: e.target.value,
                              })
                              setDirty(true)
                            }}
                          />
                        </Field>
                      )}
                      {(
                        [
                          ["account", "Tài khoản ngân hàng"],
                          ["bank", "Ngân hàng"],
                          ["phone", "Số điện thoại"],
                          ["website", "Website"],
                          ["amount", "Số tiền (triệu đồng)"],
                        ] as const
                      ).map(([key, label]) =>
                        key === "account" || key === "phone" ? (
                          <SensitiveInput
                            key={key}
                            name={key}
                            label={label}
                            value={draft[key]}
                            canEdit={canAnalyze}
                            onChange={(value) => {
                              setDraft({ ...draft, [key]: value })
                              setDirty(true)
                            }}
                          />
                        ) : (
                          <Field label={label} key={key}>
                            <input
                              type={key === "amount" ? "number" : "text"}
                              min={key === "amount" ? 0 : undefined}
                              step={key === "amount" ? "any" : undefined}
                              value={draft[key]}
                              readOnly={!canAnalyze}
                              onChange={(e) => {
                                setDraft({ ...draft, [key]: e.target.value })
                                setDirty(true)
                              }}
                            />
                          </Field>
                        ),
                      )}
                      {error && (
                        <div role="alert" className="error-box">
                          {error}
                        </div>
                      )}
                      <p className="extraction-note">
                        Lưu thông tin đã kiểm tra để xem đề xuất liên kết. Kết
                        quả chỉ hỗ trợ xác minh; không phải kết luận vi phạm.
                      </p>
                      <Field label="Nhận định phân tích">
                        <textarea
                          rows={3}
                          value={draft.analysisNote}
                          readOnly={!canAnalyze}
                          onChange={(e) => {
                            setDraft({ ...draft, analysisNote: e.target.value })
                            setDirty(true)
                          }}
                        />
                      </Field>
                      {actor.role === R.analyst && (
                        <Button disabled={!canAnalyze} onClick={save}>
                          Lưu thông tin đã kiểm tra
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
                <div className="page-stack">
                  {" "}
                  {extracted && report.reviewed && !dirty && (
                    <Card className="detail-card evidence-card">
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
                              {match.fields.map((key) => (
                                <span className="evidence-field" key={key}>
                                  {
                                    {
                                      account: "Tài khoản",
                                      phone: "Điện thoại",
                                      website: "Website",
                                    }[key]
                                  }
                                  :{" "}
                                  {key === "website" ? (
                                    report[key]
                                  ) : (
                                    <SensitiveValue
                                      value={report[key]}
                                      label={`${key === "account" ? "tài khoản" : "điện thoại"} trong căn cứ liên kết`}
                                      name={key}
                                      inline
                                    />
                                  )}
                                </span>
                              ))}
                            </p>
                          ))}
                          {report.cluster === cluster.id ? (
                            <Badge tone="green">Đã xác nhận liên kết</Badge>
                          ) : report.rejectedClusters?.includes(cluster.id) ? (
                            <>
                              <Badge tone="gray">Đã loại bỏ đề xuất</Badge>
                              {actor.role === R.analyst && (
                                <Button
                                  variant="ghost"
                                  disabled={!canAnalyze}
                                  onClick={() => {
                                    onUpdate({
                                      ...report,
                                      rejectedClusters:
                                        report.rejectedClusters?.filter(
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
                              )}
                            </>
                          ) : (
                            <>
                              {actor.role === R.analyst && (
                                <Button
                                  disabled={
                                    !canAnalyze || !report.reviewed || dirty
                                  }
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
                                  }}
                                >
                                  Xác nhận liên kết {cluster.id}
                                </Button>
                              )}
                              {actor.role === R.analyst && (
                                <Button
                                  variant="secondary"
                                  disabled={!canAnalyze}
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
                                  }}
                                >
                                  Loại bỏ đề xuất {cluster.id}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                      {!evidence.length && (
                        <p className="muted">
                          Chưa có thực thể trùng khớp. Phản ánh được theo dõi
                          độc lập.
                        </p>
                      )}
                      {(!report.reviewed || dirty) && (
                        <p className="extraction-note">
                          Lưu thông tin đã kiểm tra trước khi xác nhận liên kết.
                        </p>
                      )}
                    </Card>
                  )}
                </div>
              </div>
            </div>
          }
          history={<ReportHistory report={report} logs={logs} />}
        />
        {preview && (
          <Modal
            title="Bằng chứng giao dịch mô phỏng"
            onClose={() => setPreview(false)}
          >
            <div className="receipt-preview">
              <b>{report.bank || "NGÂN HÀNG MẪU"}</b>
              <div className="receipt-amount">
                {(report.amount * 1000000).toLocaleString("vi-VN")} đ
              </div>
              <p>
                <SensitiveValue
                  value={report.account}
                  label="tài khoản trên tài liệu mẫu"
                  name="account"
                  inline
                />{" "}
                ·{" "}
                {report.occurredTimeUnknown
                  ? "Không nhớ chính xác"
                  : formatDateTime(report.occurredAt)}
              </p>
              <div className="watermark">TÀI LIỆU GIẢ LẬP</div>
            </div>
          </Modal>
        )}
      </div>
    </ReportPrivacy>
  )
}

function Alerts({
  alerts,
  reports,
  selectedId,
  onSelectionChange,
  onOpen,
  onGraph,
  onCreate,
  allowCreate = false,
}: {
  alerts: AlertItem[]
  reports: Report[]
  selectedId: string
  onSelectionChange: (id: string) => void
  onOpen: (id: string) => void
  onGraph: (clusterId: string) => void
  allowCreate?: boolean
  onCreate: (clusterId?: string) => void
}) {
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const [level, setLevel] = useState("Tất cả mức độ")
  const filtered = alerts.filter(
    (alert) => level === "Tất cả mức độ" || alert.level === level,
  )
  const requested = alerts.find((alert) => alert.id === selectedId)
  const selected =
    filtered.find((alert) => alert.id === requested?.id) || filtered[0]
  useEffect(() => {
    if (selected && selected.id !== selectedId) onSelectionChange(selected.id)
  }, [selected?.id, selectedId, onSelectionChange])
  const related = !selected
    ? []
    : selected.clusterId
      ? reports.filter((report) => report.cluster === selected.clusterId)
      : reports.filter((report) => report.id === selected.reportId)
  const total = related.reduce((sum, report) => sum + report.amount, 0)
  return (
    <div className="page-stack">
      <PageHeader
        title="Cảnh báo cần rà soát"
        description={
          <>
            {" "}
            Điểm minh họa dùng để ưu tiên xác minh, không phải kết luận vi
            phạm.{" "}
          </>
        }
        action={<> </>}
      />
      <div className="alert-layout" data-priority={selected?.level}>
        <Card className="alert-list">
          <div className="alert-list-head">
            <span>{alerts.length} cảnh báo đang mở</span>
            <select
              aria-label="Lọc mức độ cảnh báo"
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
                  selected?.id === alert.id ? "active" : ""
                }`}
                aria-pressed={selected?.id === alert.id}
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
                  <p>
                    Nguồn mới nhất:{" "}
                    {formatDateTime(
                      [...items]
                        .map((r) => r.receivedAt || "")
                        .sort()
                        .at(-1),
                    )}
                  </p>
                  <Badge tone="gray">Cần rà soát</Badge>
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="empty">Không có kết quả phù hợp.</div>
          )}
        </Card>
        {selected ? (
          <Card className="alert-side">
            <div
              className="score-ring"
              style={{
                background: `conic-gradient(var(--priority-color, var(--red)) 0 ${selected.score}%,#e9edf1 ${selected.score}%)`,
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
                {allowCreate && (
                  <Button
                    variant="ghost"
                    className="full"
                    onClick={() => onCreate(selected.clusterId)}
                  >
                    Tạo hồ sơ
                  </Button>
                )}
              </>
            )}
          </Card>
        ) : (
          <Card className="alert-side alert-empty">
            <EmptyState>
              {alerts.length
                ? "Không có cảnh báo phù hợp bộ lọc. Chọn mức độ khác để xem chi tiết."
                : "Không có cảnh báo trong phạm vi tài khoản."}
            </EmptyState>
          </Card>
        )}
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
  allowCreate = false,
}: {
  alert: AlertItem
  reports: Report[]
  onClose: () => void
  onGraph: () => void
  allowCreate?: boolean
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
          {alert.clusterId && allowCreate && (
            <Button onClick={onCreate}>Tạo hồ sơ</Button>
          )}
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
  relatedCases,
  onOpenRelated,
  onClose,
  onCreate,
  onClusterChange,
}: {
  onClusterChange: (id: string) => void
  cluster: Cluster
  reportIds: string[]
  reportCount: number
  total: number
  relatedCases: CaseFile[]
  onOpenRelated: (id: string) => void
  onClose: () => void
  onCreate: (value: {
    name: string
    officer: string
    priority: string
    clusterId: string
    reportIds: string[]
    duplicateConsent?: string
  }) => boolean
}) {
  const [name, setName] = useState(
    `Xác minh ${cluster.name.toLowerCase()} ${cluster.id}`,
  )
  const signature = duplicateConsentKey(cluster.id, reportIds, relatedCases)
  const hasDuplicate = relatedCases.some((c) =>
    sameReportIds(c.reportIds, reportIds),
  )
  const [acknowledged, setAcknowledged] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submitLock = useRef(false)
  useEffect(() => {
    setAcknowledged(null)
  }, [signature])
  const create = () => {
    if (submitLock.current || (hasDuplicate && acknowledged !== signature))
      return
    submitLock.current = true
    setSubmitting(true)
    const success = onCreate({
      name: name.trim(),
      officer: "Chưa phân công",
      priority: cluster.risk,
      clusterId: cluster.id,
      reportIds,
      duplicateConsent: hasDuplicate ? acknowledged! : undefined,
    })
    if (!success) {
      submitLock.current = false
      setSubmitting(false)
      setAcknowledged(null)
    }
  }
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
            disabled={
              submitting ||
              !name.trim() ||
              !reportIds.length ||
              (hasDuplicate && acknowledged !== signature)
            }
            onClick={create}
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
      {!!relatedCases.length && (
        <section
          className="related-source-cases"
          aria-label="Hồ sơ liên quan đã tồn tại"
        >
          <h3>Hồ sơ liên quan đã tồn tại</h3>
          {relatedCases.map((c) => (
            <article key={c.id}>
              <b>
                {c.id} · {c.name}
              </b>
              <p>
                {c.status} ·{" "}
                {sameReportIds(c.reportIds, reportIds)
                  ? "Cùng bộ phản ánh"
                  : "Khác bộ phản ánh"}
              </p>
              <small>Nguồn đã lưu: {c.reportIds.join(", ")}</small>
              <Button variant="secondary" onClick={() => onOpenRelated(c.id)}>
                Mở hồ sơ {c.id}
              </Button>
            </article>
          ))}
        </section>
      )}
      {hasDuplicate && (
        <label className="duplicate-case-consent">
          <input
            type="checkbox"
            checked={acknowledged === signature}
            onChange={(e) =>
              setAcknowledged(e.target.checked ? signature : null)
            }
          />
          Tôi đã kiểm tra hồ sơ cùng bộ phản ánh và vẫn muốn tạo hồ sơ mới.
        </label>
      )}
      <Field label="Tên hồ sơ" required>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <p className="access-note">
        Hồ sơ mới chờ lãnh đạo phân công cán bộ xử lý. Mức ưu tiên ban đầu theo
        cụm: {cluster.risk}.
      </p>
    </Modal>
  )
}

function Cases({
  cases,
  reports,
  onOpen,
  onCreate,
  canCreate = false,
}: {
  cases: CaseFile[]
  reports: Report[]
  onOpen: (id: string) => void
  canCreate?: boolean
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
      <PageHeader
        title="Hồ sơ vụ việc"
        description={
          <> Theo dõi quá trình xác minh và tổng hợp nhận định nghiệp vụ. </>
        }
        action={
          <>
            {" "}
            {canCreate && (
              <Button onClick={onCreate}>＋ Tạo hồ sơ phân tích</Button>
            )}{" "}
          </>
        }
      />
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
      <Card className="filter-card case-filter">
        <FilterField label="Tìm hồ sơ">
          <div className="search-wrap">
            <span>⌕</span>
            <input
              placeholder="Tìm mã hoặc tên hồ sơ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </FilterField>
        <FilterField label="Trạng thái">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Tất cả trạng thái</option>
            <option>Mới tạo</option>
            <option>Đang xác minh</option>
            <option>Chờ bổ sung</option>
            <option>Hoàn tất phân tích</option>
          </select>
        </FilterField>
      </Card>
      <Card className="table-card">
        <DataTable>
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
                  <td>
                    {reportTypeLabel(related[0]?.behavior || "Chưa xác định")}
                  </td>
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
        </DataTable>
        {!filtered.length && (
          <EmptyState>Không tìm thấy hồ sơ phù hợp.</EmptyState>
        )}
      </Card>
    </div>
  )
}

function CaseDetail({
  item,
  reports,
  actor,
  accounts,
  onAction,
  onBack,
  onLogs,
  onReport,
  onDraftChange,
}: {
  item: CaseFile
  reports: Report[]
  actor: StaffAccount
  accounts: StaffAccount[]
  onAction: (op: Operation) => boolean
  onBack: () => void
  onLogs?: () => void
  onReport: (id: string) => void
  onDraftChange: (value: boolean) => void
}) {
  const [tab, setTab] = useState("Tổng quan"),
    [preview, setPreview] = useState<{ version?: ReportVersion } | null>(null)
  const related = reports.filter((r) => item.reportIds.includes(r.id))
  const total = related.reduce((n, r) => n + r.amount, 0)
  const tabs = [
    "Tổng quan",
    "Phản ánh liên quan",
    "Thực thể",
    "Tài liệu",
    "Lịch sử xử lý",
  ]
  const snapshot = preview?.version?.snapshot
  const previewItem = snapshot
    ? { ...item, ...snapshot, note: preview!.version!.content }
    : item
  return (
    <div className="page-stack">
      <button className="back-link" onClick={onBack}>
        ← Quay lại danh sách hồ sơ
      </button>
      <div className="detail-hero case-hero">
        <div>
          <div className="detail-code">{item.id}</div>
          <h1 className="page-heading">{item.name}</h1>
          <div className="hero-meta">
            <Badge tone="blue">{item.status}</Badge>
            <span>
              {item.officer} · {item.reportIds.length} phản ánh · {total} triệu
              đồng
            </span>
          </div>
        </div>
        <div className="hero-buttons">
          {onLogs && (
            <Button variant="secondary" onClick={onLogs}>
              Xem nhật ký
            </Button>
          )}
          <Button
            onClick={() => setPreview({ version: item.reportVersions?.at(-1) })}
          >
            Xem báo cáo
          </Button>
        </div>
      </div>
      <Tabs items={tabs} active={tab} onChange={setTab} />
      <div style={{ display: tab === "Tổng quan" ? "block" : "none" }}>
        <CaseWorkPanel
          item={item}
          actor={actor}
          accounts={accounts}
          onAction={onAction}
          onDraftChange={onDraftChange}
          onPreview={(version) => setPreview({ version })}
        />
      </div>
      {tab !== "Tổng quan" && (
        <CaseTab
          tab={tab}
          item={item}
          related={related}
          entities={getEntities(related)}
          onReport={onReport}
        />
      )}
      {preview && (
        <ReportModal
          item={previewItem}
          reports={snapshot?.reports || related}
          version={preview.version}
          onClose={() => setPreview(null)}
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
      <Card className="table-card">
        <ReportTable reports={related} onOpen={onReport} />
        {related.length === 0 && (
          <div className="empty">Không có kết quả phù hợp.</div>
        )}
      </Card>
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
      <Card className="entity-list">
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
      </Card>
    )
  }
  if (tab === "Tài liệu") {
    const documents = related.filter((report) => report.attachment)
    return (
      <Card className="detail-card">
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
        {(item.workItems || [])
          .filter((w) => w.attachment)
          .map((w, i) => (
            <div className="file-row" key={`work-${i}`}>
              <div className="file-icon">MẪU</div>
              <div>
                <b>Tài liệu bổ sung {i + 1}</b>
                <span>
                  {w.author} · {formatDateTime(w.time)}
                </span>
                <p>{w.content}</p>
                <small>Tài liệu giả lập</small>
              </div>
            </div>
          ))}
        {documents.length === 0 &&
          !(item.workItems || []).some((w) => w.attachment) && (
            <div className="empty">Hồ sơ chưa có tài liệu đính kèm.</div>
          )}
      </Card>
    )
  }
  return (
    <Card className="timeline">
      {(item.history || []).map((entry, index) => (
        <div key={`${entry}-${index}`}>
          <i />
          <b>{entry.split(" · ")[1] || entry}</b>
          <span>{formatDateTime(entry.split(" · ")[0])}</span>
        </div>
      ))}
    </Card>
  )
}

function ReportModal({
  item,
  reports,
  onClose,
  version,
}: {
  item: CaseFile
  reports: Report[]
  onClose: () => void
  version?: ReportVersion
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
            [
              "Phiên bản báo cáo",
              version
                ? `${version.version} · ${version.state}`
                : "Tổng hợp hiện tại (chưa lưu)",
            ],
            ["Ý kiến xem xét", version?.reviewNote || "Chưa có"],
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
          <b>Loại phản ánh</b>
          <p>
            {reports
              .map(
                (r) =>
                  `${r.id}: ${reportTypeLabel(r.behavior)}${r.behaviorOther ? ": " + r.behaviorOther : ""}`,
              )
              .join("; ")}
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

function Logs({
  logs,
  onOpen,
}: {
  logs: LogItem[]
  onOpen: (x: LogItem) => void
}) {
  const [q, setQ] = useState("")
  const [action, setAction] = useState("Tất cả thao tác")
  const [user, setUser] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const actions = Array.from(new Set(logs.map((x) => x.action)))
  const filtered = useMemo(
    () =>
      logs.filter(
        (x) =>
          `${x.user} ${x.target} ${x.action} ${x.detail || ""}`
            .toLowerCase()
            .includes(q.toLowerCase()) &&
          (action === "Tất cả thao tác" || x.action === action) &&
          (!user || x.user === user) &&
          (!from || dayKey(x.time) >= from) &&
          (!to || dayKey(x.time) <= to),
      ),
    [logs, q, action, user, from, to],
  )
  return (
    <div className="page-stack">
      <PageHeader
        title="Nhật ký hệ thống"
        description="Theo dõi thao tác và thay đổi dữ liệu trong môi trường demo."
        action={<Badge tone="green">Ghi nhận tự động</Badge>}
      />
      <Card className="filter-card audit-filter">
        <FilterField label="Tìm kiếm">
          <div className="search-wrap">
            <span>⌕</span>
            <input
              placeholder="Tìm tài khoản, đối tượng..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </FilterField>
        <FilterField label="Thao tác">
          <select value={action} onChange={(e) => setAction(e.target.value)}>
            <option>Tất cả thao tác</option>
            {actions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Người thao tác">
          <select value={user} onChange={(e) => setUser(e.target.value)}>
            <option value="">Tất cả tài khoản</option>
            {Array.from(new Set(logs.map((x) => x.user))).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Từ ngày">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </FilterField>
        <FilterField label="Đến ngày">
          <input
            type="date"
            min={from}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </FilterField>
      </Card>
      <Card className="table-card audit-card">
        <DataTable>
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
                  {x.detail && (
                    <details
                      className="audit-changes"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <summary>Chi tiết thay đổi</summary>
                      <p>{x.detail}</p>
                      <button className="text-action" onClick={() => onOpen(x)}>
                        Mở sự kiện
                      </button>
                    </details>
                  )}
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
        </DataTable>
        {!filtered.length && (
          <EmptyState>Không có sự kiện phù hợp bộ lọc.</EmptyState>
        )}
      </Card>
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

function CitizenReportView({
  report,
  initialTab,
  processing,
  onBack,
}: {
  report: Report
  initialTab: ReportSection
  processing: React.ReactNode
  onBack: () => void
}) {
  return (
    <ReportPrivacy>
      <section className="report-intake report-detail-page citizen-report-detail">
        <button className="intake-link" onClick={onBack}>
          ← Xem danh sách phản ánh
        </button>
        <div className="detail-hero">
          <div>
            <div className="detail-code">{report.id}</div>
            <h1 className="page-heading">{report.title}</h1>
            <Badge tone="blue">{report.intakeStatus || "Mới tiếp nhận"}</Badge>
          </div>
        </div>
        <ReportTabs
          initialTab={initialTab}
          pending={
            report.intakeStatus === "Chờ bổ sung"
              ? "Phản ánh đang cần bạn bổ sung thông tin."
              : undefined
          }
          information={
            <div className="intake-card">
              <h2>
                {report.id} · {report.title}
              </h2>
              <p>
                Loại phản ánh: {reportTypeLabel(report.behavior)}
                {report.behaviorOther ? ": " + report.behaviorOther : ""}
              </p>
              <p>
                Phát sinh:{" "}
                {report.occurredTimeUnknown
                  ? "Không nhớ chính xác"
                  : formatDateTime(report.occurredAt)}
              </p>
              <p>
                Tiếp nhận: {formatDateTime(report.receivedAt)} · Giờ Việt Nam
              </p>
              <p>
                Số tiền:{" "}
                {report.transferStatus === "Không"
                  ? "Không phát sinh chuyển tiền"
                  : `${report.amount} triệu đồng`}
              </p>
              <Badge tone="blue">
                {report.intakeStatus || "Mới tiếp nhận"}
              </Badge>
              <div className="intake-content">
                <ReportStatement report={report} />
              </div>
              <p>Tài liệu: {report.attachment ? "01 ảnh mẫu" : "Không có"}</p>
            </div>
          }
          processing={processing}
          history={<ReportHistory report={report} logs={[]} />}
        />
      </section>
    </ReportPrivacy>
  )
}
