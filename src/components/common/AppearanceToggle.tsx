import { useEffect, useState } from "react"
const key = "scamgraph-appearance"
try {
  document.documentElement.dataset.theme =
    localStorage.getItem(key) === "light" ? "light" : "dark"
} catch {
  document.documentElement.dataset.theme = "dark"
}
export default function AppearanceToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme !== "light",
  )
  useEffect(() => {
    const refresh = () =>
      setDark(document.documentElement.dataset.theme !== "light")
    window.addEventListener("scamgraph-theme", refresh)
    return () => window.removeEventListener("scamgraph-theme", refresh)
  }, [])
  return (
    <button
      className="appearance-toggle"
      aria-label={
        dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
      }
      aria-pressed={dark}
      onClick={() => {
        const next = dark ? "light" : "dark"
        document.documentElement.dataset.theme = next
        try {
          localStorage.setItem(key, next)
        } catch {}
        window.dispatchEvent(new Event("scamgraph-theme"))
      }}
    >
      <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
    </button>
  )
}
