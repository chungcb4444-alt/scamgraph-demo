const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/polish-review"
fs.mkdirSync(out, { recursive: true })
;(async () => {
  let b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  let result = []
  try {
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
    ]) {
      let c = await b.newContext({ viewport: { width, height } }),
        p = await c.newPage(),
        errors = []
      p.on("pageerror", (e) => errors.push(e.message))
      await p.goto(process.env.DEMO_URL || "http://127.0.0.1:8444/")
      await p
        .getByRole("button", { name: "Tài khoản Cán bộ", exact: true })
        .click()
      await p.getByRole("button", { name: "Đăng nhập", exact: true }).click()
      const nav = async (name) =>
        p.locator("nav button").filter({ hasText: name }).click()
      await nav("Phản ánh")
      await p
        .getByRole("button", { name: "Tiếp nhận phản ánh", exact: true })
        .click()
      await p.getByRole("button", { name: "Tiếp tục", exact: true }).click()
      await p.evaluate(() => {
        window.scrollCalls = 0
        window.originalScroll = Element.prototype.scrollIntoView
        Element.prototype.scrollIntoView = function (...args) {
          window.scrollCalls++
          return window.originalScroll.apply(this, args)
        }
      })
      await p.getByRole("button", { name: "Tiếp tục", exact: true }).click()
      await p.waitForTimeout(650)
      assert.equal(await p.evaluate(() => window.scrollCalls), 1)
      await p.getByLabel("Tiêu đề", { exact: true }).scrollIntoViewIfNeeded()
      await p.evaluate(() => (window.scrollCalls = 0))
      await p
        .getByLabel("Tiêu đề", { exact: true })
        .pressSequentially("Sự việc đang được nhập, chưa hoàn tất", {
          delay: 8,
        })
      await p
        .getByLabel("Nội dung sự việc", { exact: true })
        .fill("Nội dung nhập tiếp trong khi các trường khác vẫn còn thiếu.")
      await p.waitForTimeout(400)
      assert.equal(
        await p.evaluate(() => window.scrollCalls),
        0,
        "typing must never trigger error summary scrolling",
      )
      assert.equal(
        await p.getByLabel("Nội dung sự việc", { exact: true }).inputValue(),
        "Nội dung nhập tiếp trong khi các trường khác vẫn còn thiếu.",
      )
      await p.screenshot({ path: `${out}/${width}-incident.png` })
      await nav("Cảnh báo")
      await p.waitForTimeout(400)
      assert.equal(await p.locator(".alert-row").count(), 3)
      await p.screenshot({ path: `${out}/${width}-alerts-dark.png` })
      const dataBefore = await p.evaluate(() =>
        localStorage.getItem("scamgraph-demo-reports"),
      )
      await p.locator(".alert-row").first().click()
      assert(await p.getByRole("dialog").isVisible())
      await p.screenshot({ path: `${out}/${width}-alert-detail.png` })
      await p.keyboard.press("Escape")
      assert.equal(await p.getByRole("dialog").count(), 0)
      await p
        .getByRole("button", { name: "Chuyển sang giao diện sáng" })
        .click()
      await p.waitForTimeout(400)
      await p.screenshot({ path: `${out}/${width}-alerts-light.png` })
      await p.getByLabel("Lọc mức độ cảnh báo").selectOption("Thấp")
      assert.equal(await p.locator(".alert-row").count(), 1)
      assert((await p.locator(".alert-side").innerText()).includes("30 triệu"))
      assert.equal(
        await p.evaluate(() => localStorage.getItem("scamgraph-demo-reports")),
        dataBefore,
      )
      assert.equal(
        await p.locator("h1").evaluate((e) => getComputedStyle(e).fontSize),
        "30px",
      )
      assert.equal(
        await p
          .locator("nav button")
          .first()
          .evaluate((e) => getComputedStyle(e).fontSize),
        "15px",
      )
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      assert.deepEqual(errors, [])
      result.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "scroll on failed validation only",
          "no scrolling while editing remaining errors",
          "draft content retained",
          "three alerts and level filter",
          "same modal and source data",
          "dark and light alerts",
          "30px title / 15px navigation",
          "no overflow or page errors",
        ],
      })
      await c.close()
    }
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(result, null, 2))
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
