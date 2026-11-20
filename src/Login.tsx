import { useState } from "react"
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
        <a href="#demo-login" className="access-site-brand">
          <BrandMark />
          <span>
            SCAMGRAPH<span>Phân tích & truy vết</span>
          </span>
        </a>
        <a href="#demo-login">Truy cập hệ thống →</a>
      </header>
      <section className="access-intro" aria-labelledby="access-intro-title">
        <span className="access-eyebrow">PHÂN TÍCH & TRUY VẾT</span>
        <h2 id="access-intro-title">
          Kết nối dữ liệu.
          <br />
          <span>Làm rõ dấu vết.</span>
        </h2>
        <p>
          Tiếp nhận phản ánh, đối chiếu liên kết và theo dõi hồ sơ trong một
          không gian làm việc thống nhất.
        </p>
        <ol className="access-flow" aria-label="Quy trình xử lý phản ánh">
          <li>
            <span>01</span>
            <div>
              <b>Tiếp nhận phản ánh</b>
              <p>Lưu nội dung và tài liệu do người gửi cung cấp.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <b>Kiểm tra & liên kết</b>
              <p>Đối chiếu căn cứ trước khi xác nhận quan hệ.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <b>Theo dõi hồ sơ</b>
              <p>Phân công, cập nhật nhận định và tổng hợp báo cáo.</p>
            </div>
          </li>
        </ol>
      </section>
      <svg
        className="access-network"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="access-grid"
            width="65"
            height="65"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M65 0H0V65"
              fill="none"
              stroke="#0ea5e9"
              strokeOpacity=".07"
            />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#access-grid)" />
        {Array.from({ length: 22 }, (_, i) => {
          const x = 60 + ((i * 173) % 1300),
            y = 70 + ((i * 127) % 760)
          return (
            <g key={i}>
              <path
                d={`M${x} ${y}l110 65 55 -105`}
                fill="none"
                stroke="#38bdf8"
                strokeOpacity=".12"
              />
              <circle
                cx={x}
                cy={y}
                r={i % 4 === 0 ? 3 : 2}
                fill="#7dd3fc"
                opacity=".45"
              />
            </g>
          )
        })}
        <circle
          cx="720"
          cy="450"
          r="310"
          fill="none"
          stroke="#0ea5e9"
          strokeOpacity=".06"
          strokeDasharray="4 12"
        />
      </svg>
      <main id="demo-login" className="access-card">
        <div className="access-brand">
          <BrandMark />
          <h2>Phân Tích Và Truy Vết Tội Phạm Công Nghệ Cao</h2>
        </div>
        <h1>Đăng nhập</h1>
        <button className="access-vneid" onClick={() => setModal("vneid")}>
          <span aria-hidden="true">★</span>Đăng nhập bằng VNeID{" "}
          <small>mô phỏng</small>
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (
              account.trim() !== demoRoles[selected].account ||
              password !== "demo1234"
            ) {
              setError("Chỉ dùng tài khoản mẫu đã chọn và mật khẩu demo1234.")
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
            onClick={() => setModal("forgot")}
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
          Demo — dữ liệu giả lập. Chỉ dùng tài khoản mẫu có sẵn.
        </p>
      </main>
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
