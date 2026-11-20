const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "/tmp/scamgraph-results"
fs.mkdirSync(out, { recursive: true })
const results = []
let activePage
;(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  try {
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } })
      const page = await context.newPage()
      activePage = page
      page.setDefaultTimeout(10000)
      const errors = []
      page.on("pageerror", (e) => errors.push(e.message))
      const nav = async (name) =>
        page.locator("nav button").filter({ hasText: name }).click()
      const button = (name) => page.getByRole("button", { name, exact: true })
      const snap = async (name) => {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.waitForTimeout(100)
        await page.screenshot({ path: `${out}/${width}-${name}.png` })
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `page overflow ${name}`,
        )
      }
      const reports = () =>
        page.evaluate(() =>
          JSON.parse(localStorage.getItem("scamgraph-demo-reports")),
        )
      const cases = () =>
        page.evaluate(() =>
          JSON.parse(localStorage.getItem("scamgraph-demo-cases")),
        )
      await page.goto(process.env.DEMO_URL || "http://127.0.0.1:8443/", {
        waitUntil: "networkidle",
      })
      await snap("01-login")
      await button("Đăng nhập demo →").click()
      assert.equal((await reports()).length, 12)
      const cluster = async (id) =>
        (await reports()).filter((r) => r.cluster === id)
      assert.equal(
        (await cluster("CUM-001")).reduce((s, r) => s + r.amount, 0),
        45,
      )
      await nav("Phản ánh")
      await snap("03-reports")
      await page.getByPlaceholder("Tìm theo mã hoặc tiêu đề...").fill("PA-008")
      assert.equal(await page.locator("tbody tr").count(), 1)
      await page
        .getByPlaceholder("Tìm theo mã hoặc tiêu đề...")
        .fill("zz-no-result")
      assert.equal(await page.locator("tbody tr").count(), 0)
      await page.getByPlaceholder("Tìm theo mã hoặc tiêu đề...").fill("")
      await page
        .locator(".filter-card select")
        .first()
        .selectOption({ label: "Chờ kiểm tra" })
      assert.equal(await page.locator("tbody tr").count(), 6)
      await page
        .locator(".filter-card select")
        .first()
        .selectOption({ label: "Tất cả trạng thái" })
      await button("＋ Tạo phản ánh").click()
      await snap("02-new-report")
      await button("Dùng tình huống mẫu").click()
      await button("Tiếp tục").click()
      await button("Tiếp tục").click()
      await button("Dùng ảnh chuyển khoản mẫu").click()
      await button("Tiếp tục").click()
      await button("Lưu phản ánh").click()
      await button("Mở chi tiết PA-013").click()
      assert.equal((await reports()).length, 13)
      assert.equal((await reports()).find((r) => r.id === "PA-013").amount, 15)
      assert.equal((await cluster("CUM-001")).length, 3)
      await button("Trích xuất thông tin").click()
      await page
        .getByLabel("Số điện thoại", { exact: true })
        .fill("DEMO-SDT-013")
      await page
        .getByLabel("Ngân hàng", { exact: true })
        .fill("Ngân hàng mẫu A · đã kiểm tra")
      assert.equal(await button("Xác nhận liên kết CUM-001").count(), 0)
      await button("Lưu thông tin đã kiểm tra").click()
      assert.equal(
        (await reports()).find((r) => r.id === "PA-013").phone,
        "DEMO-SDT-013",
      )
      assert.equal(
        (await reports()).find((r) => r.id === "PA-013").bank,
        "Ngân hàng mẫu A · đã kiểm tra",
      )
      await snap("07-evidence")
      await button("Loại bỏ đề xuất CUM-001").click()
      assert.equal((await cluster("CUM-001")).length, 3)
      await page.reload({ waitUntil: "networkidle" })
      assert.equal(await button("Xác nhận liên kết CUM-001").count(), 0)
      await button("Xem xét lại CUM-001").click()
      await button("Xác nhận liên kết CUM-001").click()
      assert.equal((await cluster("CUM-001")).length, 4)
      assert.equal(
        (await cluster("CUM-001")).reduce((s, r) => s + r.amount, 0),
        60,
      )
      await button("Xem sơ đồ CUM-001 →").click()
      await snap("08-graph")
      await button("Xem lý do cảnh báo").click()
      assert(
        (await page.getByRole("dialog").innerText()).includes("60 triệu đồng"),
      )
      await button("Đóng").last().click()
      await button("Tạo hồ sơ từ cụm").click()
      await button("Xác nhận tạo hồ sơ").click()
      let current = (await cases()).find((c) => c.id === "HS-003")
      assert.equal(current.reportIds.length, 4)
      await page
        .getByLabel("Cán bộ phụ trách", { exact: true })
        .selectOption("Lê Minh Anh")
      await page
        .getByLabel("Trạng thái", { exact: true })
        .selectOption("Đang xác minh")
      await page
        .getByLabel("Nhận định cán bộ", { exact: true })
        .fill("Đã kiểm tra 4 phản ánh; tiếp tục xác minh đầu mối giả lập.")
      await button("Lưu thay đổi").click()
      await button("Xem báo cáo").click()
      let text = await page.getByRole("dialog").innerText()
      assert(text.includes("60 triệu đồng"))
      assert(text.includes("PA-013"))
      assert(text.includes("Lê Minh Anh"))
      await snap("09-report")
      await page.pdf({
        path: `${out}/${width}-HS-003.pdf`,
        format: "A4",
        printBackground: true,
      })
      await button("Đóng").last().click()
      await page.reload({ waitUntil: "networkidle" })
      assert((await page.locator("body").innerText()).includes("HS-003"))
      assert.equal(
        (await cases()).find((c) => c.id === "HS-003").officer,
        "Lê Minh Anh",
      )
      await nav("Hồ sơ vụ việc")
      await snap("04-cases")
      await page.locator("tbody tr").filter({ hasText: "HS-002" }).click()
      await button("Xem báo cáo").click()
      text = await page.getByRole("dialog").innerText()
      assert(text.includes("30 triệu đồng"))
      assert(text.includes("PA-008"))
      assert(!text.includes("CUM-001"))
      assert(!text.includes("DEMO-TK-001"))
      await button("Đóng").last().click()
      await nav("Tổng quan")
      await page.locator(".cluster-item").filter({ hasText: "CUM-002" }).click()
      text = await page.locator(".cluster-summary").innerText()
      assert(text.includes("25 triệu"))
      assert.equal((await cluster("CUM-002")).length, 3)
      assert.equal(
        (await reports()).find((r) => r.id === "PA-008").cluster,
        undefined,
      )
      await page
        .getByRole("combobox", { name: "Chuyển vai trò demo" })
        .selectOption("Quản trị hệ thống")
      await snap("05-accounts")
      await page
        .locator("tbody tr")
        .filter({ hasText: "tiep.nhan.demo" })
        .getByRole("button")
        .click()
      await page
        .getByRole("dialog")
        .getByLabel("Vai trò", { exact: true })
        .selectOption("Cán bộ phân tích")
      await button("Lưu thay đổi").click()
      assert(
        (
          await page
            .locator("tbody tr")
            .filter({ hasText: "tiep.nhan.demo" })
            .innerText()
        ).includes("Cán bộ phân tích"),
      )
      await page.reload({ waitUntil: "networkidle" })
      assert(
        (
          await page
            .locator("tbody tr")
            .filter({ hasText: "tiep.nhan.demo" })
            .innerText()
        ).includes("Cán bộ phân tích"),
      )
      await nav("Nhật ký hệ thống")
      await snap("06-logs")
      await page.getByPlaceholder("Tìm tài khoản, đối tượng...").fill("PA-013")
      assert(
        (await page.locator("tbody").innerText()).includes("Xác nhận liên kết"),
      )
      const audit = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("scamgraph-demo-logs")),
      )
      assert(
        audit.some(
          (l) =>
            l.action === "Kiểm tra thông tin trích xuất" &&
            l.detail.includes("DEMO-SDT-001") &&
            l.detail.includes("DEMO-SDT-013") &&
            l.user === "phan.tich.demo",
        ),
      )
      assert(
        audit.some(
          (l) =>
            l.action === "Sửa quyền" &&
            l.detail.includes("Trước: Cán bộ tiếp nhận") &&
            l.detail.includes("Sau: Cán bộ phân tích"),
        ),
      )
      await page
        .getByRole("combobox", { name: "Chuyển vai trò demo" })
        .selectOption("Người dân / Tổ chức")
      assert.equal(await page.locator("nav button:visible").count(), 0)
      await page.reload({ waitUntil: "networkidle" })
      assert.equal(await page.locator("nav button:visible").count(), 0)
      page.once("dialog", (d) => d.dismiss())
      await button("Đặt lại demo").click()
      assert.equal((await reports()).length, 13)
      page.once("dialog", (d) => d.accept())
      await button("Đặt lại demo").click()
      assert.equal((await reports()).length, 12)
      assert.equal((await cases()).length, 2)
      assert.equal(
        (await cluster("CUM-001")).reduce((s, r) => s + r.amount, 0),
        45,
      )
      await snap("02-citizen-portal")
      await button("Dùng tình huống mẫu").click()
      await button("Tiếp tục").click()
      await page.reload({ waitUntil: "networkidle" })
      assert.equal(
        await page.getByLabel("Tiêu đề", { exact: true }).inputValue(),
        "Yêu cầu xác minh tài khoản qua website đáng ngờ",
      )
      await snap("02-citizen-details")
      assert.equal(errors.length, 0, errors.join("\n"))
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "initial-12-and-45",
          "search-and-filter",
          "create-13-before-link",
          "edit-and-review-extraction",
          "reject-restore-proposal",
          "confirm-4-and-60",
          "case-4-reports",
          "assign-status-note",
          "case-specific-report",
          "wizard-reload-persistence",
          "reload-persistence",
          "CUM-002-25",
          "HS-002-independent-30",
          "account-role-persistence",
          "audit-before-after",
          "logs",
          "citizen-isolation",
          "reset-cancel-and-confirm",
          "no-page-overflow",
          "no-browser-errors",
        ],
      })
      await context.close()
    }
    console.log(JSON.stringify(results, null, 2))
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2))
    if (fs.existsSync(`${out}/failure.png`)) fs.unlinkSync(`${out}/failure.png`)
  } catch (e) {
    if (activePage)
      await activePage.screenshot({
        path: `${out}/failure.png`,
        fullPage: true,
      })
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
