import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Theme = "dark" | "light"
export type Language = "de" | "en"

interface SettingsState {
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      language: "de",
      setTheme: (theme) => {
        set({ theme })
        // Apply theme to document
        if (typeof window !== "undefined") {
          if (theme === "dark") {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
          } else {
            document.documentElement.classList.add("light")
            document.documentElement.classList.remove("dark")
          }
        }
      },
      setLanguage: (language) => set({ language }),
    }),
    { 
      name: "syno-settings-v1",
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state && typeof window !== "undefined") {
          if (state.theme === "dark") {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
          } else {
            document.documentElement.classList.add("light")
            document.documentElement.classList.remove("dark")
          }
        }
      },
    }
  )
)

