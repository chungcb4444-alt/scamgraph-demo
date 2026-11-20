const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/receipt-workflow-review",
  url = process.env.DEMO_URL || "http://127.0.0.1:8444/"
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
        page.setDefaultTimeout(10000)
        page.on("pageerror", (e) => errors.push(e.message))
        const btn = (n) => page.getByRole("button", { name: n, exact: true }),
          label = (n) => page.getByLabel(n, { exact: true }),
          nav = async (n) =>
            page.locator("nav button").filter({ hasText: n }).click(),
          read = (k) =>
            page.evaluate(
              (k) => JSON.parse(localStorage.getItem("scamgraph-demo-" + k)),
              k,
            )
        const account = async (id) => {
          await page.locator(".account-tools summary").click()
          await label("Chuyển tài khoản thử nghiệm").selectOption(id)
        }
        const openCase = async (id) => {
          await nav("Hồ sơ")
          await page.locator("tbody tr").filter({ hasText: id }).first().click()
        }
        const opinions = async () => btn("Ý kiến / Yêu cầu").click(),
          overview = async () => btn("Tổng quan").click()
        const snap = async (name, locator) => {
          await page.waitForTimeout(180)
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            name + " overflow",
          )
          await (locator || page).screenshot({
            path: `${out}/${width}-${theme}-${name}.png`,
          })
        }
        const cdp = await context.newCDPSession(page)
        const cancelReload = async () => {
          await page.waitForTimeout(60)
          const waiting = page.waitForEvent("dialog"),
            command = cdp.send("Page.reload")
          const d = await waiting
          assert.equal(d.type(), "beforeunload")
          await d.dismiss()
          await command
        }
        const business = () =>
          page.evaluate(() =>
            Object.fromEntries(
              ["reports", "cases", "accounts", "logs"].map((k) => [
                k,
                localStorage.getItem("scamgraph-demo-" + k),
              ]),
            ),
          )
        await page.goto(url)
        await btn("Tài khoản Cán bộ").click()
        await btn("Đăng nhập").click()
        await page.evaluate(
          (t) => localStorage.setItem("scamgraph-appearance", t),
          theme,
        )
        await page.reload()
        const initialReports = await read("reports"),
          initialCases = await read("cases")
        assert.equal(initialReports.length, 12)
        assert(
          initialReports.every((r) => !r.intakeReceipt && !r.receiptWorkflow),
        )
        assert(initialCases.every((c) => !c.assignments && !c.receiptWorkflow))
        await account("cong.dan.demo")
        await btn("Gửi phản ánh").click()
        await btn("Dùng tình huống mẫu").click()
        await btn("Tiếp tục").click()
        await btn("Tiếp tục").click()
        await btn("Dùng ảnh chuyển khoản mẫu").click()
        await btn("Tiếp tục").click()
        await btn("Gửi phản ánh").click()
        await btn("Mở chi tiết PA-013").click()
        await page
          .getByRole("tab", { name: "Xử lý nghiệp vụ", exact: true })
          .click()
        assert(
          (await page.locator(".reception-panel").innerText()).includes(
            "Chờ cán bộ tiếp nhận",
          ),
        )
        await account("tiep.nhan.demo")
        await label("Phạm vi công việc").selectOption("all")
        await page
          .getByPlaceholder("Tìm theo mã hoặc tiêu đề...")
          .fill("PA-013")
        await page.locator("tbody tr").first().click()
        await page
          .getByRole("tab", { name: "Xử lý nghiệp vụ", exact: true })
          .click()
        assert.equal(await label("Ghi chú tiếp nhận / Lý do").count(), 0)
        const receivedAt = (await read("reports")).find(
          (r) => r.id === "PA-013",
        ).receivedAt
        await btn("Xác nhận tiếp nhận").evaluate((el) => {
          el.click()
          el.click()
        })
        assert.equal(
          (await read("logs")).filter(
            (l) => l.action === "Xác nhận tiếp nhận phản ánh",
          ).length,
          1,
        )
        const pa = (await read("reports")).find((r) => r.id === "PA-013")
        assert.equal(pa.receivedAt, receivedAt)
        assert.equal(pa.intakeReceipt.by, "tiep.nhan.demo")
        assert.equal(pa.cluster, undefined)
        assert.equal(pa.reviewed, false)
        await snap("intake-accepted", page.locator(".reception-panel"))
        for (const old of initialReports)
          assert.deepEqual(
            (await read("reports")).find((r) => r.id === old.id),
            old,
          )
        assert.deepEqual(await read("cases"), initialCases)
        await account("lanh.dao.demo")
        await openCase("HS-001")
        assert(
          (await page.locator(".receipt-summary").innerText()).includes(
            "Dữ liệu cũ",
          ),
        )
        await label("Ý kiến chỉ đạo").fill("Chỉ đạo thêm, chưa đổi người")
        await btn("Lưu phân công và chỉ đạo").click()
        assert.equal(
          (await read("cases")).find((c) => c.id === "HS-001").receiptWorkflow,
          undefined,
        )
        await label("Cán bộ phụ trách").selectOption("xu.ly.huy")
        await btn("Lưu phân công và chỉ đạo").click()
        await account("xu.ly.huy")
        await openCase("HS-001")
        assert.equal(await btn("Lưu tiến độ và nhận định").count(), 0)
        assert.equal(await btn("Lưu bản nháp báo cáo").count(), 0)
        await btn("Nhận xử lý hồ sơ").evaluate((el) => {
          el.click()
          el.click()
        })
        assert.equal(
          (await read("logs")).filter((l) => l.action === "Nhận xử lý hồ sơ")
            .length,
          1,
        )
        const assignmentB = structuredClone(
          (await read("cases")).find((c) => c.id === "HS-001").assignments[0],
        )
        assert.equal(assignmentB.received.by, "xu.ly.huy")
        await snap("case-received", page.locator(".receipt-summary"))
        await account("lanh.dao.demo")
        await openCase("HS-001")
        await label("Cán bộ phụ trách").selectOption("xu.ly.demo")
        await btn("Lưu phân công và chỉ đạo").click()
        await account("xu.ly.huy")
        assert.equal(
          await page.locator("tbody tr").filter({ hasText: "HS-001" }).count(),
          0,
        )
        await account("xu.ly.demo")
        await openCase("HS-001")
        assert.equal(await btn("Lưu tiến độ và nhận định").count(), 0)
        await btn("Nhận xử lý hồ sơ").click()
        let item = (await read("cases")).find((c) => c.id === "HS-001")
        assert.deepEqual(item.assignments[0], assignmentB)
        const assignmentA = structuredClone(item.assignments.at(-1))
        await account("lanh.dao.demo")
        await openCase("HS-001")
        await label("Mức ưu tiên").selectOption("Thấp")
        await label("Ý kiến chỉ đạo").fill("Giữ người nhận, đổi ưu tiên")
        await btn("Lưu phân công và chỉ đạo").click()
        assert.deepEqual(
          (await read("cases"))
            .find((c) => c.id === "HS-001")
            .assignments.at(-1),
          assignmentA,
        )
        await account("xu.ly.demo")
        await openCase("HS-001")
        assert.equal(await btn("Nhận xử lý hồ sơ").count(), 0)
        await label("Nhận định cán bộ").fill("Nhận định chưa lưu qua tab mới")
        await opinions()
        await label("Loại ý kiến").selectOption("Kiến nghị")
        await label("Nội dung ý kiến").fill("KIẾN NGHỊ RIÊNG CẦN XEM XÉT")
        await btn("Lưu nháp kiến nghị").click()
        await cancelReload()
        await overview()
        assert.equal(
          await label("Nhận định cán bộ").inputValue(),
          "Nhận định chưa lưu qua tab mới",
        )
        await btn("Lưu tiến độ và nhận định").click()
        item = (await read("cases")).find((c) => c.id === "HS-001")
        const messageId = item.messages[0].id
        await account("lanh.dao.demo")
        await openCase("HS-001")
        await opinions()
        assert(
          !(await page.locator("main").textContent()).includes(
            "KIẾN NGHỊ RIÊNG CẦN XEM XÉT",
          ),
        )
        await account("xu.ly.demo")
        await openCase("HS-001")
        await opinions()
        await btn("Trình kiến nghị").click()
        await label("Người nhận ý kiến").selectOption("phan.tich.demo")
        await label("Nội dung ý kiến").fill("GHI CHÚ TRAO ĐỔI KHÔNG DUYỆT")
        await page
          .getByRole("checkbox", {
            name: "Yêu cầu người nhận xác nhận tiếp nhận",
            exact: true,
          })
          .check()
        await btn("Gửi ghi chú nội bộ").click()
        await overview()
        assert(await btn("Lưu tiến độ và nhận định").isEnabled())
        await label("Nội dung yêu cầu xem xét lại").fill(
          "YÊU CẦU ĐỐI CHIẾU NGUỒN",
        )
        await btn("Gửi yêu cầu xem xét lại").click()
        await account("phan.tich.demo")
        await openCase("HS-001")
        await opinions()
        const ordinary = page
          .locator(".case-messages .workflow-entry")
          .filter({ hasText: "GHI CHÚ TRAO ĐỔI KHÔNG DUYỆT" })
        await ordinary
          .getByRole("button", {
            name: "Xác nhận tiếp nhận ý kiến",
            exact: true,
          })
          .click()
        assert((await ordinary.innerText()).includes("Không yêu cầu phê duyệt"))
        assert.equal(
          await ordinary
            .getByRole("button", { name: "Duyệt kiến nghị", exact: true })
            .count(),
          0,
        )
        await btn("Tiếp nhận yêu cầu nguồn").click()
        const response = page.getByRole("textbox", {
          name: /^Phản hồi yêu cầu/,
        })
        await response.fill("Đã kiểm tra và phản hồi căn cứ nguồn")
        await label("Người nhận ý kiến").selectOption("xu.ly.demo")
        await label("Nội dung ý kiến").fill(
          "Ghi chú phân tích không làm mất nháp phản hồi",
        )
        await btn("Gửi ghi chú nội bộ").click()
        await cancelReload()
        assert.equal(
          await response.inputValue(),
          "Đã kiểm tra và phản hồi căn cứ nguồn",
        )
        await btn("Hoàn thành yêu cầu nguồn").click()
        assert(
          (await page.locator(".receipt-case-summary").innerText()).includes(
            "0 yêu cầu nguồn đang mở",
          ),
        )
        await snap("source-completed", page.locator(".source-requests"))
        await nav("Phản ánh")
        assert(
          (await page.locator(".work-summary").innerText()).includes(
            "0 hồ sơ có yêu cầu xem xét lại",
          ),
        )
        await account("lanh.dao.demo")
        await btn("1 kiến nghị chờ xem xét").click()
        assert.equal(
          await btn("Ý kiến / Yêu cầu").getAttribute("aria-pressed"),
          "true",
        )
        const formal = () =>
          page
            .locator(".case-messages .workflow-entry")
            .filter({ hasText: messageId })
            .first()
        assert.equal(
          await formal()
            .getByRole("button", { name: "Duyệt kiến nghị", exact: true })
            .count(),
          0,
        )
        await formal()
          .getByRole("button", {
            name: "Xác nhận tiếp nhận ý kiến",
            exact: true,
          })
          .click()
        const reason = label("Ý kiến xem xét " + messageId)
        await reason.fill("Cần thêm căn cứ cụ thể")
        await label("Người nhận ý kiến").selectOption("xu.ly.demo")
        await label("Nội dung ý kiến").fill(
          "Ghi chú lãnh đạo trong lúc đang xem xét",
        )
        await btn("Gửi ghi chú nội bộ").click()
        await cancelReload()
        assert.equal(await reason.inputValue(), "Cần thêm căn cứ cụ thể")
        await btn("Trả sửa kiến nghị").click()
        const version1 = structuredClone(
          (await read("cases")).find((c) => c.id === "HS-001").messages[0]
            .versions[0],
        )
        await account("xu.ly.demo")
        await openCase("HS-001")
        await opinions()
        await formal()
          .getByRole("button", {
            name: "Soạn phiên bản kiến nghị mới",
            exact: true,
          })
          .click()
        await label("Nội dung ý kiến").fill("KIẾN NGHỊ ĐÃ BỔ SUNG PHIÊN BẢN 2")
        await btn("Lưu nháp kiến nghị").click()
        assert.deepEqual(
          (await read("cases")).find((c) => c.id === "HS-001").messages[0]
            .versions[0],
          version1,
        )
        await btn("Trình kiến nghị").click()
        await account("lanh.dao.demo")
        await openCase("HS-001")
        await opinions()
        await formal()
          .getByRole("button", {
            name: "Xác nhận tiếp nhận ý kiến",
            exact: true,
          })
          .click()
        await label("Ý kiến xem xét " + messageId).fill(
          "Chấp thuận kiến nghị nội bộ theo phiên bản 2",
        )
        await btn("Duyệt kiến nghị").click()
        await snap("opinion-approved", formal())
        item = (await read("cases")).find((c) => c.id === "HS-001")
        assert.deepEqual(item.messages[0].versions[0], version1)
        assert.equal(item.messages[0].versions[1].state, "Đã duyệt")
        assert.notEqual(item.status, "Đã đóng")
        await account("xu.ly.demo")
        await openCase("HS-001")
        await label("Nội dung báo cáo").fill("BÁO CÁO BẢN ĐẦU CẦN GIỮ")
        await btn("Lưu bản nháp báo cáo").click()
        await label("Nhận định cán bộ").fill("Nhận định mới sau nháp báo cáo")
        await label("Trạng thái xử lý").selectOption("Chờ bổ sung")
        await btn("Lưu tiến độ và nhận định").click()
        assert(await btn("Trình báo cáo").isDisabled())
        assert.equal(
          await label("Nội dung báo cáo").inputValue(),
          "BÁO CÁO BẢN ĐẦU CẦN GIỮ",
        )
        await snap("report-stale", page.locator(".workflow-warning"))
        await btn("Lưu bản nháp báo cáo").click()
        assert(await btn("Trình báo cáo").isEnabled())
        await btn("Trình báo cáo").click()
        await account("lanh.dao.demo")
        await openCase("HS-001")
        await label("Ý kiến xem xét báo cáo").fill(
          "Bổ sung nội dung báo cáo trước khi duyệt",
        )
        await btn("Yêu cầu chỉnh sửa").click()
        const previous = structuredClone(
          (await read("cases")).find((c) => c.id === "HS-001")
            .reportVersions[0],
        )
        await account("xu.ly.demo")
        await openCase("HS-001")
        await label("Nội dung báo cáo").fill("BÁO CÁO ĐÃ BỔ SUNG")
        await btn("Lưu bản nháp báo cáo").click()
        const archive = (await read("cases")).find((c) => c.id === "HS-001")
          .reportVersions[0].previousSubmissions[0]
        assert.equal(archive.content, previous.content)
        assert.equal(archive.author, previous.author)
        assert.deepEqual(archive.snapshot, previous.snapshot)
        await page
          .locator(".report-versions details summary")
          .filter({ hasText: "Các lần trình trước của bản 1" })
          .click()
        await btn("Xem lần trình 1 của bản 1").click()
        assert(
          (await page.locator(".report-doc").innerText()).includes(
            "BÁO CÁO BẢN ĐẦU CẦN GIỮ",
          ),
        )
        await page.keyboard.press("Escape")
        await btn("Trình báo cáo").click()
        await account("lanh.dao.demo")
        await openCase("HS-001")
        await btn("Phê duyệt báo cáo").click()
        assert.equal(
          (await read("cases")).find((c) => c.id === "HS-001").reportVersions[0]
            .state,
          "Đã phê duyệt",
        )
        await account("giam.sat.demo")
        await openCase("HS-001")
        await opinions()
        assert.equal(
          await page
            .locator(".source-requests button,.case-messages button")
            .count(),
          0,
        )
        const viewBase = await business()
        await overview()
        await opinions()
        assert.deepEqual(await business(), viewBase)
        await account("quan.tri.demo")
        assert.equal(await page.locator("nav button").count(), 2)
        for (const old of initialReports)
          assert.deepEqual(
            (await read("reports")).find((r) => r.id === old.id),
            old,
          )
        assert.deepEqual(
          (await read("cases")).find((c) => c.id === "HS-002"),
          initialCases.find((c) => c.id === "HS-002"),
        )
        assert.equal((await read("reports")).length, 13)
        assert.equal(
          (await read("reports"))
            .filter((r) => r.cluster === "CUM-001")
            .reduce((n, r) => n + r.amount, 0),
          45,
        )
        assert.deepEqual(errors, [])
        results.push({
          width,
          height,
          theme,
          result: "PASS",
          checks: [
            "new report acknowledgement is explicit, once, timestamp distinct and source untouched",
            "legacy data unchanged on viewing; new assignment gates and reassignment receipts preserve history",
            "same-person priority edit retains receipt and old assignee loses access",
            "cross-tab unsaved drafts survive saving another form",
            "private formal drafts hidden; notes acknowledged without approval",
            "source requests claimed, answered and closed with pending counts updated",
            "leader queue deep link; receipt/revision/approval apply to exact opinion versions",
            "stale report blocked until explicit refresh without replacing text",
            "returned report submissions previewable and previous snapshots preserved",
            "supervisor/admin cannot act; view-only storage stays identical",
            "original twelve reports and independent HS-002 unchanged",
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
