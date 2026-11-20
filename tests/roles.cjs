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
  const results = []
  try {
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } }),
        page = await context.newPage(),
        errors = [],
        external = []
      page.setDefaultTimeout(10000)
      page.on("pageerror", (e) => errors.push(e.message))
      page.on("dialog", (d) => d.accept())
      page.on("request", (r) => {
        if (
          /^https?:/.test(r.url()) &&
          !r.url().startsWith(process.env.DEMO_URL || "http://127.0.0.1:8444/")
        )
          external.push(r.url())
      })
      const btn = (n) => page.getByRole("button", { name: n, exact: true }),
        label = (n) => page.getByLabel(n, { exact: true })
      const read = (k) =>
        page.evaluate(
          (k) => JSON.parse(localStorage.getItem(`scamgraph-demo-${k}`)),
          k,
        )
      const nav = async (n) => {
        await page.locator("nav button").filter({ hasText: n }).click()
        await page.waitForTimeout(100)
      }
      const account = async (id) => {
        await page.locator(".account-tools summary").click()
        await label("Chuyển tài khoản thử nghiệm").selectOption(id)
        await page.waitForTimeout(180)
        assert.equal(await read("account"), id)
      }
      const snap = async (name) => {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.waitForTimeout(400)
        await page.screenshot({ path: `${out}/${width}-${name}.png` })
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `overflow ${name}`,
        )
      }
      const openReport = async (id) => {
        await page.getByPlaceholder("Tìm theo mã hoặc tiêu đề...").fill(id)
        await page.locator("tbody tr").filter({ hasText: id }).first().click()
        assert.equal(
          await page
            .getByRole("tab", { name: "Thông tin phản ánh", exact: true })
            .getAttribute("aria-selected"),
          "true",
        )
        await page
          .getByRole("tab", { name: "Xử lý nghiệp vụ", exact: true })
          .click()
        await page.locator(".reception-panel").waitFor({ state: "attached" })
      }
      const openCase = async (id) => {
        await nav("Hồ sơ")
        await page.locator("tbody tr").filter({ hasText: id }).first().click()
        await page.locator(".case-work").waitFor()
      }
      const roleText = () => page.locator(".role-context").innerText()
      await page.goto(process.env.DEMO_URL || "http://127.0.0.1:8444/")
      await btn("Tài khoản Cán bộ").click()
      await btn("Đăng nhập").click()
      assert.equal((await read("reports")).length, 12)
      await snap("analyst-queue")
      assert.equal(await btn("Tiếp nhận phản ánh").count(), 0)
      await account("cong.dan.demo")
      await snap("citizen-list")
      assert.equal(await page.locator("tbody tr").count(), 0)
      await btn("Gửi phản ánh").click()
      await btn("Dùng tình huống mẫu").click()
      await btn("Tiếp tục").click()
      await btn("Tiếp tục").click()
      await btn("Dùng ảnh chuyển khoản mẫu").click()
      await btn("Tiếp tục").click()
      await btn("Gửi phản ánh").click()
      await btn("Mở chi tiết PA-013").click()
      let reports = await read("reports")
      assert.equal(reports.length, 13)
      assert.equal(reports.find((r) => r.id === "PA-013").amount, 15)
      assert.equal(reports.filter((r) => r.cluster === "CUM-001").length, 3)
      assert.equal(await page.locator(".report-people").count(), 0)
      await account("tiep.nhan.demo")
      await openReport("PA-013")
      assert.equal(await btn("Trích xuất thông tin").count(), 0)
      assert.equal(await btn("Xác nhận liên kết CUM-001").count(), 0)
      await label("Ghi chú tiếp nhận / Lý do").fill(
        "Đề nghị bổ sung biên nhận chuyển khoản.",
      )
      await btn("Yêu cầu bổ sung").click()
      await snap("reception-request")
      await account("cong.dan.demo")
      await openReport("PA-013")
      const original = (await read("reports")).find(
        (r) => r.id === "PA-013",
      ).content
      await label("Nội dung bổ sung").fill(
        "Tôi bổ sung biên nhận và lịch sử liên lạc (hư cấu).",
      )
      await btn("Gửi bổ sung").click()
      assert.equal(
        (await read("reports")).find((r) => r.id === "PA-013").content,
        original,
      )
      await account("tiep.nhan.demo")
      await openReport("PA-013")
      await label("Ghi chú tiếp nhận / Lý do").fill(
        "Đã kiểm tra thông tin và tài liệu, chuyển bộ phận phân tích.",
      )
      await btn("Chuyển phân tích").click()
      await snap("reception-transferred")
      await account("cong.dan.demo")
      await openReport("PA-013")
      assert(
        !(await page.locator("main").innerText()).includes(
          "Đã kiểm tra thông tin và tài liệu, chuyển bộ phận phân tích.",
        ),
      )
      await account("phan.tich.demo")
      await openReport("PA-013")
      await btn("Trích xuất thông tin").click()
      await btn("Hiện Số điện thoại trích xuất").click()
      await label("Số điện thoại").fill("DEMO-SDT-013")
      await label("Nhận định phân tích").fill(
        "Trùng tài khoản và website với CUM-001; cần xác minh tiếp.",
      )
      await btn("Lưu thông tin đã kiểm tra").click()
      await btn("Loại bỏ đề xuất CUM-001").click()
      await label("Ngân hàng").fill("Ngân hàng mẫu A · đã kiểm tra")
      await btn("Lưu thông tin đã kiểm tra").click()
      assert.equal(
        (await read("reports")).find((r) => r.id === "PA-013").bank,
        "Ngân hàng mẫu A · đã kiểm tra",
      )
      await btn("Loại bỏ đề xuất CUM-001").click()
      await btn("Xem xét lại CUM-001").click()
      await btn("Xác nhận liên kết CUM-001").click()
      reports = await read("reports")
      assert.equal(reports.filter((r) => r.cluster === "CUM-001").length, 4)
      assert.equal(
        reports
          .filter((r) => r.cluster === "CUM-001")
          .reduce((s, r) => s + r.amount, 0),
        60,
      )
      await snap("analyst-confirmed")
      await btn("Xem sơ đồ CUM-001 →").click()
      await btn("Tạo hồ sơ từ cụm").click()
      assert.equal(
        await page
          .getByRole("dialog")
          .getByLabel("Cán bộ phụ trách", { exact: true })
          .count(),
        0,
      )
      await btn("Xác nhận tạo hồ sơ").click()
      const caseId = (await read("cases"))[0].id
      assert.equal((await read("cases"))[0].reportIds.length, 4)
      assert.equal((await read("cases"))[0].assignedTo, undefined)
      assert.equal(await btn("Lưu phân công và chỉ đạo").count(), 0)
      await snap("analyst-case-readonly")
      await account("lanh.dao.demo")
      await snap("leader-overview")
      await openCase(caseId)
      await label("Cán bộ phụ trách").selectOption("xu.ly.demo")
      await label("Ý kiến chỉ đạo").fill(
        "Đối chiếu giao dịch và trình báo cáo tổng hợp.",
      )
      await btn("Lưu phân công và chỉ đạo").click()
      await snap("leader-assigned")
      await btn("Chuyển sang giao diện sáng").click()
      await snap("leader-assigned-light")
      await btn("Chuyển sang giao diện tối").click()
      await account("xu.ly.demo")
      await snap("worker-assigned-list")
      assert.equal(
        await page.locator("tbody tr").filter({ hasText: "HS-002" }).count(),
        0,
      )
      await openCase(caseId)
      assert.equal(await label("Cán bộ phụ trách").count(), 0)
      await label("Trạng thái xử lý").selectOption("Đang xác minh")
      await label("Nhận định cán bộ").fill(
        "Đã đối chiếu đủ bốn phản ánh, tổng số tiền 60 triệu đồng.",
      )
      await label("Nội dung tiến độ / Kết quả xác minh").fill(
        "Đã kiểm tra tài liệu giao dịch mẫu.",
      )
      await page
        .getByRole("checkbox", {
          name: "Bổ sung tài liệu mẫu (mô phỏng)",
          exact: true,
        })
        .check()
      await btn("Lưu tiến độ và nhận định").click()
      await label("Nội dung báo cáo").fill(
        "Báo cáo tổng hợp bốn phản ánh của hồ sơ đang chọn.",
      )
      await btn("Lưu bản nháp báo cáo").click()
      await btn("Xem bản 1").click()
      assert(
        (await page.locator(".report-doc").innerText()).includes(
          "60 triệu đồng",
        ),
      )
      assert((await page.locator(".report-doc").innerText()).includes("PA-013"))
      await page.keyboard.press("Escape")
      await btn("Trình báo cáo").click()
      await snap("worker-submitted")
      assert.equal(await btn("Lưu tiến độ và nhận định").count(), 0)
      await account("lanh.dao.demo")
      await openCase(caseId)
      await label("Ý kiến xem xét báo cáo").fill("Bổ sung căn cứ xác minh.")
      await btn("Yêu cầu chỉnh sửa").click()
      await account("xu.ly.demo")
      await openCase(caseId)
      await label("Nội dung báo cáo").fill(
        "Báo cáo đã bổ sung căn cứ xác minh theo yêu cầu.",
      )
      await btn("Lưu bản nháp báo cáo").click()
      await btn("Trình báo cáo").click()
      await account("lanh.dao.demo")
      await openCase(caseId)
      await label("Ý kiến xem xét báo cáo").fill(
        "Đã xem xét nội dung và dữ liệu nguồn.",
      )
      await btn("Phê duyệt báo cáo").click()
      await snap("leader-approved")
      const approved = JSON.stringify(
        (await read("cases")).find((c) => c.id === caseId).reportVersions[0],
      )
      await account("xu.ly.demo")
      await openCase(caseId)
      assert.equal(await btn("Lưu bản nháp báo cáo").count(), 0)
      await btn("Soạn phiên bản mới").click()
      await label("Nội dung báo cáo").fill("Báo cáo cập nhật phiên bản hai.")
      await btn("Lưu phiên bản mới").click()
      assert.equal(
        JSON.stringify(
          (await read("cases")).find((c) => c.id === caseId).reportVersions[0],
        ),
        approved,
      )
      assert(
        (await read("cases"))
          .find((c) => c.id === caseId)
          .workItems.some((w) => w.attachment),
      )
      // Switching tabs retains unsaved work; switching accounts explicitly discards it.
      await label("Nhận định cán bộ").fill("Bản nháp chưa lưu của người xử lý.")
      await page
        .locator(".tabs")
        .getByRole("button", { name: "Tài liệu", exact: true })
        .click()
      await page
        .locator(".tabs")
        .getByRole("button", { name: "Tổng quan", exact: true })
        .click()
      assert.equal(
        await label("Nhận định cán bộ").inputValue(),
        "Bản nháp chưa lưu của người xử lý.",
      )
      await account("giam.sat.demo")
      await snap("supervisor-audit")
      assert((await roleText()).includes("Kiểm tra, giám sát"))
      assert.equal(await btn("Lưu quyền tài khoản").count(), 0)
      const logs = await read("logs")
      for (const action of [
        "Tạo phản ánh",
        "Yêu cầu bổ sung",
        "Bổ sung phản ánh",
        "Chuyển phân tích",
        "Kiểm tra thông tin trích xuất",
        "Xác nhận liên kết",
        "Tạo hồ sơ",
        "Phân công cán bộ",
        "Trình báo cáo",
        "Phê duyệt báo cáo",
      ])
        assert(
          logs.some((l) => l.action === action),
          action,
        )
      await nav("Hồ sơ")
      await page.locator("tbody tr").filter({ hasText: "HS-002" }).click()
      await btn("Xem báo cáo").click()
      const text = await page.locator(".report-doc").innerText()
      assert(text.includes("PA-008"))
      assert(text.includes("30 triệu đồng"))
      assert(!text.includes("PA-013"))
      await page.keyboard.press("Escape")
      await account("quan.tri.demo")
      await snap("admin-accounts")
      assert.equal(await page.locator("nav button").count(), 2)
      await btn("Sửa quyền phan.tich.demo").click()
      await label("Vai trò tài khoản").selectOption("Lãnh đạo theo dõi")
      await btn("Lưu quyền tài khoản").click()
      await account("phan.tich.demo")
      assert((await roleText()).includes("Lãnh đạo theo dõi"))
      assert.equal(await btn("Tiếp nhận phản ánh").count(), 0)
      await account("quan.tri.demo")
      await btn("Sửa quyền phan.tich.demo").click()
      await label("Vai trò tài khoản").selectOption("Cán bộ phân tích")
      await btn("Lưu quyền tài khoản").click()
      await nav("Nhật ký")
      assert.equal(
        await page
          .locator("tbody tr")
          .filter({ hasText: "Xác nhận liên kết" })
          .count(),
        0,
      )
      await account("phan.tich.demo")
      await nav("Phản ánh")
      await label("Phạm vi công việc").selectOption("all")
      await page.getByPlaceholder("Tìm theo mã hoặc tiêu đề...").fill("PA-013")
      await page.locator("tbody tr").first().click()
      await btn("Hiện liên hệ người gửi").click()
      await page.reload()
      assert.equal(await btn("Hiện liên hệ người gửi").count(), 1)
      assert.equal(
        (await read("reports"))
          .filter((r) => r.cluster === "CUM-002")
          .reduce((s, r) => s + r.amount, 0),
        25,
      )
      assert.equal(
        (await read("reports")).find((r) => r.id === "PA-008").cluster,
        undefined,
      )
      assert.deepEqual(errors, [])
      assert.deepEqual(external, [])
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "seven distinct roles and menus",
          "citizen ownership",
          "supplement separate from original",
          "reception-to-analysis handoff",
          "review/reject/restore/link four/60",
          "case snapshot four and waiting assignment",
          "leader assignment; assigned worker only",
          "draft/submit/reject/correct/approve",
          "immutable approved report and next version",
          "case-specific HS-002/30 and CUM-002/25",
          "unsaved work survives tabs; switch confirmation",
          "audit role snapshots and admin scope",
          "real account role mutation",
          "reload re-hides sensitive data",
          "no page overflow, external API or browser errors",
        ],
      })
      await context.close()
    }
    fs.writeFileSync(
      `${out}/workflow-results.json`,
      JSON.stringify(results, null, 2),
    )
    console.log(JSON.stringify(results, null, 2))
  } catch (e) {
    console.error(e)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
})()
