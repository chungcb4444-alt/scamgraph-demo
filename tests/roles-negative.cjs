const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/role-review"
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  try {
    const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
      }),
      errors = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.setDefaultTimeout(10000)
    const btn = (name) => page.getByRole("button", { name, exact: true }),
      label = (name) => page.getByLabel(name, { exact: true })
    const account = async (id) => {
      await page.locator(".account-tools summary").click()
      await label("Chuyển tài khoản thử nghiệm").selectOption(id)
      await page.waitForTimeout(200)
    }
    const read = (k) =>
      page.evaluate(
        (k) => JSON.parse(localStorage.getItem("scamgraph-demo-" + k)),
        k,
      )
    await page.goto(process.env.DEMO_URL || "http://127.0.0.1:8444/")
    await btn("Tài khoản Cán bộ").click()
    await btn("Đăng nhập").click()
    const original = await read("reports"),
      legacyCases = await read("cases")
    await page.evaluate(() => {
      const reports = JSON.parse(
          localStorage.getItem("scamgraph-demo-reports"),
        ),
        cases = JSON.parse(localStorage.getItem("scamgraph-demo-cases"))
      reports.push({
        ...reports[0],
        id: "PA-900",
        title: "NGOAI-PHAM-VI-DON-VI",
        unitId: "Đơn vị B",
        submittedBy: "nguoi.khac",
      })
      reports.push({
        ...reports[0],
        id: "PA-901",
        title: "NGUOI-DAN-KHAC",
        cluster: undefined,
        submittedBy: "nguoi.khac",
      })
      cases.push({
        ...cases[0],
        id: "HS-900",
        name: "HO-SO-DON-VI-KHAC",
        unitId: "Đơn vị B",
        assignedTo: "xu.ly.demo",
        reportIds: ["PA-900"],
      })
      localStorage.setItem("scamgraph-demo-reports", JSON.stringify(reports))
      localStorage.setItem("scamgraph-demo-cases", JSON.stringify(cases))
    })
    await page.reload()
    await label("Phạm vi công việc").selectOption("all")
    await page.getByPlaceholder("Tìm theo mã hoặc tiêu đề...").fill("PA-900")
    assert.equal(await page.locator("tbody tr").count(), 0)
    await page
      .locator("nav button")
      .filter({ hasText: "Phân tích liên kết" })
      .click()
    assert(!(await page.locator("main").innerText()).includes("NGOAI-PHAM-VI"))
    // Restoring an inaccessible object must not silently open another case.
    await page.evaluate(() => {
      localStorage.setItem(
        "scamgraph-demo-account",
        JSON.stringify("xu.ly.demo"),
      )
      localStorage.setItem(
        "scamgraph-demo-screen",
        JSON.stringify("case-detail"),
      )
      localStorage.setItem(
        "scamgraph-demo-selected-case",
        JSON.stringify("HS-002"),
      )
    })
    await page.reload()
    await page
      .getByText("Không có quyền truy cập đối tượng", { exact: true })
      .waitFor()
    assert.equal(await page.locator(".case-work").count(), 0)
    await page.evaluate(() =>
      localStorage.setItem(
        "scamgraph-demo-selected-case",
        JSON.stringify("HS-900"),
      ),
    )
    await page.reload()
    await page
      .getByText("Không có quyền truy cập đối tượng", { exact: true })
      .waitFor()
    await page.evaluate(() => {
      localStorage.setItem(
        "scamgraph-demo-account",
        JSON.stringify("quan.tri.demo"),
      )
      localStorage.setItem(
        "scamgraph-demo-screen",
        JSON.stringify("report-detail"),
      )
      localStorage.setItem(
        "scamgraph-demo-selected-report",
        JSON.stringify("PA-001"),
      )
    })
    await page.reload()
    await page
      .getByRole("heading", { name: "Tài khoản và phân quyền", exact: true })
      .waitFor()
    assert.equal(await page.locator(".report-people").count(), 0)
    await account("cong.dan.demo")
    assert.equal(await page.locator("tbody tr").count(), 0)
    await btn("Gửi phản ánh").click()
    await btn("Tiếp tục").click()
    await label("Tiêu đề").fill("Bản nháp riêng của người dân")
    // Cancel keeps account and entered values; accepting preserves namespaced intake draft.
    page.once("dialog", (d) => d.dismiss())
    await account("tiep.nhan.demo")
    assert.equal(await read("account"), "cong.dan.demo")
    assert.equal(
      await label("Tiêu đề").inputValue(),
      "Bản nháp riêng của người dân",
    )
    page.once("dialog", (d) => d.accept())
    await account("tiep.nhan.demo")
    await btn("Tiếp nhận phản ánh").click()
    await btn("Tiếp tục").click()
    assert.equal(await label("Tiêu đề").inputValue(), "")
    await account("cong.dan.demo")
    await btn("Gửi phản ánh").click()
    assert.equal(
      await label("Tiêu đề").inputValue(),
      "Bản nháp riêng của người dân",
    )
    // Simulate old storage without new ownership/status/assignment fields. No reset required.
    await page.evaluate(
      ({ reports, cases }) => {
        for (const r of reports) {
          delete r.unitId
          delete r.intakeStatus
          delete r.analysisStatus
          delete r.analysisAssignee
        }
        cases[0].officer = "Cán bộ cũ chưa định danh"
        delete cases[0].assignedTo
        delete cases[0].unitId
        localStorage.setItem("scamgraph-demo-reports", JSON.stringify(reports))
        localStorage.setItem("scamgraph-demo-cases", JSON.stringify(cases))
        localStorage.removeItem("scamgraph-demo-accounts")
        localStorage.setItem(
          "scamgraph-demo-account-roles",
          JSON.stringify({ "phan.tich.demo": "Lãnh đạo theo dõi" }),
        )
        localStorage.setItem(
          "scamgraph-demo-account",
          JSON.stringify("phan.tich.demo"),
        )
        localStorage.setItem(
          "scamgraph-demo-role",
          JSON.stringify("Cán bộ phân tích"),
        )
        localStorage.setItem(
          "scamgraph-demo-screen",
          JSON.stringify("new-report"),
        )
        localStorage.setItem(
          "scamgraph-demo-wizard-form",
          JSON.stringify({
            title: "Bản nháp cũ cần giữ",
            sender: "Người gửi cũ",
          }),
        )
        localStorage.setItem("scamgraph-demo-wizard-step", "2")
      },
      { reports: original, cases: legacyCases },
    )
    await page.reload()
    assert(
      (await page.locator(".role-context").innerText()).includes(
        "Lãnh đạo theo dõi",
      ),
    )
    const migrated = await read("reports")
    assert.equal(migrated.length, 12)
    assert.equal(
      migrated
        .filter((r) => r.cluster === "CUM-001")
        .reduce((n, r) => n + r.amount, 0),
      45,
    )
    const old = (await read("cases"))[0]
    assert.equal(old.officer, "Cán bộ cũ chưa định danh")
    assert.equal(old.assignedTo, undefined)
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("scamgraph-intake:phan.tich.demo:form"),
          ).title,
      ),
      "Bản nháp cũ cần giữ",
    )
    // A locked account cannot restore a working session, even with a stored route.
    await page.evaluate(() => {
      const accounts = JSON.parse(
        localStorage.getItem("scamgraph-demo-accounts"),
      )
      accounts.find((a) => a.id === "xu.ly.demo").active = false
      localStorage.setItem("scamgraph-demo-accounts", JSON.stringify(accounts))
      localStorage.setItem(
        "scamgraph-demo-account",
        JSON.stringify("xu.ly.demo"),
      )
      localStorage.setItem(
        "scamgraph-demo-screen",
        JSON.stringify("case-detail"),
      )
    })
    await page.reload()
    await page
      .getByRole("heading", { name: "Tài khoản không hoạt động", exact: true })
      .waitFor()
    assert.equal(await page.locator(".case-work").count(), 0)
    assert.equal(await page.locator("nav").count(), 0)
    // Storage transaction failure must not create a report or show false success.
    const second = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    })
    second.on("pageerror", (e) => errors.push(e.message))
    const b = (n) => second.getByRole("button", { name: n, exact: true })
    await second.goto(process.env.DEMO_URL || "http://127.0.0.1:8444/")
    await b("Tài khoản Cán bộ").click()
    await b("Đăng nhập").click()
    await second.locator(".account-tools summary").click()
    await second
      .getByLabel("Chuyển tài khoản thử nghiệm", { exact: true })
      .selectOption("tiep.nhan.demo")
    await b("Tiếp nhận phản ánh").click()
    await b("Dùng tình huống mẫu").click()
    await b("Tiếp tục").click()
    await second.getByLabel("Số tiền đã chuyển", { exact: true }).fill("-1")
    await b("Tiếp tục").click()
    assert(
      (await second.locator(".intake-error-summary").innerText()).includes(
        "lớn hơn 0",
      ),
    )
    await second
      .getByLabel("Số tiền đã chuyển", { exact: true })
      .fill("15000000")
    await b("Tiếp tục").click()
    await b("Tiếp tục").click()
    await second.evaluate(() => {
      window.savedSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = function (k, v) {
        if (k === "scamgraph-demo-logs")
          throw Error("Simulated storage failure")
        return window.savedSetItem.call(this, k, v)
      }
    })
    await b("Lưu phản ánh").click()
    await second
      .getByText(
        "Chưa lưu được phản ánh trên trình duyệt. Nội dung nhập được giữ để thử lại.",
        { exact: true },
      )
      .waitFor()
    assert.equal(
      await second.evaluate(
        () => JSON.parse(localStorage.getItem("scamgraph-demo-reports")).length,
      ),
      12,
    )
    assert.equal(
      await second
        .getByRole("heading", { name: "Đã lưu phản ánh", exact: true })
        .count(),
      0,
    )
    await second.evaluate(
      () => (Storage.prototype.setItem = window.savedSetItem),
    )
    await b("Lưu phản ánh").click()
    await b("Mở chi tiết PA-013").click()
    assert.equal(
      await second.evaluate(
        () => JSON.parse(localStorage.getItem("scamgraph-demo-reports")).length,
      ),
      13,
    )
    // Manual unclassified/no-transfer intake remains available and doesn't invent bank entities.
    await second
      .locator("nav button")
      .filter({ hasText: "Tạo phiếu tiếp nhận" })
      .click()
    await second
      .getByLabel("Họ và tên mẫu", { exact: true })
      .fill("Người gửi mới hư cấu")
    await b("Tiếp tục").click()
    await b("Tiếp tục").click()
    assert(
      (await second.locator(".intake-error-summary").innerText()).includes(
        "Chọn loại phản ánh",
      ),
    )
    await second
      .getByLabel("Loại phản ánh", { exact: true })
      .selectOption("Chưa xác định")
    await second
      .getByLabel("Tiêu đề", { exact: true })
      .fill("Phản ánh nhập tay không có chuyển tiền")
    await second
      .getByLabel("Nội dung sự việc", { exact: true })
      .fill("Tôi nhận lời mời đáng ngờ, chưa chuyển tiền và cần hướng dẫn.")
    await second
      .getByRole("checkbox", {
        name: "Không nhớ chính xác thời gian",
        exact: true,
      })
      .check()
    await second
      .getByLabel("Địa bàn liên quan", { exact: true })
      .selectOption("Chưa xác định")
    await second
      .getByLabel("Có phát sinh chuyển tiền không?", { exact: true })
      .selectOption("Không")
    await second
      .getByLabel("Kênh tiếp nhận", { exact: true })
      .selectOption("Tiếp nhận trực tiếp")
    await second
      .getByLabel("Tên / danh xưng bên bị phản ánh", { exact: true })
      .fill("Tên tự xưng chưa xác minh")
    await b("Tiếp tục").click()
    await b("Tiếp tục").click()
    await b("Lưu phản ánh").click()
    await b("Mở chi tiết PA-014").click()
    const manualReport = await second.evaluate(() =>
      JSON.parse(localStorage.getItem("scamgraph-demo-reports")).find(
        (r) => r.id === "PA-014",
      ),
    )
    assert.equal(manualReport.amount, 0)
    assert.equal(manualReport.account, undefined)
    assert.equal(manualReport.cluster, undefined)
    assert.equal(manualReport.people.subjectName, "Tên tự xưng chưa xác minh")
    assert.equal(await b("Đặt lại dữ liệu thử nghiệm").count(), 0)
    await second.locator(".account-tools summary").click()
    await second
      .getByLabel("Chuyển tài khoản thử nghiệm", { exact: true })
      .selectOption("quan.tri.demo")
    const auditBefore = await second.evaluate(() =>
      JSON.parse(localStorage.getItem("scamgraph-demo-logs")),
    )
    await second.locator(".account-tools summary").click()
    second.once("dialog", (d) => d.dismiss())
    await b("Đặt lại dữ liệu thử nghiệm").click()
    assert.equal(
      await second.evaluate(
        () => JSON.parse(localStorage.getItem("scamgraph-demo-reports")).length,
      ),
      14,
    )
    second.once("dialog", (d) => d.accept())
    await b("Đặt lại dữ liệu thử nghiệm").click()
    assert.equal(
      await second.evaluate(
        () => JSON.parse(localStorage.getItem("scamgraph-demo-reports")).length,
      ),
      12,
    )
    const auditAfter = await second.evaluate(() =>
      JSON.parse(localStorage.getItem("scamgraph-demo-logs")),
    )
    for (const old of auditBefore)
      assert(auditAfter.some((l) => JSON.stringify(l) === JSON.stringify(old)))
    await second.close()
    assert.deepEqual(errors, [])
    const result = {
      result: "PASS",
      viewport: "1280x720",
      checks: [
        "foreign unit excluded from lists/graph",
        "restored unauthorized case blocked without fallback",
        "admin cannot restore business detail",
        "citizen cannot see unowned records",
        "switch cancel retains input",
        "accepted switch isolates and restores intake drafts",
        "legacy role overrides take real effect",
        "legacy records,45m and unknown assignee preserved",
        "legacy draft migration retains backup",
        "inactive session blocked",
        "storage failure rolls back report and audit; retry succeeds",
        "required fields and negative amount rejected",
        "manual PA-014 unclassified/no-transfer keeps own subject name and no fake entities",
        "reset restricted to admin; confirmation required; audit retained",
        "no browser errors",
      ],
    }
    fs.writeFileSync(
      `${out}/negative-results.json`,
      JSON.stringify(result, null, 2),
    )
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
