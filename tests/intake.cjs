const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict"),
  fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "/tmp/intake-results"
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const results = []
  try {
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        timezoneId: "Asia/Ho_Chi_Minh",
      })
      const page = await context.newPage()
      page.setDefaultTimeout(12000)
      const errors = []
      page.on("pageerror", (e) => errors.push(e.message))
      const button = (name) => page.getByRole("button", { name, exact: true })
      const label = (name) => page.getByLabel(name, { exact: true })
      const reports = () =>
        page.evaluate(() =>
          JSON.parse(localStorage.getItem("scamgraph-demo-reports")),
        )
      const snap = async (name) => {
        await page.evaluate(() => scrollTo(0, 0))
        await page.screenshot({ path: `${out}/${width}-${name}.png` })
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
      }
      const fillManual = async (
        type,
        title,
        { other = "", transfer = "Không" } = {},
      ) => {
        await button("Tiếp tục").click()
        await label("Loại phản ánh").selectOption(type)
        if (other) await label("Mô tả loại phản ánh").fill(other)
        await label("Tiêu đề").fill(title)
        await label("Nội dung sự việc").fill(
          "Nội dung giả lập: phát hiện dấu hiệu đáng ngờ, cần cán bộ xác minh thêm.",
        )
        await page
          .getByRole("checkbox", {
            name: "Không nhớ chính xác thời gian",
            exact: true,
          })
          .check()
        await label("Địa bàn liên quan").selectOption("Chưa xác định")
        await label("Có phát sinh chuyển tiền không?").selectOption(transfer)
      }
      const submit = async () => {
        await button("Tiếp tục").click()
        await button("Tiếp tục").click()
        await button("Gửi phản ánh").click()
        return (await reports())[0]
      }
      await page.goto(process.env.DEMO_URL || "http://127.0.0.1:8444/", {
        waitUntil: "networkidle",
      })
      await page.getByRole("button", {name:"Tài khoản Cán bộ",exact:true}).click()
      await page.getByLabel("Vai trò demo", {exact:true}).selectOption({label:"Người dân / Tổ chức"})
      await button("Đăng nhập").click()
      assert.equal(
        await page.locator(".report-intake h1").innerText(),
        "Gửi phản ánh",
      )
      await snap("citizen-sender")
      await button("Tiếp tục").click()
      assert.equal(await label("Loại phản ánh").inputValue(), "")
      await button("Tiếp tục").click()
      assert(
        (await page.getByRole("alert").innerText()).includes(
          "Chọn loại phản ánh",
        ),
      )
      assert.equal(await label("Số tiền đã chuyển").count(), 0)
      // Returning to sender preserves data; changing the category only changes the hint.
      await label("Loại phản ánh").selectOption("Lừa đảo đầu tư trực tuyến")
      await label("Tiêu đề").fill("Phát hiện lời mời đầu tư đáng ngờ")
      const content = "Nội dung tôi tự nhập, không được ghi đè khi đổi loại."
      await label("Nội dung sự việc").fill(content)
      await label("Loại phản ánh").selectOption("Chưa xác định")
      assert.equal(await label("Nội dung sự việc").inputValue(), content)
      await label("Loại phản ánh").selectOption("Lừa đảo đầu tư trực tuyến")
      await page
        .getByRole("checkbox", {
          name: "Không nhớ chính xác thời gian",
          exact: true,
        })
        .check()
      await label("Địa bàn liên quan").selectOption("Chưa xác định")
      await label("Có phát sinh chuyển tiền không?").selectOption("Không")
      await button("Quay lại").click()
      await button("Tiếp tục").click()
      assert.equal(await label("Nội dung sự việc").inputValue(), content)
      await page.reload({ waitUntil: "networkidle" })
      assert.equal(await label("Nội dung sự việc").inputValue(), content)
      assert.equal(await label("Kênh tiếp nhận").count(), 0)
      const font = await label("Nội dung sự việc").evaluate(
        (e) => getComputedStyle(e).fontSize,
      )
      assert.equal(font, "15px")
      assert.equal(
        await page
          .locator(".report-intake h1")
          .evaluate((e) => getComputedStyle(e).fontSize),
        "30px",
      )
      assert.equal(await page.locator(".intake-demo:visible").count(), 0)
      assert.equal(await page.locator(".demo-label:visible").count(), 1)
      await label("Tên / danh xưng bên bị phản ánh").fill("Người tự xưng Quang (mẫu)")
      await label("Tài khoản mạng xã hội").fill("tai-khoan-mau-khong-co-that")
      await snap("citizen-incident")
      await button("Tiếp tục").scrollIntoViewIfNeeded()
      const action = await button("Tiếp tục").boundingBox()
      assert(
        await page.evaluate(
          ({ x, y }) =>
            Boolean(document.elementFromPoint(x, y)?.closest("button")),
          { x: action.x + action.width / 2, y: action.y + action.height / 2 },
        ),
      )
      await page.screenshot({ path: `${out}/${width}-citizen-actions.png` })
      // Template overwrite must be explicitly accepted.
      page.once("dialog", (d) => d.dismiss())
      await button("Dùng tình huống mẫu").click()
      assert.equal(await label("Nội dung sự việc").inputValue(), content)
      let created = await submit()
      assert.equal(created.id, "PA-014")
      assert.equal(created.amount, 0)
      assert.equal(created.source, "Cổng trực tuyến")
      assert.equal(created.behavior, "Lừa đảo đầu tư trực tuyến")
      assert(!created.occurredAt)
      assert(!created.account)
      assert(!created.cluster)
      assert.equal(created.socialAccount, "tai-khoan-mau-khong-co-that")
      assert.equal(created.people.subjectName, "Người tự xưng Quang (mẫu)")
      await snap("success-manual")
      await button("Mở chi tiết PA-014").click()
      assert.equal(await button("Trích xuất thông tin").count(), 0)
      await button("← Xem danh sách phản ánh").click()
      assert.equal(await page.locator("tbody tr").count(), 1)
      await button("Gửi phản ánh").click()
      await button("Dùng tình huống mẫu").click()
      await button("Tiếp tục").click()
      assert.equal(await label("Số tiền đã chuyển").inputValue(), "15.000.000")
      assert.equal(
        await label("Loại phản ánh").inputValue(),
        "Giả danh ngân hàng",
      )
      await button("Tiếp tục").click()
      assert.equal(await page.locator(".citizen-guide,.form-side").count(), 0)
      await button("Dùng ảnh chuyển khoản mẫu").click()
      await snap("documents")
      await button("Tiếp tục").click()
      await snap("review-sample")
      // Two synchronous clicks cannot write duplicate PA-013.
      await button("Gửi phản ánh").evaluate((e) => {
        e.click()
        e.click()
      })
      assert.equal((await reports()).filter((r) => r.id === "PA-013").length, 1)
      assert.equal((await reports()).find((r) => r.id === "PA-013").amount, 15)
      await button("Gửi phản ánh khác").click()
      assert(
        (await page.locator(".intake-sample").innerText()).includes(
          "Tình huống mẫu đã được tạo",
        ),
      )
      assert.equal(await button("Dùng tình huống mẫu").count(), 0)
      await button("Mở PA-013").click()
      assert(
        (await page.locator(".report-intake").innerText()).includes("PA-013"),
      )
      await button("← Xem danh sách phản ánh").click()
      await button("Gửi phản ánh").click()
      await fillManual("Khác", "Phản ánh loại khác")
      await button("Tiếp tục").click()
      assert((await page.getByRole("alert").innerText()).includes("mô tả ngắn"))
      await label("Mô tả loại phản ánh").fill("Dấu hiệu giả mạo dịch vụ mới")
      created = await submit()
      assert.equal(created.id, "PA-015")
      assert.equal(created.behaviorOther, "Dấu hiệu giả mạo dịch vụ mới")
      await button("Gửi phản ánh khác").click()
      await fillManual("Chưa xác định", "Sự việc chưa đủ căn cứ phân loại", {
        transfer: "Chưa rõ",
      })
      created = await submit()
      assert.equal(created.id, "PA-016")
      assert.equal(created.behavior, "Chưa xác định")
      assert.equal(created.amount, 0)
      await button("Gửi phản ánh khác").click()
      await fillManual(
        "Lừa đảo mua bán trực tuyến",
        "Kiểm tra lỗi lưu localStorage",
      )
      await button("Tiếp tục").click()
      await button("Tiếp tục").click()
      // Simulate quota/policy failure after the report write, before the journal write.
      await page.evaluate(() => {
        window.__originalSet = Storage.prototype.setItem
        Storage.prototype.setItem = function (k, v) {
          if (k === "scamgraph-demo-logs")
            throw new DOMException("Quota", "QuotaExceededError")
          return window.__originalSet.call(this, k, v)
        }
      })
      const before = (await reports()).length
      await button("Gửi phản ánh").click()
      assert.equal((await reports()).length, before)
      assert.equal(await page.locator(".intake-success").count(), 0)
      assert(
        (await page.getByRole("alert").innerText()).includes("Chưa lưu được"),
      )
      await snap("storage-failure")
      await page.evaluate(() => {
        Storage.prototype.setItem = window.__originalSet
      })
      await button("Gửi phản ánh").click()
      assert.equal((await reports()).length, before + 1)
      assert.equal((await reports())[0].id, "PA-017")
      await page
        .getByLabel("Chuyển vai trò demo", { exact: true })
        .selectOption("Cán bộ tiếp nhận")
      await page.locator("nav button").filter({ hasText: "Phản ánh" }).click()
      await button("Tiếp nhận phản ánh").click()
      assert.equal(
        await page.locator(".report-intake h1").innerText(),
        "Tiếp nhận phản ánh",
      )
      assert.equal(await page.locator("nav .nav-item.active").count(), 1)
      assert(
        (await page.locator("nav .nav-item.active").innerText()).includes(
          "Phản ánh",
        ),
      )
      await fillManual(
        "Giả danh cơ quan nhà nước",
        "Phiếu cán bộ tiếp nhận qua nguồn khác",
      )
      await label("Kênh tiếp nhận").selectOption("Nguồn khác")
      await button("Tiếp tục").click()
      assert(
        (await page.getByRole("alert").innerText()).includes("Mô tả nguồn"),
      )
      await label("Mô tả nguồn tiếp nhận").fill("Nguồn phối hợp mẫu")
      await snap("officer-incident")
      await button("Tiếp tục").click()
      await button("Tiếp tục").click()
      await button("Lưu phản ánh").click()
      created = (await reports())[0]
      assert.equal(created.id, "PA-018")
      assert.equal(created.sourceOther, "Nguồn phối hợp mẫu")
      await button("Mở chi tiết PA-018").click()
      await button("Trích xuất thông tin").click()
      await label("Loại phản ánh").selectOption("Khác")
      await label("Mô tả loại phản ánh").fill("Phân loại do cán bộ kiểm tra")
      await button("Lưu thông tin đã kiểm tra").click()
      assert.equal((await reports())[0].behavior, "Khác")
      assert.equal(
        (await reports())[0].initialBehavior,
        "Giả danh cơ quan nhà nước",
      )
      const audit = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("scamgraph-demo-logs")),
      )
      assert(
        audit.some(
          (l) =>
            l.action === "Điều chỉnh loại phản ánh" &&
            l.detail.includes("Trước: Giả danh cơ quan nhà nước") &&
            l.detail.includes("sau: Khác"),
        ),
      )
      await page.locator("nav button").filter({ hasText: "Phản ánh" }).click()
      await page.reload({ waitUntil: "networkidle" })
      await page.locator(".reports-filter select").nth(1).selectOption("Khác")
      assert.equal(await page.locator("tbody tr").count(), 2)
      await snap("type-filter-after-reload")
      await page
        .locator(".reports-filter select")
        .nth(1)
        .selectOption("Tất cả loại phản ánh")
      await page.getByPlaceholder("Tìm theo mã hoặc tiêu đề...").fill("PA-008")
      await page.locator("tbody tr").click()
      await label("Loại phản ánh").selectOption("Khác")
      await label("Mô tả loại phản ánh").fill("Phân loại khác trên hồ sơ mẫu")
      await button("Lưu thông tin đã kiểm tra").click()
      await page
        .locator("nav button")
        .filter({ hasText: "Hồ sơ vụ việc" })
        .click()
      await page.locator("tbody tr").filter({ hasText: "HS-002" }).click()
      await button("Xem báo cáo").click()
      assert(
        (await page.getByRole("dialog").innerText()).includes(
          "PA-008: Khác: Phân loại khác trên hồ sơ mẫu",
        ),
      )
      await page.keyboard.press("Escape")
      assert.equal(errors.length, 0, errors.join("\n"))
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "required-type-default-empty",
          "known-type-no-transfer",
          "unknown-event-time",
          "changing-type-preserves-content",
          "back-and-reload-draft",
          "single-demo-label",
          "font-sizes-100-percent",
          "confirm-template-overwrite-cancel",
          "PA013-reserved-and-sample-15",
          "double-submit-protected",
          "sample-exists-open-not-block-manual",
          "other-type-required-description",
          "unclassified-no-fake-bank-data",
          "localStorage-error-rollback-no-false-success",
          "multiple-unique-IDs-after-sample",
          "citizen-own-list-read-only-detail",
          "officer-title-save-source-other",
          "only-reports-nav-active",
          "classification-audit-before-after",
          "type-filter-after-reload",
          "legacy-classification-in-correct-case-report",
          "no-browser-errors",
        ],
      })
      await context.close()
    }
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2))
    console.log(JSON.stringify(results, null, 2))
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
