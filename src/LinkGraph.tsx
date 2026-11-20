import { useEffect, useMemo, useState } from "react"
import type { Cluster, Report } from "./types"
import { dayKey, formatDateTime, nowISO, seedTimestamp } from "./demoTime"
import "./linkGraph.css"
import { Modal, PageHeader } from "./ui"

type Entity = {
  id: string
  value: string
  type: "account" | "phone" | "website"
  label: string
  relation: string
}
type Node = {
  id: string
  kind: "group" | "report" | "entity"
  title: string
  sub: string
  x: number
  y: number
  reports: Report[]
  entity?: Entity
}
type Edge = {
  id: string
  from: Node
  to: Node
  relation: string
  reports: Report[]
}
// Fit labels by measured width while retaining full text in the accessible title and drawer.
const labelMeasure = document.createElement("canvas").getContext("2d")
function fitLabel(value: string, font: string) {
  if (!labelMeasure) return value.slice(0, 18)
  labelMeasure.font = font
  if (labelMeasure.measureText(value).width <= 184) return value
  let short = value
  while (short.length && labelMeasure.measureText(short + "…").width > 184)
    short = short.slice(0, -1)
  return short + "…"
}
const PAGE_SIZE = 5
function entitiesOf(reports: Report[]): Entity[] {
  const definitions = [
    ["account", "Tài khoản", "Ghi nhận chuyển tiền đến"],
    ["phone", "Điện thoại", "Liên hệ qua"],
    ["website", "Website", "Nhắc đến"],
  ] as const
  return definitions.flatMap(([type, label, relation]) =>
    Array.from(
      new Set(
        reports.map((r) => r[type]).filter((v): v is string => Boolean(v)),
      ),
    ).map((value) => ({
      id: `${type}:${value}`,
      value,
      type,
      label,
      relation,
    })),
  )
}
function stressData(): Report[] {
  const now = new Date()
  return Array.from({ length: 1000 }, (_, i) => ({
    id: `THU-TAI-${String(i + 1).padStart(4, "0")}`,
    title: `Phản ánh thử tải riêng ${i + 1}`,
    source: "Thử tải độc lập",
    area: "Địa bàn giả lập",
    occurredAt: seedTimestamp(i % 7, 8, 0, now),
    receivedAt: seedTimestamp(i % 7, 9, 0, now),
    updatedAt: nowISO(),
    amount: 1,
    status: "Đã phân tích",
    behavior: `Tình huống giả lập nhóm ${(i % 4) + 1}`,
    account: "THU-TAI-TK-001",
    phone: `THU-TAI-SDT-${(i % 3) + 1}`,
    website: `thu-tai-${(i % 2) + 1}.example`,
    content:
      "Dữ liệu thử tải riêng, ghi nhận chuyển tiền đến THU-TAI-TK-001. Không thuộc bộ 12 phản ánh và không được dùng để lập hồ sơ demo.",
  }))
}

export default function LinkGraph({
  cluster,
  reports,
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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [compact, setCompact] = useState(() => window.innerWidth <= 1500)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1500px)")
    const update = () => setCompact(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  const [loadMode, setLoadMode] = useState(false)
  const stress = useMemo(() => (loadMode ? stressData() : []), [loadMode])
  const [previewReport, setPreviewReport] = useState<Report | null>(null)
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  const [grouping, setGrouping] = useState("behavior")
  const [groupPage, setGroupPage] = useState(0)
  const [entityPage, setEntityPage] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reportPage, setReportPage] = useState(0)
  const [sourcePage, setSourcePage] = useState(0)
  const [sourceQuery, setSourceQuery] = useState("")
  const [selected, setSelected] = useState("")
  const [hover, setHover] = useState("")
  const [showLabels, setShowLabels] = useState(false)
  const [zoom, setZoom] = useState(1)
  const data = loadMode ? stress : reports
  const allEntities = useMemo(() => entitiesOf(data), [data])
  const needle = query.trim().toLowerCase()
  const filteredEntities = allEntities.filter(
    (e) =>
      (type === "all" || e.type === type) &&
      (!needle || e.value.toLowerCase().includes(needle)),
  )
  const matchingReports = useMemo(
    () =>
      data.filter((r) => {
        const typeMatch = type === "all" || Boolean(r[type as Entity["type"]])
        const searchMatch =
          !needle ||
          `${r.id} ${r.title} ${r.account || ""} ${r.phone || ""} ${r.website || ""}`
            .toLowerCase()
            .includes(needle)
        return typeMatch && searchMatch
      }),
    [data, type, needle],
  )
  const total = matchingReports.reduce((sum, r) => sum + r.amount, 0)
  const groups = useMemo(() => {
    const map = new Map<string, Report[]>()
    matchingReports.forEach((r) => {
      const key =
        grouping === "behavior"
          ? r.behavior
          : dayKey(r.receivedAt || "") || "Chưa có ngày"
      map.set(key, [...(map.get(key) || []), r])
    })
    return Array.from(map, ([key, items]) => ({
      id: `group:${key}`,
      key,
      items,
    }))
  }, [matchingReports, grouping])
  const shownGroups = groups.slice(groupPage * 3, groupPage * 3 + 3)
  const expandedGroup = shownGroups.find((g) => g.id === expanded)
  const drawnReports =
    expandedGroup?.items.slice(
      reportPage * PAGE_SIZE,
      reportPage * PAGE_SIZE + PAGE_SIZE,
    ) || []
  const shownEntities = filteredEntities.slice(
    entityPage * PAGE_SIZE,
    entityPage * PAGE_SIZE + PAGE_SIZE,
  )
  const nodes: Node[] = [
    ...shownGroups.map((g, i) => ({
      id: g.id,
      kind: "group" as const,
      title:
        grouping === "day" && /^\d{4}-\d{2}-\d{2}$/.test(g.key)
          ? `${g.key.slice(8)}/${g.key.slice(5, 7)}/${g.key.slice(0, 4)}`
          : g.key,
      sub: `${g.items.length} phản ánh · ${g.items.reduce((s, r) => s + r.amount, 0)} triệu`,
      x: 10,
      y: 30 + i * 150,
      reports: g.items,
    })),
    ...drawnReports.map((r, i) => ({
      id: r.id,
      kind: "report" as const,
      title: r.id,
      sub: `${r.amount} triệu · ${formatDateTime(r.receivedAt).slice(0, 10)}`,
      x: 270,
      y: 10 + i * 105,
      reports: [r],
    })),
    ...shownEntities.map((e, i) => ({
      id: e.id,
      kind: "entity" as const,
      title: e.value,
      sub: e.label,
      x: 550,
      y: 10 + i * 105,
      reports: matchingReports.filter((r) => r[e.type] === e.value),
      entity: e,
    })),
  ]
  const edges: Edge[] = []
  nodes
    .filter((n) => n.kind === "group")
    .forEach((group) => {
      if (group.id === expanded) {
        nodes
          .filter((n) => n.kind === "report")
          .forEach((report) =>
            edges.push({
              id: `${group.id}->${report.id}`,
              from: group,
              to: report,
              relation: "Trong nhóm khám phá",
              reports: report.reports,
            }),
          )
      } else {
        nodes
          .filter((n) => n.entity)
          .forEach((entity) => {
            const sources = group.reports.filter(
              (r) => r[entity.entity!.type] === entity.entity!.value,
            )
            if (sources.length)
              edges.push({
                id: `${group.id}->${entity.id}`,
                from: group,
                to: entity,
                relation: `${entity.entity!.relation} · ${sources.length} phản ánh`,
                reports: sources,
              })
          })
      }
    })
  nodes
    .filter((n) => n.kind === "report")
    .forEach((report) =>
      nodes
        .filter((n) => n.entity)
        .forEach((entity) => {
          if (report.reports[0][entity.entity!.type] === entity.entity!.value)
            edges.push({
              id: `${report.id}->${entity.id}`,
              from: report,
              to: entity,
              relation: entity.entity!.relation,
              reports: report.reports,
            })
        }),
    )
  const chosenNode = nodes.find((n) => n.id === selected)
  const chosenEdge = edges.find((e) => e.id === selected)
  // Clicking a node highlights only its immediate relationships, not inferred ownership.
  const focus = hover || selected
  const focusedEdge = edges.find((e) => e.id === focus)
  const directEdges = edges.filter(
    (e) => e.id === focus || e.from.id === focus || e.to.id === focus,
  )
  const activeNodes = new Set([
    focus,
    ...directEdges.flatMap((e) => [e.from.id, e.to.id]),
    ...(focusedEdge ? [focusedEdge.from.id, focusedEdge.to.id] : []),
  ])
  const sources = chosenEdge?.reports || chosenNode?.reports || matchingReports
  const sourceFiltered = sources.filter((r) =>
    `${r.id} ${r.title} ${r.content}`
      .toLowerCase()
      .includes(sourceQuery.trim().toLowerCase()),
  )
  const sourcePages = Math.max(1, Math.ceil(sourceFiltered.length / PAGE_SIZE))
  const sourcePageSafe = Math.min(sourcePage, sourcePages - 1)
  const choose = (id: string) => {
    if (id) setDetailsOpen(true)
    setSelected(id)
    setSourcePage(0)
    setSourceQuery("")
  }
  const resetView = () => {
    setSelected("")
    setHover("")
    setGroupPage(0)
    setEntityPage(0)
    setExpanded(null)
    setReportPage(0)
    setSourcePage(0)
    setSourceQuery("")
    setZoom(1)
  }
  const labelEdge = edges.some((edge) => edge.id === hover) ? hover : selected
  const sourceTotal = sources.reduce((s, r) => s + r.amount, 0)
  const inspector = (
    <aside className="card explorer-details">
      <h2>
        {chosenEdge
          ? "Căn cứ quan hệ"
          : chosenNode
            ? "Thông tin nút"
            : "Tổng quan liên kết"}
      </h2>
      <strong>
        {chosenEdge
          ? `${chosenEdge.from.title} → ${chosenEdge.to.title}`
          : chosenNode?.title ||
            (loadMode ? "Dữ liệu thử tải riêng" : cluster.id)}
      </strong>
      <p className="relation-explanation">
        {chosenEdge
          ? chosenEdge.relation
          : chosenNode?.entity
            ? chosenNode.entity.relation
            : chosenNode?.kind === "group"
              ? "Nhóm khám phá theo tiêu chí đang chọn. Không phải xác nhận liên kết."
              : "Chọn nút hoặc đường nối để xem ý nghĩa quan hệ và phản ánh nguồn."}
      </p>
      <dl>
        <div>
          <dt>Phản ánh nguồn</dt>
          <dd>{sources.length}</dd>
        </div>
        <div>
          <dt>Tổng số tiền</dt>
          <dd>{sourceTotal} triệu đồng</dd>
        </div>
      </dl>
      {chosenNode?.kind === "group" && (
        <button
          className="btn btn-primary"
          onClick={() => {
            setExpanded(expanded === chosenNode.id ? null : chosenNode.id)
            setReportPage(0)
          }}
        >
          {expanded === chosenNode.id ? "Thu gọn nhóm" : "Mở rộng nhóm"}
        </button>
      )}
      <p className="muted">
        Chỉ phản ánh những gì nguồn dữ liệu ghi nhận. Không xác nhận quyền sở
        hữu tài khoản hay danh tính.
      </p>
      <input
        aria-label="Tìm phản ánh nguồn"
        placeholder="Tìm mã hoặc nội dung nguồn..."
        value={sourceQuery}
        onChange={(e) => {
          setSourceQuery(e.target.value)
          setSourcePage(0)
        }}
      />
      <div className="source-list">
        {sourceFiltered
          .slice(
            sourcePageSafe * PAGE_SIZE,
            sourcePageSafe * PAGE_SIZE + PAGE_SIZE,
          )
          .map((r) => (
            <button
              className="source-evidence"
              key={r.id}
              onClick={() => (loadMode ? setPreviewReport(r) : onReport(r.id))}
            >
              <b>{r.id}</b>
              <span>{r.content}</span>
              <small>{loadMode ? "Xem nguồn thử tải →" : "Mở nguồn →"}</small>
            </button>
          ))}
        {!sourceFiltered.length && <p>Không có phản ánh nguồn phù hợp.</p>}
      </div>
      <div className="map-pagination">
        <button
          aria-label="Nguồn trước"
          disabled={sourcePageSafe === 0}
          onClick={() => setSourcePage((v) => v - 1)}
        >
          ←
        </button>
        <span>
          Trang {sourcePageSafe + 1}/{sourcePages} · {sourceFiltered.length}{" "}
          nguồn
        </span>
        <button
          aria-label="Nguồn sau"
          disabled={sourcePageSafe + 1 >= sourcePages}
          onClick={() => setSourcePage((v) => v + 1)}
        >
          →
        </button>
      </div>
    </aside>
  )
  return (
    <div
      className={`link-explorer page-stack ${compact ? "compact-explorer" : ""}`}
    >
      <PageHeader
        title="Phân tích liên kết"
        description="Khám phá nhóm phản ánh, thực thể và căn cứ quan hệ."
        action={
          compact && (
            <button
              className="btn btn-secondary"
              onClick={() => setDetailsOpen(true)}
            >
              Chi tiết và nguồn liên kết
            </button>
          )
        }
      />
      <div className="cluster-summary">
        <div>
          <span className="cluster-id">
            {loadMode ? "THỬ TẢI ĐỘC LẬP" : cluster.id}
          </span>
          <h1 className="cluster-name">
            {loadMode
              ? "1.000 phản ánh giả lập cùng một tài khoản"
              : cluster.name}
          </h1>
          <p>
            Kết quả hỗ trợ xác minh; không suy diễn danh tính, quyền sở hữu tài
            khoản hoặc dòng tiền.
          </p>
        </div>
        <div className="cluster-numbers">
          <div>
            <span>Phản ánh phù hợp</span>
            <b>
              {matchingReports.length}/{data.length}
            </b>
          </div>
          <div>
            <span>Tổng số tiền</span>
            <b>{total} triệu</b>
          </div>
        </div>
        <div className="cluster-actions">
          <button
            className="btn btn-secondary"
            disabled={loadMode}
            onClick={onAlert}
          >
            Xem lý do cảnh báo
          </button>
          <button
            className="btn btn-primary"
            disabled={loadMode}
            onClick={onCreateCase}
          >
            Tạo hồ sơ từ cụm
          </button>
        </div>
      </div>
      <label className="load-toggle">
        <input
          type="checkbox"
          checked={loadMode}
          onChange={(e) => {
            setLoadMode(e.target.checked)
            setQuery("")
            setType("all")
            resetView()
          }}
        />
        Thử tải riêng 1.000 phản ánh · không lưu vào dữ liệu demo, không lập hồ
        sơ từ thử tải
      </label>
      <div className="explorer-toolbar card">
        <input
          aria-label="Tìm thực thể hoặc phản ánh"
          placeholder="Tìm tài khoản, điện thoại, website hoặc mã PA..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            resetView()
          }}
        />
        <select
          aria-label="Loại thực thể"
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            resetView()
          }}
        >
          <option value="all">Tất cả thực thể</option>
          <option value="account">Tài khoản ngân hàng</option>
          <option value="phone">Số điện thoại</option>
          <option value="website">Website</option>
        </select>
        <select
          aria-label="Gom nhóm phản ánh"
          value={grouping}
          onChange={(e) => {
            setGrouping(e.target.value)
            resetView()
          }}
        >
          <option value="behavior">Nhóm theo loại hành vi</option>
          <option value="day">Nhóm theo ngày tiếp nhận</option>
        </select>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Hiện nhãn
        </label>
        <div className="zoom-actions">
          <button
            aria-label="Phóng to"
            onClick={() => setZoom((v) => Math.min(1.5, v + 0.15))}
          >
            ＋
          </button>
          <button
            aria-label="Thu nhỏ"
            onClick={() => setZoom((v) => Math.max(0.6, v - 0.15))}
          >
            −
          </button>
          <button onClick={() => setZoom(1)}>Vừa màn hình</button>
        </div>
      </div>
      <div className="graph-counts">
        <span>
          Đang hiển thị {drawnReports.length}/{matchingReports.length} phản ánh
          riêng lẻ · {shownGroups.length}/{groups.length} nhóm · {nodes.length}{" "}
          nút / {edges.length} cạnh
        </span>
        <span>
          Tổng tiền tính trên toàn bộ kết quả phù hợp. Tạo hồ sơ dùng toàn bộ
          cụm đã xác nhận; nhóm/lọc chỉ để khám phá.
        </span>
      </div>
      <div className="explorer-layout">
        <div className="card explorer-map">
          <div className="map-columns">
            <b>NHÓM PHẢN ÁNH</b>
            <b>PHẢN ÁNH MỞ RỘNG</b>
            <b>THỰC THỂ</b>
          </div>
          {!expanded && groups.length > 0 && (
            <p className="map-help">
              Chọn nhóm rồi bấm “Mở rộng nhóm” để xem từng phản ánh.
            </p>
          )}
          <div className="map-viewport">
            <svg
              className="relationship-map"
              viewBox={`${(790 - 790 / zoom) / 2} ${(555 - 555 / zoom) / 2} ${790 / zoom} ${555 / zoom}`}
              aria-label="Sơ đồ quan hệ có nguồn"
              role="group"
              data-node-count={nodes.length}
              data-edge-count={edges.length}
            >
              {edges.map((edge) => {
                const active = !focus || directEdges.includes(edge)
                const x1 = edge.from.x + 210,
                  y1 = edge.from.y + 38,
                  x2 = edge.to.x,
                  y2 = edge.to.y + 38
                const mid = (x1 + x2) / 2
                return (
                  <g
                    key={edge.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Quan hệ ${edge.from.title} → ${edge.to.title}: ${edge.relation}`}
                    className={`map-edge ${active ? "is-direct" : "is-dim"}`}
                    onClick={() => choose(edge.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        choose(edge.id)
                      }
                    }}
                    onMouseEnter={() => setHover(edge.id)}
                    onMouseLeave={() => setHover("")}
                  >
                    <path
                      className="edge-hit"
                      d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                    />
                    <path
                      className="edge-line"
                      d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                    />
                    <title>
                      {edge.relation} · {edge.reports.length} phản ánh nguồn
                    </title>
                    {labelEdge === edge.id && (
                      <g className="edge-label-card" pointerEvents="none">
                        <rect
                          x={mid - 100}
                          y={(y1 + y2) / 2 - 13}
                          width="200"
                          height="26"
                          rx="5"
                        />
                        <text x={mid} y={(y1 + y2) / 2 + 4} textAnchor="middle">
                          {edge.relation}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}
              {nodes.map((node) => (
                <g
                  key={node.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.kind === "group" ? "Nhóm" : node.entity?.label || "Phản ánh"} ${node.title}`}
                  aria-pressed={selected === node.id}
                  className={`map-node map-${node.kind} ${focus && !activeNodes.has(node.id) ? "is-dim" : ""} ${selected === node.id ? "is-selected" : ""}`}
                  transform={`translate(${node.x},${node.y})`}
                  onClick={() => choose(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      choose(node.id)
                    }
                  }}
                  onMouseEnter={() => setHover(node.id)}
                  onMouseLeave={() => setHover("")}
                >
                  <rect width="210" height="76" rx="9" />
                  <text x="12" y="25">
                    {fitLabel(node.title, "600 16px system-ui")}
                  </text>
                  <text className="node-sub" x="12" y="49">
                    {fitLabel(node.sub, "400 14px system-ui")}
                  </text>
                  {showLabels && node.entity && (
                    <text className="node-relation" x="12" y="67">
                      {node.entity.relation}
                    </text>
                  )}
                  <title>
                    {node.title} · {node.sub}
                  </title>
                </g>
              ))}
              {!matchingReports.length && (
                <text className="map-hint" x="200" y="250">
                  Không có dữ liệu phù hợp
                </text>
              )}
            </svg>
          </div>
          <div className="map-pagination">
            <button
              disabled={groupPage === 0}
              onClick={() => {
                setGroupPage((v) => v - 1)
                setExpanded(null)
                choose("")
              }}
            >
              Nhóm trước
            </button>
            <span>
              Nhóm {groups.length ? groupPage + 1 : 0}/
              {Math.ceil(groups.length / 3)}
            </span>
            <button
              disabled={(groupPage + 1) * 3 >= groups.length}
              onClick={() => {
                setGroupPage((v) => v + 1)
                setExpanded(null)
                choose("")
              }}
            >
              Nhóm sau
            </button>
          </div>
          {filteredEntities.length > PAGE_SIZE && (
            <div className="map-pagination">
              <button
                disabled={entityPage === 0}
                onClick={() => {
                  setEntityPage((v) => v - 1)
                  choose("")
                }}
              >
                Thực thể trước
              </button>
              <span>
                {entityPage + 1}/
                {Math.ceil(filteredEntities.length / PAGE_SIZE)} trang thực thể
              </span>
              <button
                disabled={
                  (entityPage + 1) * PAGE_SIZE >= filteredEntities.length
                }
                onClick={() => {
                  setEntityPage((v) => v + 1)
                  choose("")
                }}
              >
                Thực thể sau
              </button>
            </div>
          )}
          {expandedGroup && (
            <div className="map-pagination">
              <button
                disabled={reportPage === 0}
                onClick={() => {
                  setReportPage((v) => v - 1)
                  choose(expandedGroup.id)
                }}
              >
                Phản ánh trước
              </button>
              <span>
                Đang vẽ{" "}
                {Math.min(
                  reportPage * PAGE_SIZE + 1,
                  expandedGroup.items.length,
                )}
                –
                {Math.min(
                  (reportPage + 1) * PAGE_SIZE,
                  expandedGroup.items.length,
                )}
                /{expandedGroup.items.length} trong nhóm
              </span>
              <button
                disabled={
                  (reportPage + 1) * PAGE_SIZE >= expandedGroup.items.length
                }
                onClick={() => {
                  setReportPage((v) => v + 1)
                  choose(expandedGroup.id)
                }}
              >
                Phản ánh sau
              </button>
              <button
                onClick={() => {
                  setExpanded(null)
                  setReportPage(0)
                  choose(expandedGroup.id)
                }}
              >
                Thu gọn nhóm
              </button>
            </div>
          )}
        </div>
        {!compact && inspector}
        {compact && detailsOpen && !previewReport && (
          <Modal
            drawer
            title="Chi tiết liên kết và nguồn"
            onClose={() => setDetailsOpen(false)}
          >
            {inspector}
          </Modal>
        )}
      </div>
      {previewReport && (
        <Modal
          title="Phản ánh nguồn thử tải"
          closeLabel="Đóng nguồn thử tải"
          onClose={() => setPreviewReport(null)}
        >
          <b>{previewReport.id}</b>
          <p>{previewReport.content}</p>
          <p>Tiếp nhận: {formatDateTime(previewReport.receivedAt)}</p>
          <p>
            Số tiền: {previewReport.amount} triệu đồng · Chỉ dữ liệu thử tải,
            không lưu vào hồ sơ demo.
          </p>
        </Modal>
      )}
      {loadMode && (
        <p className="load-note">
          Thử tải chỉ kiểm tra 1.000 bản ghi giả lập trong trình duyệt. Không đo
          hoặc khẳng định khả năng của backend hay dữ liệu lớn hơn. Tắt thử tải
          để quay về cụm demo; dữ liệu và hồ sơ không thay đổi.
        </p>
      )}
    </div>
  )
}
