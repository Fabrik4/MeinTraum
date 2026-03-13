// Mondphasen-Berechnung ohne externe API
// Referenz: bekannter Neumond am 6. Januar 2000, 18:14 UTC

const SYNODIC_PERIOD = 29.53059 // Tage
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime()

export type MoonPhaseResult = {
  phase: number        // 0.0–1.0
  name: string         // Phasenname auf Deutsch
  emoji: string        // Mondphasen-Emoji
  illumination: number // 0–100% Beleuchtung
}

type PhaseEntry = { max: number; name: string; emoji: string }

const PHASES: PhaseEntry[] = [
  { max: 0.0625, name: "Neumond",              emoji: "🌑" },
  { max: 0.1875, name: "Zunehmende Sichel",    emoji: "🌒" },
  { max: 0.3125, name: "Erstes Viertel",       emoji: "🌓" },
  { max: 0.4375, name: "Zunehmender Gibbous",  emoji: "🌔" },
  { max: 0.5625, name: "Vollmond",             emoji: "🌕" },
  { max: 0.6875, name: "Abnehmender Gibbous",  emoji: "🌖" },
  { max: 0.8125, name: "Letztes Viertel",      emoji: "🌗" },
  { max: 0.9375, name: "Abnehmende Sichel",    emoji: "🌘" },
  { max: 1.0,    name: "Neumond",              emoji: "🌑" },
]

export function getMoonPhase(date: Date): MoonPhaseResult {
  const daysSinceNew = (date.getTime() - KNOWN_NEW_MOON) / 864e5
  const rawPhase = ((daysSinceNew % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD
  const phase = rawPhase / SYNODIC_PERIOD
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phase)) / 2 * 100)
  const entry = PHASES.find((p) => phase < p.max) ?? PHASES[PHASES.length - 1]
  return {
    phase: Math.round(phase * 1000) / 1000,
    name: entry.name,
    emoji: entry.emoji,
    illumination,
  }
}

export function getMoonCalendar(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month - 1, i + 1)
    const { phase, name, emoji } = getMoonPhase(date)
    return { date, phase, name, emoji }
  })
}

// Hilfsfunktion: Phasenname → Emoji (für gespeicherte DB-Werte)
export function moonNameToEmoji(name: string): string {
  return PHASES.find((p) => p.name === name)?.emoji ?? "🌙"
}
