const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict"),
  fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/fluent-review"
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
      [390, 844],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } })
      const page = await context.newPage()
      const errors = [],
        external = []
      page.on("pageerror", (e) => errors.push(e.message))
      page.on("request", (r) => {
        if (
          !r.url().startsWith("http://127.0.0.1:8444") &&
          !r.url().startsWith("data:")
        )
          external.push(r.url())
      })
      await page.goto(process.env.DEMO_URL || "http://127.0.0.1:8444", {
        waitUntil: "networkidle",
      })
      assert.equal(await page.locator(".access-card").count(), 1)
      assert.equal(await page.locator(".login-aside").count(), 0)
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      await page.screenshot({ path: `${out}/${width}-login.png` })
      await page
        .getByRole("button", { name: "Hiện mật khẩu", exact: true })
        .click()
      assert.equal(
        await page.getByLabel("Mật khẩu", { exact: true }).getAttribute("type"),
        "text",
      )
      await page
        .getByRole("button", { name: "Ẩn mật khẩu", exact: true })
        .click()
      await page
        .getByRole("button", { name: "Bạn quên mật khẩu?", exact: true })
        .click()
      assert((await page.getByRole("dialog").innerText()).includes("demo1234"))
      await page.keyboard.press("Escape")
      await page.getByLabel("Mật khẩu", { exact: true }).fill("sai-mat-khau")
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
      assert(await page.getByRole("alert").isVisible())
      assert.equal(await page.locator(".app-shell").count(), 0)
      await page
        .getByLabel("Vai trò demo", { exact: true })
        .selectOption({ label: "Người dân / Tổ chức" })
      assert.equal(
        await page.getByLabel("Tài khoản", { exact: true }).inputValue(),
        "cong.dan.demo",
      )
      await page.getByRole("button", { name: /Đăng nhập bằng VNeID/ }).click()
      assert(
        (await page.getByRole("dialog").innerText()).includes(
          "Không kết nối VNeID",
        ),
      )
      await page.screenshot({ path: `${out}/${width}-vneid.png` })
      await page.keyboard.press("Escape")
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
      assert.equal(
        await page.locator(".report-intake h1").innerText(),
        "Gửi phản ánh",
      )
      await page.getByRole("button", { name: "Đăng xuất", exact: true }).click()
      await page.getByRole("button", { name: /Đăng nhập bằng VNeID/ }).click()
      await page
        .getByRole("button", {
          name: "Tiếp tục bằng tài khoản demo",
          exact: true,
        })
        .click()
      assert(
        await page
          .getByRole("heading", { name: "Tổng quan công việc", exact: true })
          .isVisible(),
      )
      assert(
        !(await page.evaluate(() =>
          Object.values(localStorage).some((value) =>
            value.includes("demo1234"),
          ),
        )),
      )
      assert.deepEqual(errors, [])
      assert.deepEqual(external, [])
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "centered supplied design",
          "no page overflow at login",
          "password toggle",
          "forgot demo hint",
          "invalid sample rejected",
          "citizen role separate",
          "VNeID explicitly simulated and Escape",
          "demo entry works",
          "password not persisted",
          "no external requests",
          "no page errors",
        ],
      })
      await context.close()
    }
    fs.writeFileSync(
      `${out}/login-results.json`,
      JSON.stringify(results, null, 2),
    )
    console.log(JSON.stringify(results, null, 2))
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
