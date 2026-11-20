import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

const PrivacyContext = createContext({
  visible: new Set<string>(),
  toggle: (_key: string, _label: string) => {},
  hide: () => {},
  allowReveal: true,
})
export const useReportPrivacy = () => useContext(PrivacyContext)

export default function ReportPrivacy({
  children,
  onReveal,
  allowReveal = true,
}: {
  children: ReactNode
  allowReveal?: boolean
  onReveal?: (label: string) => void
}) {
  const [visible, setVisible] = useState(new Set<string>())
  const hide = () => setVisible(new Set())
  useEffect(() => {
    if (!visible.size) return
    const timer = window.setTimeout(hide, 45000)
    const hidden = () => {
      if (document.hidden) hide()
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide()
    }
    window.addEventListener("blur", hide)
    document.addEventListener("visibilitychange", hidden)
    document.addEventListener("keydown", escape)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("blur", hide)
      document.removeEventListener("visibilitychange", hidden)
      document.removeEventListener("keydown", escape)
    }
  }, [visible])
  const toggle = (key: string, label: string) => {
    if (!allowReveal) return
    if (!visible.has(key)) onReveal?.(label)
    setVisible((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  return (
    <PrivacyContext.Provider value={{ visible, toggle, hide, allowReveal }}>
      {children}
    </PrivacyContext.Provider>
  )
}
