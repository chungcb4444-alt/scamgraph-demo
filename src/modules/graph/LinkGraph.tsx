import { useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import type { Cluster, Report } from "../../types/types"
import {
  dayKey,
  formatDateTime,
  nowISO,
  seedTimestamp,
} from "../../utils/demoTime"
import "./linkGraph.css"
import { Badge, Button, Modal, PageHeader } from "../../components/common"

type EntityKey = "account" | "phone" | "website"
type Entity = {
  id: string
  value: string
  type: EntityKey
  label: string
  relation: string
  tag: string
}
type NodeKind = "group" | "report" | "entity"
type GraphNode = {
  id: string
  kind: NodeKind
  title: string
  sub: string
  x: number
  y: number
  w: number
  h: number
  reports: Report[]
  entity?: Entity
  confirmed: boolean
}
type EdgeStatus = "confirmed" | "suggested" | "structure"
type GraphEdge = {
  id: string
  from: GraphNode
  to: GraphNode
  relation: string
  reports: Report[]
  status: EdgeStatus
}
type View = { x: number; y: number; w: number; h: number }

const ENTITY_KEYS: EntityKey[] = ["account", "phone", "website"]
const PAGE_SIZE = 5
const GROUP_SIZE = 3
const NODE_W = 208
const GROUP_W = 224
const ROW_H = 96
const COL = { group: 32, report: 396, entity: 752 }
const CANVAS_H = 560

// Fit labels by measured width while retaining full text in the accessible title and drawer.
const labelMeasure = document.createElement("canvas").getContext("2d")
function fitLabel(value: string, font: string, max = 168) {
  if (!labelMeasure) return value.slice(0, 18)
  labelMeasure.font = font
  if (labelMeasure.measureText(value).width <= max) return value
  let short = value
  while (short.length && labelMeasure.measureText(short + "…").width > max)
    short = short.slice(0, -1)
  return short + "…"
}
function entitiesOf(reports: Report[]): Entity[] {
  const definitions = [
    ["account", "Tài khoản", "Ghi nhận chuyển tiền đến", "TK"],
    ["phone", "Điện thoại", "Liên hệ qua", "SĐT"],
    ["website", "Website", "Nhắc đến", "WEB"],
  ] as const
  return definitions.flatMap(([type, label, relation, tag]) =>
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
      tag,
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
const sameValue = (a?: string, b?: string) =>
  Boolean(a?.trim() && b?.trim() && a!.trim().toLowerCase() === b!.trim().toLowerCase())

export default function LinkGraph({
  cluster,
  reports,
  onReport,
  onAlert,
  onCreateCase,
  allowCreate = true,
  canLink,
  onLink,
}: {
  cluster: Cluster
  reports: Report[]
  total: number
  hasNew: boolean
  onReport: (id: string) => void
  onAlert: () => void
  allowCreate?: boolean
  onCreateCase: () => void
  canLink: (report: Report) => boolean
  onLink: (id: string, confirm: boolean) => boolean
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
  const [isolate, setIsolate] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({})
  const [view, setView] = useState<View>({ x: 0, y: 0, w: 1000, h: CANVAS_H })
  const [size, setSize] = useState({ w: 1000, h: CANVAS_H })
  const [panning, setPanning] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{
    id: string
    startX: number
    startY: number
    baseX: number
    baseY: number
  } | null>(null)
  const panRef = useRef<{
    clientX: number
    clientY: number
    scale: number
    baseX: number
    baseY: number
  } | null>(null)
  const movedRef = useRef(false)

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
        const typeMatch = type === "all" || Boolean(r[type as EntityKey])
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
  const confirmedReports = matchingReports.filter((r) => r.cluster === cluster.id)
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
  const shownGroups = groups.slice(
    groupPage * GROUP_SIZE,
    groupPage * GROUP_SIZE + GROUP_SIZE,
  )
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
  const nodes: GraphNode[] = [
    ...shownGroups.map((g, i) => ({
      id: g.id,
      kind: "group" as const,
      title:
        grouping === "day" && /^\d{4}-\d{2}-\d{2}$/.test(g.key)
          ? `${g.key.slice(8)}/${g.key.slice(5, 7)}/${g.key.slice(0, 4)}`
          : g.key,
      sub: `${g.items.length} phản ánh · ${g.items.reduce((s, r) => s + r.amount, 0)} triệu`,
      x: COL.group,
      y: 32 + i * (ROW_H + 40),
      w: GROUP_W,
      h: 74,
      reports: g.items,
      confirmed: g.items.every((r) => r.cluster === cluster.id),
    })),
    ...drawnReports.map((r, i) => ({
      id: r.id,
      kind: "report" as const,
      title: r.id,
      sub: `${r.amount} triệu · ${formatDateTime(r.receivedAt).slice(0, 10)}`,
      x: COL.report,
      y: 32 + i * ROW_H,
      w: NODE_W,
      h: 62,
      reports: [r],
      confirmed: r.cluster === cluster.id,
    })),
    ...shownEntities.map((e, i) => ({
      id: e.id,
      kind: "entity" as const,
      title: e.value,
      sub: `${e.tag} · ${e.label}`,
      x: COL.entity,
      y: 32 + i * ROW_H,
      w: NODE_W,
      h: showLabels ? 80 : 62,
      reports: matchingReports.filter((r) => sameValue(r[e.type], e.value)),
      entity: e,
      confirmed: matchingReports
        .filter((r) => sameValue(r[e.type], e.value))
        .some((r) => r.cluster === cluster.id),
    })),
  ]
  const edges: GraphEdge[] = []
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
              relation: "Thuộc nhóm khám phá",
              reports: report.reports,
              status: "structure",
            }),
          )
      } else {
        nodes
          .filter((n) => n.entity)
          .forEach((entity) => {
            const sources = group.reports.filter((r) =>
              sameValue(r[entity.entity!.type], entity.entity!.value),
            )
            if (sources.length)
              edges.push({
                id: `${group.id}->${entity.id}`,
                from: group,
                to: entity,
                relation: entity.entity!.relation,
                reports: sources,
                status: sources.every((r) => r.cluster === cluster.id)
                  ? "confirmed"
                  : "suggested",
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
          if (sameValue(report.reports[0][entity.entity!.type], entity.entity!.value))
            edges.push({
              id: `${report.id}->${entity.id}`,
              from: report,
              to: entity,
              relation: entity.entity!.relation,
              reports: report.reports,
              status: report.confirmed ? "confirmed" : "suggested",
            })
        }),
    )
  const positions = new Map(
    nodes.map((n) => [
      n.id,
      { x: n.x + (offsets[n.id]?.x || 0), y: n.y + (offsets[n.id]?.y || 0) },
    ]),
  )
  const chosenNode = nodes.find((n) => n.id === selected)
  const chosenEdge = edges.find((e) => e.id === selected)
  // Clicking a node highlights only its immediate relationships, not inferred ownership.
  const base = isolate ? selected : hover || selected
  const directEdges = edges.filter(
    (e) => e.id === base || e.from.id === base || e.to.id === base,
  )
  const activeNodes = new Set([
    base,
    ...directEdges.flatMap((e) => [e.from.id, e.to.id]),
  ])
  const dimming = Boolean(base)
  const sources = chosenEdge?.reports || chosenNode?.reports || matchingReports
  const sourceFiltered = sources.filter((r) =>
    `${r.id} ${r.title} ${r.content}`
      .toLowerCase()
      .includes(sourceQuery.trim().toLowerCase()),
  )
  const sourcePages = Math.max(1, Math.ceil(sourceFiltered.length / PAGE_SIZE))
  const sourcePageSafe = Math.min(sourcePage, sourcePages - 1)
  const sourceTotal = sources.reduce((s, r) => s + r.amount, 0)
  const confirmedSources = sources.filter((r) => r.cluster === cluster.id).length
  const hasBasis = (r: Report) =>
    data.some(
      (o) =>
        o.id !== r.id &&
        o.cluster === cluster.id &&
        ENTITY_KEYS.some((k) => sameValue(r[k], o[k])),
    )
  const choose = (id: string) => {
    if (id) setDetailsOpen(true)
    setSelected(id)
    if (!id) setIsolate(false)
    setSourcePage(0)
    setSourceQuery("")
  }
  const resetView = () => {
    setSelected("")
    setHover("")
    setIsolate(false)
    setGroupPage(0)
    setEntityPage(0)
    setExpanded(null)
    setReportPage(0)
    setSourcePage(0)
    setSourceQuery("")
    setOffsets({})
  }
  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }
  const onSurfaceMove = (e: ReactPointerEvent) => {
    if (dragRef.current) {
      const d = dragRef.current
      const p = toSvg(e.clientX, e.clientY)
      const dx = p.x - d.startX
      const dy = p.y - d.startY
      if (Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true
      setOffsets((prev) => ({
        ...prev,
        [d.id]: { x: d.baseX + dx, y: d.baseY + dy },
      }))
    } else if (panRef.current) {
      const d = panRef.current
      const dx = (e.clientX - d.clientX) * d.scale
      const dy = (e.clientY - d.clientY) * d.scale
      if (Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true
      setView((v) => ({ ...v, x: d.baseX - dx, y: d.baseY - dy }))
    }
  }
  const endGesture = () => {
    dragRef.current = null
    panRef.current = null
    setPanning(false)
  }
  const zoomBy = (delta: number) => {
    setView((v) => {
      const k = size.w / v.w
      const nextK = Math.min(2.5, Math.max(0.25, k + delta))
      const f = k / nextK
      const w = v.w * f
      const h = v.h * f
      return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h }
    })
  }
  const fit = () => {
    if (!nodes.length) {
      setView({ x: 0, y: 0, w: size.w, h: size.h })
      return
    }
    const xs = nodes.map((n) => positions.get(n.id)!.x)
    const ys = nodes.map((n) => positions.get(n.id)!.y)
    const minX = Math.min(...xs) - 32
    const minY = Math.min(...ys) - 32
    const maxX = Math.max(...nodes.map((n) => positions.get(n.id)!.x + n.w)) + 32
    const maxY = Math.max(...nodes.map((n) => positions.get(n.id)!.y + n.h)) + 32
    let w = Math.max(1, maxX - minX)
    let h = Math.max(1, maxY - minY)
    const aspect = size.w / Math.max(1, size.h)
    if (w / h < aspect) w = h * aspect
    else h = w / aspect
    setView({
      x: minX - (w - (maxX - minX)) / 2,
      y: minY - (h - (maxY - minY)) / 2,
      w,
      h,
    })
  }
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const observer = new ResizeObserver(() => {
      const rect = svg.getBoundingClientRect()
      if (rect.width > 0)
        setSize({ w: Math.round(rect.width), h: Math.round(rect.height) })
    })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const frame = requestAnimationFrame(fit)
    return () => cancelAnimationFrame(frame)
    // Refit when the drawn layout changes; dragging and selection keep the viewport.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouping, type, query, loadMode, groupPage, entityPage, expanded, reportPage, size])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      setSelected("")
      setHover("")
      setIsolate(false)
      setDetailsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomBy(e.deltaY < 0 ? 0.12 : -0.12)
    }
    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
  }, [size])
  const relationFor = () =>
    chosenEdge?.relation ||
    chosenNode?.entity?.relation ||
    (chosenNode?.kind === "group" ? "Thuộc nhóm khám phá" : "Phản ánh nguồn")
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
          : chosenNode?.title || (loadMode ? "Dữ liệu thử tải riêng" : cluster.id)}
      </strong>
      <div className="inspector-badges">
        {chosenNode && (
          <Badge tone={chosenNode.kind === "entity" ? "purple" : "blue"}>
            {chosenNode.kind === "group"
              ? "Nhóm phản ánh"
              : chosenNode.entity?.label || "Phản ánh"}
          </Badge>
        )}
        {chosenEdge && (
          <Badge tone={chosenEdge.status === "confirmed" ? "green" : "orange"}>
            {chosenEdge.status === "confirmed"
              ? "Cán bộ đã xác nhận"
              : chosenEdge.status === "suggested"
                ? "Hệ thống gợi ý"
                : "Quan hệ nhóm"}
          </Badge>
        )}
      </div>
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
          <dt>Đã xác nhận liên kết</dt>
          <dd>{confirmedSources}</dd>
        </div>
        <div>
          <dt>Tổng số tiền</dt>
          <dd>{sourceTotal} triệu đồng</dd>
        </div>
      </dl>
      {chosenNode?.kind === "group" && (
        <Button
          onClick={() => {
            setExpanded(expanded === chosenNode.id ? null : chosenNode.id)
            setReportPage(0)
          }}
        >
          {expanded === chosenNode.id ? "Thu gọn nhóm" : "Mở rộng nhóm"}
        </Button>
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
          .map((r) => {
            const confirmed = r.cluster === cluster.id
            const rejected = r.rejectedClusters?.includes(cluster.id)
            return (
              <div
                className="source-evidence"
                key={r.id}
                onClick={() =>
                  loadMode ? setPreviewReport(r) : onReport(r.id)
                }
              >
                <div className="source-head">
                  <b>{r.id}</b>
                  <Badge
                    tone={confirmed ? "green" : rejected ? "gray" : "orange"}
                  >
                    {confirmed
                      ? "Đã xác nhận"
                      : rejected
                        ? "Đã loại bỏ"
                        : "Gợi ý"}
                  </Badge>
                </div>
                <span className="source-relation">{relationFor()}</span>
                <span>{r.content}</span>
                <div
                  className="source-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="source-open"
                    onClick={() =>
                      loadMode ? setPreviewReport(r) : onReport(r.id)
                    }
                  >
                    {loadMode ? "Xem nguồn thử tải →" : "Mở nguồn →"}
                  </button>
                  {!loadMode && !rejected && canLink(r) && (
                    <Button
                      variant={confirmed ? "secondary" : "primary"}
                      disabled={!confirmed && !hasBasis(r)}
                      onClick={() => onLink(r.id, !confirmed)}
                    >
                      {confirmed ? "Hủy xác nhận" : "Xác nhận liên kết"}
                    </Button>
                  )}
                </div>
                {!loadMode && !confirmed && !rejected && canLink(r) && !hasBasis(r) && (
                  <small className="source-note">
                    Chưa có thực thể trùng khớp đã xác nhận để làm căn cứ.
                  </small>
                )}
              </div>
            )
          })}
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
            <span>Đã xác nhận</span>
            <b>{confirmedReports.length}</b>
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
          {allowCreate && (
            <button
              className="btn btn-primary"
              disabled={loadMode}
              onClick={onCreateCase}
            >
              Tạo hồ sơ từ cụm
            </button>
          )}
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
      <div className="explorer-toolbar card graph-toolbar">
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
        <button
          className={`btn btn-secondary ${isolate ? "is-on" : ""}`}
          disabled={!selected}
          title="Làm mờ các nút và cạnh không liên quan tới lựa chọn"
          onClick={() => setIsolate((v) => !v)}
        >
          Cô lập nhánh
        </button>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Hiện nhãn
        </label>
        <div className="zoom-actions">
          <button aria-label="Thu nhỏ" onClick={() => zoomBy(-0.15)}>
            −
          </button>
          <span className="zoom-value">{Math.round((size.w / view.w) * 100)}%</span>
          <button aria-label="Phóng to" onClick={() => zoomBy(0.15)}>
            ＋
          </button>
          <button onClick={fit}>Vừa màn hình</button>
        </div>
      </div>
      <div className="graph-counts">
        <span>
          {shownGroups.length}/{groups.length} nhóm · {drawnReports.length} phản
          ánh mở rộng · {shownEntities.length}/{filteredEntities.length} thực
          thể · {nodes.length} nút / {edges.length} cạnh
        </span>
        <span>
          Nét liền đậm: cán bộ đã xác nhận · Nét đứt: hệ thống gợi ý. Kéo nút để
          sắp xếp, kéo nền để di chuyển, cuộn để thu phóng, rê lên cạnh để xem
          nhãn quan hệ.
        </span>
      </div>
      <div className="explorer-layout">
        <div className="card explorer-map">
          <div className="graph-legend">
            <span className="legend-item">
              <i className="dot dot-group" /> Nhóm phản ánh
            </span>
            <span className="legend-item">
              <i className="dot dot-report" /> Phản ánh
            </span>
            <span className="legend-item">
              <i className="dot dot-account" /> Tài khoản
            </span>
            <span className="legend-item">
              <i className="dot dot-phone" /> Điện thoại
            </span>
            <span className="legend-item">
              <i className="dot dot-website" /> Website
            </span>
            <span className="legend-item legend-line">
              <i className="line line-confirmed" /> Đã xác nhận
            </span>
            <span className="legend-item legend-line">
              <i className="line line-suggested" /> Gợi ý
            </span>
          </div>
          <div className="map-viewport graph-canvas">
            <svg
              ref={svgRef}
              className={`relationship-map ${panning ? "is-panning" : ""}`}
              height={CANVAS_H}
              viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
              aria-label="Sơ đồ quan hệ có nguồn"
              role="group"
              data-node-count={nodes.length}
              data-edge-count={edges.length}
              onPointerMove={onSurfaceMove}
              onPointerUp={endGesture}
              onPointerLeave={endGesture}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                panRef.current = {
                  clientX: e.clientX,
                  clientY: e.clientY,
                  scale: view.w / Math.max(1, size.w),
                  baseX: view.x,
                  baseY: view.y,
                }
                movedRef.current = false
                setPanning(true)
              }}
              onClick={() => {
                if (movedRef.current) {
                  movedRef.current = false
                  return
                }
                choose("")
              }}
            >
              <g>
                {edges.map((edge) => {
                  const a = positions.get(edge.from.id)!
                  const b = positions.get(edge.to.id)!
                  const x1 = a.x + edge.from.w
                  const y1 = a.y + edge.from.h / 2
                  const x2 = b.x
                  const y2 = b.y + edge.to.h / 2
                  const dx = Math.max(48, Math.abs(x2 - x1) / 2)
                  const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
                  const active = !dimming || directEdges.includes(edge)
                  const midX = (x1 + x2) / 2
                  const midY = (y1 + y2) / 2
                  const labelVisible = hover === edge.id || selected === edge.id
                  return (
                    <g
                      key={edge.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Quan hệ ${edge.from.title} → ${edge.to.title}: ${edge.relation}`}
                      className={`map-edge is-${edge.status} ${active ? "is-direct" : "is-dim"} ${selected === edge.id ? "is-selected" : ""}`}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (movedRef.current) return
                        choose(edge.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          choose(edge.id)
                        }
                      }}
                      onMouseEnter={() => setHover(edge.id)}
                      onMouseLeave={() => setHover("")}
                    >
                      <path className="edge-hit" d={d} />
                      <path className="edge-line" d={d} />
                      <title>
                        {edge.relation} · {edge.reports.length} phản ánh nguồn ·{" "}
                        {edge.status === "confirmed"
                          ? "Cán bộ đã xác nhận"
                          : edge.status === "suggested"
                            ? "Hệ thống gợi ý"
                            : "Quan hệ nhóm"}
                      </title>
                      {labelVisible && active && (
                        <g className="edge-label-card" pointerEvents="none">
                          <rect
                            x={midX - 78}
                            y={midY - 12}
                            width="156"
                            height="24"
                            rx="4"
                          />
                          <text x={midX} y={midY + 4} textAnchor="middle">
                            {fitLabel(edge.relation, "400 12px system-ui", 146)}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
                {nodes.map((node) => {
                  const p = positions.get(node.id)!
                  const dim = dimming && !activeNodes.has(node.id)
                  return (
                    <g
                      key={node.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`${node.kind === "group" ? "Nhóm" : node.entity?.label || "Phản ánh"} ${node.title}`}
                      aria-pressed={selected === node.id}
                      className={`map-node map-${node.kind} ${node.entity ? `t-${node.entity.type}` : ""} ${dim ? "is-dim" : ""} ${selected === node.id ? "is-selected" : ""}`}
                      transform={`translate(${p.x},${p.y})`}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return
                        e.stopPropagation()
                        const pt = toSvg(e.clientX, e.clientY)
                        dragRef.current = {
                          id: node.id,
                          startX: pt.x,
                          startY: pt.y,
                          baseX: offsets[node.id]?.x || 0,
                          baseY: offsets[node.id]?.y || 0,
                        }
                        movedRef.current = false
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (movedRef.current) {
                          movedRef.current = false
                          return
                        }
                        choose(node.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          choose(node.id)
                        }
                      }}
                      onMouseEnter={() => setHover(node.id)}
                      onMouseLeave={() => setHover("")}
                    >
                      <rect
                        className="node-box"
                        width={node.w}
                        height={node.h}
                        rx="7"
                      />
                      <circle className="node-dot" cx="17" cy="21" r="4" />
                      <text className="node-title" x="29" y="26">
                        {fitLabel(node.title, "600 14px system-ui", node.w - 46)}
                      </text>
                      <text className="node-sub" x="29" y="46">
                        {fitLabel(node.sub, "400 12px system-ui", node.w - 42)}
                      </text>
                      {node.entity && showLabels && (
                        <text className="node-relation" x="29" y="65">
                          {fitLabel(
                            node.entity.relation,
                            "400 12px system-ui",
                            node.w - 42,
                          )}
                        </text>
                      )}
                      {node.kind !== "group" && node.confirmed && (
                        <text
                          className="node-check"
                          x={node.w - 16}
                          y={node.h - 12}
                          textAnchor="end"
                        >
                          ✓
                        </text>
                      )}
                      <title>
                        {node.title} · {node.sub}
                      </title>
                    </g>
                  )
                })}
              </g>
              {!matchingReports.length && (
                <text className="map-hint" x="40" y="60">
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
              {Math.ceil(groups.length / GROUP_SIZE)}
            </span>
            <button
              disabled={(groupPage + 1) * GROUP_SIZE >= groups.length}
              onClick={() => {
                setGroupPage((v) => v + 1)
                setExpanded(null)
                choose("")
              }}
            >
              Nhóm sau
            </button>
            {filteredEntities.length > PAGE_SIZE && (
              <>
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
                  {entityPage + 1}/{Math.ceil(filteredEntities.length / PAGE_SIZE)}{" "}
                  trang thực thể
                </span>
                <button
                  disabled={(entityPage + 1) * PAGE_SIZE >= filteredEntities.length}
                  onClick={() => {
                    setEntityPage((v) => v + 1)
                    choose("")
                  }}
                >
                  Thực thể sau
                </button>
              </>
            )}
            {expandedGroup && (
              <>
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
              </>
            )}
          </div>
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
