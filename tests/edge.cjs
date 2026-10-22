const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict")
const fs = require("node:fs")
;(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const out = process.env.TEST_OUTPUT || "/tmp/scamgraph-results"
  fs.mkdirSync(out, { recursive: true })
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      timezoneId: "Asia/Ho_Chi_Minh",
    })
    page.setDefaultTimeout(10000)
    const errors = [],
      external = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("request", (r) => {
      if (
        !r
          .url()
          .startsWith(
            new URL(process.env.DEMO_URL || "http://127.0.0.1:8443/").origin,
          ) &&
        /^https?:/.test(r.url())
      )
        external.push(r.url())
    })
    const btn = (name) => page.getByRole("button", { name, exact: true })
    const nav = (name) =>
      page.locator("nav button").filter({ hasText: name }).click()
    const role = (value) =>
      page
        .getByLabel("Chuyển vai trò demo", { exact: true })
        .selectOption(value)
    await page.goto(process.env.DEMO_URL || "http://127.0.0.1:8443/", {
      waitUntil: "networkidle",
    })
    await btn("▦ Quét mã QR · mô phỏng").click()
    assert(
      (await page.getByRole("dialog").innerText()).includes(
        "không kết nối VNeID",
      ),
    )
    await page.keyboard.press("Escape")
    assert.equal(await page.getByRole("dialog").count(), 0)
    await btn("Đăng nhập demo →").click()
    await nav("Phản ánh")
    await btn("Tiếp nhận phản ánh").click()
    await btn("Tiếp tục").click()
    await btn("Tiếp tục").click()
    assert(
      (await page.locator(".intake-error-summary").innerText()).includes(
        "tiêu đề",
      ),
    )
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("scamgraph-demo-reports")).length,
      ),
      12,
    )
    await btn("Dùng tình huống mẫu").click()
    await page.getByLabel("Số tiền đã chuyển", { exact: true }).fill("-1")
    await btn("Tiếp tục").click()
    assert(
      (await page.locator(".intake-error-summary").innerText()).includes(
        "lớn hơn 0",
      ),
    )
    page.once("dialog", (d) => d.accept())
    await btn("Dùng tình huống mẫu").click()
    await btn("Tiếp tục").click()
    await btn("Tiếp tục").click()
    await btn("Lưu phản ánh").click()
    await btn("Mở chi tiết PA-013").click()
    await btn("Trích xuất thông tin").click()
    await page
      .getByLabel("Tài khoản ngân hàng", { exact: true })
      .fill("DEMO-TK-RIENG")
    await page
      .getByLabel("Số điện thoại", { exact: true })
      .fill("DEMO-SDT-RIENG")
    await page.getByLabel("Website", { exact: true }).fill("doclap.example")
    await btn("Lưu thông tin đã kiểm tra").click()
    assert.equal(await page.locator(".candidate").count(), 0)
    await page
      .getByLabel("Tài khoản ngân hàng", { exact: true })
      .fill("DEMO-TK-001")
    await btn("Lưu thông tin đã kiểm tra").click()
    await btn("Xác nhận liên kết CUM-001").click()
    await page
      .getByLabel("Tài khoản ngân hàng", { exact: true })
      .fill("DEMO-TK-RIENG")
    await btn("Lưu thông tin đã kiểm tra").click()
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("scamgraph-demo-reports")).filter(
            (r) => r.cluster === "CUM-001",
          ).length,
      ),
      3,
    )
    await nav("Phản ánh")
    await btn("Tiếp nhận phản ánh").click()
    assert(
      (await page.locator(".intake-sample").innerText()).includes(
        "Tình huống mẫu đã được tạo",
      ),
    )
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("scamgraph-demo-reports")).length,
      ),
      13,
    )
    await role("Lãnh đạo theo dõi")
    await nav("Hồ sơ vụ việc")
    await page.locator("tbody tr").filter({ hasText: "HS-002" }).click()
    await page
      .getByLabel("Nhận định cán bộ", { exact: true })
      .fill("Không được ghi nhận")
    await btn("Lưu thay đổi").click()
    assert.notEqual(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("scamgraph-demo-cases")).find(
            (c) => c.id === "HS-002",
          ).note,
      ),
      "Không được ghi nhận",
    )
    await role("Cán bộ phân tích")
    await nav("Hồ sơ vụ việc")
    await page.getByPlaceholder("Tìm mã hoặc tên hồ sơ...").fill("HS-002")
    assert.equal(await page.locator("tbody tr").count(), 1)
    await page.getByPlaceholder("Tìm mã hoặc tên hồ sơ...").fill("")
    await page.locator(".case-filter select").selectOption("Chờ bổ sung")
    assert.equal(await page.locator("tbody tr").count(), 1)
    await page.locator(".case-filter select").selectOption("Tất cả trạng thái")
    await btn("＋ Tạo hồ sơ phân tích").click()
    await page
      .getByLabel("Chọn cụm nguồn", { exact: true })
      .selectOption("CUM-002")
    assert(
      (await page.getByRole("dialog").innerText()).includes("25 triệu đồng"),
    )
    await btn("Xác nhận tạo hồ sơ").click()
    const c = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("scamgraph-demo-cases")).find(
        (c) => c.id === "HS-003",
      ),
    )
    assert.deepEqual(c.reportIds, ["PA-004", "PA-005", "PA-006"])
    for (const tab of [
      "Phản ánh liên quan",
      "Thực thể",
      "Tài liệu",
      "Lịch sử xử lý",
      "Tổng quan",
    ])
      await page
        .locator(".tabs")
        .getByRole("button", { name: tab, exact: true })
        .click()
    await page
      .locator(".operations-tabs")
      .getByRole("button", { name: "Danh sách hồ sơ", exact: true })
      .click()
    await page
      .locator(".operations-tabs")
      .getByRole("button", { name: "Chi tiết hồ sơ đang mở", exact: true })
      .click()
    assert((await page.locator(".case-hero").innerText()).includes("HS-003"))
    await btn("Xem báo cáo").click()
    assert(
      (await page.getByRole("dialog").innerText()).includes("25 triệu đồng"),
    )
    await page.keyboard.press("Escape")
    await nav("Cảnh báo")
    await page.locator(".alert-list-head select").selectOption("Thấp")
    assert.equal(await page.locator(".alert-row").count(), 1)
    assert((await page.locator(".alert-side").innerText()).includes("30 triệu"))
    await nav("Tổng quan")
    await page.locator(".cluster-item").filter({ hasText: "CUM-002" }).click()
    await page
      .getByLabel("Loại thực thể", { exact: true })
      .selectOption("phone")
    assert.equal(await page.locator(".map-report").count(), 0)
    await page
      .getByRole("button", { name: "Điện thoại DEMO-SDT-002", exact: true })
      .click()
    assert(
      (await page.locator(".explorer-details").innerText()).includes("PA-004"),
    )
    await page.locator(".source-evidence").first().click()
    assert((await page.locator(".detail-code").innerText()).includes("PA-004"))
    await role("Quản trị hệ thống")
    await page
      .getByLabel("Tìm tài khoản", { exact: true })
      .fill("cong.dan.demo")
    assert.equal(await page.locator("tbody tr").count(), 1)
    assert(
      (await page.locator("tbody").innerText()).includes("Người dân / Tổ chức"),
    )
    assert.equal(external.length, 0, external.join("\n"))
    assert.equal(errors.length, 0, errors.join("\n"))
    const result = {
      result: "PASS",
      checks: [
        "QR-simulation-and-Escape",
        "required-fields",
        "negative-amount",
        "duplicate-submit-disabled",
        "unmatched-entities-stay-independent",
        "edited-entity-removes-stale-link",
        "read-only-role-denied",
        "case-search-filter",
        "CUM-002-case-source",
        "all-case-tabs",
        "operations-tabs-exact-case",
        "CUM-002-report-25",
        "alert-level-filter",
        "graph-filter-and-source-navigation",
        "account-search-citizen-separated",
        "no-external-API-requests",
        "no-browser-errors",
      ],
    }
    fs.writeFileSync(
      `${out}/edge-results.json`,
      JSON.stringify(result, null, 2),
    )
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
