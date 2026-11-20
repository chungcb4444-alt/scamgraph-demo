import type { Report } from "./types"
import samples from "./reportPeopleSamples.json"

// Only recognize original seed titles. A manually created report with the same
// ID must never inherit another person's identity from the reference document.
const seedTitles: Record<string, string> = {
  "PA-001": "Cuộc gọi yêu cầu xác minh tài khoản",
  "PA-002": "Yêu cầu chuyển tiền để khóa giao dịch",
  "PA-003": "Trang xác minh tài khoản đáng ngờ",
  "PA-004": "Giả danh cán bộ yêu cầu nộp phạt",
  "PA-005": "Thông báo vi phạm hành chính giả",
  "PA-006": "Cuộc gọi tự xưng cơ quan điều tra",
  "PA-007": "Đơn hàng trực tuyến không được giao",
  "PA-008": "Mời đầu tư lợi nhuận cao",
  "PA-009": "Tin nhắn nhận quà trúng thưởng",
  "PA-010": "Tuyển cộng tác viên xử lý đơn",
  "PA-011": "Tài khoản mạng xã hội mạo danh",
  "PA-012": "Đường dẫn cập nhật dịch vụ giả",
}
export function samplePeople(id: string) {
  return (
    samples as Record<
      string,
      {
        senderName: string
        senderContact: string
        people: NonNullable<Report["people"]>
      }
    >
  )[id]
}
export function reportPeople(report: Report) {
  const knownSample013 =
    report.id === "PA-013" &&
    report.title === "Yêu cầu xác minh tài khoản qua website đáng ngờ" &&
    report.senderName === "Nguyễn Hoàng Minh" &&
    report.senderContact === "DEMO-LIEN-HE-013"
  const reference = samplePeople(report.id)
  const sample =
    knownSample013 ||
    (!report.submittedBy &&
      seedTitles[report.id] === report.title &&
      (!report.senderName || report.senderName === reference?.senderName))
      ? reference
      : undefined
  return {
    senderName: report.senderName || sample?.senderName || "Chưa cung cấp",
    senderContact: report.senderContact || sample?.senderContact,
    ...sample?.people,
    ...report.people,
  }
}
export function reportSearchText(report: Report) {
  const people = reportPeople(report)
  // Contact details remain hidden and are deliberately excluded from searches.
  return `${report.id} ${report.title} ${people.senderName} ${people.subjectName || ""} ${report.account || ""} ${report.phone || ""} ${report.website || ""} ${report.area}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
}
