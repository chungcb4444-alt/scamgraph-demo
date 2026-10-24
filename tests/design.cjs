const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/design-review"
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const results = []
  try {
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
    ]) {
      const c = await b.newContext({ viewport: { width, height } })
      const p = await c.newPage()
      p.setDefaultTimeout(12000)
      let errors = []
      p.on("pageerror", (e) => errors.push(e.message))
      const btn = (name) => p.getByRole("button", { name, exact: true })
      const nav = async (name) => {
        await p.locator("nav button").filter({ hasText: name }).click()
        await p.waitForTimeout(200)
      }
      const shot = async (name) => {
        await p.evaluate(() => scrollTo(0, 0))
        await p.waitForTimeout(200)
        assert(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          name + " page overflow",
        )
        assert.equal(await p.locator(".demo-label:visible").count(), 1)
        assert.equal(await p.locator("nav .active").count(), 1)
        await p.screenshot({ path: `${out}/${width}-${name}.png` })
      }
      await p.goto(process.env.DEMO_URL || "http://127.0.0.1:8444/", {
        waitUntil: "networkidle",
      })
      await p.screenshot({ path: `${out}/${width}-login.png` })
      await btn("Đăng nhập").click()
      await shot("dashboard")
      assert.equal(
        await p.locator("h1").evaluate((e) => getComputedStyle(e).fontSize),
        "32px",
      )
      assert.equal(
        await p
          .locator("nav button")
          .first()
          .evaluate((e) => getComputedStyle(e).fontSize),
        "16px",
      )
      await nav("Phản ánh")
      await shot("reports")
      await p
        .getByLabel("Tiếp nhận từ ngày", { exact: true })
        .fill("2099-01-01")
      assert.equal(await p.locator("tbody tr").count(), 0)
      await p.getByLabel("Tiếp nhận từ ngày", { exact: true }).fill("")
      await p.locator("tbody tr").filter({ hasText: "PA-001" }).click()
      await shot("report-detail")
      await nav("Phân tích liên kết")
      await shot("graph")
      await p.locator(".relationship-map").scrollIntoViewIfNeeded()
      await p.screenshot({ path: `${out}/${width}-graph-map.png` })
      assert(
        await p
          .locator(".map-node text")
          .evaluateAll((els) =>
            els.every((e) => e.getComputedTextLength() <= 190),
          ),
        "graph labels fit their nodes",
      )
      await p.locator(".map-entity").first().click()
      await shot("graph-drawer")
      const dialog = p.getByRole("dialog")
      assert(await dialog.isVisible())
      const close = btn("Đóng")
      let rect = await close.boundingBox()
      assert(rect.y >= 0 && rect.y + rect.height <= height)
      await p.keyboard.press("Escape")
      assert.equal(await p.getByRole("dialog").count(), 0)
      await nav("Cảnh báo")
      await shot("alerts")
      await nav("Hồ sơ vụ việc")
      await shot("cases")
      await p.locator("tbody tr").filter({ hasText: "HS-002" }).click()
      await shot("case-detail")
      for (const tab of [
        "Phản ánh",
        "Thực thể",
        "Tài liệu",
        "Công việc",
        "Lịch sử",
      ]) {
        const t = p.locator(".tabs button").filter({ hasText: tab })
        if (await t.count()) {
          await t.click()
          await shot("case-" + tab)
        }
      }
      await btn("Xem báo cáo").click()
      await shot("report")
      assert((await dialog.innerText()).includes("PA-008"))
      await p.emulateMedia({ media: "print" })
      assert.equal(
        await p
          .locator(".report-doc")
          .evaluate((e) => getComputedStyle(e).backgroundColor),
        "rgb(255, 255, 255)",
      )
      assert.equal(
        await p
          .locator("html")
          .evaluate((e) => getComputedStyle(e).backgroundColor),
        "rgb(255, 255, 255)",
      )
      await p.pdf({
        path: `${out}/${width}-report.pdf`,
        format: "A4",
        printBackground: true,
      })
      await p.emulateMedia({ media: "screen" })
      await p.keyboard.press("Escape")
      await p
        .getByLabel("Chuyển vai trò demo", { exact: true })
        .selectOption("Quản trị hệ thống")
      await shot("accounts")
      await p.getByLabel("Tìm tài khoản", { exact: true }).fill("no-account")
      assert(await p.getByText("Không tìm thấy tài khoản phù hợp.").isVisible())
      await p.getByLabel("Tìm tài khoản", { exact: true }).fill("")
      await nav("Nhật ký")
      await shot("logs")
      await p.getByLabel("Từ ngày", { exact: true }).fill("2099-01-01")
      assert(await p.getByText("Không có sự kiện phù hợp bộ lọc.").isVisible())
      await p.getByLabel("Từ ngày", { exact: true }).fill("")
      await p.locator(".audit-changes summary").first().click()
      await shot("log-expanded")
      for (const role of [
        "Cán bộ tiếp nhận",
        "Cán bộ phân tích",
        "Cán bộ xử lý hồ sơ",
        "Lãnh đạo theo dõi",
        "Kiểm tra, giám sát",
      ]) {
        await p
          .getByLabel("Chuyển vai trò demo", { exact: true })
          .selectOption(role)
        assert(await p.locator("h1").isVisible())
        assert.equal(await p.locator("nav .active").count(), 1)
        await nav("Phản ánh")
        if (["Lãnh đạo theo dõi", "Kiểm tra, giám sát"].includes(role)) {
          await btn("Tiếp nhận phản ánh").click()
          assert.equal(await p.locator(".report-intake").count(), 0)
        }
      }
      await p
        .getByLabel("Chuyển vai trò demo", { exact: true })
        .selectOption("Cán bộ tiếp nhận")
      await nav("Phản ánh")
      await btn("Tiếp nhận phản ánh").click()
      await shot("intake")
      await p
        .getByLabel("Chuyển vai trò demo", { exact: true })
        .selectOption("Người dân / Tổ chức")
      await p.evaluate(() => scrollTo(0, 0))
      assert.equal(await p.locator(".demo-label:visible").count(), 1)
      await p.screenshot({ path: `${out}/${width}-citizen-intake.png` })
      assert.equal(await p.locator("nav:visible").count(), 0)
      assert.deepEqual(errors, [])
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "page typography",
          "one demo badge",
          "single active navigation",
          "local table overflow only",
          "report date filter",
          "log date filter",
          "account empty state",
          "graph drawer close and escape",
          "case tabs",
          "white print report",
          "seven role views",
          "intake preserved",
          "no page errors",
        ],
      })
      await c.close()
    }
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2))
    console.log(JSON.stringify(results, null, 2))
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
