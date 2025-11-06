"use client"
import { motion } from "framer-motion"
import { useModeStore, THEMES } from "../lib/mode"

export default function AnimatedBackdrop() {
  const { mode } = useModeStore()
  const theme = THEMES[mode]

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Subtiles Grid */}
      <div className="absolute inset-0 opacity-35 [background:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:24px_24px]" />

      {/* Gemeinsamer Glow */}
      <motion.div
        key={`glow-${mode}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.45 }}
        style={{
          background: `radial-gradient(70% 50% at 50% 40%, ${theme.glow}, transparent)`,
        }}
        className="absolute inset-0"
      />

      {/* Theme-spezifische Animation */}
      {mode === "basic" && <BasicPulse color={theme.blobA} />}
      {mode === "developer" && <DevScanlines accent={theme.accent} />}
      {mode === "finance" && <FinanceShimmer glow={theme.glow} />}
      {mode === "advanced" && <AdvancedOrbits accent={theme.accent} />}
    </div>
  )
}

/* BASIC: sanfter pulsierender Blob */
function BasicPulse({ color }: { color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.2, scale: 0.95 }}
      animate={{ opacity: [0.18, 0.35, 0.18], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-1/2 top-[38%] h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      style={{ background: color }}
    />
  )
}

/* DEVELOPER: diagonale Scanlines + wandernder Gradient */
function DevScanlines({ accent }: { accent: string }) {
  return (
    <>
      <motion.div
        initial={{ backgroundPosition: "0% 0%" }}
        animate={{ backgroundPosition: ["0% 0%", "200% 200%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, transparent 0 6px, ${accent}22 6px 7px)`,
          mixBlendMode: "screen",
        }}
      />
      <motion.div
        initial={{ x: "-40%" }}
        animate={{ x: ["-40%", "140%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-full w-1/3 opacity-15 blur-2xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}33, transparent)`,
        }}
      />
    </>
  )
}

/* FINANCE: sanfter Shimmer von links nach rechts */
function FinanceShimmer({ glow }: { glow: string }) {
  return (
    <motion.div
      initial={{ x: "-30%" }}
      animate={{ x: ["-30%", "130%", "-30%"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/3 h-1/2 w-1/4 rotate-6 opacity-25 blur-2xl"
      style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }}
    />
  )
}

/* ADVANCED: 3 kleine Orbits mit Winkelversatz */
function AdvancedOrbits({ accent }: { accent: string }) {
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
            boxShadow: `0 0 20px ${accent}55`,
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
