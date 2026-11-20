import type { Report } from "./types"
import { reportPeople } from "./reportPeople"
import SensitiveValue from "./SensitiveValue"
import { useReportPrivacy } from "./ReportPrivacy"

export default function ReportPeople({ report }: { report: Report }) {
  const p = reportPeople(report)
  const { hide } = useReportPrivacy()
  return (
    <section
      className="report-people"
      aria-label="Thông tin các bên trong phản ánh"
    >
      <div className="people-heading">
        <div>
          <span className="people-eyebrow">THÔNG TIN CÁC BÊN</span>
          <h2>Người gửi và bên bị phản ánh</h2>
        </div>
        <button type="button" className="people-hide" onClick={hide}>
          Che thông tin
        </button>
      </div>
      <p className="people-privacy-note">
        Bấm Xem tại từng thông tin để đọc rõ. Tự che lại sau 45 giây hoặc khi
        rời cửa sổ.
      </p>
      <div className="people-grid">
        <article className="person-panel">
          <div className="person-title">
            <span className="person-icon" aria-hidden="true">
              NG
            </span>
            <div>
              <span>Người gửi phản ánh</span>
              <h3>{p.senderName}</h3>
            </div>
          </div>
          <dl>
            <div>
              <dt>Năm sinh</dt>
              <dd>{p.birthYear || "Chưa cung cấp"}</dd>
            </div>
            <div>
              <dt>Nơi cư trú</dt>
              <dd>{p.residence || "Chưa cung cấp"}</dd>
            </div>
            <div>
              <dt>Tư cách</dt>
              <dd>{p.capacity || "Chưa cung cấp"}</dd>
            </div>
            <div>
              <dt>Liên hệ</dt>
              <dd>
                <SensitiveValue
                  value={p.senderContact}
                  label="liên hệ người gửi"
                  name="senderContact"
                />
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <SensitiveValue
                  value={p.email}
                  label="email người gửi"
                  name="senderEmail"
                />
              </dd>
            </div>
            <div>
              <dt>Kênh tiếp nhận</dt>
              <dd>
                {report.source}
                {report.sourceOther ? `: ${report.sourceOther}` : ""}
              </dd>
            </div>
          </dl>
        </article>
        <article className="person-panel subject-panel">
          <div className="person-title">
            <span className="person-icon" aria-hidden="true">
              BP
            </span>
            <div>
              <span>Bên bị phản ánh · Theo lời khai</span>
              <h3>{p.subjectName || "Chưa cung cấp tên / danh xưng"}</h3>
            </div>
          </div>
          <dl>
            <div>
              <dt>Danh tính</dt>
              <dd>
                <span className="unverified-label">Chưa xác minh</span>
              </dd>
            </div>
            <div>
              <dt>Mạng xã hội</dt>
              <dd>
                <SensitiveValue
                  value={report.socialAccount || p.subjectSocial}
                  label="mạng xã hội bên bị phản ánh"
                  name="subjectSocial"
                />
              </dd>
            </div>
            <div>
              <dt>Số liên hệ</dt>
              <dd>
                <SensitiveValue
                  value={report.phone}
                  label="số liên hệ bên bị phản ánh"
                  name="phone"
                />
              </dd>
            </div>
            <div>
              <dt>Tài khoản nhận</dt>
              <dd>
                <SensitiveValue
                  value={report.account}
                  label="tài khoản bên bị phản ánh"
                  name="account"
                />
              </dd>
            </div>
            <div>
              <dt>Ngân hàng</dt>
              <dd>{report.bank || "Chưa cung cấp"}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd className="people-domain">
                {report.website || "Chưa cung cấp"}
              </dd>
            </div>
          </dl>
        </article>
      </div>
      <p className="people-disclaimer">
        Danh tính và tình huống hư cấu phục vụ demo. Tên tự xưng và tài khoản
        được khai báo chưa phải kết luận về cá nhân hay tổ chức.
      </p>
    </section>
  )
}
