import { useState } from "react"
import AppearanceToggle from "./AppearanceToggle"
import BrandMark from "./BrandMark"
import { Button, Field, Modal } from "./ui"
import "./login.css"

type Destination = "dashboard" | "new-report" | "accounts"
const demoRoles: { role: string; account: string; destination: Destination }[] =
  [
    {
      role: "Người dân / Tổ chức",
      account: "cong.dan.demo",
      destination: "new-report",
    },
    {
      role: "Cán bộ tiếp nhận",
      account: "tiep.nhan.demo",
      destination: "dashboard",
    },
    {
      role: "Cán bộ phân tích",
      account: "phan.tich.demo",
      destination: "dashboard",
    },
    {
      role: "Cán bộ xử lý hồ sơ",
      account: "xu.ly.demo",
      destination: "dashboard",
    },
    {
      role: "Lãnh đạo theo dõi",
      account: "lanh.dao.demo",
      destination: "dashboard",
    },
    {
      role: "Quản trị hệ thống",
      account: "quan.tri.demo",
      destination: "accounts",
    },
    {
      role: "Kiểm tra, giám sát",
      account: "giam.sat.demo",
      destination: "dashboard",
    },
  ]

export default function Login({
  onLogin,
}: {
  onLogin: (role: string, screen: Destination) => void
}) {
  const [authOpen, setAuthOpen] = useState(false)
  const [selected, setSelected] = useState(2)
  const [account, setAccount] = useState(demoRoles[2].account)
  const [password, setPassword] = useState("demo1234")
  const [showPassword, setShowPassword] = useState(false)
  const [modal, setModal] = useState<"vneid" | "forgot" | null>(null)
  const [error, setError] = useState("")
  const enter = () =>
    onLogin(demoRoles[selected].role, demoRoles[selected].destination)
  return (
    <div className="access-page">
      <header className="access-site-header">
        <a href="#" className="access-site-brand">
          <BrandMark />
          <span>SCAMGRAPH</span>
        </a>
        <div className="access-header-tools">
          <span>Cổng thông tin nghiệp vụ</span>
          <AppearanceToggle />
        </div>
      </header>
      <main className="sample-hero">
        <section
          className="tracer-scene"
          aria-label="Minh họa mạng liên kết giả lập"
        >
          <div className="tracer-board">
            <div className="tracer-toolbar">
              <span className="tracer-dots">
                <i />
                <i />
                <i />
              </span>
              <span>NETWORK TRACER v2.0</span>
              <b>Mô phỏng</b>
            </div>
            <div className="tracer-viewport">
              <div className="scanner-line" />
              <svg viewBox="0 0 520 340" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                  const x = 60 + ((i * 83) % 410),
                    y = 40 + ((i * 67) % 210)
                  return (
                    <g
                      key={i}
                      className="tracer-node"
                      style={{ animationDelay: `${i * 0.25}s` }}
                    >
                      <path d={`M260 145L${x} ${y}`} className="tracer-edge" />
                      <circle cx={x} cy={y} r={i % 3 === 0 ? 7 : 4} />
                      <circle cx={x} cy={y} r="14" className="tracer-halo" />
                    </g>
                  )
                })}
                <circle cx="260" cy="145" r="26" className="tracer-center" />
                <path
                  d="m249 145 8 8 15-18"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="3"
                />
              </svg>
              <div className="tracer-bottom">
                <div>
                  <small>THỰC THỂ MINH HỌA</small>
                  <b>DEMO-TK-001</b>
                </div>
                <span>● Liên kết giả lập</span>
              </div>
            </div>
          </div>
        </section>
        <section className="sample-message">
          <span className="sample-status">● Môi trường trình diễn</span>
          <h1>
            Phân Tích Và Truy Vết
            <br />
            <span>Tội Phạm Công Nghệ Cao</span>
          </h1>
          <p>
            Nền tảng chuyên trách hỗ trợ nghiệp vụ điều tra, phân tích mạng lưới
            liên kết và đối chiếu nguồn phản ánh lừa đảo trên không gian mạng.
          </p>
          <div className="sample-ctas">
            <button
              className="access-vneid"
              onClick={() => {
                setAuthOpen(false)
                setModal("vneid")
              }}
            >
              ★ Đăng nhập bằng VNeID <small>mô phỏng</small>
            </button>
            <button
              className="sample-account"
              onClick={() => setAuthOpen(true)}
            >
              Tài khoản Cán bộ
            </button>
          </div>
          <p className="sample-demo-note">
            Demo — dữ liệu giả lập. VNeID không kết nối thật.
          </p>
        </section>
      </main>
      {authOpen && (
        <Modal title="Xác thực hệ thống" onClose={() => setAuthOpen(false)}>
          <div className="access-card">
            <p className="auth-subtitle">
              Chọn phương thức đăng nhập để vào bàn làm việc
            </p>
            <button
              className="access-vneid"
              onClick={() => {
                setAuthOpen(false)
                setModal("vneid")
              }}
            >
              Đăng nhập bằng VNeID · mô phỏng
            </button>
            <div className="auth-divider">HOẶC TÀI KHOẢN DEMO</div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (
                  account.trim() !== demoRoles[selected].account ||
                  password !== "demo1234"
                ) {
                  setError(
                    "Chỉ dùng tài khoản mẫu đã chọn và mật khẩu demo1234.",
                  )
                  return
                }
                setError("")
                enter()
              }}
            >
              <Field label="Vai trò demo">
                <select
                  value={selected}
                  onChange={(e) => {
                    const index = Number(e.target.value)
                    setSelected(index)
                    setAccount(demoRoles[index].account)
                    setPassword("demo1234")
                    setError("")
                  }}
                >
                  {demoRoles.map((item, index) => (
                    <option key={item.role} value={index}>
                      {item.role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tài khoản">
                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  required
                  placeholder="Mã cán bộ hoặc tên người dùng mẫu"
                />
              </Field>
              <label className="field" htmlFor="demo-password">
                <span className="field-label">Mật khẩu</span>
                <div className="access-password">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="demo-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPassword && <path d="m3 3 18 18" />}
                    </svg>
                  </button>
                </div>
              </label>
              <button
                type="button"
                className="access-forgot"
                onClick={() => {
                  setAuthOpen(false)
                  setModal("forgot")
                }}
              >
                Bạn quên mật khẩu?
              </button>
              {error && (
                <p className="access-error" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="full">
                Đăng nhập
              </Button>
            </form>
            <p className="access-demo">
              Chỉ dùng tài khoản mẫu có sẵn. Không nhập thông tin thật.
            </p>
          </div>
        </Modal>
      )}
      {modal && (
        <Modal
          title={
            modal === "vneid" ? "VNeID · mô phỏng" : "Thông tin tài khoản demo"
          }
          onClose={() => setModal(null)}
          footer={
            modal === "vneid" ? (
              <Button onClick={enter}>Tiếp tục bằng tài khoản demo</Button>
            ) : undefined
          }
        >
          {modal === "vneid" ? (
            <>
              <div className="access-qr" aria-hidden="true">
                <svg viewBox="0 0 100 100">
                  <path
                    d="M8 8h27v27H8Zm57 0h27v27H65ZM8 65h27v27H8Z"
                    fill="none"
                    stroke="#0b1321"
                    strokeWidth="6"
                  />
                  <path
                    d="M17 17h9v9h-9Zm57 0h9v9h-9ZM17 74h9v9h-9ZM43 8h8v17h-8Zm0 30h14v14H43Zm22 5h8v20h-8Zm17 0h10v8H82ZM43 65h8v27h-8Zm16 11h14v8H59Zm23-11h10v27H82ZM8 43h21v9H8Z"
                    fill="#0b1321"
                  />
                </svg>
                <span>QR MINH HỌA</span>
              </div>
              <p>
                Không quét bằng ứng dụng thật. Không kết nối VNeID hoặc thu thập
                thông tin định danh.
              </p>
              <p className="muted">
                Tiếp tục với vai trò: {demoRoles[selected].role}.
              </p>
            </>
          ) : (
            <p>
              Tài khoản demo được điền sẵn khi chọn vai trò. Mật khẩu mẫu:{" "}
              <b>demo1234</b>. Chức năng khôi phục mật khẩu thật chưa được triển
              khai.
            </p>
          )}
        </Modal>
      )}
    </div>
  )
}
