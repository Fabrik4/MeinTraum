"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

type PatternData = {
  // Stimmung
  moodByDay: Array<{ date: string; score: number; type: "dream" | "journal" }>
  moodAvg7d: number | null
  moodAvg30d: number | null
  moodTrend: "rising" | "falling" | "stable" | null

  // Personen & Orte
  topPersons: Array<{ label: string; count: number }>
  topPlaces: Array<{ label: string; count: number }>

  // Emotionen
  topEmotions: Array<{ label: string; count: number; type: "dream" | "journal" | "both" }>

  // Träume
  dreamTones: { nightmare: number; neutral: number; pleasant: number }
  avgDreamClarity: string | null
  nightmareRate: number

  // Aktivität
  totalDreams: number
  totalJournal: number
  activeDays: number
  longestStreak: number
}

type AIInsight = {
  patterns: string
  connections: string
  question: string
}

export default function PatternsPage() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<PatternData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null)
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [timeRange, setTimeRange] = useState<30 | 90 | 365>(30)

  useEffect(() => {
    if (!authLoading && user) fetchPatterns()
  }, [user, authLoading, timeRange])

  async function fetchPatterns() {
    setLoading(true)
    const since = new Date(Date.now() - timeRange * 864e5).toISOString()

    const [dreamsRes, journalsRes, entitiesRes] = await Promise.all([
      supabase.from("dream_entries")
        .select("id, dream_tone, nightmare_flag, dream_clarity, dominant_emotion, dreamed_at, created_at")
        .eq("user_id", user!.id).gte("created_at", since).order("created_at", { ascending: true }),
      supabase.from("journal_entries")
        .select("id, mood_score, dominant_emotion, energy_level, entry_date, created_at")
        .eq("user_id", user!.id).gte("created_at", since).order("created_at", { ascending: true }),
      supabase.from("user_entities")
        .select("entity_type, entity_label, dream_entry_entities(count), journal_entry_entities(count)")
        .eq("user_id", user!.id).eq("is_confirmed", true),
    ])

    const dreams = dreamsRes.data ?? []
    const journals = journalsRes.data ?? []

    // ── Stimmungsverlauf ──────────────────────────────────────
    const moodByDay = journals
      .filter((j: any) => j.mood_score)
      .map((j: any) => ({
        date: (j.entry_date || j.created_at).slice(0, 10),
        score: j.mood_score,
        type: "journal" as const,
      }))

    const moodScores = journals.filter((j: any) => j.mood_score).map((j: any) => j.mood_score)
    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null

    const now = Date.now()
    const recent7  = journals.filter((j: any) => new Date(j.created_at).getTime() > now - 7  * 864e5 && j.mood_score).map((j: any) => j.mood_score)
    const recent30 = journals.filter((j: any) => new Date(j.created_at).getTime() > now - 30 * 864e5 && j.mood_score).map((j: any) => j.mood_score)
    const older30  = journals.filter((j: any) => {
      const t = new Date(j.created_at).getTime()
      return t < now - 30 * 864e5 && t > now - 60 * 864e5 && j.mood_score
    }).map((j: any) => j.mood_score)

    const avg7d  = avg(recent7)
    const avg30d = avg(recent30)
    const avgOld = avg(older30)
    let moodTrend: PatternData["moodTrend"] = null
    if (avg30d && avgOld) {
      const diff = avg30d - avgOld
      moodTrend = diff > 0.5 ? "rising" : diff < -0.5 ? "falling" : "stable"
    }

    // ── Emotionen ─────────────────────────────────────────────
    const emotionMap: Record<string, { count: number; dream: number; journal: number }> = {}
    dreams.forEach((d: any) => {
      d.dominant_emotion?.split(", ").filter(Boolean).forEach((em: string) => {
        if (!emotionMap[em]) emotionMap[em] = { count: 0, dream: 0, journal: 0 }
        emotionMap[em].count++; emotionMap[em].dream++
      })
    })
    journals.forEach((j: any) => {
      j.dominant_emotion?.split(", ").filter(Boolean).forEach((em: string) => {
        if (!emotionMap[em]) emotionMap[em] = { count: 0, dream: 0, journal: 0 }
        emotionMap[em].count++; emotionMap[em].journal++
      })
    })
    const topEmotions = Object.entries(emotionMap)
      .sort((a, b) => b[1].count - a[1].count).slice(0, 8)
      .map(([label, v]) => ({
        label, count: v.count,
        type: (v.dream > 0 && v.journal > 0 ? "both" : v.dream > 0 ? "dream" : "journal") as any,
      }))

    // ── Traumstimmungen ───────────────────────────────────────
    const tones = { nightmare: 0, neutral: 0, pleasant: 0 }
    dreams.forEach((d: any) => {
      const t = d.dream_tone || (d.nightmare_flag ? "nightmare" : "neutral")
      if (t in tones) tones[t as keyof typeof tones]++
    })
    const nightmareRate = dreams.length > 0 ? Math.round(tones.nightmare / dreams.length * 100) : 0

    // Klarheit
    const clarityMap: Record<string, number> = {}
    dreams.forEach((d: any) => { if (d.dream_clarity) clarityMap[d.dream_clarity] = (clarityMap[d.dream_clarity] ?? 0) + 1 })
    const avgDreamClarity = Object.entries(clarityMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    // ── Personen & Orte (aus user_entities mit Join-Count) ───
    const entityCounts: Record<string, { label: string; type: string; count: number }> = {}
    ;(entitiesRes.data ?? []).forEach((e: any) => {
      const dreamCount   = e.dream_entry_entities?.[0]?.count ?? 0
      const journalCount = e.journal_entry_entities?.[0]?.count ?? 0
      const total = Number(dreamCount) + Number(journalCount)
      if (total > 0) entityCounts[e.entity_label] = { label: e.entity_label, type: e.entity_type, count: total }
    })
    const topPersons = Object.values(entityCounts).filter((e) => e.type === "person").sort((a, b) => b.count - a.count).slice(0, 8)
    const topPlaces  = Object.values(entityCounts).filter((e) => e.type === "place").sort((a, b) => b.count - a.count).slice(0, 8)

    // ── Aktivität ─────────────────────────────────────────────
    const allDates = [
      ...dreams.map((d: any) => (d.dreamed_at || d.created_at).slice(0, 10)),
      ...journals.map((j: any) => (j.entry_date || j.created_at).slice(0, 10)),
    ]
    const uniqueDates = [...new Set(allDates)].sort()
    let longestStreak = 0, currentStreak = 0
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) { currentStreak = 1; continue }
      const prev = new Date(uniqueDates[i - 1]).getTime()
      const curr = new Date(uniqueDates[i]).getTime()
      if (curr - prev === 864e5) { currentStreak++ } else { currentStreak = 1 }
      longestStreak = Math.max(longestStreak, currentStreak)
    }

    setData({
      moodByDay, moodAvg7d: avg7d, moodAvg30d: avg30d, moodTrend,
      topPersons, topPlaces, topEmotions,
      dreamTones: tones, avgDreamClarity, nightmareRate,
      totalDreams: dreams.length, totalJournal: journals.length,
      activeDays: uniqueDates.length, longestStreak,
    })
    setLoading(false)
  }

  async function generateInsight() {
    if (!data || !user) return
    setGeneratingInsight(true)
    try {
      const res = await fetch("/api/pattern-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          timeRange,
          stats: {
            moodAvg7d: data.moodAvg7d,
            moodAvg30d: data.moodAvg30d,
            moodTrend: data.moodTrend,
            topEmotions: data.topEmotions.slice(0, 5).map((e) => e.label),
            topPersons: data.topPersons.slice(0, 5).map((p) => p.label),
            topPlaces: data.topPlaces.slice(0, 5).map((p) => p.label),
            nightmareRate: data.nightmareRate,
            dreamTones: data.dreamTones,
            totalDreams: data.totalDreams,
            totalJournal: data.totalJournal,
          }
        }),
      })
      const result = await res.json()
      if (result.insight) setAiInsight(result.insight)
    } catch { /* silent */ }
    setGeneratingInsight(false)
  }

  const moodTrendIcon = data?.moodTrend === "rising" ? "↗" : data?.moodTrend === "falling" ? "↘" : "→"
  const moodTrendColor = data?.moodTrend === "rising" ? "text-emerald-300" : data?.moodTrend === "falling" ? "text-red-300" : "text-white/50"

  if (authLoading || loading) return (
    <main className="min-h-screen bg-[#070b14] px-6 pt-5 pb-24 md:py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="h-8 w-48 rounded-xl bg-white/5 animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-3xl bg-white/5 animate-pulse" />)}
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#070b14] px-6 pt-5 pb-24 md:py-16 text-white">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/35">Deine Muster</p>
            <h1 className="mt-4 text-4xl font-semibold">Muster-Analyse</h1>
            <p className="mt-3 text-sm leading-7 text-white/45">Was dein Unterbewusstsein dir zeigt.</p>
          </div>
          <div className="flex gap-2">
            {([30, 90, 365] as const).map((t) => (
              <button key={t} onClick={() => setTimeRange(t)}
                className={`rounded-full border px-4 py-2 text-sm transition ${timeRange === t ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/45 hover:text-white"}`}>
                {t === 365 ? "1 Jahr" : `${t} Tage`}
              </button>
            ))}
          </div>
        </div>

        {/* Übersicht */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Träume" value={data?.totalDreams ?? 0} accent="cyan" />
          <StatCard label="Journaleinträge" value={data?.totalJournal ?? 0} accent="amber" />
          <StatCard label="Aktive Tage" value={data?.activeDays ?? 0} accent="violet" />
          <StatCard label="Längste Serie" value={data?.longestStreak ?? 0} suffix="Tage" accent="emerald" />
        </div>

        {/* Stimmung */}
        {(data?.moodAvg30d || data?.moodAvg7d) && (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.15em] text-white/30">Stimmungsverlauf</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {data?.moodAvg7d && (
                <div>
                  <p className="text-xs text-white/35 mb-1">Letzte 7 Tage</p>
                  <p className={`text-2xl font-semibold ${moodScoreColor(data.moodAvg7d)}`}>{data.moodAvg7d}<span className="text-sm font-normal text-white/30">/10</span></p>
                </div>
              )}
              {data?.moodAvg30d && (
                <div>
                  <p className="text-xs text-white/35 mb-1">Letzte 30 Tage</p>
                  <p className={`text-2xl font-semibold ${moodScoreColor(data.moodAvg30d)}`}>{data.moodAvg30d}<span className="text-sm font-normal text-white/30">/10</span></p>
                </div>
              )}
              {data?.moodTrend && (
                <div>
                  <p className="text-xs text-white/35 mb-1">Trend</p>
                  <p className={`text-2xl font-semibold ${moodTrendColor}`}>{moodTrendIcon}
                    <span className="text-sm font-normal ml-2 text-white/45">
                      {data.moodTrend === "rising" ? "Steigend" : data.moodTrend === "falling" ? "Fallend" : "Stabil"}
                    </span>
                  </p>
                </div>
              )}
            </div>
            {/* Mini Mood Chart */}
            {data?.moodByDay && data.moodByDay.length > 1 && (
              <MoodChart entries={data.moodByDay} />
            )}
          </div>
        )}

        {/* Traumstimmungen */}
        {data && data.totalDreams > 0 && (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.15em] text-white/30">Traumstimmungen</p>
            <div className="grid grid-cols-3 gap-3">
              <ToneBar label="Albtraum" count={data.dreamTones.nightmare} total={data.totalDreams} color="red" emoji="😰" />
              <ToneBar label="Neutral" count={data.dreamTones.neutral} total={data.totalDreams} color="white" emoji="😐" />
              <ToneBar label="Schön" count={data.dreamTones.pleasant} total={data.totalDreams} color="emerald" emoji="✨" />
            </div>
            {data.avgDreamClarity && (
              <p className="text-sm text-white/40">Durchschnittliche Klarheit: <span className="text-white/65">{data.avgDreamClarity}</span></p>
            )}
          </div>
        )}

        {/* Emotionen */}
        {data && data.topEmotions.length > 0 && (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.15em] text-white/30">Häufigste Emotionen</p>
            <div className="space-y-3">
              {data.topEmotions.map((em, i) => {
                const max = data.topEmotions[0].count
                const pct = Math.round(em.count / max * 100)
                const color = em.type === "dream" ? "bg-cyan-300/50" : em.type === "journal" ? "bg-amber-300/50" : "bg-violet-300/50"
                const badge = em.type === "dream" ? "🌙" : em.type === "journal" ? "📓" : "🌙📓"
                return (
                  <div key={em.label} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-white/70 shrink-0">{em.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-white/30 w-6 text-right shrink-0">{em.count}×</span>
                    <span className="text-xs shrink-0">{badge}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-white/20">🌙 Träume · 📓 Journal · 🌙📓 Beide</p>
          </div>
        )}

        {/* Personen & Orte */}
        <div className="grid gap-5 sm:grid-cols-2">
          {data && data.topPersons.length > 0 && (
            <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.15em] text-white/30">Personen</p>
              <div className="space-y-2.5">
                {data.topPersons.map((p) => (
                  <div key={p.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-violet-300/60">👤</span>{p.label}
                    </span>
                    <span className="text-xs text-white/25">{p.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {data && data.topPlaces.length > 0 && (
            <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.15em] text-white/30">Orte</p>
              <div className="space-y-2.5">
                {data.topPlaces.map((p) => (
                  <div key={p.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-amber-300/60">📍</span>{p.label}
                    </span>
                    <span className="text-xs text-white/25">{p.count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KI-Musteranalyse */}
        <div className="rounded-3xl border border-violet-300/15 bg-violet-300/4 p-6 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-violet-300/50 mb-1">Traumbegleiter AI</p>
            <p className="text-sm text-white/45 leading-6">
              Lass die KI deine Muster analysieren und Zusammenhänge aufzeigen die du vielleicht noch nicht gesehen hast.
            </p>
          </div>

          {!aiInsight ? (
            <button onClick={generateInsight} disabled={generatingInsight}
              className="w-full rounded-2xl border border-violet-300/20 bg-violet-300/8 px-6 py-4 text-sm font-medium text-violet-100 transition hover:bg-violet-300/15 disabled:opacity-50">
              {generatingInsight
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">✦</span> Analysiere Muster…</span>
                : "✦ KI-Musteranalyse starten"
              }
            </button>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-violet-300/45 mb-2 uppercase tracking-wider">Erkannte Muster</p>
                <p className="text-sm leading-7 text-white/75">{aiInsight.patterns}</p>
              </div>
              <div>
                <p className="text-xs text-violet-300/45 mb-2 uppercase tracking-wider">Verbindungen</p>
                <p className="text-sm leading-7 text-white/75">{aiInsight.connections}</p>
              </div>
              <div className="rounded-2xl border border-violet-300/12 bg-violet-300/5 px-5 py-4">
                <p className="text-xs text-violet-300/45 mb-1">Frage für dich</p>
                <p className="text-sm leading-7 text-white/75 italic">"{aiInsight.question}"</p>
              </div>
              <button onClick={generateInsight} disabled={generatingInsight}
                className="text-xs text-violet-300/35 hover:text-violet-300/60 transition">
                {generatingInsight ? "Analysiere…" : "Neu analysieren →"}
              </button>
            </div>
          )}
        </div>

        {/* Leerer Zustand */}
        {data && data.totalDreams === 0 && data.totalJournal === 0 && (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-10 text-center">
            <p className="text-4xl mb-4">🌙</p>
            <p className="font-medium mb-2">Noch keine Daten für diesen Zeitraum</p>
            <p className="text-sm text-white/40 mb-6">Erfasse Träume und Stimmungseinträge um Muster zu entdecken.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/entry" className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 px-5 py-2.5 text-sm text-cyan-100 hover:bg-cyan-300/15 transition">🌙 Traum erfassen</Link>
              <Link href="/journal/new" className="rounded-2xl border border-amber-300/20 bg-amber-300/8 px-5 py-2.5 text-sm text-amber-100 hover:bg-amber-300/15 transition">📓 Journal-Eintrag</Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

// ── Hilfsfunktionen & Sub-Komponenten ────────────────────────
function moodScoreColor(s: number) {
  if (s <= 4) return "text-red-300"
  if (s <= 6) return "text-amber-300"
  return "text-emerald-300"
}

function StatCard({ label, value, suffix, accent }: { label: string; value: number; suffix?: string; accent: string }) {
  const styles: Record<string, string> = {
    cyan:    "border-cyan-300/12 bg-cyan-300/4 text-cyan-200",
    amber:   "border-amber-300/12 bg-amber-300/4 text-amber-200",
    violet:  "border-violet-300/12 bg-violet-300/4 text-violet-200",
    emerald: "border-emerald-300/12 bg-emerald-300/4 text-emerald-200",
  }
  return (
    <div className={`rounded-3xl border p-5 ${styles[accent]}`}>
      <p className="text-xs text-white/30 mb-3">{label}</p>
      <p className={`text-2xl font-semibold ${styles[accent].split(" ").slice(-1)[0]}`}>
        {value}{suffix && <span className="text-sm font-normal text-white/30 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}

function ToneBar({ label, count, total, color, emoji }: { label: string; count: number; total: number; color: string; emoji: string }) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0
  const barColor = color === "red" ? "bg-red-300/50" : color === "emerald" ? "bg-emerald-300/50" : "bg-white/25"
  return (
    <div className="text-center space-y-2">
      <p className="text-2xl">{emoji}</p>
      <p className="text-xl font-semibold text-white">{pct}%</p>
      <p className="text-xs text-white/35">{label}</p>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-white/20">{count}×</p>
    </div>
  )
}

function MoodChart({ entries }: { entries: Array<{ date: string; score: number }> }) {
  if (entries.length < 2) return null
  const max = 10, min = 1
  const w = 600, h = 80, pad = 16

  const points = entries.map((e, i) => ({
    x: pad + (i / (entries.length - 1)) * (w - 2 * pad),
    y: h - pad - ((e.score - min) / (max - min)) * (h - 2 * pad),
    score: e.score,
    date: e.date,
  }))

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16 overflow-visible">
      <defs>
        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(251 191 36)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(251 191 36)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#moodGrad)" />
      <path d={pathD} fill="none" stroke="rgb(251 191 36 / 0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="rgb(251 191 36 / 0.8)" />
      ))}
    </svg>
  )
}