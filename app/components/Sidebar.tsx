"use client"
import { Star, Trash2, Clock } from "lucide-react"
import { useCalcStore } from "../lib/store"
import { useTranslation } from "../lib/i18n"
import { useSettingsStore } from "../lib/settings"

export default function Sidebar({
  onPick,
}: {
  onPick: (expr: string) => void
}) {
  const { entries, remove, toggleFav, clear } = useCalcStore()
  const t = useTranslation()
  const appTheme = useSettingsStore((state) => state.theme)

  const favs = entries.filter((e) => e.favorite)
  const rest = entries.filter((e) => !e.favorite)

  return (
    <aside className={`hidden lg:flex h-dvh w-[320px] flex-col border-l backdrop-blur-md shadow-2xl ${
      appTheme === "light"
        ? "border-gray-200 bg-white/90"
        : "border-zinc-800/70 bg-zinc-950/60"
    }`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        appTheme === "light"
          ? "border-gray-200 bg-gray-50"
          : "border-zinc-800/70 bg-zinc-900/30"
      }`}>
        <div className={`flex items-center gap-2 text-sm font-medium ${
          appTheme === "light" ? "text-gray-600" : "text-zinc-400"
        }`}>
          <Clock size={16} />
          {t("sidebar.history")}
        </div>
        <button
          onClick={() => clear()}
          className={`text-xs transition ${
            appTheme === "light"
              ? "text-gray-500 hover:text-red-600"
              : "text-zinc-400 hover:text-red-400"
          }`}
          title={t("shortcuts.clear")}
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {favs.length > 0 && (
          <Section
            title={t("sidebar.favorites")}
            items={favs}
            onPick={onPick}
            onRemove={remove}
            onToggleFav={toggleFav}
            appTheme={appTheme}
            t={t}
          />
        )}
        <Section
          title={t("sidebar.history")}
          items={rest}
          onPick={onPick}
          onRemove={remove}
          onToggleFav={toggleFav}
          appTheme={appTheme}
          t={t}
        />
      </div>
    </aside>
  )
}

function Section({
  title,
  items,
  onPick,
  onRemove,
  onToggleFav,
  appTheme,
  t,
}: any) {
  return (
    <div>
      <div className={`px-4 pt-3 pb-2 text-xs uppercase tracking-wide ${
        appTheme === "light" ? "text-gray-500" : "text-zinc-500"
      }`}>
        {title}
      </div>
      <ul className="space-y-2 px-2">
        {items.map((e: any) => (
          <li
            key={e.id}
            className={`group flex items-start justify-between gap-2 rounded-md border p-3 transition ${
              appTheme === "light"
                ? "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                : "border-zinc-800/70 bg-zinc-900/40 hover:border-lime-500/40 hover:bg-zinc-900/60"
            }`}
          >
            <button
              className="text-left"
              onClick={() => onPick(e.expr)}
              title={e.normalized}
            >
              <div className={`text-sm ${
                appTheme === "light" ? "text-gray-800" : "text-zinc-200"
              }`}>{e.expr}</div>
              <div className={`text-xs ${
                appTheme === "light" ? "text-gray-500" : "text-zinc-500"
              }`}>= {e.result}</div>
            </button>
            <div className="flex items-center gap-2 opacity-70">
              <button
                onClick={() => onToggleFav(e.id)}
                className={`transition ${
                  e.favorite 
                    ? "text-yellow-400" 
                    : appTheme === "light" 
                    ? "text-gray-400 hover:text-gray-600"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title={e.favorite ? t("sidebar.removeFavorite") : t("sidebar.addFavorite")}
              >
                <Star size={16} fill={e.favorite ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => onRemove(e.id)}
                className={`transition ${
                  appTheme === "light"
                    ? "text-gray-400 hover:text-red-600"
                    : "text-zinc-500 hover:text-red-400"
                }`}
                title={t("sidebar.delete")}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className={`px-3 py-2 text-xs ${
            appTheme === "light" ? "text-gray-500" : "text-zinc-500"
          }`}>{t("sidebar.noEntries")}</li>
        )}
      </ul>
    </div>
  )
}


