const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const root = process.env.DEMO_URL || "http://127.0.0.1:8444/"
const out = process.env.TEST_OUTPUT || "/tmp/scamgraph-revision"
fs.mkdirSync(out, { recursive: true })
const results = []
;(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  try {
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        timezoneId: "America/Los_Angeles",
      })
      const page = await context.newPage()
      page.setDefaultTimeout(12000)
      const errors = []
      page.on("pageerror", (e) => errors.push(e.message))
      const btn = (name) => page.getByRole("button", { name, exact: true })
      const nav = (name) =>
        page.locator("nav button").filter({ hasText: name }).click()
      const get = (key) =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(`scamgraph-demo-${key}`)),
          key,
        )
      const shot = async (name) => {
        await page.evaluate(() => scrollTo(0, 0))
        await page.screenshot({ path: `${out}/${width}-${name}.png` })
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
      }
      await page.clock.install({ time: new Date("2026-10-22T16:59:00Z") })
      await page.goto(root, { waitUntil: "networkidle" })
      await btn("Đăng nhập").click()
      const initial = await get("reports")
      assert.equal(initial.length, 12)
      const initialAudit = await get("logs")
      const initialCases = await get("cases")
      assert.equal(
        initialAudit.find((log) => log.target === "HS-001").time,
        initialCases[0].updated,
      )
      assert.equal(
        initialCases[0].history[0].split(" · ")[0],
        initialCases[0].updated,
      )
      assert.equal(
        initialAudit.find((log) => log.action === "Tạo phản ánh").time,
        initial.find((report) => report.id === "PA-002").receivedAt,
      )
      assert(
        initial.every(
          (r) => r.receivedAt && r.occurredAt && r.occurredAt < r.receivedAt,
        ),
      )
      assert(
        (await page.locator(".daily-column").last().innerText()).includes(
          "22/10",
        ),
      )
      let chart = await page.locator(".daily-column > b").allTextContents()
      assert.equal(chart.length, 7)
      assert.equal(
        chart.map(Number).reduce((s, n) => s + n, 0),
        7,
      )
      await shot("calendar-before-midnight")
      await page.clock.fastForward(61000)
      assert(
        (await page.locator(".daily-column").last().innerText()).includes(
          "23/10",
        ),
      )
      chart = await page.locator(".daily-column > b").allTextContents()
      assert.equal(chart.at(-1), "0")
      assert.equal(
        chart.map(Number).reduce((s, n) => s + n, 0),
        6,
      )
      await shot("calendar-after-midnight")
      await page.reload({ waitUntil: "networkidle" })
      assert.deepEqual(await get("reports"), initial)
      // A case snapshots exactly the report IDs at its creation time.
      await page.locator(".cluster-item").filter({ hasText: "CUM-001" }).click()
      await btn("Tạo hồ sơ từ cụm").click()
      await btn("Xác nhận tạo hồ sơ").click()
      assert.equal(
        (await get("cases")).find((c) => c.id === "HS-003").reportIds.length,
        3,
      )
      await nav("Phản ánh")
      await btn("Tiếp nhận phản ánh").click()
      await btn("Dùng tình huống mẫu").click()
      await btn("Tiếp tục").click()
      await page
        .getByLabel("Thời gian phát sinh", { exact: true })
        .fill("2026-10-21T20:30")
      await btn("Tiếp tục").click()
      await btn("Tiếp tục").click()
      await btn("Lưu phản ánh").click()
      await btn("Mở chi tiết PA-013").click()
      let added = (await get("reports")).find((r) => r.id === "PA-013")
      assert.equal(added.amount, 15)
      assert.equal(added.occurredAt, "2026-10-21T13:30:00.000Z")
      assert(added.receivedAt.startsWith("2026-10-22T17:"))
      await btn("Trích xuất thông tin").click()
      await page.getByLabel("Số tiền (triệu đồng)", { exact: true }).fill("19")
      await btn("Lưu thông tin đã kiểm tra").click()
      assert.equal(
        (await get("reports"))
          .filter((r) => r.cluster === "CUM-001")
          .reduce((s, r) => s + r.amount, 0),
        45,
      )
      assert.equal(
        await page
          .locator(".hero-meta [data-workflow]")
          .getAttribute("data-workflow"),
        "Đã kiểm tra",
      )
      await btn("Xác nhận liên kết CUM-001").click()
      assert.equal(
        (await get("reports"))
          .filter((r) => r.cluster === "CUM-001")
          .reduce((s, r) => s + r.amount, 0),
        64,
      )
      assert(
        (await get("logs")).some(
          (l) =>
            l.target === "PA-013" && l.detail?.includes("trước: 15; sau: 19"),
        ),
      )
      await btn("Xem sơ đồ CUM-001 →").click()
      assert(
        (await page.locator(".cluster-summary").innerText()).includes(
          "64 triệu",
        ),
      )
      await page.locator(".map-group").first().click()
      assert(
        (await page.locator(".explorer-details").innerText()).includes("4"),
      )
      await btn("Mở rộng nhóm").click()
      assert.equal(await page.locator(".map-report").count(), 4)
      await page.keyboard.press("Escape")
      await page
        .getByLabel("Loại thực thể", { exact: true })
        .selectOption("account")
      await page.locator(".map-entity").first().click()
      assert(
        (await page.locator(".explorer-details").innerText()).includes(
          "Ghi nhận chuyển tiền đến",
        ),
      )
      assert(
        (await page.locator(".is-dim").count()) > 0 ||
          (await page.locator(".map-node").count()) === 2,
      )
      await page.keyboard.press("Escape")
      await page
        .getByLabel("Tìm thực thể hoặc phản ánh", { exact: true })
        .fill("xacminh-demo.example")
      assert.equal(await page.locator(".map-entity").count(), 0)
      await page
        .getByLabel("Loại thực thể", { exact: true })
        .selectOption("all")
      assert.equal(await page.locator(".map-entity").count(), 1)
      await page
        .getByLabel("Tìm thực thể hoặc phản ánh", { exact: true })
        .fill("")
      const viewBox = await page
        .locator(".relationship-map")
        .getAttribute("viewBox")
      await page.getByLabel("Phóng to", { exact: true }).click()
      assert.notEqual(
        await page.locator(".relationship-map").getAttribute("viewBox"),
        viewBox,
      )
      await btn("Vừa màn hình").click()
      assert.equal(
        await page.locator(".relationship-map").getAttribute("viewBox"),
        viewBox,
      )
      await page.locator(".map-edge").first().click()
      assert(
        (await page.locator(".explorer-details h2").innerText()).includes(
          "Căn cứ",
        ),
      )
      await page.keyboard.press("Escape")
      await page
        .getByRole("checkbox", { name: "Hiện nhãn", exact: true })
        .check()
      assert.equal(
        await page.locator(".node-relation").count(),
        await page.locator(".map-entity").count(),
      )
      if ((await page.locator(".map-edge").count()) > 1)
        await page.locator(".map-edge").nth(1).hover()
      assert((await page.locator(".edge-label-card").count()) <= 1)
      await page.evaluate(() => scrollTo(0, 400))
      assert((await page.locator(".topbar").boundingBox()).y < 0)
      await shot("structured-graph-small")
      await btn("Tạo hồ sơ từ cụm").click()
      await btn("Xác nhận tạo hồ sơ").click()
      await btn("Xem báo cáo").click()
      assert(
        (await page.getByRole("dialog").innerText()).includes("64 triệu đồng"),
      )
      await page.keyboard.press("Escape")
      await nav("Hồ sơ vụ việc")
      await page.evaluate(() => scrollTo(0, 300))
      assert.equal(
        await page
          .locator(".topbar")
          .evaluate((el) => getComputedStyle(el).position),
        "static",
      )
      await page.locator("tbody tr").filter({ hasText: "HS-003" }).click()
      await btn("Xem báo cáo").click()
      let report = await page.getByRole("dialog").innerText()
      assert(report.includes("45 triệu đồng"))
      assert(!report.includes("PA-013"))
      await page.keyboard.press("Escape")
      await nav("Phản ánh")
      const badges = await page
        .locator("tbody [data-workflow]")
        .evaluateAll((els) =>
          els.map((el) => ({
            text: el.textContent.trim(),
            classes: el.className,
          })),
        )
      assert(
        badges.every((b) =>
          b.text === "Đã kiểm tra"
            ? b.classes.includes("badge-green")
            : b.text === "Chờ kiểm tra"
              ? b.classes.includes("badge-gray")
              : true,
        ),
      )
      await shot("consistent-status-colors")
      await page.evaluate(() => scrollTo(0, 500))
      assert((await page.locator(".topbar").boundingBox()).y < 0)
      await page
        .locator("tbody tr")
        .filter({ hasText: "PA-013" })
        .getByRole("button")
        .click()
      assert(
        (await page.locator(".detail-code").innerText()).includes("PA-013"),
      )
      await nav("Tổng quan")
      await page.locator(".cluster-item").filter({ hasText: "CUM-001" }).click()
      await page
        .getByLabel("Gom nhóm phản ánh", { exact: true })
        .selectOption("day")
      assert(
        (
          await page.locator(".map-group").first().getAttribute("aria-label")
        ).match(/\d{2}\/\d{2}\/\d{4}/),
      )
      await page
        .getByLabel("Gom nhóm phản ánh", { exact: true })
        .selectOption("behavior")
      const beforeLoad = {
        reports: await get("reports"),
        cases: await get("cases"),
        logs: await get("logs"),
      }
      const start = performance.now()
      await page.getByRole("checkbox", { name: /Thử tải riêng/ }).check()
      assert(
        (await page.locator(".cluster-summary").innerText()).includes(
          "1000/1000",
        ),
      )
      await page.locator(".map-group").first().click()
      await btn("Mở rộng nhóm").click()
      const nodeCount = Number(
        await page.locator(".relationship-map").getAttribute("data-node-count"),
      )
      const edgeCount = Number(
        await page.locator(".relationship-map").getAttribute("data-edge-count"),
      )
      assert(nodeCount <= 13)
      assert(edgeCount <= 45)
      assert.equal(await page.locator(".map-report").count(), 5)
      assert(
        (await page.locator(".explorer-details dl").innerText()).includes(
          "250 triệu đồng",
        ),
      )
      const firstSources = await page
        .locator(".source-evidence b")
        .allTextContents()
      await page.getByRole("button", { name: "Nguồn sau", exact: true }).click()
      assert.notDeepEqual(
        await page.locator(".source-evidence b").allTextContents(),
        firstSources,
      )
      await page
        .getByLabel("Tìm phản ánh nguồn", { exact: true })
        .fill("THU-TAI-0997")
      assert.equal(await page.locator(".source-evidence").count(), 1)
      await page.locator(".source-evidence").click()
      assert(
        (await page.getByRole("dialog").last().innerText()).includes("THU-TAI-0997"),
      )
      await page.getByLabel("Đóng nguồn thử tải", { exact: true }).click()
      await page.getByLabel("Tìm phản ánh nguồn", { exact: true }).fill("")
      await page.keyboard.press("Escape")
      await btn("Phản ánh sau").click()
      assert(
        (await page.locator(".map-pagination").allTextContents())
          .join(" ")
          .includes("6–10/250"),
      )
      await page.keyboard.press("Escape")
      assert(await btn("Tạo hồ sơ từ cụm").isDisabled())
      await shot("stress-1000-bounded")
      await btn("Thu gọn nhóm").first().click()
      await page.keyboard.press("Escape")
      assert.equal(await page.locator(".map-report").count(), 0)
      await page.getByRole("checkbox", { name: /Thử tải riêng/ }).uncheck()
      assert.deepEqual(
        {
          reports: await get("reports"),
          cases: await get("cases"),
          logs: await get("logs"),
        },
        beforeLoad,
      )
      await nav("Nhật ký hệ thống")
      await page.evaluate(() => scrollTo(0, 450))
      assert((await page.locator(".topbar").boundingBox()).y < 0)
      await shot("journal-layout")
      page.once("dialog", (d) => d.accept())
      await btn("Đặt lại demo").click()
      const reset = await get("reports")
      assert.equal(reset.length, 12)
      assert(reset[0].receivedAt.startsWith("2026-10-22T17:"))
      assert.equal((await get("cases")).length, 2)
      assert.equal(errors.length, 0, errors.join("\n"))
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        stressRecords: 1000,
        maxObservedNodes: nodeCount,
        maxObservedEdges: edgeCount,
        interactionDurationMs: Math.round(performance.now() - start),
        checks: [
          "seven-calendar-days-and-Vietnam-midnight",
          "empty-day-zero",
          "reload-keeps-timestamps",
          "seed-audit-history-times-consistent",
          "occurred-vs-received-separate",
          "amount-19-and-cluster-64",
          "case-created-before-link-stays-3-and-45",
          "new-case-4-and-64",
          "canonical-status-color",
          "non-overlay-header-scroll-four-pages",
          "labels-toggle-without-overlap",
          "group-expand-collapse",
          "group-by-received-day",
          "entity-filter-search",
          "edge-explanation-and-source",
          "zoom-fit",
          "bounded-1000-mode",
          "source-pagination-search",
          "stress-isolation",
          "reset-regenerates-samples-current-day",
        ],
      })
      await context.close()
    }
    // Preserve existing records in an actual browser migration, including custom case and audit note.
    const c = await browser.newContext()
    const p = await c.newPage()
    await p.addInitScript(() => {
      if (localStorage.getItem("migration-fixture")) return
      localStorage.setItem("migration-fixture", "1")
      localStorage.setItem(
        "scamgraph-demo-reports",
        JSON.stringify([
          {
            id: "PA-013",
            title: "Nội dung người dùng",
            source: "Cổng trực tuyến",
            area: "Hà Nội",
            time: "09:45:00 18/6/2025",
            amount: 19,
            status: "Có liên quan",
            behavior: "Giả danh ngân hàng",
            content: "Giữ nguyên nội dung",
            cluster: "CUM-001",
          },
        ]),
      )
      localStorage.setItem(
        "scamgraph-demo-cases",
        JSON.stringify([
          {
            id: "HS-009",
            name: "Hồ sơ riêng",
            priority: "Cao",
            officer: "Lê Minh Anh",
            status: "Đang xác minh",
            updated: "18/06/2025 10:05",
            note: "Giữ nhận định",
            reportIds: ["PA-013"],
            history: ["18/06/2025 10:05 · Người dùng tạo"],
          },
        ]),
      )
      localStorage.setItem(
        "scamgraph-demo-logs",
        JSON.stringify([
          {
            time: "18/06/2025 10:05",
            user: "nguoi.dung",
            role: "Cán bộ",
            action: "Sửa số tiền",
            target: "PA-013",
            result: "Thành công",
            detail: "Trước 15, sau 19",
          },
        ]),
      )
      localStorage.setItem("scamgraph-demo-session", "true")
    })
    await p.goto(root, { waitUntil: "networkidle" })
    assert(
      (await p.locator(".migration-note").innerText()).includes("giữ nguyên"),
    )
    const migrated = await p.evaluate(() => ({
      r: JSON.parse(localStorage.getItem("scamgraph-demo-reports")),
      c: JSON.parse(localStorage.getItem("scamgraph-demo-cases")),
      l: JSON.parse(localStorage.getItem("scamgraph-demo-logs")),
      backup: JSON.parse(
        localStorage.getItem("scamgraph-demo-reports:migration-backup-v1"),
      ),
    }))
    assert.equal(migrated.r[0].amount, 19)
    assert.equal(migrated.r[0].receivedAt, "2025-06-18T02:45:00.000Z")
    assert.equal(migrated.c[0].note, "Giữ nhận định")
    assert.equal(migrated.l[0].detail, "Trước 15, sau 19")
    assert.equal(migrated.backup[0].time, "09:45:00 18/6/2025")
    await p.reload({ waitUntil: "networkidle" })
    assert.equal(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("scamgraph-demo-reports"))[0].amount,
      ),
      19,
    )
    await c.close()
    results.push({
      migration: "PASS",
      kept: "custom report, amount 19, custom case, history, journal, legacy date, backup",
    })
    fs.writeFileSync(
      `${out}/revision-results.json`,
      JSON.stringify(results, null, 2),
    )
    console.log(JSON.stringify(results, null, 2))
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
