"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useSettingsStore, type Theme, type Language } from "../lib/settings"
import { useModeStore, THEMES } from "../lib/mode"
import { useTranslation } from "../lib/i18n"

export default function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { theme, language, setTheme, setLanguage } = useSettingsStore()
  const { mode } = useModeStore()
  const themeColors = THEMES[mode]
  const t = useTranslation()
  const appTheme = useSettingsStore((state) => state.theme)

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`backdrop-blur-xl ${
        appTheme === "light"
          ? "bg-white/95 border-gray-200 text-gray-900"
          : "bg-zinc-900/95 border-zinc-800 text-white"
      }`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t("settings.title")}</DialogTitle>
          <DialogDescription className={appTheme === "light" ? "text-gray-600" : "text-zinc-400"}>
            {t("settings.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Sprache */}
          <div className="space-y-3">
            <label className={`text-sm font-medium ${
              appTheme === "light" ? "text-gray-700" : "text-zinc-300"
            }`}>{t("settings.language")}</label>
            <div className="flex gap-2">
              {(["de", "en"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                    language === lang
                      ? appTheme === "light"
                        ? "border-gray-400 bg-gray-200 text-gray-900"
                        : "border-zinc-600 bg-zinc-800 text-white"
                      : appTheme === "light"
                      ? "border-gray-300 bg-gray-100 text-gray-600 hover:border-gray-400"
                      : "border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600"
                  }`}
                  style={{
                    borderColor: language === lang ? themeColors.accent : undefined,
                    boxShadow: language === lang ? `0 0 10px ${themeColors.glow}` : undefined,
                  }}
                >
                  {lang === "de" ? t("settings.german") : t("settings.english")}
                </button>
              ))}
            </div>
          </div>

          {/* Dark/Light Mode Toggle - Apple Style */}
          <div className="space-y-3">
            <label className={`text-sm font-medium ${
              appTheme === "light" ? "text-gray-700" : "text-zinc-300"
            }`}>{t("settings.theme")}</label>
            <div className={`flex items-center justify-between p-1.5 rounded-xl border ${
              appTheme === "light"
                ? "bg-gray-100 border-gray-300"
                : "bg-zinc-800/50 border-zinc-700"
            }`}>
              <span className={`text-sm px-3 transition-colors ${
                theme === "light" 
                  ? appTheme === "light" ? "text-gray-900 font-medium" : "text-white font-medium"
                  : appTheme === "light" ? "text-gray-500" : "text-zinc-400"
              }`}>
                {t("settings.light")}
              </span>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: theme === "dark" ? themeColors.accent : "#6b7280",
                }}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center"
                  animate={{
                    x: theme === "dark" ? 24 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  {theme === "dark" ? (
                    <span className="text-xs">🌙</span>
                  ) : (
                    <span className="text-xs">☀️</span>
                  )}
                </motion.div>
              </button>
              <span className={`text-sm px-3 transition-colors ${
                theme === "dark"
                  ? appTheme === "light" ? "text-gray-900 font-medium" : "text-white font-medium"
                  : appTheme === "light" ? "text-gray-500" : "text-zinc-400"
              }`}>
                {t("settings.dark")}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

