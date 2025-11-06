"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, Copy, Check, FileText, Upload } from "lucide-react"
import Sidebar from "./components/Sidebar"
import { useCalcStore } from "./lib/store"
import ModeSwitch from "./components/ModeSwitch"
import { useModeStore, THEMES, type Mode } from "./lib/mode"
import { evalByMode } from "./lib/eval"
import { detectModeFromInput } from "./lib/detectMode"
import AnimatedBackdrop from "./components/AnimatedBackdrop"
import { SYMBOLS_COMMON, getFunctionGroups, getExamples, type InsertItem, type FunctionGroup } from "./lib/functions"
import { useTranslation } from "./lib/i18n"
import { useSettingsStore } from "./lib/settings"
import FeedbackFab from "./components/FeedbackFab"
import SettingsDialog from "./components/SettingsDialog"
import ImageUpload from "./components/ImageUpload"

export default function Page() {
  const [input, setInput] = useState("")
  const [confirmed, setConfirmed] = useState<string | null>(null)
  const [lastValidResult, setLastValidResult] = useState<{ display: string; expr: string } | null>(null)
  const [autoCorrected, setAutoCorrected] = useState<string | null>(null)
  const [modeDetected, setModeDetected] = useState<Mode | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedSteps, setCopiedSteps] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const { add, entries, setCurrentIndex } = useCalcStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const { mode, setMode } = useModeStore()
  const baseTheme = THEMES[mode]
  const t = useTranslation()
  const { theme: appTheme } = useSettingsStore()
  
  // Theme-Farben anpassen für Light Mode: Glow wird blau statt grün
  const theme = appTheme === "light" && mode === "basic"
    ? {
        ...baseTheme,
        glow: "rgba(56,189,248,0.25)", // Blauer Glow für Light Mode
        blobA: "rgba(56,189,248,0.15)",
      }
    : baseTheme

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
  
  async function copyResult() {
    if (!computed || computed.display === "Error") return
    try {
      await navigator.clipboard.writeText(computed.display)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }
  
  function generateCalculationSteps(): string {
    if (!computed || computed.display === "Error") return ""
    
    const { expr, raw, display, detectedMode } = computed
    const originalInput = input.trim()
    const isEnglish = useSettingsStore.getState().language === "en"
    
    let steps: string[] = []
    
    // Original-Eingabe
    if (originalInput !== expr) {
      steps.push(isEnglish ? `Input: ${originalInput}` : `Eingabe: ${originalInput}`)
      steps.push(isEnglish ? `Normalized to: ${expr}` : `Normalisiert zu: ${expr}`)
    } else {
      steps.push(isEnglish ? `Input: ${expr}` : `Eingabe: ${expr}`)
    }
    
    steps.push("") // Leerzeile
    
    // Erklärungen für spezielle Funktionen
    if (detectedMode === "basic" || detectedMode === "advanced") {
      // Trigonometrische Funktionen erklären
      if (expr.includes("sin(") || expr.includes("cos(") || expr.includes("tan(")) {
        const trigMatch = expr.match(/(sin|cos|tan)\((\d+(?:\.\d+)?)\)/g)
        if (trigMatch) {
          trigMatch.forEach(match => {
            const funcMatch = match.match(/(sin|cos|tan)\((\d+(?:\.\d+)?)\)/)
            if (funcMatch) {
              const [, func, angle] = funcMatch
              const angleNum = parseFloat(angle)
              const radian = (angleNum * Math.PI / 180).toFixed(6)
              if (isEnglish) {
                steps.push(`${func}(${angle}°) = ${func}(${angle} × π/180) = ${func}(${radian} rad)`)
              } else {
                steps.push(`${func}(${angle}°) = ${func}(${angle} × π/180) = ${func}(${radian} rad)`)
              }
            }
          })
          steps.push("")
        }
      }
      
      // Logarithmus erklären
      if (expr.includes("log(")) {
        const logMatch = expr.match(/log\((\d+(?:\.\d+)?)\)/g)
        if (logMatch) {
          logMatch.forEach(match => {
            const numMatch = match.match(/log\((\d+(?:\.\d+)?)\)/)
            if (numMatch) {
              const num = numMatch[1]
              if (isEnglish) {
                steps.push(`log(${num}) = log₁₀(${num}) = decimal logarithm`)
              } else {
                steps.push(`log(${num}) = log₁₀(${num}) = dekadischer Logarithmus`)
              }
            }
          })
          steps.push("")
        }
      }
    }
    
    // Prozentrechnung erklären
    if (expr.includes("%")) {
      const percentMatch = expr.match(/(\d+(?:\.\d+)?)\s*%\s*(?:von|of)\s*(\d+(?:\.\d+)?)/i)
      if (percentMatch) {
        const [, percent, base] = percentMatch
        const percentNum = parseFloat(percent)
        const baseNum = parseFloat(base)
        const result = (percentNum / 100) * baseNum
        if (isEnglish) {
          steps.push(`${percent}% of ${base} = ${percent} ÷ 100 × ${base} = ${percentNum / 100} × ${base} = ${result}`)
        } else {
          steps.push(`${percent}% von ${base} = ${percent} ÷ 100 × ${base} = ${percentNum / 100} × ${base} = ${result}`)
        }
        steps.push("")
      }
    }
    
    // Einfache Berechnungen mit Zwischenschritten
    if (expr.match(/^[\d+\-*/().\s]+$/)) {
      // Versuche, die Berechnung Schritt für Schritt zu zeigen
      try {
        // Ersetze Multiplikationen und Divisionen für bessere Lesbarkeit
        let stepExpr = expr.replace(/\*/g, " × ").replace(/\//g, " ÷ ")
        if (isEnglish) {
          steps.push(`Calculation: ${stepExpr}`)
        } else {
          steps.push(`Berechnung: ${stepExpr}`)
        }
      } catch (e) {
        // Fallback
        if (isEnglish) {
          steps.push(`Calculation: ${expr}`)
        } else {
          steps.push(`Berechnung: ${expr}`)
        }
      }
    } else {
      if (isEnglish) {
        steps.push(`Calculation: ${expr}`)
      } else {
        steps.push(`Berechnung: ${expr}`)
      }
    }
    
    steps.push("")
    
    // Finale Ergebnis
    if (isEnglish) {
      steps.push(`Result: ${display}`)
    } else {
      steps.push(`Ergebnis: ${display}`)
    }
    
    return steps.join("\n")
  }
  
  async function copyCalculationSteps() {
    if (!computed || computed.display === "Error") return
    try {
      const steps = generateCalculationSteps()
      await navigator.clipboard.writeText(steps)
      setCopiedSteps(true)
      setTimeout(() => setCopiedSteps(false), 2000)
    } catch (err) {
      console.error("Failed to copy calculation steps:", err)
    }
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
    <main className={`relative grid h-dvh w-full grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden transition-colors ${
      appTheme === "light" 
        ? "bg-gray-50 text-gray-900" 
        : "bg-[#0b0b0b] text-white"
    }`}>
      {/* Neuer animierter Hintergrund */}
      <AnimatedBackdrop />

      {/* Main column */}
      <section className="relative z-10 flex items-center justify-center">
        {/* Header */}
        <header className="absolute top-5 left-0 right-0 mx-auto flex w-full max-w-5xl items-center justify-between px-6">
          {/* Logo links */}
          <div className="flex items-center">
            <motion.div
              layout
              className="flex items-center gap-3"
            >
              <motion.img
                key={`logo-${mode}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src="/syno-logo.png"
                alt="Syno Logo"
                className="h-32 w-auto"
              />
              <motion.span
                key={`beta-${mode}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${
                  appTheme === "light"
                    ? "bg-gray-100/80 text-gray-500 ring-1 ring-gray-200"
                    : "bg-white/10 text-white/60 ring-1 ring-white/20"
                }`}
              >
                Beta
              </motion.span>
            </motion.div>
          </div>

          {/* Badge und Settings rechts */}
          <div className="flex items-center gap-3">
            <motion.span
              key={`badge-${mode}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded px-2 py-0.5 text-xs text-zinc-300 ring-1 ring-zinc-700"
              style={{ background: `${theme.glow}` }}
            >
              {computed?.detectedMode ? computed.detectedMode.toUpperCase() : mode.toUpperCase()}
              <span className="ml-1.5 text-zinc-400">🔍</span>
            </motion.span>
            <button
              onClick={() => setSettingsOpen(true)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ring-1 transition-colors ${
                appTheme === "light"
                  ? "bg-white/80 text-gray-700 ring-gray-300 hover:text-gray-900"
                  : "bg-zinc-900/70 text-zinc-300 ring-zinc-800 hover:text-white"
              }`}
              title={t("settings.title")}
            >
              <Settings size={16} />
              {t("settings.title")}
            </button>
          </div>
        </header>

        {/* Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="relative">
          <Card className={`w-[640px] backdrop-blur-md border ${
            appTheme === "light"
              ? "bg-white/90 border-gray-200"
              : "bg-[#0f0f10]/80 border-zinc-800"
          }`}
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
                  <div className="relative">
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
                      placeholder={t("input.placeholder")}
                      className={`bg-zinc-900/70 text-xl placeholder:text-zinc-500 border-zinc-700 focus-visible:ring-2 transition-all pr-12 ${
                        appTheme === "light"
                          ? "bg-white/90 border-gray-300 placeholder:text-gray-400"
                          : ""
                      } ${
                        inputStatus === "error"
                          ? "border-[#3a0b0b] focus-visible:ring-red-500"
                          : inputStatus === "valid"
                          ? "border-green-500/50 focus-visible:ring-green-500"
                          : inputStatus === "warning"
                          ? "border-yellow-500/30 focus-visible:ring-yellow-500"
                          : ""
                      }`}
                      style={{
                        color: inputStatus === "error" 
                          ? "#ff4d4d" 
                          : appTheme === "light"
                            ? "#000000"
                            : inputStatus === "valid" 
                              ? theme.accent 
                              : theme.accent,
                        outlineColor:
                          inputStatus === "error"
                            ? "#ef4444"
                            : inputStatus === "valid"
                            ? theme.accent
                            : theme.accent,
                      }}
                      autoFocus
                    />
                    {/* Upload Button */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <button
                        onClick={() => setUploadOpen(true)}
                        className={`p-2 rounded-md transition ${
                          appTheme === "light"
                            ? "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                            : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Bild hochladen"
                      >
                        <Upload size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Auto-Korrektur Feedback - ausgeblendet */}
              {/* {autoCorrected && computed && computed.display !== "Error" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-2 text-sm flex items-center gap-2 ${
                    appTheme === "light" ? "text-green-600" : "text-green-400/90"
                  }`}
                >
                  <span>✅</span>
                  <span>
                    {t("input.autoCorrected")} <code className={`px-1.5 py-0.5 rounded font-mono ${
                      appTheme === "light" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-green-950/40 text-green-300"
                    }`}>{autoCorrected}</code>
                  </span>
                </motion.div>
              )} */}

              {/* Auto-Mode-Detection Feedback - ausgeblendet */}
              {/* {modeDetected && computed && computed.display !== "Error" && modeDetected !== mode && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-2 text-sm flex items-center gap-2 ${
                    appTheme === "light" ? "text-amber-600" : "text-amber-400/90"
                  }`}
                >
                  <span>🔍</span>
                  <span>
                    {t("input.modeDetected")} <span className="font-semibold">{modeDetected.toUpperCase()}</span>
                  </span>
                </motion.div>
              )} */}

              {/* Fehler-Hilfe - ausgeblendet: Taschenrechner arbeitet im Hintergrund */}
              {/* {computed?.display === "Error" && input.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm"
                >
                  <div className={`flex items-start gap-2 mb-2 ${
                    appTheme === "light" ? "text-amber-600" : "text-amber-400/90"
                  }`}>
                    <span>⚠️</span>
                    <span>
                      {t("input.error.title")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <button
                      onClick={() => setInput("50 / 7")}
                      className={`px-2.5 py-1 rounded-full border transition text-sm font-mono ${
                        appTheme === "light"
                          ? "bg-gray-100 border-gray-300 text-gray-700 hover:border-amber-500 hover:text-amber-600"
                          : "bg-zinc-800/80 border-zinc-700/70 text-zinc-300 hover:border-amber-500/50 hover:text-amber-300"
                      }`}
                    >
                      50 / 7
                    </button>
                    <button
                      onClick={() => setInput(t("input.error.suggestion"))}
                      className={`px-2.5 py-1 rounded-full border transition text-sm ${
                        appTheme === "light"
                          ? "bg-gray-100 border-gray-300 text-gray-700 hover:border-amber-500 hover:text-amber-600"
                          : "bg-zinc-800/80 border-zinc-700/70 text-zinc-300 hover:border-amber-500/50 hover:text-amber-300"
                      }`}
                    >
                      {t("input.error.suggestion")}
                    </button>
                  </div>
                </motion.div>
              )} */}

              {/* Symbol Toolbar (immer gleich) */}
              <div className={`mt-2 flex flex-wrap gap-2 text-lg ${
                appTheme === "light" ? "text-gray-700" : "text-zinc-300"
              }`}>
                {SYMBOLS_COMMON.map((item: InsertItem) => {
                  const { label, insert, caret } = item
                  return (
                    <button
                      key={label}
                      onClick={() => insertAtCursor(insert, caret ? caret : insert.length)}
                      className={`rounded-md border px-2 py-1 transition text-base hover:scale-105 ${
                        appTheme === "light"
                          ? "border-gray-300 bg-gray-100 hover:border-gray-400"
                          : "border-zinc-700/70 bg-zinc-900/60"
                      }`}
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
                  {idx > 0 && <div className={`mb-2 h-px ${
                    appTheme === "light" ? "bg-gray-200" : "bg-zinc-800/50"
                  }`} />}
                  <div className={`mb-1.5 text-xs font-medium uppercase tracking-wide ${
                    appTheme === "light" ? "text-gray-500" : "text-zinc-500"
                  }`}>
                    {grp.title}
                  </div>
                  <div className={`flex flex-wrap gap-2 text-sm ${
                    appTheme === "light" ? "text-gray-700" : "text-zinc-300"
                  }`}>
                    {grp.items.map((item: InsertItem) => {
                      const { label, insert, caret } = item
                      return (
                        <button
                          key={label}
                          onClick={() => insertAtCursor(insert, caret ?? insert.length)}
                          className={`rounded-md border px-2 py-1 transition hover:scale-105 ${
                            appTheme === "light"
                              ? "border-gray-300 bg-gray-100 hover:border-gray-400"
                              : "border-zinc-700/70 bg-zinc-900/60"
                          }`}
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
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      appTheme === "light"
                        ? "border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400"
                        : "border-zinc-700/70 bg-zinc-900/60 text-zinc-300"
                    }`}
                    onMouseEnter={(e) => ((e.currentTarget.style.borderColor = theme.accent), (e.currentTarget.style.color = "#fff"))}
                    onMouseLeave={(e) => ((e.currentTarget.style.borderColor = ""), (e.currentTarget.style.color = ""))}
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {/* Live result */}
              {computed && (
                <motion.div
                  key={`${computed.display}-${mode}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`mt-5 rounded-lg border px-4 py-3 relative ${
                    computed.display === "Error"
                      ? appTheme === "light"
                        ? "bg-red-50 border-red-200"
                        : "bg-red-950/20 border-red-900/40"
                      : appTheme === "light"
                      ? "bg-gray-100 border-gray-200"
                      : "bg-zinc-900/40 border-zinc-700/50"
                  }`}
                  style={{
                    boxShadow:
                      computed.display === "Error"
                        ? appTheme === "light"
                          ? "0 0 10px rgba(239, 68, 68, 0.1)"
                          : "0 0 20px rgba(239, 68, 68, 0.15)"
                        : `0 0 30px ${theme.glow}`,
                  }}
                >
                  {/* Copy Buttons - nur wenn kein Fehler */}
                  {computed.display !== "Error" && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={copyResult}
                        className={`p-2 rounded-md transition ${
                          appTheme === "light"
                            ? "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                            : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Ergebnis kopieren"
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={copyCalculationSteps}
                        className={`p-2 rounded-md transition ${
                          appTheme === "light"
                            ? "hover:bg-gray-200 text-gray-600 hover:text-gray-900"
                            : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Berechnungsschritte kopieren"
                      >
                        {copiedSteps ? <Check size={18} /> : <FileText size={18} />}
                      </button>
                    </div>
                  )}
                  <div className={`text-right ${computed.display !== "Error" ? "pr-24" : ""}`}>
                    <div
                      className="text-4xl font-semibold"
                      style={{
                        color: computed.display === "Error" 
                          ? "#ff4d4d" 
                          : appTheme === "light" 
                            ? "#000000" 
                            : theme.accent,
                        textShadow: computed.display === "Error" || appTheme === "light" 
                          ? "none" 
                          : `0 0 10px ${theme.glow}`,
                      }}
                    >
                      = {computed.display}
                    </div>
                    {computed.expr && computed.expr !== input.trim() && computed.display !== "Error" && (
                      <div className={`mt-1 text-xs font-mono italic ${
                        appTheme === "light" ? "text-gray-500" : "text-zinc-500"
                      }`}>
                        {computed.expr}
                      </div>
                    )}
                    {computed.display === "Error" && (
                      <div className="mt-2 space-y-1">
                        {computed.expr && (
                          <div className={`text-xs font-mono italic opacity-70 ${
                            appTheme === "light" ? "text-gray-600" : "text-zinc-500"
                          }`}>
                            {t("result.try")} {computed.expr}
                          </div>
                        )}
                        {lastValidResult && (
                          <div className={`text-xs italic ${
                            appTheme === "light" ? "text-gray-600" : "text-zinc-400"
                          }`}>
                            {t("result.lastValid")} <span className={`font-semibold ${
                              appTheme === "light" ? "text-gray-800" : "text-zinc-300"
                            }`}>{lastValidResult.display}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Bestätigungsnachricht */}
              {confirmed && computed && confirmed !== computed.display && (
                <div className={`mt-2 text-right text-sm ${
                  appTheme === "light" ? "text-gray-600" : "text-zinc-500"
                }`}>
                  {t("result.confirmed")} <span className={appTheme === "light" ? "text-gray-800" : "text-zinc-300"}>{confirmed}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <footer className="absolute bottom-5 left-0 right-0 mx-auto flex w-full max-w-5xl items-center justify-center px-6">
          <div className={`rounded-md border px-3 py-1.5 text-xs ${
            appTheme === "light"
              ? "border-gray-300 bg-white/80 text-gray-600"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-400"
          }`}>
            <span className="font-medium">{t("shortcuts.title")}</span> {t("shortcuts.calculate")} · {t("shortcuts.history")} · {t("shortcuts.delete")} · {t("shortcuts.clear")}
          </div>
        </footer>

        {/* Signatur unten rechts */}
        <div className="absolute bottom-5 right-5 z-20">
          <a
            href="https://abdullahu-adrian.de"
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-all duration-300 hover:scale-110 hover:brightness-110"
            onClick={(e) => {
              e.preventDefault()
              window.open("https://abdullahu-adrian.de", "_blank", "noopener,noreferrer")
            }}
          >
            <img 
              src="/assets/signatur.png" 
              alt="Signatur" 
              className={`h-32 transition-all duration-300 cursor-pointer ${
                appTheme === "light"
                  ? "opacity-90 hover:opacity-100 drop-shadow-xl"
                  : "opacity-60 hover:opacity-100 drop-shadow-lg hover:drop-shadow-xl"
              }`}
              style={{
                filter: appTheme === "light"
                  ? "drop-shadow(0 2px 8px rgba(0,0,0,0.3)) drop-shadow(0 0 4px rgba(0,0,0,0.2))"
                  : "drop-shadow(0 0 8px rgba(163, 230, 53, 0.3))"
              }}
            />
          </a>
        </div>
      </section>

      {/* Sidebar */}
      <Sidebar onPick={(expr) => setInput(expr)} />

      {/* Feedback */}
      <FeedbackFab />

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Image Upload */}
      {uploadOpen && (
        <ImageUpload
          onTextRecognized={(text) => {
            setInput(text)
            setUploadOpen(false)
          }}
          onClose={() => setUploadOpen(false)}
        />
      )}
    </main>
  )
}
