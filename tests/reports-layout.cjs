const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/reports-layout-review"
const url = process.env.DEMO_URL || "http://127.0.0.1:8444/"
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const results = []
  try {
    for (const [width, height] of [
      [1280, 720],
      [1440, 900],
    ])
      for (const theme of ["dark", "light"]) {
        const context = await browser.newContext({
          viewport: { width, height },
          reducedMotion: "reduce",
        })
        const page = await context.newPage(),
          errors = []
        page.on("pageerror", (e) => errors.push(e.message))
        page.setDefaultTimeout(10000)
        const btn = (n) => page.getByRole("button", { name: n, exact: true })
        const tab = (n) => page.getByRole("tab", { name: n, exact: true })
        const label = (n) => page.getByLabel(n, { exact: true })
        const business = () =>
          page.evaluate(() =>
            Object.fromEntries(
              ["reports", "cases", "accounts", "logs"].map((k) => [
                k,
                localStorage.getItem("scamgraph-demo-" + k),
              ]),
            ),
          )
        const snap = async (name) => {
          await page.evaluate(() => window.scrollTo(0, 0))
          await page.waitForTimeout(350)
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `viewport overflow ${name}`,
          )
          await page.screenshot({
            path: `${out}/${width}-${theme}-${name}.png`,
            fullPage: name.includes("detail"),
          })
        }
        const account = async (id) => {
          await page.locator(".account-tools summary").click()
          await label("Chuyển tài khoản thử nghiệm").selectOption(id)
        }
        const open = async (id) => {
          await label("Phạm vi công việc").selectOption("all")
          await page.getByPlaceholder("Tìm theo mã hoặc tiêu đề...").fill(id)
          await page.locator("tbody tr").first().click()
          assert.equal(
            await tab("Thông tin phản ánh").getAttribute("aria-selected"),
            "true",
          )
        }
        await page.goto(url)
        await btn("Tài khoản Cán bộ").click()
        await btn("Đăng nhập").click()
        await page.evaluate(
          (t) => localStorage.setItem("scamgraph-appearance", t),
          theme,
        )
        await page.reload()
        await label("Phạm vi công việc").selectOption("all")
        await page.waitForTimeout(350)
        const baseline = await business()
        const firstRow = await page.locator("tbody tr").first().boundingBox()
        assert(
          firstRow.y < height - 100,
          `first row below viewport: ${firstRow.y}`,
        )
        assert.equal(await page.locator("thead th").count(), 7)
        await snap("list-after")
        assert.equal(
          await page.locator("#report-advanced-filters").isVisible(),
          false,
        )
        await btn("Bộ lọc nâng cao").click()
        await label("Loại phản ánh").selectOption({
          label: "Giả danh ngân hàng",
        })
        await label("Nguồn tiếp nhận").selectOption("Cổng trực tuyến")
        await label("Địa bàn phản ánh").selectOption("Hà Nội")
        const seed = JSON.parse(baseline.reports).find((r) => r.id === "PA-001")
        const date = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(seed.receivedAt))
        await label("Tiếp nhận từ ngày").fill(date)
        await label("Đến ngày").fill(date)
        await label("Trạng thái").selectOption(seed.analysisStatus)
        await page
          .getByPlaceholder("Tìm theo mã hoặc tiêu đề...")
          .fill("tran thi mai")
        assert.equal(await page.locator("tbody tr").count(), 1)
        assert((await page.locator("tbody tr").innerText()).includes("PA-001"))
        await btn("Bộ lọc nâng cao (5)").click()
        assert.equal(
          await page.locator("#report-advanced-filters").isVisible(),
          false,
        )
        assert.equal(await page.locator("tbody tr").count(), 1)
        await btn("Bộ lọc nâng cao (5)").click()
        assert.equal(
          await label("Nguồn tiếp nhận").inputValue(),
          "Cổng trực tuyến",
        )
        await btn("Xóa bộ lọc").click()
        assert.equal(await label("Phạm vi công việc").inputValue(), "all")
        assert.equal(
          await label("Trạng thái").inputValue(),
          "Tất cả trạng thái",
        )
        assert.equal(await label("Nguồn tiếp nhận").inputValue(), "")
        assert.equal(await label("Tiếp nhận từ ngày").inputValue(), "")
        assert.equal(await page.locator("tbody tr").count(), 12)
        await btn("Bộ lọc nâng cao").click()
        await page
          .getByRole("button", { name: "Đang phân tích (6)", exact: true })
          .click()
        assert.equal(await label("Trạng thái").inputValue(), "Đang phân tích")
        assert.equal(await page.locator("tbody tr").count(), 6)
        await btn("Xóa bộ lọc").click()
        await page
          .locator("tbody tr")
          .first()
          .getByRole("button", { name: "Kiểm tra phản ánh", exact: true })
          .click()
        assert.equal(
          await tab("Xử lý nghiệp vụ").getAttribute("aria-selected"),
          "true",
          "Direct processing action opened the wrong tab",
        )
        assert.deepEqual(await business(), baseline)
        await btn("← Quay lại danh sách phản ánh").click()
        await label("Phạm vi công việc").selectOption("all")
        await page
          .getByRole("button", { name: /^Xem người gửi PA-001:/ })
          .click()
        await snap("detail-after")
        assert.equal(
          await tab("Thông tin phản ánh").getAttribute("aria-selected"),
          "true",
        )
        await tab("Thông tin phản ánh").focus()
        await page.keyboard.press("ArrowRight")
        assert.equal(
          await tab("Xử lý nghiệp vụ").getAttribute("aria-selected"),
          "true",
        )
        assert.equal(
          await tab("Xử lý nghiệp vụ").evaluate(
            (e) => e === document.activeElement,
          ),
          true,
        )
        await page.keyboard.press("End")
        assert.equal(await tab("Lịch sử").getAttribute("aria-selected"), "true")
        await tab("Thông tin phản ánh").click()
        assert.deepEqual(
          await business(),
          baseline,
          "view/filter/tab operations changed business data or created logs",
        )
        await tab("Xử lý nghiệp vụ").click()
        const note = label("Nhận định phân tích")
        await note.fill("Bản nháp phân tích chưa lưu qua các tab")
        await note.evaluate((el) => (el.dataset.mountMarker = "kept"))
        const unsavedBaseline = await business()
        await tab("Lịch sử").click()
        await tab("Thông tin phản ánh").click()
        await tab("Xử lý nghiệp vụ").click()
        assert.equal(
          await note.inputValue(),
          "Bản nháp phân tích chưa lưu qua các tab",
        )
        assert.equal(await note.getAttribute("data-mount-marker"), "kept")
        assert.deepEqual(
          await business(),
          unsavedBaseline,
          "tab switch auto-saved an unsaved draft",
        )
        page.once("dialog", (d) => d.dismiss())
        await account("tiep.nhan.demo")
        assert.equal(
          await note.inputValue(),
          "Bản nháp phân tích chưa lưu qua các tab",
        )
        let unloadPrompt = false
        page.once("dialog", async (dialog) => {
          assert.equal(dialog.type(), "beforeunload")
          unloadPrompt = true
          await dialog.dismiss()
        })
        // Chromium may leave a canceled reload pending rather than reject it.
        await page.reload({ timeout: 1500 }).catch((error) => {
          if (!/ERR_ABORTED|Timeout/.test(String(error))) throw error
        })
        assert(unloadPrompt, "Reload did not warn about an unsaved draft")
        assert.equal(
          await note.inputValue(),
          "Bản nháp phân tích chưa lưu qua các tab",
        )
        // Explicit navigation confirmation discards only unsaved changes; saved data stays.
        page.once("dialog", (d) => d.accept())
        await btn("← Quay lại danh sách phản ánh").click()
        await open("PA-001")
        await tab("Xử lý nghiệp vụ").click()
        assert.equal(await note.inputValue(), seed.analysisNote || "")
        await snap("processing-detail-after")
        // Privacy: reveal is the sole intentional log entry here; tab changes re-mask.
        await btn("Hiện Số điện thoại trích xuất").click()
        assert.equal(await label("Số điện thoại").inputValue(), seed.phone)
        const revealed = await business()
        assert.equal(
          JSON.parse(revealed.logs).length,
          JSON.parse(unsavedBaseline.logs).length + 1,
        )
        await tab("Thông tin phản ánh").click()
        await tab("Xử lý nghiệp vụ").click()
        assert.notEqual(await label("Số điện thoại").inputValue(), seed.phone)
        assert.deepEqual(await business(), revealed)
        // A reception draft also survives hidden panels and cancels account switching.
        await account("tiep.nhan.demo")
        await open("PA-009")
        await tab("Xử lý nghiệp vụ").click()
        await label("Ghi chú tiếp nhận / Lý do").fill(
          "Nội dung tiếp nhận chưa lưu",
        )
        await tab("Thông tin phản ánh").click()
        await tab("Lịch sử").click()
        await tab("Xử lý nghiệp vụ").click()
        assert.equal(
          await label("Ghi chú tiếp nhận / Lý do").inputValue(),
          "Nội dung tiếp nhận chưa lưu",
        )
        page.once("dialog", (d) => d.dismiss())
        await account("giam.sat.demo")
        assert.equal(
          await label("Ghi chú tiếp nhận / Lý do").inputValue(),
          "Nội dung tiếp nhận chưa lưu",
        )
        page.once("dialog", (d) => d.accept())
        await account("giam.sat.demo")
        await page.locator("nav button").filter({ hasText: "Phản ánh" }).click()
        await open("PA-001")
        await tab("Xử lý nghiệp vụ").click()
        assert.equal(await label("Ngân hàng").getAttribute("readonly"), "")
        assert.equal(await btn("Lưu thông tin đã kiểm tra").count(), 0)
        await tab("Lịch sử").click()
        assert((await page.locator(".report-audit-list li").count()) >= 1)
        const allowed = JSON.parse((await business()).logs).filter(
          (l) =>
            l.target === "PA-001" &&
            (l.unitId || "Đơn vị nghiệp vụ A") === "Đơn vị nghiệp vụ A",
        )
        assert.equal(
          await page.locator(".report-audit-list li").count(),
          allowed.length,
        )
        await snap("history-detail-after")
        assert.deepEqual(errors, [])
        results.push({
          width,
          height,
          theme,
          result: "PASS",
          firstRowY: Math.round(firstRow.y),
          checks: [
            "combined filters and advanced badge",
            "closed filters retain values",
            "clear preserves work scope",
            "all seven columns and correct sender detail",
            "default information tab, direct processing route and keyboard navigation",
            "view-only localStorage byte-identical",
            "analysis and reception drafts stay mounted",
            "cancel navigation/reload/account change preserves drafts",
            "explicit reveal logs once; tabs re-mask without logs",
            "supervisor readonly and report-scoped existing history",
          ],
        })
        await context.close()
      }
    fs.writeFileSync(
      `${out}/layout-results.json`,
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
