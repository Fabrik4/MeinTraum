"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import Link from "next/link"

type WeeklyStats = {
  dream_count: number
  journal_count: number
  checkin_count: number
  mood_avg: number | null
  mood_avg_prev: number | null
  nightmare_count: number
  pleasant_count: number
  top_emotion: string | null
  moon_phases: string[]
  persons: string[]
  places: string[]
  week_start: string
  week_end: string
}

type ReviewData = {
  stats: WeeklyStats
  hypothesis: string
  question: string
}

function weekRangeLabel(ws: string, we: string): string {
  const s = new Date(ws)
  const e = new Date(we)
  const sf = s.toLocaleDateString("de-CH", { day: "numeric", month: "long" })
  const ef = e.toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })
  return `${sf} – ${ef}`
}

function moodTrendInfo(avg: number | null, prev: number | null) {
  if (!avg) return null
  if (!prev) return { label: "Stabil", arrow: "→", cls: "text-white/60 border-white/10 bg-white/4" }
  const diff = avg - prev
  if (diff > 0.5)  return { label: "Steigend", arrow: "↗", cls: "text-emerald-300 border-emerald-300/20 bg-emerald-300/6" }
  if (diff < -0.5) return { label: "Sinkend",  arrow: "↘", cls: "text-rose-300 border-rose-300/20 bg-rose-300/6" }
  return { label: "Stabil", arrow: "→", cls: "text-amber-300 border-amber-300/20 bg-amber-300/6" }
}

function plural(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`
}

export default function WeeklyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [review, setReview] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
    if (!authLoading && user) loadReview()
  }, [user, authLoading])

  async function loadReview() {
    try {
      const res = await fetch("/api/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user!.id }),
      })
      const data = await res.json()
      if (data.stats) setReview(data)
      else setError(data.error ?? "Rückblick konnte nicht geladen werden.")
    } catch {
      setError("Rückblick konnte nicht geladen werden.")
    }
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-14 text-white">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <div className="h-3 w-28 rounded-full bg-white/5 animate-pulse mb-3" />
            <div className="h-8 w-44 rounded-xl bg-white/8 animate-pulse" />
            <div className="h-3 w-40 rounded-full bg-white/4 animate-pulse mt-2" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
          <div className="h-16 rounded-2xl bg-white/3 animate-pulse" />
          <div className="h-32 rounded-3xl bg-white/3 animate-pulse" />
          <div className="h-36 rounded-3xl bg-cyan-300/4 animate-pulse" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-14 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/50">{error}</p>
          <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/70 transition">
            ← Zurück zum Dashboard
          </Link>
        </div>
      </main>
    )
  }

  const { stats, hypothesis, question } = review!
  const isEmpty = stats.dream_count === 0 && stats.journal_count === 0 && stats.checkin_count === 0
  const trend = moodTrendInfo(stats.mood_avg, stats.mood_avg_prev)

  if (isEmpty) {
    return (
      <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-14 text-white">
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Wochenrückblick</p>
            <h1 className="text-3xl font-semibold">Deine Woche</h1>
            <p className="text-xs text-white/40 mt-2">{weekRangeLabel(stats.week_start, stats.week_end)}</p>
          </div>
          <div className="rounded-3xl border border-white/8 bg-white/3 p-10 text-center space-y-4">
            <p className="text-3xl">🌙</p>
            <p className="font-medium text-white">Diese Woche noch keine Einträge</p>
            <p className="text-sm text-white/65 leading-7 max-w-sm mx-auto">
              Trag deinen nächsten Traum ein –<br />nächste Woche erscheint hier dein Rückblick.
            </p>
            <Link href="/entry"
              className="inline-block mt-2 rounded-2xl bg-white px-6 py-3 font-medium text-[#070b14] transition hover:scale-[1.02]">
              Traum erfassen →
            </Link>
          </div>
          <div className="flex justify-center">
            <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/70 transition">
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-14 text-white">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Wochenrückblick</p>
          <h1 className="text-3xl font-semibold">Deine Woche</h1>
          <p className="text-xs text-white/40 mt-2">{weekRangeLabel(stats.week_start, stats.week_end)}</p>
        </div>

        {/* Stat Grid */}
        <div className={`grid grid-cols-2 gap-3 ${stats.mood_avg ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
            <p className="text-xs text-white/40 mb-2">🌙 Träume</p>
            <p className="text-2xl font-semibold text-cyan-200">{stats.dream_count}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
            <p className="text-xs text-white/40 mb-2">📓 Journal</p>
            <p className="text-2xl font-semibold text-amber-200">{stats.journal_count}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
            <p className="text-xs text-white/40 mb-2">✓ Check-ins</p>
            <p className="text-2xl font-semibold text-white/65">{stats.checkin_count}</p>
          </div>
          {stats.mood_avg && (
            <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
              <p className="text-xs text-white/40 mb-2">Ø Stimmung</p>
              <p className="text-2xl font-semibold text-emerald-200">
                {stats.mood_avg}
                <span className="text-xs font-normal text-white/40 ml-0.5">/10</span>
              </p>
            </div>
          )}
        </div>

        {/* Stimmungstrend */}
        {trend && (
          <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-white/65">Stimmung diese Woche</p>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${trend.cls}`}>
              {trend.arrow} {trend.label}
            </span>
          </div>
        )}

        {/* Emotion + Traumton */}
        {(stats.top_emotion || stats.nightmare_count > 0 || stats.pleasant_count > 0) && (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.15em] text-white/40">Träume</p>
            {stats.top_emotion && (
              <span className="inline-block rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-1.5 text-sm text-cyan-200">
                💭 {stats.top_emotion}
              </span>
            )}
            {(stats.nightmare_count > 0 || stats.pleasant_count > 0) && (
              <p className="text-xs text-white/50">
                {[
                  stats.nightmare_count > 0 ? plural(stats.nightmare_count, "Albtraum", "Albträume") : null,
                  stats.pleasant_count > 0 ? plural(stats.pleasant_count, "schöner Traum", "schöne Träume") : null,
                ].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}

        {/* Personen & Orte */}
        {(stats.persons?.length > 0 || stats.places?.length > 0) && (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-5 space-y-4">
            {stats.persons?.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2">👤 Personen diese Woche</p>
                <div className="flex flex-wrap gap-2">
                  {stats.persons.map((p) => (
                    <span key={p} className="rounded-full border border-violet-300/15 bg-violet-300/8 px-3 py-1 text-xs text-violet-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {stats.places?.length > 0 && (
              <div>
                <p className="text-xs text-white/40 mb-2">📍 Orte diese Woche</p>
                <div className="flex flex-wrap gap-2">
                  {stats.places.map((p) => (
                    <span key={p} className="rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1 text-xs text-amber-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mondphasen */}
        {stats.moon_phases?.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4">
            <p className="text-xs text-white/40 mb-2">🌙 Mondphasen</p>
            <div className="flex flex-wrap gap-2">
              {stats.moon_phases.map((m) => (
                <span key={m} className="rounded-full border border-amber-300/15 bg-amber-300/5 px-3 py-1 text-xs text-amber-300/60">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* KI-Hypothese */}
        {hypothesis && (
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/4 p-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-300/60">✦ Wochenreflexion</p>
            <p className="leading-8 text-white/75">{hypothesis}</p>
            {question && (
              <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-4">
                <p className="text-xs text-white/50 mb-2">Frage für diese Woche</p>
                <p className="text-sm text-white/65 leading-7 italic">"{question}"</p>
              </div>
            )}
          </div>
        )}

        {/* Back */}
        <div className="flex justify-center">
          <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/70 transition">
            ← Zurück zum Dashboard
          </Link>
        </div>

      </div>
    </main>
  )
}
