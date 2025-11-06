/**
 * Mini-NLP Parser: Wandelt freie Eingaben in valide Math-Ausdrücke um
 * 100% lokal, kostenlos, deterministisch - kein externer KI-Dienst nötig
 */

const RE = {
  decComma: /(\d),(?=\d)/g, // 3,5 -> 3.5
  spaces: /\s+/g,
  unicodeDiv: /÷/g,
  unicodeMul: /×|·|•/g,
}

/**
 * Zentrale Normalisierung: DE/EN Natural Language → Math Syntax
 * Reihenfolge ist wichtig (speziell %/von und "hoch")
 */
export function normalizeInput(raw: string): string {
  let s = (raw ?? "").trim()
  if (!s) return ""

  // 0) Unicode & Basics ZUERST
  s = s
    .replace(RE.unicodeDiv, "/")
    .replace(RE.unicodeMul, "*")
    .replace(RE.decComma, "$1.") // Dezimalkomma -> Punkt
    .replace(RE.spaces, " ")

  // 0.5) ZUERST lowercase für konsistente Verarbeitung (WICHTIG für alle Patterns)
  s = s.toLowerCase()
  
  // 0.6) Fragezeichen und andere Satzzeichen am Ende entfernen
  s = s.replace(/[?!=.,;:]+$/, "").trim()

  // 0.7) Füllphrasen FRÜH entfernen (VOR "% von" Pattern, damit Pattern matchen können)
  // "wie viel 20% von 70" -> "20% von 70"
  s = s
    .replace(/\b(wie\s+viel|was\s+ist|wie\s+viel\s+ist|berechne|rechne|ergibt|was|ist)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // 1) Prozent-Patterns (höchste Priorität) - NACH lowercase und Füllphrasen-Entfernung
  // "20% von 50" -> "(20/100)*50"
  // WICHTIG: Muss VOR allen anderen %-Ersetzungen kommen!
  // Pattern: Erlaubt Leerzeichen (auch 0) vor/nach % und vor "von" - TOLERANTER
  // MERKE: Nach diesem Match gibt es KEIN % mehr im String!
  const beforePercent = s
  
  // "% von" Pattern - MUST match BEFORE other % replacements
  // Pattern: Zahl, optional whitespace, %, optional whitespace, "von", whitespace, Zahl
  if (/\%\s*von/i.test(s)) {
    s = s.replace(/(\d+(?:\.\d+)?)\s*%\s*von\s+(\d+(?:\.\d+)?)/gi, (match, p1, p2) => `(${p1}/100)*${p2}`)
  }
  
  // Debug für "% von" Pattern - zeigt auch das Ergebnis
  if (beforePercent.includes("%") && beforePercent.includes("von") && beforePercent === s) {
    console.warn("[miniNlp] '% von' Pattern matched NICHT! Input:", raw, "Before:", beforePercent, "After:", s)
  }

  // "x + y%" -> "x + (x*y/100)" (Auf-/Abschläge)
  s = s.replace(/\b(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)\s*%/g, "($1 + ($1*$2/100))")
  s = s.replace(/\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*%/g, "($1 - ($1*$2/100))")

  // 2) Sprachliche Operatoren (DE + ein wenig EN) - nach Prozent
  // WICHTIG: "geteilt durch" muss VOR "durch" kommen, damit es nicht zweimal ersetzt wird
  s = s
    .replace(/\bgeteilt\s+durch\b/gi, "/") // Case-insensitive für Sicherheit
    .replace(/\bdurch\b/g, "/") // "7 durch 2" -> 7/2
    .replace(/\bmal\b/g, "*")
    .replace(/\bplus\b/g, "+")
    .replace(/\bminus\b/g, "-")
    .replace(/\bhoch\b/g, "^") // "2 hoch 5" -> 2^5
    .replace(/\bsqrt(?:\s*von)?\b/g, "sqrt") // tolerant
    .replace(/\bwurzel(?:\s*aus)?\b/g, "sqrt")
    .replace(/\b(?:die\s+)?wurzel\s+(?:aus|von)\s+/g, "sqrt(")

  // Füllphrasen entfernen (zweites Mal für Reste nach Operator-Ersetzungen)
  s = s
    .replace(/\b(wie\s+viel|was\s+ist|wie\s+viel\s+ist|berechne|rechne|ergibt|was|ist)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // 3) Prozent-Zeichen allein (NUR wenn noch nicht durch "% von" behandelt)
  // mathjs versteht 20% als 0.2 nicht automatisch ⇒ wir ersetzen:
  // Pattern: Prozent das NICHT von "von" gefolgt wird (Negative Lookahead)
  // WICHTIG: Diese Regel muss NACH "% von" kommen, damit sie nicht interferiert
  s = s.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)")

  // 4) Unicode-Mathematische Zeichen (falls noch nicht ersetzt)
  s = s.replace(/π/g, "pi").replace(/√/g, "sqrt")

  // 5) sqrt zu sqrt() konvertieren wenn Zahl folgt
  s = s.replace(/sqrt\s*(\d+(?:\.\d+)?)/g, "sqrt($1)")

  // 6) Reste säubern - FINALE Bereinigung
  // Alle Leerzeichen um Operatoren entfernen für mathjs-Kompatibilität
  // WICHTIG: Nur Leerzeichen entfernen, die mathjs stören könnten
  s = s
    .replace(/\s*\*\s*/g, "*")    // Leerzeichen um * entfernen
    .replace(/\s*\+\s*/g, "+")    // Leerzeichen um + entfernen
    // Minus vorsichtig - nur wenn nicht Teil einer negativen Zahl
    .replace(/(?<=\d)\s*-\s*(?=\d)/g, "-")  // Leerzeichen um - nur zwischen Zahlen
    .replace(/\s*\/\s*/g, "/")    // Leerzeichen um / entfernen
    .replace(/\s*\^\s*/g, "^")    // Leerzeichen um ^ entfernen
    .replace(/\s*\(\s*/g, "(")    // Leerzeichen nach ( entfernen
    .replace(/\s*\)\s*/g, ")")    // Leerzeichen vor ) entfernen
    .replace(/\s+/g, " ")          // Mehrfach-Leerzeichen zu einem
    .trim()

  // Sicherstellen, dass Ergebnis valide ist
  if (!s || !/[0-9+\-*/^()]/.test(s)) {
    console.warn("[miniNlp] Normalisierung fehlgeschlagen - Fallback zu Original. Input:", raw, "Normalized:", s)
    return raw.trim() // Fallback: Original zurückgeben
  }

  // Debug: Zeige normalisierten Ausdruck wenn anders als Original
  if (s !== raw.trim().toLowerCase().replace(/\s+/g, " ").trim()) {
    console.log("[miniNlp] Normalisiert:", raw, "→", s)
  }

  return s
}

