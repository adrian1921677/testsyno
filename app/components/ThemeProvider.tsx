"use client"
import { useEffect } from "react"
import { useSettingsStore } from "../lib/settings"

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  // Apply theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("syno-settings-v1")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.state?.theme) {
          if (parsed.state.theme === "dark") {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
          } else {
            document.documentElement.classList.add("light")
            document.documentElement.classList.remove("dark")
          }
        }
      } catch (e) {
        // Fallback to dark
        document.documentElement.classList.add("dark")
      }
    } else {
      // Default to dark
      document.documentElement.classList.add("dark")
    }
  }, [])

  return <>{children}</>
}


