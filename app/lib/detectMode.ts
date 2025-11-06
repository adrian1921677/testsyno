import type { Mode } from "./mode"

/**
 * Intelligente Auto-Detection: Erkennt basierend auf Input-Patterns den optimalen Modus
 */
export function detectModeFromInput(input: string): Mode {
  const lower = input.toLowerCase().trim()

  // Developer-Mode: Hex, Bin, JS-Operatoren
  if (
    /\b0x[0-9a-f]+\b/i.test(input) ||
    /\b0b[01]+\b/i.test(input) ||
    /&&|\|\|/.test(input) ||
    /\*\*/.test(input) ||
    /\b(and|or)\s*\(/.test(lower)
  ) {
    return "developer"
  }

  // Finance-Mode: Finanzfunktionen und MwSt
  if (
    /\b(npv|fv|pmt)\s*\(/i.test(input) ||
    /\b(brutto|netto)\s+\d+/i.test(input) ||
    /\bmwst\s+\d+/i.test(input) ||
    /\b(mwst|umsatzsteuer)\b/i.test(lower) ||
    /\b(euro|eur)\b/i.test(lower) ||
    /\b(zinsen|zinssatz|kredit|anlage)\b/i.test(lower)
  ) {
    return "finance"
  }

  // Advanced-Mode: Trigonometrie, Units, Grad
  if (
    /\b(sin|cos|tan|asin|acos|atan)\s*\(/i.test(input) ||
    /\bdeg\b/i.test(input) ||
    /\d+\s*°/i.test(input) ||
    /\b(rad|grad)\b/i.test(input) ||
    /\b\d+\s*(m|cm|km|kg|g)\b/i.test(input) ||
    /\b(sqrt|log|ln|exp)\s*\(/i.test(input) ||
    /\b(pi|e)\b/i.test(lower)
  ) {
    return "advanced"
  }

  // Basic-Mode: Standard-Arithmetik, Prozent, einfache Operationen
  return "basic"
}







