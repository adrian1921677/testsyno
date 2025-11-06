"use client"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Star } from "lucide-react"
import { useModeStore, THEMES } from "../lib/mode"
import { useTranslation } from "../lib/i18n"
import { useSettingsStore } from "../lib/settings"

export default function FeedbackFab() {
  const { mode } = useModeStore()
  const theme = THEMES[mode]
  const t = useTranslation()
  const appTheme = useSettingsStore((state) => state.theme)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const emailRef = useRef<HTMLInputElement>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<null | "ok" | "err">(null)

  async function submit() {
    setSending(true)
    setDone(null)
    try {
      const res = await fetch("/api/syno/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          message,
          email: emailRef.current?.value || undefined,
          mode,
          ua: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setDone("ok")
        setRating(0)
        setMessage("")
        if (emailRef.current) emailRef.current.value = ""
        setTimeout(() => setOpen(false), 900)
      } else setDone("err")
    } catch {
      setDone("err")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            aria-label="Feedback"
            className={`grid h-12 w-12 place-items-center rounded-full border backdrop-blur-md transition ${
              appTheme === "light"
                ? "border-gray-300 bg-white/90"
                : "border-zinc-800 bg-zinc-900/80"
            }`}
            style={{ boxShadow: `0 0 18px ${theme.glow}`, color: theme.accent }}
            title={t("feedback.title")}
          >
            <Star size={18} />
          </button>
        </DialogTrigger>
        <DialogContent className={`sm:max-w-[460px] backdrop-blur-xl ${
          appTheme === "light"
            ? "bg-white/95 border-gray-200 text-gray-900"
            : "bg-[#0f0f10]/90 border-zinc-800 text-white"
        }`}>
          <DialogHeader>
            <DialogTitle>{t("feedback.title")}</DialogTitle>
          </DialogHeader>

          {/* Stars */}
          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const idx = i + 1
              const active = (hover ?? rating) >= idx
              return (
                <button
                  key={idx}
                  onMouseEnter={() => setHover(idx)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setRating(idx)}
                  className="p-1"
                  title={`${idx} Sterne`}
                >
                  <Star
                    size={22}
                    style={{ color: active ? theme.accent : appTheme === "light" ? "#9ca3af" : "#525252" }}
                    fill={active ? theme.accent : "none"}
                  />
                </button>
              )
            })}
            <span className={`ml-2 text-sm ${
              appTheme === "light" ? "text-gray-500" : "text-zinc-400"
            }`}>{rating}/5</span>
          </div>

          {/* Message */}
          <div className="mt-3 space-y-1">
            <Label htmlFor="msg">{t("feedback.message")}</Label>
            <Textarea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("feedback.messagePlaceholder")}
              className={`min-h-[100px] ${
                appTheme === "light"
                  ? "bg-gray-50 border-gray-300"
                  : "bg-zinc-900/70 border-zinc-800"
              }`}
              maxLength={1000}
            />
          </div>

          {/* Email optional */}
          <div className="mt-3 space-y-1">
            <Label htmlFor="email">{t("feedback.email")}</Label>
            <Input 
              id="email" 
              ref={emailRef} 
              className={appTheme === "light" ? "bg-gray-50 border-gray-300" : "bg-zinc-900/70 border-zinc-800"} 
              type="email"
              placeholder={t("feedback.emailPlaceholder")}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className={`text-xs ${
              appTheme === "light" ? "text-gray-500" : "text-zinc-500"
            }`}>Mode: {mode}</span>
            <button
              onClick={submit}
              disabled={sending || rating === 0}
              className={`rounded-md px-4 py-2 text-sm font-medium transition border ${
                appTheme === "light"
                  ? "border-gray-300"
                  : "border-gray-800"
              }`}
              style={{
                color: sending 
                  ? appTheme === "light" ? "#6b7280" : "#999"
                  : appTheme === "light" ? "#111" : "#0b0b0b",
                background: sending 
                  ? appTheme === "light" ? "#e5e7eb" : "#2a2a2a"
                  : theme.accent,
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? t("feedback.sending") : t("feedback.submit")}
            </button>
          </div>

          {done === "ok" && (
            <div className={`text-sm mt-2 ${
              appTheme === "light" ? "text-green-600" : "text-lime-400"
            }`}>{t("feedback.success")}</div>
          )}
          {done === "err" && (
            <div className={`text-sm mt-2 ${
              appTheme === "light" ? "text-red-600" : "text-red-400"
            }`}>{t("feedback.error")}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


