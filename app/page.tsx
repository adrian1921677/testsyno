"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Settings } from "lucide-react"
import Sidebar from "./components/Sidebar"
import { useCalcStore } from "./lib/store"
import ModeSwitch from "./components/ModeSwitch"
import { useModeStore, THEMES, type Mode } from "./lib/mode"
import { evalByMode } from "./lib/eval"
import { detectModeFromInput } from "./lib/detectMode"
import AnimatedBackdrop from "./components/AnimatedBackdrop"
import { SYMBOLS_COMMON, getFunctionGroups, getExamples, type InsertItem, type FunctionGroup } from "./lib/functions"
import FeedbackFab from "./components/FeedbackFab"

export default function Page() {
  const [input, setInput] = useState("")
  const [confirmed, setConfirmed] = useState<string | null>(null)
  const [lastValidResult, setLastValidResult] = useState<{ display: string; expr: string } | null>(null)
  const [autoCorrected, setAutoCorrected] = useState<string | null>(null)
  const [modeDetected, setModeDetected] = useState<Mode | null>(null)
  const { add, entries, setCurrentIndex } = useCalcStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const { mode, setMode } = useModeStore()
  const theme = THEMES[mode]

  // Compute mit intelligenter Auto-Detection - IMMER aktiviert
  const computed = useMemo(() => {
    if (!input.trim()) return null
    try {
      // 🧠 UNIVERSALER RECHNER: Immer Auto-Detection verwenden (Mode wird automatisch erkannt)
      const result = evalByMode(input, "basic", true) // Auto-Detection IMMER aktiviert
      
      // Visuelles Feedback: Zeige erkannten Modus an
      if (result.detectedMode && result.display !== "Error") {
        setModeDetected(result.detectedMode)
        // Automatisch zum erkannten Modus wechseln (für Theme & Formatierung)
        setTimeout(() => {
          setMode(result.detectedMode)
        }, 100)
      } else if (!input.trim()) {
        setModeDetected(null)
      }
      
      // Wenn erfolgreich: letztes gültiges Ergebnis speichern
      if (result.display !== "Error") {
        setLastValidResult({ display: result.display, expr: result.expr })
        setAutoCorrected(result.expr !== input.trim() ? result.expr : null)
      }
      return result
    } catch {
      return { expr: "", raw: "Error", display: "Error", detectedMode: "basic", wasAutoDetected: false }
    }
  }, [input]) // Mode als Dependency entfernt - nur input reicht

  // Input-Status für Farb-Feedback
  const inputStatus = useMemo(() => {
    if (!input.trim()) return "neutral" // neutral/gelb/grün/rot
    if (computed?.display === "Error") return "error"
    if (computed && computed.display !== "Error") return "valid"
    return "warning" // unvollständig
  }, [input, computed])

  // Animated glow intensity (reaktiv aufs Ergebnis)
  const glow = useMotionValue(0)
  const glowSpring = useSpring(glow, { stiffness: 120, damping: 18 })
  useEffect(() => {
    if (!computed) return
    glow.set(computed.display === "Error" ? 0 : 1)
    const t = setTimeout(() => glow.set(0.25), 250)
    return () => clearTimeout(t)
  }, [computed, glow])

  // Input-Animation bei Fehler (leichtes Wackeln)
  const [shake, setShake] = useState(0)
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    if (computed?.display === "Error" && input.trim()) {
      setShake(1)
      const t = setTimeout(() => setShake(0), 500)
      return () => clearTimeout(t)
    } else if (computed && computed.display !== "Error") {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 600)
      return () => clearTimeout(t)
    }
  }, [computed, input])

  // Keyboard recall
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && entries.length > 0) {
        e.preventDefault()
        setInput(entries[0].expr)
        setCurrentIndex(0)
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setInput("")
        setCurrentIndex(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [entries, setCurrentIndex])

  function confirm() {
    if (!computed || computed.display === "Error") return
    add({ expr: input.trim(), normalized: computed.expr, result: String(computed.raw) })
    setConfirmed(computed.display)
  }
  function onEnter(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") confirm()
  }

  // Insert helper: schreibt text, positioniert Cursor (offset relativ zum Insert)
  function insertAtCursor(text: string, cursorOffset = 0) {
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const newVal = el.value.slice(0, start) + text + el.value.slice(end)
    setInput(newVal)
    const pos = start + cursorOffset
    requestAnimationFrame(() => el.setSelectionRange(pos, pos))
    el.focus()
  }

  // Dynamische Funktionen & Examples basierend auf erkanntem Modus
  const effectiveMode: Mode = (computed?.detectedMode || mode) as Mode
  const functionGroups = getFunctionGroups(effectiveMode)
  const examples = getExamples(effectiveMode)

  return (
    <main className="relative grid h-dvh w-full grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden bg-[#0b0b0b] text-white">
      {/* Neuer animierter Hintergrund */}
      <AnimatedBackdrop />

      {/* Main column */}
      <section className="relative z-10 flex items-center justify-center">
        {/* Header */}
        <header className="absolute top-5 left-0 right-0 mx-auto flex w-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <motion.div
              layout
              className="grid h-8 w-8 place-items-center rounded-md bg-zinc-900/70 ring-1 ring-zinc-800"
            >
              <motion.span
                key={`s-${mode}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="font-black"
                style={{ color: theme.accent }}
              >
                S
              </motion.span>
            </motion.div>
            <span className="text-lg font-semibold tracking-wide text-zinc-100">Syno</span>
            <motion.span
              key={`badge-${mode}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="ml-2 rounded px-2 py-0.5 text-xs text-zinc-300 ring-1 ring-zinc-700"
              style={{ background: `${theme.glow}` }}
            >
              {computed?.detectedMode ? computed.detectedMode.toUpperCase() : mode.toUpperCase()}
              <span className="ml-1.5 text-zinc-400">🔍</span>
            </motion.span>
            {/* ModeSwitch optional - kann später wieder eingeblendet werden */}
            {/* <div className="ml-3">
              <ModeSwitch />
            </div> */}
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900/70 px-3 py-1.5 text-sm text-zinc-300 ring-1 ring-zinc-800 hover:text-white"
            title="Settings (coming soon)"
          >
            <Settings size={16} />
            Settings
          </button>
        </header>

        {/* Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="relative">
          <Card className="w-[640px] bg-[#0f0f10]/80 backdrop-blur-md border border-zinc-800"
                style={{ boxShadow: `0 0 40px ${theme.glow}` }}>
            <CardContent className="p-6">
              <motion.div
                animate={{
                  x: shake ? [-4, 4, -4, 4, 0] : 0,
                  scale: pulse ? [1, 1.01, 1] : 1,
                }}
                transition={{ duration: shake ? 0.3 : pulse ? 0.6 : 0 }}
              >
                <motion.div
                  animate={{
                    boxShadow: pulse
                      ? [`0 0 20px ${theme.glow}`, `0 0 30px ${theme.glow}`, `0 0 20px ${theme.glow}`]
                      : inputStatus === "error"
                      ? ["0 0 10px rgba(239, 68, 68, 0.3)", "0 0 15px rgba(239, 68, 68, 0.5)", "0 0 10px rgba(239, 68, 68, 0.3)"]
                      : undefined,
                  }}
                  transition={{ duration: 0.3, repeat: pulse || inputStatus === "error" ? 1 : 0 }}
                  className="rounded-md"
                >
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      setAutoCorrected(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setInput("")
                        inputRef.current?.focus()
                      } else {
                        onEnter(e)
                      }
                    }}
                    placeholder="Eingabe: 20% von 12, 2 + 10, sin(30°), npv(0.08, -1000, 400), 0xFF..."
                    className={`bg-zinc-900/70 text-xl placeholder:text-zinc-500 border-zinc-700 focus-visible:ring-2 transition-all ${
                      inputStatus === "error"
                        ? "border-[#3a0b0b] focus-visible:ring-red-500"
                        : inputStatus === "valid"
                        ? "border-green-500/50 focus-visible:ring-green-500"
                        : inputStatus === "warning"
                        ? "border-yellow-500/30 focus-visible:ring-yellow-500"
                        : ""
                    }`}
                    style={{
                      color: inputStatus === "error" ? "#ff4d4d" : inputStatus === "valid" ? theme.accent : theme.accent,
                      outlineColor:
                        inputStatus === "error"
                          ? "#ef4444"
                          : inputStatus === "valid"
                          ? theme.accent
                          : theme.accent,
                    }}
                    autoFocus
                  />
                </motion.div>
              </motion.div>

              {/* Auto-Korrektur Feedback */}
              {autoCorrected && computed && computed.display !== "Error" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-sm text-green-400/90 flex items-center gap-2"
                >
                  <span>✅</span>
                  <span>
                    Automatisch korrigiert in: <code className="px-1.5 py-0.5 rounded bg-green-950/40 text-green-300 font-mono">{autoCorrected}</code>
                  </span>
                </motion.div>
              )}

              {/* Auto-Mode-Detection Feedback - nur zeigen wenn Modus sich ändert */}
              {modeDetected && computed && computed.display !== "Error" && modeDetected !== mode && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-sm text-amber-400/90 flex items-center gap-2"
                >
                  <span>🔍</span>
                  <span>
                    Automatisch erkannt: <span className="font-semibold">{modeDetected.toUpperCase()}</span>
                  </span>
                </motion.div>
              )}

              {/* Fehler-Hilfe mit klickbaren Alternativen */}
              {computed?.display === "Error" && input.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm"
                >
                  <div className="flex items-start gap-2 text-amber-400/90 mb-2">
                    <span>⚠️</span>
                    <span>
                      Syntaxfehler – das sieht nicht nach einer gültigen Formel aus. Versuch z. B.:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <button
                      onClick={() => setInput("50 / 7")}
                      className="px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/70 text-zinc-300 hover:border-amber-500/50 hover:text-amber-300 transition text-sm font-mono"
                    >
                      50 / 7
                    </button>
                    <button
                      onClick={() => setInput("50 geteilt durch 7")}
                      className="px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/70 text-zinc-300 hover:border-amber-500/50 hover:text-amber-300 transition text-sm"
                    >
                      50 geteilt durch 7
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Symbol Toolbar (immer gleich) */}
              <div className="mt-2 flex flex-wrap gap-2 text-lg text-zinc-300">
                {SYMBOLS_COMMON.map((item: InsertItem) => {
                  const { label, insert, caret } = item
                  return (
                    <button
                      key={label}
                      onClick={() => insertAtCursor(insert, caret ? caret : insert.length)}
                      className="rounded-md border border-zinc-700/70 bg-zinc-900/60 px-2 py-1 transition text-base hover:scale-105"
                      onMouseEnter={(e) => ((e.currentTarget.style.borderColor = theme.accent), (e.currentTarget.style.color = theme.accent))}
                      onMouseLeave={(e) => ((e.currentTarget.style.borderColor = ""), (e.currentTarget.style.color = ""))}
                      title={`Einfügen: ${insert}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Functions Toolbar – strikt nach Mode */}
              {functionGroups.map((grp: FunctionGroup, idx) => (
                <div key={grp.title} className="mt-3">
                  {idx > 0 && <div className="mb-2 h-px bg-zinc-800/50" />}
                  <div className="mb-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    {grp.title}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
                    {grp.items.map((item: InsertItem) => {
                      const { label, insert, caret } = item
                      return (
                        <button
                          key={label}
                          onClick={() => insertAtCursor(insert, caret ?? insert.length)}
                          className="rounded-md border border-zinc-700/70 bg-zinc-900/60 px-2 py-1 transition hover:scale-105"
                          onMouseEnter={(e) => ((e.currentTarget.style.borderColor = theme.accent), (e.currentTarget.style.color = theme.accent))}
                          onMouseLeave={(e) => ((e.currentTarget.style.borderColor = ""), (e.currentTarget.style.color = ""))}
                          title={
                            label.includes("()")
                              ? `${label.replace("()", "")}(x) = ${grp.title === "Standard" ? "mathematische Funktion" : label}`
                              : `Einfügen: ${insert}`
                          }
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Examples */}
              <div className="mt-3 flex flex-wrap gap-2">
                {examples.map((ex: string) => (
                  <button
                    key={ex}
                    onClick={() => setInput(ex)}
                    className="rounded-full border border-zinc-700/70 bg-zinc-900/60 px-3 py-1 text-sm text-zinc-300 transition"
                    onMouseEnter={(e) => ((e.currentTarget.style.borderColor = theme.accent), (e.currentTarget.style.color = "#fff"))}
                    onMouseLeave={(e) => ((e.currentTarget.style.borderColor = ""), (e.currentTarget.style.color = ""))}
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {/* Live result - visuell getrennt */}
              {computed && (
                <motion.div
                  key={`${computed.display}-${mode}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`mt-5 rounded-lg border px-4 py-3 ${
                    computed.display === "Error"
                      ? "bg-red-950/20 border-red-900/40"
                      : "bg-zinc-900/40 border-zinc-700/50"
                  }`}
                  style={{
                    boxShadow:
                      computed.display === "Error"
                        ? "0 0 20px rgba(239, 68, 68, 0.15)"
                        : `0 0 30px ${theme.glow}`,
                  }}
                >
                  <div className="text-right">
                    <div
                      className="text-4xl font-semibold"
                      style={{
                        color: computed.display === "Error" ? "#ff4d4d" : theme.accent,
                        textShadow: computed.display === "Error" ? "none" : `0 0 10px ${theme.glow}`,
                      }}
                    >
                      = {computed.display}
                    </div>
                    {/* Normalisierter Ausdruck */}
                    {computed.expr && computed.expr !== input.trim() && computed.display !== "Error" && (
                      <div className="mt-1 text-xs text-zinc-500 font-mono italic">
                        {computed.expr}
                      </div>
                    )}
                    {/* Fehler: zeige Versuch und letztes gültiges Ergebnis */}
                    {computed.display === "Error" && (
                      <div className="mt-2 space-y-1">
                        {computed.expr && (
                          <div className="text-xs text-zinc-500 font-mono italic opacity-70">
                            Versuch: {computed.expr}
                          </div>
                        )}
                        {lastValidResult && (
                          <div className="text-xs text-zinc-400 italic">
                            Letztes gültiges Ergebnis: <span className="text-zinc-300 font-semibold">{lastValidResult.display}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {confirmed && computed && confirmed !== computed.display && (
                <div className="mt-2 text-right text-sm text-zinc-500">
                  Bestätigt: <span className="text-zinc-300">{confirmed}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <footer className="absolute bottom-5 left-0 right-0 mx-auto flex w-full max-w-5xl items-center justify-center px-6">
          <div className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
            <span className="font-medium">Tastenkürzel:</span> Enter = berechnen · ↑ = Verlauf · ↓ = löschen · Esc = Eingabe löschen
          </div>
        </footer>
      </section>

      {/* Sidebar */}
      <Sidebar onPick={(expr) => setInput(expr)} />

      {/* Feedback */}
      <FeedbackFab />
    </main>
  )
}
