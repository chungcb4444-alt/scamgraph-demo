import type { Report } from "./types"
import { reportPeople } from "./reportPeople"
import SensitiveValue from "./SensitiveValue"

export default function ReportStatement({ report }: { report: Report }) {
  const p = reportPeople(report)
  const tokens = [
    {
      value: report.account,
      name: "account",
      label: "tài khoản trong lời khai",
    },
    {
      value: report.phone,
      name: "phone",
      label: "số điện thoại trong lời khai",
    },
    {
      value: p.senderContact,
      name: "senderContact",
      label: "liên hệ trong lời khai",
    },
    { value: p.email, name: "senderEmail", label: "email trong lời khai" },
  ].filter((t) => t.value) as { value: string; name: string; label: string }[]
  const escaped = tokens.map((t) =>
    t.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  )
  const chunks = escaped.length
    ? report.content.split(new RegExp(`(${escaped.join("|")})`, "g"))
    : [report.content]
  return (
    <div className="quote-content report-statement">
      <p>
        {chunks.map((chunk, index) => {
          const token = tokens.find((t) => t.value === chunk)
          return token ? (
            <SensitiveValue
              key={index}
              value={chunk}
              name={token.name}
              label={token.label}
              inline
            />
          ) : (
            chunk
          )
        })}
      </p>
      {p.followUp && <p className="statement-context">{p.followUp}</p>}
    </div>
  )
}
