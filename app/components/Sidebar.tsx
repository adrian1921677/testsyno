"use client"
import { Star, Trash2, Clock } from "lucide-react"
import { useCalcStore } from "../lib/store"

export default function Sidebar({
  onPick,
}: {
  onPick: (expr: string) => void
}) {
  const { entries, remove, toggleFav, clear } = useCalcStore()

  const favs = entries.filter((e) => e.favorite)
  const rest = entries.filter((e) => !e.favorite)

  return (
    <aside className="hidden lg:flex h-dvh w-[320px] flex-col border-l border-zinc-800/70 bg-zinc-950/60 backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/70 bg-zinc-900/30">
        <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
          <Clock size={16} />
          Verlauf
        </div>
        <button
          onClick={() => clear()}
          className="text-xs text-zinc-400 hover:text-red-400 transition"
          title="Alles löschen"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {favs.length > 0 && (
          <Section
            title="Favoriten"
            items={favs}
            onPick={onPick}
            onRemove={remove}
            onToggleFav={toggleFav}
          />
        )}
        <Section
          title="Zuletzt"
          items={rest}
          onPick={onPick}
          onRemove={remove}
          onToggleFav={toggleFav}
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
}: any) {
  return (
    <div>
      <div className="px-4 pt-3 pb-2 text-xs uppercase tracking-wide text-zinc-500">
        {title}
      </div>
      <ul className="space-y-2 px-2">
        {items.map((e: any) => (
          <li
            key={e.id}
            className="group flex items-start justify-between gap-2 rounded-md border border-zinc-800/70 bg-zinc-900/40 p-3 hover:border-lime-500/40 hover:bg-zinc-900/60 transition"
          >
            <button
              className="text-left"
              onClick={() => onPick(e.expr)}
              title={e.normalized}
            >
              <div className="text-sm text-zinc-200">{e.expr}</div>
              <div className="text-xs text-zinc-500">= {e.result}</div>
            </button>
            <div className="flex items-center gap-2 opacity-70">
              <button
                onClick={() => onToggleFav(e.id)}
                className={`transition ${
                  e.favorite ? "text-yellow-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title={e.favorite ? "Favorit entfernen" : "Als Favorit speichern"}
              >
                <Star size={16} fill={e.favorite ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => onRemove(e.id)}
                className="text-zinc-500 hover:text-red-400 transition"
                title="Löschen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-2 text-xs text-zinc-500">Keine Einträge</li>
        )}
      </ul>
    </div>
  )
}


