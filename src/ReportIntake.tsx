import {
  cloneElement,
  isValidElement,
  useId,
  useEffect,
  useRef,
  useState,
} from "react"
import type { Report } from "./types"
import {
  formatDateTime,
  fromVietnamInput,
  nowISO,
  vietnamInput,
} from "./demoTime"
import { REPORT_TYPES, reportTypeLabel } from "./intakeModel"
import type { IntakePayload, IntakeResult } from "./intakeModel"
import "./reportIntake.css"

type Draft = {
  sender: string
  contact: string
  behavior: string
  behaviorOther: string
  title: string
  content: string
  time: string
  unknownTime: boolean
  area: string
  transfer: string
  amount: string
  account: string
  bank: string
  phone: string
  website: string
  socialAccount: string
  subjectName: string
  source: string
  sourceOther: string
  attachment: boolean
  sample: boolean
}
const emptyDraft = (): Draft => ({
  sender: "",
  contact: "",
  behavior: "",
  behaviorOther: "",
  title: "",
  content: "",
  time: "",
  unknownTime: false,
  area: "",
  transfer: "",
  amount: "",
  account: "",
  bank: "",
  phone: "",
  website: "",
  socialAccount: "",
  subjectName: "",
  source: "",
  sourceOther: "",
  attachment: false,
  sample: false,
})
const hints: Record<string, string> = {
  "Giả danh ngân hàng":
    "Người liên hệ tự xưng là ai? Liên hệ qua đâu? Yêu cầu bạn thực hiện việc gì? Có tài khoản hoặc đường link liên quan không?",
  "Giả danh cơ quan nhà nước":
    "Người liên hệ tự xưng thuộc cơ quan nào? Họ đưa ra yêu cầu, giấy tờ hoặc lời đe dọa gì?",
  "Lừa đảo đầu tư trực tuyến":
    "Bạn được mời đầu tư vào đâu? Họ hứa hẹn lợi nhuận hoặc yêu cầu nộp tiền như thế nào?",
  "Lừa đảo mua bán trực tuyến":
    "Bạn mua/bán mặt hàng gì, qua kênh nào? Việc giao hàng, thanh toán có dấu hiệu gì đáng ngờ?",
  "Lừa đảo tuyển dụng/cộng tác viên":
    "Công việc được giới thiệu như thế nào? Có yêu cầu nạp tiền, làm nhiệm vụ hoặc đóng phí không?",
  "Chiếm đoạt tài khoản mạng xã hội":
    "Tài khoản nào có dấu hiệu bị chiếm đoạt? Có tin nhắn mượn tiền, đường link hoặc thay đổi truy cập không?",
}
function readDraft(storagePrefix: string): Draft {
  try {
    const old = JSON.parse(
      localStorage.getItem(`${storagePrefix}:form`) || "null",
    )
    if (!old || typeof old !== "object") return emptyDraft()
    return {
      ...emptyDraft(),
      ...old,
      contact: old.contact || (old.sender ? old.phone : ""),
    }
  } catch {
    return emptyDraft()
  }
}
function Field({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  hint?: string
}) {
  const id = useId()
  return (
    <label className="intake-field" htmlFor={id}>
      <span>
        {label}
        {required && <b aria-hidden="true"> *</b>}
      </span>
      {isValidElement(children)
        ? cloneElement(
            children as React.ReactElement<Record<string, unknown>>,
            { id, "aria-label": label },
          )
        : children}
      {hint && <small>{hint}</small>}
      {error && <small className="intake-error">{error}</small>}
    </label>
  )
}
export default function ReportIntake({
  citizen,
  reports,
  onSubmit,
  onOpen,
  onList,
  storagePrefix = "scamgraph-demo-wizard",
}: {
  citizen: boolean
  storagePrefix?: string
  reports: Report[]
  onSubmit: (payload: IntakePayload) => IntakeResult
  onOpen: (id: string) => void
  onList: () => void
}) {
  const [draft, setDraft] = useState(() => readDraft(storagePrefix))
  const [step, setStep] = useState(() => {
    try {
      const n = Number(localStorage.getItem(`${storagePrefix}:step`))
      return [1, 2, 3, 4].includes(n) ? n : 1
    } catch {
      return 1
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validationAttempt, setValidationAttempt] = useState(0)
  const [storageNote, setStorageNote] = useState("")
  const [success, setSuccess] = useState<Report | null>(null)
  const submitted = useRef(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const sampleExists = reports.some((r) => r.id === "PA-013")
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((v) => ({
      ...v,
      [key]: value,
      ...(key === "behavior" ? { sample: false } : {}),
    }))
    setErrors((v) => ({ ...v, [key]: "" }))
  }
  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}:form`, JSON.stringify(draft))
      localStorage.setItem(`${storagePrefix}:step`, String(step))
    } catch {
      setStorageNote(
        "Không lưu được bản nháp trên trình duyệt này. Dữ liệu đang nhập vẫn giữ trong phiên hiện tại.",
      )
    }
  }, [draft, step])
  useEffect(() => {
    if (validationAttempt === 0) return
    const frame = requestAnimationFrame(() =>
      errorRef.current?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      }),
    )
    return () => cancelAnimationFrame(frame)
  }, [validationAttempt])
  const validate = () => {
    const result: Record<string, string> = {}
    if (!draft.behavior)
      result.behavior = "Chọn loại phản ánh hoặc “Chưa xác định”."
    if (draft.behavior === "Khác" && !draft.behaviorOther.trim())
      result.behaviorOther = "Nhập mô tả ngắn cho loại phản ánh khác."
    if (!draft.title.trim()) result.title = "Nhập tiêu đề sự việc."
    if (!draft.content.trim())
      result.content = "Mô tả nội dung sự việc để tiếp nhận."
    if (!draft.unknownTime && !fromVietnamInput(draft.time))
      result.time = "Nhập thời gian hoặc chọn “Không nhớ chính xác thời gian”."
    if (!draft.area) result.area = "Chọn địa bàn hoặc “Chưa xác định”."
    if (!draft.transfer) result.transfer = "Chọn Có, Không hoặc Chưa rõ."
    if (
      draft.transfer === "Có" &&
      (!/^\d+$/.test(draft.amount) ||
        !Number.isSafeInteger(Number(draft.amount)) ||
        Number(draft.amount) <= 0)
    )
      result.amount = "Nhập số tiền VND lớn hơn 0, chỉ gồm chữ số."
    if (!citizen && !draft.source) result.source = "Chọn kênh tiếp nhận."
    if (!citizen && draft.source === "Nguồn khác" && !draft.sourceOther.trim())
      result.sourceOther = "Mô tả nguồn tiếp nhận khác."
    return result
  }
  const fillSample = () => {
    if (sampleExists) return
    if (
      Object.values(draft).some((v) => typeof v === "string" && v.trim()) &&
      !window.confirm("Thay bản nháp đang nhập bằng tình huống mẫu PA-013?")
    )
      return
    setDraft({
      ...emptyDraft(),
      sender: "Nguyễn Hoàng Minh",
      subjectName: "Người gọi tự giới thiệu tên Đức, nhân viên ngân hàng",
      contact: "DEMO-LIEN-HE-013",
      behavior: "Giả danh ngân hàng",
      title: "Yêu cầu xác minh tài khoản qua website đáng ngờ",
      content:
        "Tôi nhận được cuộc gọi của người tự xưng là nhân viên ngân hàng, yêu cầu truy cập xacminh-demo.example để xác minh tài khoản. Sau đó tôi chuyển 15.000.000 đồng vào tài khoản DEMO-TK-001 tại Ngân hàng mẫu A. Người liên hệ sử dụng số DEMO-SDT-001. Sau khi chuyển tiền, tôi không liên lạc được.",
      time: vietnamInput(new Date(Date.now() - 30 * 60000)),
      area: "Hà Nội",
      transfer: "Có",
      amount: "15000000",
      account: "DEMO-TK-001",
      bank: "Ngân hàng mẫu A",
      phone: "DEMO-SDT-001",
      website: "xacminh-demo.example",
      source: "Cổng trực tuyến",
      sample: true,
    })
    setErrors({})
  }
  const next = () => {
    if (step === 2) {
      const problems = validate()
      if (Object.keys(problems).length) {
        setValidationAttempt((v) => v + 1)
        setErrors(problems)
        return
      }
    }
    setStep((v) => Math.min(4, v + 1))
    setErrors({})
  }
  const submit = () => {
    if (submitted.current) return
    const problems = validate()
    if (Object.keys(problems).length) {
      setValidationAttempt((v) => v + 1)
      setErrors(problems)
      setStep(2)
      return
    }
    submitted.current = true
    const time = nowISO()
    const payload: IntakePayload = {
      sample: draft.sample,
      report: {
        title: draft.title.trim(),
        content: draft.content.trim(),
        behavior: draft.behavior,
        behaviorOther:
          draft.behavior === "Khác" ? draft.behaviorOther.trim() : undefined,
        initialBehavior: draft.behavior,
        initialBehaviorOther:
          draft.behavior === "Khác" ? draft.behaviorOther.trim() : undefined,
        senderName: draft.sender.trim(),
        senderContact: draft.contact.trim(),
        source: citizen ? "Cổng trực tuyến" : draft.source,
        sourceOther:
          !citizen && draft.source === "Nguồn khác"
            ? draft.sourceOther.trim()
            : undefined,
        area: draft.area,
        occurredAt: draft.unknownTime
          ? undefined
          : fromVietnamInput(draft.time),
        occurredTimeUnknown: draft.unknownTime,
        receivedAt: time,
        updatedAt: time,
        transferStatus: draft.transfer as Report["transferStatus"],
        amount: draft.transfer === "Có" ? Number(draft.amount) / 1000000 : 0,
        status: "Mới tiếp nhận",
        account: draft.account.trim() || undefined,
        bank: draft.bank.trim() || undefined,
        phone: draft.phone.trim() || undefined,
        website: draft.website.trim() || undefined,
        socialAccount: draft.socialAccount.trim() || undefined,
        people: draft.subjectName?.trim()
          ? { subjectName: draft.subjectName.trim() }
          : undefined,
        attachment: draft.attachment,
        extracted: false,
        reviewed: false,
      },
    }
    const result = onSubmit(payload)
    if (result.ok) {
      setSuccess(result.report)
      setDraft(emptyDraft())
      setStep(1)
      setErrors({})
    } else {
      setErrors({ submit: result.error })
      submitted.current = false
    }
  }
  const amount =
    draft.transfer === "Có"
      ? `${Number(draft.amount || 0).toLocaleString("vi-VN")} VND`
      : draft.transfer === "Không"
        ? "Không phát sinh chuyển tiền"
        : "Chưa rõ có chuyển tiền"
  return (
    <div className="report-intake">
      <header className="intake-heading">
        <h1>{citizen ? "Gửi phản ánh" : "Tiếp nhận phản ánh"}</h1>
        <p>
          Cung cấp thông tin về sự việc có dấu hiệu lừa đảo hoặc hành vi đáng
          ngờ trên môi trường mạng.
        </p>
        <small>Chỉ nhập thông tin mẫu. VNeID không kết nối thật.</small>
      </header>
      {success ? (
        <section className="intake-card intake-success" role="status">
          <span className="success-symbol">✓</span>
          <h2>{citizen ? "Đã gửi phản ánh" : "Đã lưu phản ánh"}</h2>
          <p>
            Mã phản ánh: <strong>{success.id}</strong>
          </p>
          <p>Tiếp nhận: {formatDateTime(success.receivedAt)} · Giờ Việt Nam</p>
          <p>Trạng thái: Chờ kiểm tra. Chưa tự động xác nhận liên kết.</p>
          <div className="intake-actions">
            <button
              className="intake-secondary"
              onClick={() => onOpen(success.id)}
            >
              Mở chi tiết {success.id}
            </button>
            <button
              className="intake-primary"
              onClick={() => {
                setSuccess(null)
                submitted.current = false
              }}
            >
              Gửi phản ánh khác
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="intake-sample">
            {sampleExists ? (
              <>
                <span>Tình huống mẫu đã được tạo</span>
                <button
                  className="intake-link"
                  onClick={() => onOpen("PA-013")}
                >
                  Mở PA-013
                </button>
              </>
            ) : (
              <>
                <span>Điền nhanh một ví dụ để thử luồng.</span>
                <button className="intake-secondary" onClick={fillSample}>
                  Dùng tình huống mẫu
                </button>
              </>
            )}
          </div>
          <ol className="intake-steps">
            {["Người gửi", "Sự việc", "Tài liệu", "Xem lại và gửi"].map(
              (label, i) => (
                <li
                  key={label}
                  className={
                    step === i + 1 ? "current" : step > i + 1 ? "complete" : ""
                  }
                >
                  <button
                    type="button"
                    aria-current={step === i + 1 ? "step" : undefined}
                    disabled={i + 1 > step}
                    onClick={() => {
                      setStep(i + 1)
                      setErrors({})
                    }}
                  >
                    <span>{step > i + 1 ? "✓" : i + 1}</span>
                    {label}
                  </button>
                </li>
              ),
            )}
          </ol>
          <section className="intake-card">
            <h2>
              {
                [
                  "Thông tin người gửi",
                  "Thông tin sự việc",
                  "Tài liệu liên quan",
                  "Xem lại trước khi gửi",
                ][step - 1]
              }
            </h2>
            {Object.values(errors).some(Boolean) && (
              <div className="intake-error-summary" ref={errorRef} role="alert">
                <b>Chưa thể {step === 4 ? "gửi" : "tiếp tục"}</b>
                <ul>
                  {Object.entries(errors)
                    .filter(([, v]) => v)
                    .map(([key, value]) => (
                      <li key={key}>{value}</li>
                    ))}
                </ul>
              </div>
            )}
            {storageNote && (
              <p className="intake-storage-note">{storageNote}</p>
            )}
            {step === 1 && (
              <div className="intake-grid">
                <Field label="Họ và tên mẫu">
                  <input
                    value={draft.sender}
                    onChange={(e) => set("sender", e.target.value)}
                    placeholder="Tên người gửi mẫu"
                  />
                </Field>
                <Field
                  label="Thông tin liên hệ mẫu"
                  hint="Có thể để trống nếu không muốn cung cấp."
                >
                  <input
                    value={draft.contact}
                    onChange={(e) => set("contact", e.target.value)}
                    placeholder="Email hoặc số điện thoại mẫu"
                  />
                </Field>
                <div className="intake-wide">
                  <p className="intake-help">
                    Thông tin người gửi giúp liên hệ bổ sung. Bước tiếp theo là
                    mô tả sự việc; bạn không cần tự xác định người vi phạm.
                  </p>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="intake-grid">
                <Field label="Loại phản ánh" required error={errors.behavior}>
                  <select
                    value={draft.behavior}
                    onChange={(e) => set("behavior", e.target.value)}
                  >
                    <option value="">Chọn loại phản ánh</option>
                    {REPORT_TYPES.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                {draft.behavior === "Khác" && (
                  <Field
                    label="Mô tả loại phản ánh"
                    required
                    error={errors.behaviorOther}
                  >
                    <input
                      value={draft.behaviorOther}
                      onChange={(e) => set("behaviorOther", e.target.value)}
                      placeholder="Mô tả ngắn loại sự việc"
                    />
                  </Field>
                )}
                <div className="intake-wide">
                  <Field label="Tiêu đề" required error={errors.title}>
                    <input
                      value={draft.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="Ví dụ: Nhận cuộc gọi yêu cầu chuyển tiền để xác minh tài khoản"
                    />
                  </Field>
                </div>
                <div className="intake-wide">
                  <Field
                    label="Nội dung sự việc"
                    required
                    error={errors.content}
                    hint={
                      hints[draft.behavior] ||
                      "Mô tả điều bạn biết: diễn biến, cách liên hệ và dấu hiệu đáng ngờ. Nếu chưa rõ loại, hãy kể lại sự việc."
                    }
                  >
                    <textarea
                      rows={6}
                      value={draft.content}
                      onChange={(e) => set("content", e.target.value)}
                      placeholder="Kể lại sự việc theo trình tự bạn nhớ..."
                    />
                  </Field>
                </div>
                <div>
                  <Field
                    label="Thời gian phát sinh"
                    error={errors.time}
                    hint={
                      "Giờ Việt Nam — Asia/Ho_Chi_Minh." +
                      (!draft.unknownTime && fromVietnamInput(draft.time)
                        ? ` Đã chọn: ${formatDateTime(fromVietnamInput(draft.time))}.`
                        : "")
                    }
                  >
                    <input
                      type="datetime-local"
                      value={draft.time}
                      disabled={draft.unknownTime}
                      onChange={(e) => set("time", e.target.value)}
                    />
                  </Field>
                  <label className="intake-check">
                    <input
                      type="checkbox"
                      checked={draft.unknownTime}
                      onChange={(e) => set("unknownTime", e.target.checked)}
                    />
                    Không nhớ chính xác thời gian
                  </label>
                </div>
                <Field label="Địa bàn liên quan" required error={errors.area}>
                  <select
                    value={draft.area}
                    onChange={(e) => set("area", e.target.value)}
                  >
                    <option value="">Chọn địa bàn</option>
                    {[
                      "Chưa xác định",
                      "Hà Nội",
                      "Đà Nẵng",
                      "TP. Hồ Chí Minh",
                      "Hải Phòng",
                      "Cần Thơ",
                      "Địa bàn khác",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Có phát sinh chuyển tiền không?"
                  required
                  error={errors.transfer}
                >
                  <select
                    value={draft.transfer}
                    onChange={(e) => set("transfer", e.target.value)}
                  >
                    <option value="">Chọn câu trả lời</option>
                    <option>Có</option>
                    <option>Không</option>
                    <option>Chưa rõ</option>
                  </select>
                </Field>
                {draft.transfer === "Có" && (
                  <Field
                    label="Số tiền đã chuyển"
                    required
                    error={errors.amount}
                    hint="Đơn vị VND. Ví dụ: 15.000.000."
                  >
                    <input
                      inputMode="numeric"
                      value={
                        /^-?\d+$/.test(draft.amount)
                          ? Number(draft.amount).toLocaleString("vi-VN")
                          : draft.amount
                      }
                      onChange={(e) =>
                        set("amount", e.target.value.replace(/[.,\s]/g, ""))
                      }
                      placeholder="15.000.000"
                    />
                  </Field>
                )}
                <div className="intake-wide">
                  <h3>
                    Thông tin liên quan <small>Không bắt buộc</small>
                  </h3>
                </div>
                {(
                  [
                    ["subjectName", "Tên / danh xưng bên bị phản ánh"],
                    ["account", "Tài khoản ngân hàng"],
                    ["bank", "Ngân hàng"],
                    ["phone", "Số điện thoại liên quan"],
                    ["website", "Website"],
                    ["socialAccount", "Tài khoản mạng xã hội"],
                  ] as const
                ).map(([key, label]) => (
                  <Field label={label} key={key}>
                    <input
                      value={draft[key] || ""}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder="Chỉ nhập nếu bạn biết"
                    />
                  </Field>
                ))}
                {citizen ? (
                  <p className="intake-help intake-wide">
                    Kênh tiếp nhận: Cổng trực tuyến. Thời gian tiếp nhận được
                    ghi khi gửi thành công.
                  </p>
                ) : (
                  <>
                    <Field
                      label="Kênh tiếp nhận"
                      required
                      error={errors.source}
                    >
                      <select
                        value={draft.source}
                        onChange={(e) => set("source", e.target.value)}
                      >
                        <option value="">Chọn kênh tiếp nhận</option>
                        <option>Cổng trực tuyến</option>
                        <option>Đường dây nóng</option>
                        <option>Tiếp nhận trực tiếp</option>
                        <option>Nguồn khác</option>
                      </select>
                    </Field>
                    {draft.source === "Nguồn khác" && (
                      <Field
                        label="Mô tả nguồn tiếp nhận"
                        required
                        error={errors.sourceOther}
                      >
                        <input
                          value={draft.sourceOther}
                          onChange={(e) => set("sourceOther", e.target.value)}
                        />
                      </Field>
                    )}
                  </>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="intake-documents">
                <p>
                  Tài liệu là thông tin bổ sung, không bắt buộc để gửi sự việc
                  đáng ngờ.
                </p>
                {draft.attachment ? (
                  <>
                    <div className="intake-receipt">
                      <strong>Ảnh chuyển khoản mẫu</strong>
                      <p>15.000.000 VND · DEMO-TK-001</p>
                      <span>Tài liệu giả lập, không phải chứng từ thật.</span>
                    </div>
                    <button
                      className="intake-secondary"
                      onClick={() => set("attachment", false)}
                    >
                      Bỏ tài liệu mẫu
                    </button>
                  </>
                ) : (
                  <>
                    <div className="intake-empty">
                      Chưa có tài liệu đính kèm
                    </div>
                    <button
                      className="intake-secondary"
                      onClick={() => set("attachment", true)}
                    >
                      Dùng ảnh chuyển khoản mẫu
                    </button>
                  </>
                )}
              </div>
            )}
            {step === 4 && (
              <div className="intake-review">
                <dl>
                  {[
                    ["Người gửi", draft.sender || "Chưa cung cấp"],
                    [
                      "Loại phản ánh",
                      reportTypeLabel(draft.behavior) +
                        (draft.behavior === "Khác"
                          ? `: ${draft.behaviorOther}`
                          : ""),
                    ],
                    ["Tiêu đề", draft.title],
                    [
                      "Thời gian phát sinh",
                      draft.unknownTime
                        ? "Không nhớ chính xác"
                        : formatDateTime(fromVietnamInput(draft.time)),
                    ],
                    ["Địa bàn", draft.area],
                    ["Chuyển tiền", amount],
                    [
                      "Kênh tiếp nhận",
                      citizen
                        ? "Cổng trực tuyến"
                        : draft.source +
                          (draft.source === "Nguồn khác"
                            ? `: ${draft.sourceOther}`
                            : ""),
                    ],
                    ...[
                      ["Thông tin liên hệ", draft.contact],
                      ["Tài khoản ngân hàng", draft.account],
                      ["Ngân hàng", draft.bank],
                      ["Điện thoại liên quan", draft.phone],
                      ["Website", draft.website],
                      ["Tên / danh xưng bên bị phản ánh", draft.subjectName],
                      ["Tài khoản mạng xã hội", draft.socialAccount],
                    ].filter(([, value]) => value.trim()),
                    ["Tài liệu", draft.attachment ? "01 ảnh mẫu" : "Không có"],
                  ].map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <h3>Nội dung sự việc</h3>
                <p className="intake-content">{draft.content}</p>
                <p className="intake-help">
                  Bạn có thể quay lại để sửa. Thông tin sẽ được cán bộ kiểm tra
                  trước khi xác nhận liên kết.
                </p>
              </div>
            )}
            <footer className="intake-actions">
              <button
                className="intake-secondary"
                disabled={step === 1}
                onClick={() => {
                  setStep((v) => v - 1)
                  setErrors({})
                }}
              >
                Quay lại
              </button>
              {step < 4 ? (
                <button className="intake-primary" onClick={next}>
                  Tiếp tục
                </button>
              ) : (
                <button className="intake-primary" onClick={submit}>
                  {citizen ? "Gửi phản ánh" : "Lưu phản ánh"}
                </button>
              )}
            </footer>
          </section>
        </>
      )}
      <button className="intake-link intake-list-link" onClick={onList}>
        Xem danh sách phản ánh
      </button>
    </div>
  )
}
