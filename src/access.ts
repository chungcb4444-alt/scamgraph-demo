import type { StaffAccount, Report, CaseFile, LogItem } from "./types"
import { caseReceiptAllowsWork, currentAssignment } from "./receiptWorkflow.ts"
export const R = {
  citizen: "Người dân / Tổ chức",
  reception: "Cán bộ tiếp nhận",
  analyst: "Cán bộ phân tích",
  worker: "Cán bộ xử lý hồ sơ",
  leader: "Lãnh đạo theo dõi",
  supervisor: "Kiểm tra, giám sát",
  admin: "Quản trị hệ thống",
} as const
export const UNIT = "Đơn vị nghiệp vụ A"
export const accountSeeds: StaffAccount[] = [
  {
    id: "cong.dan.demo",
    name: "Nguyễn Hoàng Minh",
    role: R.citizen,
    unitId: UNIT,
    active: true,
    kind: "citizen",
  },
  {
    id: "tiep.nhan.demo",
    name: "Trần Minh Tuấn",
    role: R.reception,
    unitId: UNIT,
    active: true,
    kind: "staff",
  },
  {
    id: "phan.tich.demo",
    name: "Nguyễn Xuân Sơn",
    role: R.analyst,
    unitId: UNIT,
    active: true,
    kind: "staff",
  },
  {
    id: "xu.ly.demo",
    name: "Lê Minh Anh",
    role: R.worker,
    unitId: UNIT,
    active: true,
    kind: "staff",
  },
  {
    id: "xu.ly.huy",
    name: "Trần Quốc Huy",
    role: R.worker,
    unitId: UNIT,
    active: true,
    kind: "staff",
  },
  {
    id: "lanh.dao.demo",
    name: "Nguyễn Duy Hoàng",
    role: R.leader,
    unitId: UNIT,
    active: true,
    kind: "staff",
  },
  {
    id: "giam.sat.demo",
    name: "Lê Quốc Bảo",
    role: R.supervisor,
    unitId: UNIT,
    active: true,
    kind: "staff",
  },
  {
    id: "quan.tri.demo",
    name: "Quản trị hệ thống",
    role: R.admin,
    unitId: UNIT,
    active: true,
    kind: "staff",
  },
]
// Update only former placeholder names; account identity and permissions stay intact.
const formerStaffNames: Record<string, string> = {
  "Nguyễn Phân Tích": "Nguyễn Xuân Sơn",
  "Nguyễn Lãnh Đạo": "Nguyễn Duy Hoàng",
  "Nguyễn Tiếp Nhận": "Trần Minh Tuấn",
  "Nguyễn Giám Sát": "Lê Quốc Bảo",
}
export function renameStaffAccount(account: StaffAccount): StaffAccount {
  const seed = accountSeeds.find((a) => a.id === account.id)
  return account.kind === "staff" &&
    seed &&
    formerStaffNames[account.name] === seed.name
    ? { ...account, name: seed.name }
    : account
}
export const accountForRole = (role: string) =>
  accountSeeds.find((a) => a.role === role)?.id || "phan.tich.demo"
export function initialAccount() {
  try {
    const id =
      JSON.parse(localStorage.getItem("scamgraph-demo-account") || "null") ||
      accountForRole(
        JSON.parse(localStorage.getItem("scamgraph-demo-role") || "null"),
      )
    for (const suffix of ["form", "step"]) {
      const oldKey = `scamgraph-demo-wizard-${suffix}`,
        raw = localStorage.getItem(oldKey),
        key = `scamgraph-intake:${id}:${suffix}`
      if (raw !== null) {
        if (!localStorage.getItem(key)) localStorage.setItem(key, raw)
        localStorage.setItem(`${oldKey}:account-migration-backup`, raw)
        localStorage.removeItem(oldKey)
      }
    }
    return id as string
  } catch {
    return "phan.tich.demo"
  }
}
export function migrateAccounts() {
  try {
    const old = JSON.parse(
      localStorage.getItem("scamgraph-demo-account-roles") || "{}",
    )
    return accountSeeds.map((a) => ({
      ...a,
      role:
        a.kind === "staff" &&
        Object.values(R)
          .filter((r) => r !== R.citizen)
          .includes(old[a.id])
          ? old[a.id]
          : a.role,
    }))
  } catch {
    return accountSeeds
  }
}
export function migrateReport(r: Report): Report {
  return {
    ...r,
    unitId: r.unitId || UNIT,
    intakeStatus:
      r.intakeStatus ||
      (r.reviewed ||
      r.cluster ||
      !["Mới tiếp nhận", "Chờ kiểm tra", "Không hợp lệ"].includes(r.status)
        ? "Chuyển phân tích"
        : r.status === "Không hợp lệ"
          ? "Không hợp lệ"
          : "Mới tiếp nhận"),
    analysisStatus:
      r.analysisStatus ||
      (r.reviewed
        ? "Đã kiểm tra"
        : r.cluster
          ? "Đang phân tích"
          : "Chờ phân tích"),
    analysisAssignee:
      r.analysisAssignee ||
      (r.cluster || r.reviewed ? "phan.tich.demo" : undefined),
  }
}
export function migrateCase(c: CaseFile): CaseFile {
  const known = accountSeeds.find(
    (a) => a.kind === "staff" && a.role === R.worker && a.name === c.officer,
  )
  return {
    ...c,
    officer: formerStaffNames[c.officer] || c.officer,
    unitId: c.unitId || UNIT,
    assignedTo: c.assignedTo || known?.id,
    reportVersions: c.reportVersions || [],
    directives: c.directives || [],
    workItems: c.workItems || [],
  }
}
export type Screen =
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
const menus: Record<string, Screen[]> = {
  [R.citizen]: ["reports", "new-report"],
  [R.reception]: ["reports", "new-report"],
  [R.analyst]: ["reports", "graph", "alerts", "cases"],
  [R.worker]: ["cases", "reports", "graph", "alerts"],
  [R.leader]: ["dashboard", "cases", "reports", "graph", "alerts", "logs"],
  [R.supervisor]: ["logs", "reports", "cases", "graph", "alerts"],
  [R.admin]: ["accounts", "logs"],
}
export function allowedScreens(a: StaffAccount): Screen[] {
  return a.active ? menus[a.role] || [] : []
}
export function homeScreen(a: StaffAccount): Screen {
  return allowedScreens(a)[0] || "dashboard"
}
export function screenAllowed(a: StaffAccount, screen: Screen) {
  const root =
    screen === "report-detail"
      ? "reports"
      : screen === "case-detail"
        ? "cases"
        : screen
  return allowedScreens(a).includes(root)
}
export function canReadCase(a: StaffAccount, c: CaseFile) {
  return (
    a.active &&
    a.unitId === (c.unitId || UNIT) &&
    [R.analyst, R.worker, R.leader, R.supervisor].includes(a.role as never) &&
    (a.role !== R.worker || c.assignedTo === a.id)
  )
}
export function canReadReport(a: StaffAccount, r: Report, cases: CaseFile[]) {
  if (!a.active) return false
  if (a.kind === "citizen") return r.submittedBy === a.id
  if (
    a.unitId !== (r.unitId || UNIT) ||
    [R.admin, R.citizen].includes(a.role as never)
  )
    return false
  if (a.role === R.worker)
    return cases.some((c) => canReadCase(a, c) && c.reportIds.includes(r.id))
  return [R.reception, R.analyst, R.leader, R.supervisor].includes(
    a.role as never,
  )
}
export type Permission =
  | "report.create"
  | "report.accept"
  | "report.receive"
  | "report.supplement"
  | "report.analyze"
  | "report.link"
  | "case.create"
  | "case.assign"
  | "case.accept"
  | "case.discuss"
  | "case.source.handle"
  | "case.work"
  | "case.report"
  | "case.review"
  | "case.request"
  | "sensitive.read"
  | "account.manage"
  | "logs.read"
export function permit(
  a: StaffAccount,
  p: Permission,
  subject?: Report | CaseFile,
  cases: CaseFile[] = [],
): boolean {
  if (!a.active) return false
  const report =
    subject && "content" in subject ? (subject as Report) : undefined
  const item =
    subject && "reportIds" in subject ? (subject as CaseFile) : undefined
  const reportRead = !!report && canReadReport(a, report, cases)
  const caseRead = !!item && canReadCase(a, item)
  const latest = item?.reportVersions?.at(-1)
  const mutableCase =
    caseRead &&
    item?.assignedTo === a.id &&
    a.role === R.worker &&
    item.status !== "Đã đóng" &&
    caseReceiptAllowsWork(item) &&
    latest?.state !== "Chờ xem xét" &&
    latest?.state !== "Đã phê duyệt"
  switch (p) {
    case "report.create":
      return a.kind === "citizen" || a.role === R.reception
    case "report.accept":
      return (
        reportRead &&
        a.role === R.reception &&
        report?.intakeStatus !== "Chuyển phân tích" &&
        !report?.intakeReceipt
      )
    case "report.receive":
      return (
        reportRead &&
        a.role === R.reception &&
        report?.intakeStatus !== "Chuyển phân tích" &&
        (report.receiptWorkflow !== 2 || !!report.intakeReceipt)
      )
    case "report.supplement":
      return (
        reportRead &&
        a.kind === "citizen" &&
        report?.intakeStatus === "Chờ bổ sung"
      )
    case "report.analyze":
      return (
        reportRead &&
        a.role === R.analyst &&
        report?.intakeStatus === "Chuyển phân tích" &&
        (!report.analysisAssignee || report.analysisAssignee === a.id)
      )
    case "report.link":
      return (
        permit(a, "report.analyze", report, cases) &&
        !!report?.reviewed &&
        report.analysisStatus === "Đã kiểm tra"
      )
    case "case.create":
      return a.role === R.analyst && (!subject || reportRead)
    case "case.assign":
      return (
        caseRead &&
        a.role === R.leader &&
        latest?.state !== "Chờ xem xét" &&
        latest?.state !== "Đã phê duyệt"
      )
    case "case.accept":
      return (
        caseRead &&
        a.role === R.worker &&
        item?.assignedTo === a.id &&
        item.receiptWorkflow === 2 &&
        !!currentAssignment(item) &&
        !currentAssignment(item)?.received
      )
    case "case.source.handle":
      return caseRead && a.role === R.analyst
    case "case.discuss":
      return (
        caseRead &&
        item?.status !== "Đã đóng" &&
        [R.analyst, R.worker, R.leader].includes(a.role as never) &&
        (a.role !== R.worker || caseReceiptAllowsWork(item!))
      )
    case "case.work":
    case "case.report":
      return !!mutableCase
    case "case.request":
      return (
        caseRead &&
        a.role === R.worker &&
        item?.assignedTo === a.id &&
        caseReceiptAllowsWork(item)
      )
    case "case.review":
      return caseRead && a.role === R.leader && latest?.state === "Chờ xem xét"
    case "sensitive.read":
      return reportRead
    case "account.manage":
      return a.role === R.admin
    case "logs.read":
      return [R.admin, R.leader, R.supervisor].includes(a.role as never)
  }
}
export function visibleLogs(a: StaffAccount, logs: LogItem[]) {
  if (!permit(a, "logs.read")) return []
  return logs.filter(
    (l) =>
      (l.unitId || UNIT) === a.unitId &&
      (a.role !== R.admin ||
        l.category === "Quản trị" ||
        /quyền|tài khoản|Đăng nhập|Đăng xuất/.test(l.action)),
  )
}
export const roleTask: Record<string, string> = {
  [R.citizen]:
    "Gửi phản ánh, theo dõi tiếp nhận và bổ sung thông tin khi có yêu cầu.",
  [R.reception]:
    "Kiểm tra phiếu, yêu cầu bổ sung và chuyển phản ánh đủ thông tin sang phân tích.",
  [R.analyst]:
    "Kiểm tra thực thể, đối chiếu căn cứ liên kết và tạo hồ sơ chờ phân công.",
  [R.worker]: "Cập nhật tiến độ, nhận định và lập báo cáo cho hồ sơ được giao.",
  [R.leader]: "Phân công hồ sơ, chỉ đạo xử lý và xem xét báo cáo trong đơn vị.",
  [R.supervisor]:
    "Đối chiếu lịch sử thao tác và thay đổi dữ liệu trong phạm vi giám sát.",
  [R.admin]:
    "Quản lý tài khoản nội bộ, đơn vị, trạng thái hoạt động và quyền truy cập.",
}
