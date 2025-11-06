"use client"
import { useModeStore, THEMES, Mode } from "../lib/mode"

const modes: { id: Mode; label: string; icon: string }[] = [
  { id: "basic", label: "Basic", icon: "🧮" },
  { id: "developer", label: "Dev", icon: "💻" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "advanced", label: "Advanced", icon: "⚙️" },
]

export default function ModeSwitch() {
  const { mode, setMode } = useModeStore()
  return (
    <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-1 text-xs">
      {modes.map((m) => {
        const t = THEMES[m.id]
        const active = mode === m.id
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded px-2 py-0.5 font-medium transition relative`}
            style={{
              color: active ? t.accent : undefined,
              boxShadow: active ? `inset 0 0 0 1px ${t.accent}40` : undefined,
              background: active ? `linear-gradient(0deg, ${t.glow}20, transparent)` : undefined,
            }}
            title={`${m.label} mode`}
          >
            <span className="mr-1.5">{m.icon}</span>
            {m.label}
            <span
              className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full transition-all"
              style={{
                background: active ? t.accent : "transparent",
                width: active ? "24px" : "0px",
              }}
            />
          </button>
        )
      })}
    </div>
  )
}
