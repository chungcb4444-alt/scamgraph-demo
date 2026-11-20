const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/report-people-review"
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  const results = []
  try {
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } })
      const page = await context.newPage(),
        errors = []
      page.on("pageerror", (e) => errors.push(e.message))
      page.setDefaultTimeout(10000)
      const button = (name) => page.getByRole("button", { name, exact: true })
      const nav = (name) =>
        page.locator("nav button").filter({ hasText: name }).click()
      const data = () =>
        page.evaluate(() =>
          JSON.parse(localStorage.getItem("scamgraph-demo-reports")),
        )
      const snap = async (name) => {
        await page.waitForTimeout(350)
        await page.screenshot({
          path: `${out}/${width}-${name}.png`,
          fullPage: name.includes("full"),
        })
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
      }
      await page.goto(process.env.DEMO_URL || "http://127.0.0.1:8444/")
      await button("Tài khoản Cán bộ").click()
      await button("Đăng nhập").click()
      const baseline = await data()
      assert.equal(baseline.length, 12)
      await nav("Phản ánh")
      await page
        .getByRole("columnheader", { name: "Người gửi phản ánh", exact: true })
        .waitFor()
      assert.equal(
        await page
          .getByRole("columnheader", {
            name: "Người gửi phản ánh",
            exact: true,
          })
          .count(),
        1,
      )
      await snap("list-dark")
      await page
        .getByPlaceholder("Tìm theo mã hoặc tiêu đề...")
        .fill("tran thi mai")
      await page
        .getByRole("button", {
          name: "Xem người gửi PA-002: Lê Văn Phúc",
          exact: true,
        })
        .waitFor({ state: "detached" })
      assert.equal(await page.locator("tbody tr").count(), 1)
      await button("Xem người gửi PA-001: Trần Thị Mai").click()
      assert.equal(await page.locator(".detail-code").innerText(), "PA-001")
      assert(
        (await page.locator(".report-people").innerText()).includes(
          "Hoàng Anh",
        ),
      )
      assert(
        !(await page.locator(".report-people").innerText()).includes(
          "0912 367 281",
        ),
      )
      assert.equal(
        await page
          .getByLabel("Tài khoản ngân hàng", { exact: true })
          .inputValue(),
        "•••• ••••",
      )
      await snap("detail-dark")
      await button("Hiện liên hệ người gửi").focus()
      await page.keyboard.press("Enter")
      assert(
        (await page.locator(".report-people").innerText()).includes(
          "0912 367 281",
        ),
      )
      await page.evaluate(() => window.scrollTo(0, 380))
      await snap("people-revealed-dark")
      await button("Ẩn liên hệ người gửi").click()
      await button("Hiện số liên hệ bên bị phản ánh").click()
      assert.equal(
        await page.getByLabel("Số điện thoại", { exact: true }).inputValue(),
        "DEMO-SDT-001",
      )
      await page
        .getByLabel("Số điện thoại", { exact: true })
        .fill("DEMO-SDT-EDIT-DRAFT")
      await button("Ẩn Số điện thoại trích xuất").click()
      await button("Hiện Số điện thoại trích xuất").click()
      assert.equal(
        await page.getByLabel("Số điện thoại", { exact: true }).inputValue(),
        "DEMO-SDT-EDIT-DRAFT",
      )
      await page
        .getByLabel("Số điện thoại", { exact: true })
        .fill("DEMO-SDT-001")
      // Auto-hide does not discard a user's extraction draft.
      await page.clock.install()
      await button("Hiện liên hệ người gửi").click()
      await page.clock.runFor(45010)
      assert.equal(await button("Hiện liên hệ người gửi").count(), 1)
      await button("Hiện liên hệ người gửi").click()
      await page.evaluate(() => window.dispatchEvent(new Event("blur")))
      assert.equal(await button("Hiện liên hệ người gửi").count(), 1)
      await page.clock.resume()
      await button("Chuyển sang giao diện sáng").click()
      await page.evaluate(() => window.scrollTo(0, 0))
      await snap("detail-light-full")
      await page
        .getByLabel("Tên / danh xưng bên bị phản ánh", { exact: true })
        .fill("Tên tự xưng được kiểm tra (mô phỏng)")
      await button("Lưu thông tin đã kiểm tra").click()
      assert.equal((await data())[0].cluster, "CUM-001")
      assert.equal(
        (await data())[0].people.subjectName,
        "Tên tự xưng được kiểm tra (mô phỏng)",
      )
      await page.reload()
      assert(
        (await page.locator(".report-people").innerText()).includes(
          "Tên tự xưng được kiểm tra",
        ),
      )
      assert.equal(await button("Hiện liên hệ người gửi").count(), 1)
      const saved = await data()
      for (const r of saved) {
        const original = baseline.find((x) => x.id === r.id)
        assert.equal(r.amount, original.amount)
        assert.equal(r.cluster, original.cluster)
        assert.equal(r.account, original.account)
        assert.equal(r.phone, original.phone)
      }
      const logs = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("scamgraph-demo-logs")),
      )
      assert(
        logs.some(
          (l) => l.action === "Xem thông tin đã che" && l.target === "PA-001",
        ),
      )
      assert(logs.some((l) => l.action === "Cập nhật bên bị phản ánh"))
      assert(!logs.some((l) => (l.detail || "").includes("0912 367 281")))
      // Legacy sessions gain display-only metadata without overwriting their saved data.
      await page.evaluate(() => {
        const reports = JSON.parse(
          localStorage.getItem("scamgraph-demo-reports"),
        )
        for (const r of reports) {
          delete r.people
          delete r.senderName
          delete r.senderContact
        }
        reports.find((r) => r.id === "PA-002").title =
          "Nội dung do người dùng sửa"
        localStorage.setItem("scamgraph-demo-reports", JSON.stringify(reports))
        localStorage.setItem("scamgraph-demo-screen", JSON.stringify("reports"))
      })
      await page.reload()
      await button("Xem người gửi PA-001: Trần Thị Mai").click()
      assert(
        (await page.locator(".report-people").innerText()).includes(
          "Trần Thị Mai",
        ),
      )
      assert(!(await data())[0].people)
      await nav("Phản ánh")
      await button("Xem người gửi PA-002: Chưa cung cấp").click()
      assert(
        !(await page.locator(".report-people").innerText()).includes(
          "Lê Văn Phúc",
        ),
      )
      await page.evaluate(() => {
        const reports = JSON.parse(
          localStorage.getItem("scamgraph-demo-reports"),
        )
        reports.push({
          ...reports[0],
          id: "PA-013",
          title: "Yêu cầu xác minh tài khoản qua website đáng ngờ",
          senderName: "Nguyễn Hoàng Minh",
          senderContact: "DEMO-LIEN-HE-013",
          submittedBy: "cong.dan.demo",
          cluster: undefined,
        })
        localStorage.setItem("scamgraph-demo-reports", JSON.stringify(reports))
        localStorage.setItem(
          "scamgraph-demo-selected-report",
          JSON.stringify("PA-013"),
        )
      })
      await page.reload()
      assert(
        (await page.locator(".report-people").innerText()).includes(
          "Hỗ Trợ",
        ) === false,
        "social account remains masked",
      )
      assert(
        (await page.locator(".report-people").innerText()).includes("tên Đức"),
      )
      assert.deepEqual(errors, [])
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "sender search and keyboard navigation",
          "masked contacts, accounts, narrative and extraction inputs",
          "reveal/hide/45s timeout/window blur/reload",
          "draft preservation",
          "new party name persistence and audit",
          "seed counts, amounts, graph entities unchanged",
          "legacy metadata without destructive migration",
          "unknown identities remain unknown",
          "light and dark layouts without page overflow",
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
  process.exit(1)
})
