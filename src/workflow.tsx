const workflow = {
  "Chờ kiểm tra": {
    tone: "gray",
    values: ["Mới tiếp nhận", "Cần xác minh", "Chờ kiểm tra"],
  },
  "Đã kiểm tra": {
    tone: "green",
    values: ["Đã phân tích", "Có liên quan", "Đã kiểm tra"],
  },
  "Không hợp lệ": { tone: "red", values: ["Không hợp lệ"] },
} as const
export function workflowLabel(value: string): keyof typeof workflow {
  return (
    (Object.keys(workflow) as (keyof typeof workflow)[]).find((key) =>
      (workflow[key].values as readonly string[]).includes(value),
    ) || "Chờ kiểm tra"
  )
}
export function WorkflowBadge({ value }: { value: string }) {
  const label = workflowLabel(value)
  return (
    <span
      className={`badge badge-${workflow[label].tone}`}
      data-workflow={label}
    >
      <i className="badge-dot" />
      {label}
    </span>
  )
}
