"use client"
import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Star } from "lucide-react"
import { useModeStore, THEMES } from "../lib/mode"

export default function FeedbackFab() {
  const { mode } = useModeStore()
  const theme = THEMES[mode]
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
      const res = await fetch("/api/feedback", {
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
            className="grid h-12 w-12 place-items-center rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-md transition"
            style={{ boxShadow: `0 0 18px ${theme.glow}`, color: theme.accent }}
            title="Feedback geben"
          >
            <Star size={18} />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[460px] bg-[#0f0f10]/90 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Feedback</DialogTitle>
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
                    style={{ color: active ? theme.accent : "#525252" }}
                    fill={active ? theme.accent : "none"}
                  />
                </button>
              )
            })}
            <span className="ml-2 text-sm text-zinc-400">{rating}/5</span>
          </div>

          {/* Message */}
          <div className="mt-3 space-y-1">
            <Label htmlFor="msg">Dein Feedback (optional)</Label>
            <Textarea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Was ist gut? Was fehlt? Bugs?"
              className="min-h-[100px] bg-zinc-900/70 border-zinc-800"
              maxLength={1000}
            />
          </div>

          {/* Email optional */}
          <div className="mt-3 space-y-1">
            <Label htmlFor="email">E-Mail (optional, für Rückfragen)</Label>
            <Input id="email" ref={emailRef} className="bg-zinc-900/70 border-zinc-800" type="email" />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Mode: {mode}</span>
            <button
              onClick={submit}
              disabled={sending || rating === 0}
              className="rounded-md px-4 py-2 text-sm font-medium transition border"
              style={{
                color: sending ? "#999" : "#0b0b0b",
                background: sending ? "#2a2a2a" : theme.accent,
                borderColor: "#222",
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? "Senden..." : "Absenden"}
            </button>
          </div>

          {done === "ok" && <div className="text-lime-400 text-sm mt-2">Danke! Feedback gesendet.</div>}
          {done === "err" && <div className="text-red-400 text-sm mt-2">Senden fehlgeschlagen.</div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}


