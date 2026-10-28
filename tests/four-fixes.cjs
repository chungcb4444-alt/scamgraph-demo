const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict"),
  fs = require("node:fs")
const url = process.env.DEMO_URL || "http://127.0.0.1:8444/",
  out = process.env.TEST_OUTPUT || "docs/four-fixes-review"
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
          }),
          page = await context.newPage(),
          errors = []
        page.setDefaultTimeout(8000)
        page.on("pageerror", (e) => errors.push(e.message))
        const btn = (n) => page.getByRole("button", { name: n, exact: true }),
          label = (n) => page.getByLabel(n, { exact: true }),
          tab = (n) => page.getByRole("tab", { name: n, exact: true })
        const nav = async (n) => {
          await page.locator("nav button").filter({ hasText: n }).click()
        }
        const account = async (id) => {
          await page.locator(".account-tools summary").click()
          await label("Chuyển tài khoản thử nghiệm").selectOption(id)
        }
        const read = (k) =>
          page.evaluate(
            (k) => JSON.parse(localStorage.getItem("scamgraph-demo-" + k)),
            k,
          )
        const business = () =>
          page.evaluate(() =>
            Object.fromEntries(
              ["reports", "cases", "accounts", "logs"].map((k) => [
                k,
                localStorage.getItem("scamgraph-demo-" + k),
              ]),
            ),
          )
        const snap = async (n) => {
          await page.evaluate(() => scrollTo(0, 0))
          await page.waitForTimeout(200)
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            n + " overflow",
          )
          await page.screenshot({ path: `${out}/${width}-${theme}-${n}.png` })
        }
        const openCase = async (id) => {
          await nav("Hồ sơ")
          await page.locator("tbody tr").filter({ hasText: id }).first().click()
        }
        const confirm = async (action, accept = false, type = "confirm") => {
          const waiting = page.waitForEvent("dialog"),
            task = action()
          const dialog = await waiting
          assert.equal(dialog.type(), type)
          await (accept ? dialog.accept() : dialog.dismiss())
          await task
        }
        const cdp = await context.newCDPSession(page)
        const cancelReload = async () => {
          await page.waitForTimeout(80)
          const waiting = page.waitForEvent("dialog"),
            task = cdp.send("Page.reload")
          const dialog = await waiting
          assert.equal(dialog.type(), "beforeunload")
          await dialog.dismiss()
          await task
        }
        const cleanReload = async () => {
          await page.waitForTimeout(80)
          const dialogs = []
          const onDialog = async (d) => {
            dialogs.push(d.type())
            await d.accept()
          }
          page.on("dialog", onDialog)
          await page.reload()
          page.off("dialog", onDialog)
          assert.deepEqual(dialogs, [], "Clean view unexpectedly warned")
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
        const initial = await business()
        await page
          .getByPlaceholder("Tìm theo mã hoặc tiêu đề...")
          .fill("PA-001")
        await page.locator("tbody tr").first().click()
        assert.equal(
          await page
            .locator(".detail-hero")
            .getByLabel("Phân tích: Đang phân tích", { exact: true })
            .count(),
          1,
        )
        assert.equal(
          await page
            .locator(".detail-hero")
            .getByLabel("Liên kết: CUM-001", { exact: true })
            .count(),
          1,
        )
        assert(
          !(await page.locator(".detail-hero").innerText()).includes(
            "Đã kiểm tra",
          ),
        )
        await snap("report-stages")
        await tab("Xử lý nghiệp vụ").click()
        await tab("Lịch sử").click()
        assert.deepEqual(await business(), initial)
        // An automatically selected filtered result remains selected when the filter is widened.
        await nav("Cảnh báo")
        await label("Lọc mức độ cảnh báo").selectOption("Trung bình")
        assert(
          (await page.locator(".alert-side").innerText()).includes("CUM-002"),
        )
        await label("Lọc mức độ cảnh báo").selectOption("Tất cả mức độ")
        assert(
          (await page.locator(".alert-side").innerText()).includes("CUM-002"),
        )
        await account("xu.ly.demo")
        await nav("Cảnh báo")
        const filterBase = await business()
        await label("Lọc mức độ cảnh báo").selectOption("Cao")
        assert.equal(await page.locator(".alert-row").count(), 0)
        assert.equal(await page.locator(".alert-side button").count(), 0)
        assert.equal(await page.locator(".alert-side .score-ring").count(), 0)
        assert(!(await page.locator(".alert-side").innerText()).includes("61"))
        await snap("alerts-empty")
        await label("Lọc mức độ cảnh báo").selectOption("Trung bình")
        assert(
          (await page.locator(".alert-side").innerText()).includes("CUM-002"),
        )
        assert.deepEqual(await business(), filterBase)
        await btn("Mở sơ đồ liên kết").click()
        assert(
          (await page.locator(".cluster-summary").innerText()).includes(
            "25 triệu",
          ),
        )
        await account("phan.tich.demo")
        await nav("Phân tích liên kết")
        const originalCases = await read("cases")
        await btn("Tạo hồ sơ từ cụm").click()
        assert.equal(
          await page.getByRole("dialog").getByRole("checkbox").count(),
          0,
        )
        // Dispatch two synchronous clicks on the same node, including a stale handler after unmount.
        await btn("Xác nhận tạo hồ sơ").evaluate((el) => {
          el.click()
          el.click()
        })
        assert.equal((await read("cases")).length, originalCases.length + 1)
        const first = (await read("cases"))[0]
        assert.equal(first.assignedTo, undefined)
        assert.deepEqual((await read("cases")).slice(1), originalCases)
        await nav("Phân tích liên kết")
        await btn("Tạo hồ sơ từ cụm").click()
        await btn("Mở hồ sơ " + first.id).click()
        assert(
          (await page.locator(".detail-hero").innerText()).includes(first.id),
        )
        await nav("Phân tích liên kết")
        await btn("Tạo hồ sơ từ cụm").click()
        const consent = () =>
          page.getByRole("checkbox", {
            name: "Tôi đã kiểm tra hồ sơ cùng bộ phản ánh và vẫn muốn tạo hồ sơ mới.",
            exact: true,
          })
        assert(await btn("Xác nhận tạo hồ sơ").isDisabled())
        await consent().check()
        assert(await btn("Xác nhận tạo hồ sơ").isEnabled())
        await label("Chọn cụm nguồn").selectOption("CUM-002")
        assert(!(await consent().isChecked()))
        assert(await btn("Xác nhận tạo hồ sơ").isDisabled())
        await label("Chọn cụm nguồn").selectOption("CUM-001")
        assert(!(await consent().isChecked()))
        await snap("duplicate-case")
        await consent().check()
        await btn("Xác nhận tạo hồ sơ").click()
        assert.equal((await read("cases")).length, originalCases.length + 2)
        assert.deepEqual(
          (await read("cases")).find((c) => c.id === first.id),
          first,
        )
        // Fixture-only expansion: actual PA-013 creation/review/link is exercised by roles.cjs.
        await page.evaluate(() => {
          const reports = JSON.parse(
            localStorage.getItem("scamgraph-demo-reports"),
          )
          reports.push({
            ...reports[0],
            id: "PA-013",
            title: "Nguồn bổ sung trong kiểm thử riêng",
            amount: 15,
            reviewed: true,
            analysisStatus: "Đã kiểm tra",
          })
          localStorage.setItem(
            "scamgraph-demo-reports",
            JSON.stringify(reports),
          )
        })
        await page.reload()
        await nav("Phân tích liên kết")
        await btn("Tạo hồ sơ từ cụm").click()
        assert.equal(await consent().count(), 0)
        assert(
          (await page.locator(".linked-cluster").innerText()).includes(
            "4 phản ánh · 60 triệu",
          ),
        )
        assert(
          (await page.locator(".related-source-cases").innerText()).includes(
            "Khác bộ phản ánh",
          ),
        )
        await snap("expanded-source")
        await btn("Xác nhận tạo hồ sơ").click()
        assert.equal((await read("cases"))[0].reportIds.length, 4)
        assert.equal((await read("cases"))[0].assignedTo, undefined)
        assert.deepEqual(
          (await read("cases")).find((c) => c.id === first.id),
          first,
        )
        await account("xu.ly.demo")
        await openCase("HS-001")
        await cleanReload()
        const caseBefore = (await read("cases")).find((c) => c.id === "HS-001"),
          draftBase = await business()
        for (const [name, value] of [
          ["Nhận định cán bộ", "Nhận định đang nhập"],
          ["Nội dung tiến độ / Kết quả xác minh", "Tiến độ chưa lưu"],
          ["Nội dung báo cáo", "Báo cáo chưa lưu"],
          ["Nội dung yêu cầu xem xét lại", "Yêu cầu chưa lưu"],
        ]) {
          const old = await label(name).inputValue()
          await label(name).fill(value)
          await cancelReload()
          assert.equal(await label(name).inputValue(), value)
          await label(name).fill(old)
        }
        await label("Trạng thái xử lý").selectOption("Chờ bổ sung")
        await cancelReload()
        assert.equal(
          await label("Trạng thái xử lý").inputValue(),
          "Chờ bổ sung",
        )
        await label("Trạng thái xử lý").selectOption(caseBefore.status)
        const file = page.getByRole("checkbox", {
          name: "Bổ sung tài liệu mẫu (mô phỏng)",
          exact: true,
        })
        await file.check()
        await cancelReload()
        assert(await file.isChecked())
        await file.uncheck()
        await label("Nhận định cán bộ").fill("Bản nháp giữ qua tab")
        await btn("Tài liệu").click()
        await btn("Tổng quan").click()
        assert.equal(
          await label("Nhận định cán bộ").inputValue(),
          "Bản nháp giữ qua tab",
        )
        await confirm(() => btn("← Quay lại danh sách hồ sơ").click())
        assert.equal(
          await label("Nhận định cán bộ").inputValue(),
          "Bản nháp giữ qua tab",
        )
        await confirm(() => account("lanh.dao.demo"))
        assert.equal(
          await label("Nhận định cán bộ").inputValue(),
          "Bản nháp giữ qua tab",
        )
        await confirm(() => btn("Đăng xuất").click())
        assert.equal(
          await label("Nhận định cán bộ").inputValue(),
          "Bản nháp giữ qua tab",
        )
        await label("Nhận định cán bộ").fill(caseBefore.note)
        await cleanReload()
        assert.deepEqual(await business(), draftBase)
        await label("Nhận định cán bộ").fill("Bản nháp bỏ sau xác nhận")
        await confirm(() => page.reload(), true, "beforeunload")
        assert.equal(
          await label("Nhận định cán bộ").inputValue(),
          caseBefore.note,
        )
        await label("Nhận định cán bộ").fill(
          "Nhận định đã lưu cùng lúc còn nháp báo cáo",
        )
        await label("Nội dung báo cáo").fill("Báo cáo vẫn chưa lưu")
        await btn("Lưu tiến độ và nhận định").click()
        await cancelReload()
        assert.equal(
          await label("Nội dung báo cáo").inputValue(),
          "Báo cáo vẫn chưa lưu",
        )
        await btn("Lưu bản nháp báo cáo").click()
        await cleanReload()
        await label("Nội dung tiến độ / Kết quả xác minh").fill(
          "Tiến độ còn nháp",
        )
        await file.check()
        await label("Nội dung yêu cầu xem xét lại").fill(
          "Yêu cầu nguồn được lưu riêng",
        )
        await btn("Gửi yêu cầu xem xét lại").click()
        await cancelReload()
        assert.equal(
          await label("Nội dung tiến độ / Kết quả xác minh").inputValue(),
          "Tiến độ còn nháp",
        )
        assert(await file.isChecked())
        await btn("Lưu tiến độ và nhận định").click()
        await cleanReload()
        await snap("case-saved")
        await account("lanh.dao.demo")
        await openCase("HS-001")
        await cleanReload()
        const savedPriority = await label("Mức ưu tiên").inputValue()
        await label("Cán bộ phụ trách").selectOption("xu.ly.huy")
        await cancelReload()
        await label("Cán bộ phụ trách").selectOption("xu.ly.demo")
        await label("Mức ưu tiên").selectOption("Thấp")
        await cancelReload()
        await label("Mức ưu tiên").selectOption(savedPriority)
        await label("Ý kiến chỉ đạo").fill("Chỉ đạo chưa lưu")
        await cancelReload()
        assert.equal(
          await label("Ý kiến chỉ đạo").inputValue(),
          "Chỉ đạo chưa lưu",
        )
        await btn("Lưu phân công và chỉ đạo").click()
        await cleanReload()
        await account("xu.ly.demo")
        await openCase("HS-001")
        await btn("Trình báo cáo").click()
        await cleanReload()
        await account("lanh.dao.demo")
        await openCase("HS-001")
        await label("Ý kiến xem xét báo cáo").fill("Ý kiến chưa lưu")
        await cancelReload()
        assert.equal(
          await label("Ý kiến xem xét báo cáo").inputValue(),
          "Ý kiến chưa lưu",
        )
        await btn("Yêu cầu chỉnh sửa").click()
        await cleanReload()
        await account("giam.sat.demo")
        await openCase("HS-001")
        await cleanReload()
        // Zero scoped alerts, isolated fixture; never touches a real review session.
        await page.evaluate(() => {
          localStorage.setItem("scamgraph-demo-reports", "[]")
          localStorage.setItem(
            "scamgraph-demo-screen",
            JSON.stringify("alerts"),
          )
        })
        await page.reload()
        assert.equal(await page.locator(".alert-side button").count(), 0)
        assert(
          (await page.locator(".alert-side").innerText()).includes(
            "Không có cảnh báo trong phạm vi",
          ),
        )
        await snap("alerts-zero")
        assert.deepEqual(errors, [])
        results.push({
          width,
          height,
          theme,
          result: "PASS",
          checks: [
            "status phases agree without business writes",
            "filtered selection retained and empty/zero alerts safe",
            "view/filter operations preserve business storage",
            "intentional duplicate confirmation and related-case navigation",
            "cluster switch clears consent; three-to-four source is a distinct case",
            "synchronous double-click creates once",
            "every editable case form warns on reload",
            "cancel reload/navigation/logout/account switch preserves drafts",
            "case tabs preserve drafts without autosave",
            "partial saves retain other forms dirty; clean and saved forms do not warn",
            "explicit reload acceptance discards only unsaved input",
            "existing cases and snapshots not overwritten",
          ],
        })
        await context.close()
      }
    fs.writeFileSync(
      `${out}/browser-results.json`,
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
