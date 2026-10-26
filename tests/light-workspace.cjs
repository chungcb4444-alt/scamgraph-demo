const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
const assert = require("node:assert/strict"),
  fs = require("node:fs")
const out = process.env.TEST_OUTPUT || "docs/ravao-review"
fs.mkdirSync(out, { recursive: true })
const rgb = (value) =>
  value
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number)
const luminance = (rgb) =>
  rgb
    .map((c) => {
      c /= 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a, b) => {
  let x = luminance(rgb(a)),
    y = luminance(rgb(b))
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
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
      const page = await context.newPage()
      const errors = []
      page.on("pageerror", (e) => errors.push(e.message))
      await page.goto(process.env.DEMO_URL || "http://127.0.0.1:8444/", {
        waitUntil: "networkidle",
      })
      assert(
        await page
          .getByRole("heading", { name: "Kết nối dữ liệu. Làm rõ dấu vết." })
          .isVisible(),
      )
      assert.equal(await page.locator(".access-flow li").count(), 3)
      await page.getByRole("button", { name: "Đăng nhập", exact: true }).click()
      const navigation = await page.locator("nav button").allTextContents()
      for (const name of [
        "Tổng quan",
        "Phản ánh",
        "Phân tích liên kết",
        "Cảnh báo",
        "Hồ sơ vụ việc",
        "Tài khoản và phân quyền",
        "Nhật ký hệ thống",
      ])
        assert(
          navigation.some((v) => v.includes(name)),
          name + " still accessible",
        )
      assert.equal(
        await page
          .locator(".sidebar")
          .evaluate((e) => getComputedStyle(e).backgroundColor),
        "rgb(255, 255, 255)",
      )
      assert.equal(
        await page
          .locator(".card")
          .first()
          .evaluate((e) => getComputedStyle(e).backgroundColor),
        "rgb(255, 255, 255)",
      )
      await page.locator("nav button").filter({ hasText: "Phản ánh" }).click()
      const headers = await page
        .locator("th")
        .evaluateAll((es) =>
          es.map((e) => ({
            text: e.textContent,
            color: getComputedStyle(e).color,
            background: getComputedStyle(e).backgroundColor,
          })),
        )
      for (const header of headers) {
        assert.equal(
          header.background,
          "rgb(25, 72, 157)",
          header.text + " header remains blue",
        )
        assert(
          contrast(header.color, header.background) >= 4.5,
          header.text + " contrast",
        )
      }
      const input = await page
        .getByPlaceholder("Tìm theo mã hoặc tiêu đề...")
        .evaluate((e) => ({
          color: getComputedStyle(e).color,
          bg: getComputedStyle(e).backgroundColor,
        }))
      assert(contrast(input.color, input.bg) >= 4.5)
      assert.equal(await page.locator("tbody tr").count(), 12)
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
      assert.deepEqual(errors, [])
      results.push({
        viewport: `${width}x${height}`,
        result: "PASS",
        checks: [
          "white sidebar and cards",
          "reference-style process overview",
          "all seven existing navigation entries",
          "all table headers including sticky action column blue",
          "header and input contrast >=4.5",
          "initial 12 reports retained",
          "no horizontal page overflow",
          "no browser errors",
        ],
      })
      await context.close()
    }
    fs.writeFileSync(
      `${out}/light-style-results.json`,
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
