import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Entry = {
  id: string
  expr: string
  normalized: string
  result: string
  ts: number
  favorite?: boolean
}

type State = {
  entries: Entry[]
  currentIndex: number | null
  add: (e: Omit<Entry, "id" | "ts">) => void
  remove: (id: string) => void
  toggleFav: (id: string) => void
  clear: () => void
  setCurrentIndex: (i: number | null) => void
}

export const useCalcStore = create<State>()(
  persist(
    (set, get) => ({
      entries: [],
      currentIndex: null,
      add: (e) =>
        set((s) => ({
          entries: [
            { id: crypto.randomUUID(), ts: Date.now(), ...e },
            ...s.entries,
          ].slice(0, 200), // Hard cap
          currentIndex: 0,
        })),
      remove: (id) =>
        set((s) => ({
          entries: s.entries.filter((x) => x.id !== id),
          currentIndex: null,
        })),
      toggleFav: (id) =>
        set((s) => ({
          entries: s.entries.map((x) =>
            x.id === id ? { ...x, favorite: !x.favorite } : x
          ),
        })),
      clear: () => set({ entries: [], currentIndex: null }),
      setCurrentIndex: (i) => set({ currentIndex: i }),
    }),
    { name: "syno-history-v1" }
  )
)


