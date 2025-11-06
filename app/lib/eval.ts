import { evaluate } from "mathjs"
import type { Mode } from "./mode"
import { normalize } from "./normalize"
import { detectModeFromInput } from "./detectMode"

// Helpers
const isNum = (n: any) => typeof n === "number" && isFinite(n)

// Finance
const scopeFinance = {
  npv: (rate: number, ...cfs: number[]) =>
    cfs.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i + 1), 0),
  fv: (pv: number, rate: number, n: number) => pv * Math.pow(1 + rate, n),
  pmt: (rate: number, n: number, pv: number) =>
    (pv * rate) / (1 - Math.pow(1 + rate, -n)),
}

function fmtFinance(x: any) {
  if (!isNum(x)) return String(x)
  const v = Math.round(x * 100) / 100
  const s = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(v)
  return s + " €"
}

function fmtBasic(x: any) {
  if (!isNum(x)) return String(x)
  const abs = Math.abs(x)
  const digits = abs === 0 ? 0 : abs >= 1000 ? 0 : abs >= 100 ? 1 : abs >= 1 ? 3 : 4
  return Number(x.toFixed(digits)).toString()
}

/**
 * Evaluates input with intelligent auto-detection of the optimal mode
 * @param input User input string
 * @param currentMode Currently selected mode (can be overridden by auto-detection)
 * @param autoDetect If true, automatically detects the best mode from input
 */
export function evalByMode(input: string, currentMode: Mode, autoDetect: boolean = true) {
  // 🧠 Intelligente Auto-Detection: Bestimme optimalen Modus basierend auf Input
  const detectedMode = autoDetect ? detectModeFromInput(input) : currentMode
  const effectiveMode = detectedMode !== currentMode ? detectedMode : currentMode

  // ZUERST normalisieren (Natural Language Parser global)
  const expr = normalize(input, effectiveMode)
  
  // Debug: Zeige normalisierten Ausdruck
  if (expr !== input.trim()) {
    console.log("[evalByMode] Normalisiert:", input, "→", expr)
  }
  
  // Leere oder ungültige Ausdrücke abfangen
  if (!expr || expr.trim() === "" || !/[0-9+\-*/^()]/.test(expr)) {
    console.warn("[evalByMode] Ungültiger Ausdruck nach Normalisierung. Input:", input, "Normalized:", expr)
    return { 
      expr: expr || input, 
      raw: "Error", 
      display: "Error",
      detectedMode: effectiveMode,
      wasAutoDetected: detectedMode !== currentMode
    }
  }
  
  try {
    // MathJS evaluate: Wenn kein Scope benötigt wird, nur expr übergeben
    const raw = effectiveMode === "finance" 
      ? evaluate(expr, scopeFinance as any)
      : evaluate(expr)

    let display: string
    switch (effectiveMode) {
      case "finance":  display = fmtFinance(raw); break
      case "basic":    display = fmtBasic(raw); break
      default:         display = String(raw)
    }

    return { 
      expr, 
      raw, 
      display,
      detectedMode: effectiveMode,
      wasAutoDetected: detectedMode !== currentMode
    }
  } catch (error) {
    // Bei Fehler: normalisierte Expression zurückgeben für Debugging
    // Log für besseres Debugging
    console.error("[evalByMode] Error:", error, "Input:", input, "Normalized:", expr, "Mode:", effectiveMode)
    return { 
      expr, 
      raw: "Error", 
      display: "Error",
      detectedMode: effectiveMode,
      wasAutoDetected: detectedMode !== currentMode
    }
  }
}
