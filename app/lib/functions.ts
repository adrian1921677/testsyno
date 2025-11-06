import type { Mode } from "./mode"

export type InsertItem = {
  label: string
  insert: string
  caret?: number
}

export type FunctionGroup = {
  title: string
  items: InsertItem[]
}

export const SYMBOLS_COMMON: InsertItem[] = [
  { label: "√", insert: "√(", caret: 2 },
  { label: "^", insert: "^", caret: 1 },
  { label: "π", insert: "pi", caret: 2 },
  { label: "%", insert: "%", caret: 1 },
  { label: "÷", insert: "÷", caret: 1 },
  { label: "×", insert: "×", caret: 1 },
  { label: "(", insert: "(", caret: 1 },
  { label: ")", insert: ")", caret: 1 },
]

const BASIC_FUNCS: FunctionGroup[] = [
  {
    title: "Standard",
    items: [
      { label: "cos()", insert: "cos()", caret: 4 },
      { label: "sin()", insert: "sin()", caret: 4 },
      { label: "tan()", insert: "tan()", caret: 4 },
      { label: "log()", insert: "log()", caret: 4 },
      { label: "ln()", insert: "ln()", caret: 3 },
      { label: "sqrt()", insert: "sqrt()", caret: 5 },
    ],
  },
]

const DEV_FUNCS: FunctionGroup[] = [
  ...BASIC_FUNCS,
  {
    title: "Dev only",
    items: [
      { label: "**", insert: "**", caret: 2 },
      { label: "&", insert: "&", caret: 1 },
      { label: "|", insert: "|", caret: 1 },
      { label: "0x..", insert: "0x", caret: 2 },
      { label: "0b..", insert: "0b", caret: 2 },
    ],
  },
]

const FINANCE_FUNCS: FunctionGroup[] = [
  ...BASIC_FUNCS,
  {
    title: "Finance",
    items: [
      { label: "npv()", insert: "npv(rate, c1, c2, c3)", caret: 4 },
      { label: "fv()", insert: "fv(pv, rate, n)", caret: 3 },
      { label: "pmt()", insert: "pmt(rate, n, pv)", caret: 4 },
      { label: "Brutto", insert: "Brutto 119 bei MwSt 19%", caret: 8 },
      { label: "Netto", insert: "Netto 100 bei MwSt 19%", caret: 7 },
    ],
  },
]

const ADV_FUNCS: FunctionGroup[] = [
  ...BASIC_FUNCS,
  {
    title: "Advanced",
    items: [
      { label: "deg", insert: "°", caret: 1 },
      { label: "rad", insert: " rad", caret: 4 },
      { label: "m", insert: " m", caret: 2 },
      { label: "cm", insert: " cm", caret: 3 },
    ],
  },
]

export function getFunctionGroups(mode: Mode): FunctionGroup[] {
  switch (mode) {
    case "developer":
      return DEV_FUNCS
    case "finance":
      return FINANCE_FUNCS
    case "advanced":
      return ADV_FUNCS
    default:
      return BASIC_FUNCS
  }
}

export function getExamples(mode: Mode): string[] {
  switch (mode) {
    case "developer":
      return ["2**5", "0xFF && 1", "5 & 3", "sqrt(9) + 1"]
    case "finance":
      return ["npv(0.08, -1000, 400, 400, 400)", "fv(1000, 0.05, 3)", "Brutto 119 bei MwSt 19%"]
    case "advanced":
      return ["sin(30°)", "cos(45°)", "sqrt(2^5)", "3 m + 40 cm"]
    default:
      return ["15% von 249", "80 geteilt durch 4", "2 hoch 5", "√9 + 10%"]
  }
}





