import { create } from "zustand"

export type Mode = "basic" | "developer" | "finance" | "advanced"

export type Theme = {
  accent: string      // Text/Fokus
  glow: string        // rgba() für Radial-Glow
  blobA: string       // rgba() soft blob oben/links
  blobB: string       // rgba() soft blob unten/rechts
}

export const THEMES: Record<Mode, Theme> = {
  basic: {
    accent: "#a3e635",                    // lime-400
    glow: "rgba(0,255,150,0.18)",
    blobA: "rgba(0,255,150,0.12)",
    blobB: "rgba(100,200,255,0.10)",
  },
  developer: {
    accent: "#38bdf8",                    // sky-400
    glow: "rgba(56,189,248,0.22)",        // blauer Glow
    blobA: "rgba(56,189,248,0.14)",
    blobB: "rgba(147,197,253,0.12)",
  },
  finance: {
    accent: "#f59e0b",                    // amber-500
    glow: "rgba(245,158,11,0.22)",
    blobA: "rgba(245,158,11,0.14)",
    blobB: "rgba(253,230,138,0.12)",
  },
  advanced: {
    accent: "#a78bfa",                    // violet-400
    glow: "rgba(167,139,250,0.22)",
    blobA: "rgba(167,139,250,0.14)",
    blobB: "rgba(196,181,253,0.12)",
  },
}

interface ModeState {
  mode: Mode
  setMode: (m: Mode) => void
}

export const useModeStore = create<ModeState>((set) => ({
  mode: "basic",
  setMode: (m) => set({ mode: m }),
}))
