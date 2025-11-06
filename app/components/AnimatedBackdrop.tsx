"use client"
import { motion } from "framer-motion"
import { useModeStore, THEMES } from "../lib/mode"
import { useSettingsStore } from "../lib/settings"
import { useState, useEffect } from "react"

export default function AnimatedBackdrop() {
  const { mode } = useModeStore()
  const baseTheme = THEMES[mode]
  const appTheme = useSettingsStore((state) => state.theme)
  
  // Theme-Farben anpassen für Light Mode: Glow wird blau statt grün
  const theme = appTheme === "light" && mode === "basic"
    ? {
        ...baseTheme,
        glow: "rgba(56,189,248,0.25)", // Blauer Glow für Light Mode
        blobA: "rgba(56,189,248,0.15)",
      }
    : baseTheme

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Subtiles Grid */}
      <div className={`absolute inset-0 opacity-35 [background:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:24px_24px] ${
        appTheme === "light" ? "opacity-20" : ""
      }`} />

      {/* Gemeinsamer Glow */}
      <motion.div
        key={`glow-${mode}-${appTheme}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: appTheme === "light" ? 0.15 : 0.35 }}
        transition={{ duration: 0.45 }}
        style={{
          background: `radial-gradient(70% 50% at 50% 40%, ${theme.glow}, transparent)`,
        }}
        className="absolute inset-0"
      />

      {/* Floating Particles - immer aktiv */}
      <FloatingParticles accent={theme.accent} appTheme={appTheme} />

      {/* Theme-spezifische Animation */}
      {mode === "basic" && <BasicPulse color={theme.blobA} appTheme={appTheme} />}
      {mode === "developer" && <DevScanlines accent={theme.accent} appTheme={appTheme} />}
      {mode === "finance" && <FinanceShimmer glow={theme.glow} appTheme={appTheme} />}
      {mode === "advanced" && <AdvancedOrbits accent={theme.accent} appTheme={appTheme} />}

      {/* Animated Gradient Waves */}
      <GradientWaves glow={theme.glow} appTheme={appTheme} />
    </div>
  )
}

/* Floating Particles - schwebende Partikel */
function FloatingParticles({ accent, appTheme }: { accent: string; appTheme: "dark" | "light" }) {
  // useState + useEffect stellt sicher, dass Partikel nur auf dem Client generiert werden
  // Das verhindert Hydration-Mismatch zwischen Server und Client
  const [particles, setParticles] = useState<Array<{
    id: number
    size: number
    x: number
    y: number
    duration: number
    delay: number
  }>>([])

  useEffect(() => {
    // Generiere Partikel nur auf dem Client (nach dem Mount)
    setParticles(
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        size: Math.random() * 60 + 40,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
      }))
    )
  }, []) // Nur einmal beim Mount

  // Rendere nichts auf dem Server (verhindert Hydration-Mismatch)
  if (particles.length === 0) {
    return null
  }

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            opacity: appTheme === "light" ? 0.05 : 0.1,
          }}
          animate={{
            x: [
              `${particle.x}%`,
              `${(particle.x + 30) % 100}%`,
              `${(particle.x - 20) % 100}%`,
              `${particle.x}%`,
            ],
            y: [
              `${particle.y}%`,
              `${(particle.y + 20) % 100}%`,
              `${(particle.y - 15) % 100}%`,
              `${particle.y}%`,
            ],
            opacity: appTheme === "light" 
              ? [0.05, 0.1, 0.08, 0.05]
              : [0.1, 0.2, 0.15, 0.1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
          className="absolute rounded-full blur-2xl"
          style={{
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, ${accent}${appTheme === "light" ? "20" : "40"}, transparent)`,
          }}
        />
      ))}
    </>
  )
}

/* Gradient Waves - wellenförmige Gradient-Animationen */
function GradientWaves({ glow, appTheme }: { glow: string; appTheme: "dark" | "light" }) {
  return (
    <>
      <motion.div
        initial={{ backgroundPosition: "0% 50%" }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute inset-0 ${appTheme === "light" ? "opacity-5" : "opacity-10"}`}
        style={{
          backgroundImage: `linear-gradient(45deg, transparent 30%, ${glow} 50%, transparent 70%)`,
          backgroundSize: "200% 200%",
          backgroundPosition: "0% 50%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <motion.div
        initial={{ backgroundPosition: "100% 50%" }}
        animate={{ backgroundPosition: ["100% 50%", "0% 50%", "100% 50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={`absolute inset-0 ${appTheme === "light" ? "opacity-5" : "opacity-10"}`}
        style={{
          backgroundImage: `linear-gradient(-45deg, transparent 30%, ${glow} 50%, transparent 70%)`,
          backgroundSize: "200% 200%",
          backgroundPosition: "100% 50%",
          backgroundRepeat: "no-repeat",
        }}
      />
    </>
  )
}

/* BASIC: sanfter pulsierender Blob mit mehreren Schichten */
function BasicPulse({ color, appTheme }: { color: string; appTheme: "dark" | "light" }) {
  return (
    <>
      <motion.div
        initial={{ opacity: appTheme === "light" ? 0.1 : 0.2, scale: 0.95 }}
        animate={{ 
          opacity: appTheme === "light" 
            ? [0.1, 0.2, 0.1] 
            : [0.18, 0.35, 0.18], 
          scale: [0.95, 1.05, 0.95] 
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[38%] h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: color }}
      />
      <motion.div
        initial={{ opacity: appTheme === "light" ? 0.08 : 0.15, scale: 0.9 }}
        animate={{ 
          opacity: appTheme === "light"
            ? [0.08, 0.15, 0.08]
            : [0.15, 0.25, 0.15], 
          scale: [0.9, 1.1, 0.9] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute left-1/2 top-[45%] h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: color }}
      />
    </>
  )
}

/* DEVELOPER: diagonale Scanlines + wandernder Gradient + Matrix-Effekt */
function DevScanlines({ accent, appTheme }: { accent: string; appTheme: "dark" | "light" }) {
  return (
    <>
      <motion.div
        initial={{ backgroundPosition: "0% 0%" }}
        animate={{ backgroundPosition: ["0% 0%", "200% 200%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        className={`absolute inset-0 ${appTheme === "light" ? "opacity-10" : "opacity-20"}`}
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 6px, ${accent}22 6px 7px)`,
          mixBlendMode: "screen",
        }}
      />
      <motion.div
        initial={{ x: "-40%" }}
        animate={{ x: ["-40%", "140%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-0 h-full w-1/3 blur-2xl ${appTheme === "light" ? "opacity-8" : "opacity-15"}`}
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}33, transparent)`,
        }}
      />
      {/* Zusätzlicher Matrix-ähnlicher Effekt */}
      <motion.div
        initial={{ backgroundPosition: "0% 0%" }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className={`absolute inset-0 ${appTheme === "light" ? "opacity-5" : "opacity-10"}`}
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0 2px, ${accent}15 2px 3px)`,
        }}
      />
    </>
  )
}

/* FINANCE: sanfter Shimmer von links nach rechts + pulsierende Ringe */
function FinanceShimmer({ glow, appTheme }: { glow: string; appTheme: "dark" | "light" }) {
  return (
    <>
      <motion.div
        initial={{ x: "-30%" }}
        animate={{ x: ["-30%", "130%", "-30%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-1/3 h-1/2 w-1/4 rotate-6 blur-2xl ${appTheme === "light" ? "opacity-15" : "opacity-25"}`}
        style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }}
      />
      {/* Pulsierende konzentrische Ringe */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8, opacity: appTheme === "light" ? 0.05 : 0.1 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8], 
            opacity: appTheme === "light"
              ? [0.05, 0.1, 0.05]
              : [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.3,
          }}
          className={`absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 blur-sm ${
            appTheme === "light" ? "opacity-10" : "opacity-20"
          }`}
          style={{ borderColor: glow }}
        />
      ))}
    </>
  )
}

/* ADVANCED: 3 kleine Orbits mit Winkelversatz */
function AdvancedOrbits({ accent, appTheme }: { accent: string; appTheme: "dark" | "light" }) {
  type DotProps = {
    size: number
    delay: number
    radius: number
    angleOffset: number
  }

  function Dot({ size, delay, radius, angleOffset }: DotProps) {
    return (
      <motion.div
        initial={{ rotate: angleOffset }}
        animate={{ rotate: angleOffset + 360 }}
        transition={{ duration: 20 + delay, repeat: Infinity, ease: "linear" }}
        className="absolute left-1/2 top-[45%] h-0 w-0"
        style={{ transformOrigin: `${radius}rem ${radius}rem` }}
      >
        <div
          className="rounded-full shadow-2xl"
          style={{
            height: size,
            width: size,
            background: accent,
            filter: "blur(1px)",
            boxShadow: `0 0 20px ${accent}${appTheme === "light" ? "40" : "55"}`,
            transform: `translate(-${radius}rem, -${radius}rem)`,
          }}
        />
      </motion.div>
    )
  }

  return (
    <>
      <Dot size={8} delay={0} radius={10} angleOffset={0} />
      <Dot size={6} delay={2} radius={13} angleOffset={120} />
      <Dot size={5} delay={4} radius={16} angleOffset={240} />
      <Dot size={4} delay={6} radius={20} angleOffset={60} />
    </>
  )
}
