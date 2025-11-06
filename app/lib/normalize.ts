import type { Mode } from "./mode"
import { normalizeInput } from "./miniNlp"

// Hilfsfunktionen
const toDecimalFromBase = (s: string) => {
  if (/^0x[0-9a-f]+$/i.test(s)) return String(parseInt(s, 16))
  if (/^0b[01]+$/i.test(s)) return String(parseInt(s.replace(/^0b/i, ""), 2))
  return s
}

/**
 * Normalisiert Eingaben mit zentralem Mini-NLP Parser + Mode-spezifische Erweiterungen
 */
export function normalize(expr: string, mode: Mode = "basic"): string {
  // 🧠 ZENTRALER Mini-NLP Parser: Wandelt freie Eingaben in valide Math-Ausdrücke um
  let s = normalizeInput(expr)

  // Mode-spezifische Erweiterungen (nach zentralem NLP)

  // Developer-spezifische Syntax
  if (mode === "developer") {
    // ** (JS) -> ^ (mathjs)
    s = s.replace(/\*\*/g, "^")
    // && || -> and / or
    s = s.replace(/&&/g, " and ").replace(/\|\|/g, " or ")
    // Hex/Bin → Dezimal
    s = s.replace(/\b0x[0-9a-f]+\b/gi, (m) => toDecimalFromBase(m))
    s = s.replace(/\b0b[01]+\b/gi, (m) => toDecimalFromBase(m))
  }

  // ADVANCED: Gradzeichen in mathjs-Units
  if (mode === "advanced") {
    // Sicherstellen, dass Zahlen vor "deg" richtig formatiert sind
    s = s.replace(/(\d+(?:\.\d+)?)\s*deg/g, "$1 deg")
    // ° → deg (falls noch nicht ersetzt)
    s = s.replace(/(\d+(?:\.\d+)?)\s*°/g, "$1 deg")
  }

  // FINANCE: simple Netto/Brutto-Helper (optional, nicht invasiv)
  // "netto X bei mwst Y%" -> X * (1 + Y/100)
  if (mode === "finance") {
    s = s.replace(
      /\bbrutto\s+(\d+(?:\.\d+)?)\s+bei\s+mwst\s+(\d+(?:\.\d+)?)%/i,
      "($1)*(1+$2/100)"
    )
    s = s.replace(
      /\bnetto\s+(\d+(?:\.\d+)?)\s+bei\s+mwst\s+(\d+(?:\.\d+)?)%/i,
      "($1)/(1+$2/100)"
    )
  }

  // Finale Bereinigung: Mehrfach-Leerzeichen entfernen und trim
  s = s.replace(/\s+/g, " ").trim()
  
  // Sicherstellen, dass das Ergebnis nicht leer ist und Zahlen/Operatoren enthält
  if (!s || !/[0-9+\-*/^()]/.test(s)) {
    return expr.trim() // Fallback: Original zurückgeben
  }
  
  return s
}
