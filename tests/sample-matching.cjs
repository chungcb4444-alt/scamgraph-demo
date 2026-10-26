const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/html-sample-review"
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  })
  let results = []
  try {
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
      [390, 844],
    ]) {
      let context = await browser.newContext({ viewport: { width, height } }),
        p = await context.newPage(),
        errors = []
      p.on("pageerror", (e) => errors.push(e.message))
      await p.goto(process.env.DEMO_URL || "http://127.0.0.1:8444", {
        waitUntil: "networkidle",
      })
      assert.equal(await p.locator("html").getAttribute("data-theme"), "dark")
      await p.screenshot({ path: `${out}/${width}-landing-dark.png` })
      assert(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      await p
        .getByRole("button", { name: "Chuyển sang giao diện sáng" })
        .click()
      await p.screenshot({ path: `${out}/${width}-landing-light.png` })
      await p.reload()
      assert.equal(await p.locator("html").getAttribute("data-theme"), "light")
      await p
        .getByRole("button", { name: "Tài khoản Cán bộ", exact: true })
        .click()
      await p.screenshot({ path: `${out}/${width}-auth-light.png` })
      await p.getByRole("button", { name: "Hiện mật khẩu" }).click()
      assert.equal(
        await p.getByLabel("Mật khẩu", { exact: true }).getAttribute("type"),
        "text",
      )
      await p.getByLabel("Mật khẩu", { exact: true }).fill("sai")
      await p.getByRole("button", { name: "Đăng nhập", exact: true }).click()
      assert(await p.getByRole("alert").isVisible())
      await p
        .getByLabel("Vai trò demo", { exact: true })
        .selectOption({ label: "Người dân / Tổ chức" })
      await p.getByRole("button", { name: "Đăng nhập", exact: true }).click()
      assert.equal(
        await p.locator(".report-intake h1").innerText(),
        "Gửi phản ánh",
      )
      await p.getByRole("button", { name: "Đăng xuất", exact: true }).click()
      await p.getByRole("button", { name: "Chuyển sang giao diện tối" }).click()
      await p.getByRole("button", { name: /Đăng nhập bằng VNeID/ }).click()
      assert(
        (await p.getByRole("dialog").innerText()).includes(
          "Không kết nối VNeID",
        ),
      )
      await p.screenshot({ path: `${out}/${width}-vneid-dark.png` })
      await p.keyboard.press("Escape")
      await p
        .getByRole("button", { name: "Tài khoản Cán bộ", exact: true })
        .click()
      await p.screenshot({ path: `${out}/${width}-auth-dark.png` })
      await p.getByRole("button", { name: "Đăng nhập", exact: true }).click()
      if (width > 1000) {
        assert.equal(await p.locator("nav button").count(), 7)
        await p.waitForTimeout(400)
        await p.screenshot({ path: `${out}/${width}-dashboard-dark.png` })
        await p
          .getByRole("button", { name: "Chuyển sang giao diện sáng" })
          .click()
        await p.screenshot({ path: `${out}/${width}-dashboard-light.png` })
      }
      assert(
        !(await p.evaluate(() =>
          Object.values(localStorage).some((x) => x.includes("demo1234")),
        )),
      )
      await p.emulateMedia({ reducedMotion: "reduce" })
      assert.equal(
        await p
          .locator(".content > .page-stack")
          .evaluate((e) => getComputedStyle(e).animationName),
        "none",
      )
      assert.deepEqual(errors, [])
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "sample landing dark/light",
          "persistent appearance",
          "modal login/password/role",
          "VNeID explicit simulation and Escape",
          "existing seven modules",
          "reduced motion",
          "no password stored",
          "no browser errors",
        ],
      })
      await context.close()
    }
    fs.writeFileSync(
      `${out}/sample-results.json`,
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
