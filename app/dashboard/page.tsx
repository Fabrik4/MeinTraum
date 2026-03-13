"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"
import { useStreak } from "@/lib/useStreak"
import { getMoonPhase } from "@/lib/moonPhase"

type Stats = {
  totalDreams: number
  totalJournal: number
  thisWeekEntries: number
  lastDream: { id: number; text: string; created_at: string } | null
  lastJournal: { id: number; text: string; mood_score: number | null; created_at: string } | null
}

type MoodPoint = { date: string; score: number }
type MoodData = {
  points: MoodPoint[]
  avg7d: number | null
  avg30d: number | null
  trend: "rising" | "falling" | "stable" | null
}

const MOOD_COLOR = (s: number) => s <= 4 ? "text-red-300" : s <= 6 ? "text-amber-300" : "text-emerald-300"
const todayMoon = getMoonPhase(new Date())

function truncate(t: string, n = 90) { return t.length <= n ? t : t.slice(0, n).trim() + "…" }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 36e5)
  const d = Math.floor(diff / 864e5)
  if (h < 1) return "Gerade eben"
  if (h < 24) return `Vor ${h}h`
  if (d === 1) return "Gestern"
  if (d < 7) return `Vor ${d} Tagen`
  return new Date(iso).toLocaleDateString("de-CH", { day: "numeric", month: "short" })
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [hasTodayEntry, setHasTodayEntry] = useState<boolean | null>(null)
  const [checkinDone, setCheckinDone] = useState(false)
  const [checkinLoading, setCheckinLoading] = useState<string | null>(null)
  const [moodData, setMoodData] = useState<MoodData | null>(null)
  const { streak, reload: reloadStreak } = useStreak(user?.id ?? null)

  useEffect(() => {
    if (!authLoading && user) fetchAll()
  }, [user, authLoading])

  async function fetchAll() {
    const weekAgo   = new Date(Date.now() -  7 * 864e5).toISOString()
    const monthAgo  = new Date(Date.now() - 30 * 864e5).toISOString()
    const twoMonthAgo = new Date(Date.now() - 60 * 864e5).toISOString()
    const todayStart = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z"

    const [
      lastDreamRes, lastJournalRes,
      totalDreamsRes, totalJournalsRes,
      weekDreamsRes, weekJournalsRes,
      profileRes,
      todayDreamRes, todayJournalRes,
      moodRes,
    ] = await Promise.all([
      supabase.from("dream_entries").select("id, raw_input_text, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("journal_entries").select("id, body_text, mood_score, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id).gte("created_at", weekAgo),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id).gte("created_at", weekAgo),
      supabase.from("user_profiles").select("display_name").eq("id", user!.id).maybeSingle(),
      supabase.from("dream_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id).gte("created_at", todayStart),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user!.id).gte("created_at", todayStart),
      supabase.from("journal_entries")
        .select("mood_score, entry_date, created_at")
        .eq("user_id", user!.id)
        .gte("created_at", twoMonthAgo)
        .not("mood_score", "is", null)
        .order("entry_date", { ascending: true }),
    ])

    setHasTodayEntry((todayDreamRes.count ?? 0) + (todayJournalRes.count ?? 0) > 0)
    setDisplayName(profileRes.data?.display_name ?? null)

    // Mood-Daten aufbereiten
    const raw = (moodRes.data ?? []) as any[]
    const points: MoodPoint[] = raw.map((j) => ({
      date:  (j.entry_date || j.created_at).slice(0, 10),
      score: j.mood_score,
    }))

    const now = Date.now()
    const recent7  = raw.filter((j) => new Date(j.created_at).getTime() > now - 7  * 864e5).map((j) => j.mood_score)
    const recent30 = raw.filter((j) => new Date(j.created_at).getTime() > now - 30 * 864e5).map((j) => j.mood_score)
    const older30  = raw.filter((j) => {
      const t = new Date(j.created_at).getTime()
      return t < now - 30 * 864e5 && t > now - 60 * 864e5
    }).map((j) => j.mood_score)

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null
    const avg7d  = avg(recent7)
    const avg30d = avg(recent30)
    const avgOld = avg(older30)

    let trend: MoodData["trend"] = null
    if (avg30d && avgOld) {
      const diff = avg30d - avgOld
      trend = diff > 0.5 ? "rising" : diff < -0.5 ? "falling" : "stable"
    }

    setMoodData({ points: points.slice(-30), avg7d, avg30d, trend })

    setStats({
      totalDreams:    totalDreamsRes.count  ?? 0,
      totalJournal:   totalJournalsRes.count ?? 0,
      thisWeekEntries: (weekDreamsRes.count ?? 0) + (weekJournalsRes.count ?? 0),
      lastDream:   lastDreamRes.data?.[0]
        ? { id: lastDreamRes.data[0].id, text: lastDreamRes.data[0].raw_input_text, created_at: lastDreamRes.data[0].created_at }
        : null,
      lastJournal: lastJournalRes.data?.[0]
        ? { id: lastJournalRes.data[0].id, text: lastJournalRes.data[0].body_text, mood_score: lastJournalRes.data[0].mood_score, created_at: lastJournalRes.data[0].created_at }
        : null,
    })
    setLoading(false)
  }

  async function handleCheckin(type: "no_memory" | "no_sleep") {
    if (!user) return
    setCheckinLoading(type)
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, user_id: user.id }),
    })
    setCheckinDone(true)
    setHasTodayEntry(true)
    reloadStreak()
    setCheckinLoading(null)
  }

  const greeting = () => {
    const h = new Date().getHours()
    const name = displayName ? `, ${displayName}` : ""
    if (h < 5)  return `Gute Nacht${name} 🌙`
    if (h < 11) return `Guten Morgen${name} ☀️`
    if (h < 17) return `Guten Tag${name}`
    return `Guten Abend${name} 🌙`
  }

  if (authLoading) return <main className="min-h-screen bg-[#070b14]" />

  if (!user) return (
    <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-20 text-white flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm">
        <div className="text-5xl">🌙</div>
        <p className="text-2xl font-semibold">Willkommen bei MeinTraum</p>
        <p className="text-white/70 text-sm leading-7">Dein persönliches Traumtagebuch und Stimmungsarchiv.</p>
        <Link href="/login" className="inline-block rounded-2xl bg-white px-8 py-3.5 font-medium text-[#070b14] transition hover:scale-[1.02]">
          Anmelden / Registrieren
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-12 text-white">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Begrüssung */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold">{greeting()}</h1>
            <div className="mt-1.5 flex items-center gap-3 flex-wrap">
              <p className="text-sm text-white/60">
                {loading ? "Wird geladen…" : `${(stats?.totalDreams ?? 0) + (stats?.totalJournal ?? 0)} Einträge in deinem Archiv`}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-2xl border border-white/6 bg-white/3 px-3 py-1 text-xs text-white/65">
                {todayMoon.emoji} {todayMoon.name} · {todayMoon.illumination}%
              </span>
            </div>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-orange-300/20 bg-orange-300/8 px-4 py-2.5">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-sm font-semibold text-orange-200">{streak} {streak === 1 ? "Tag" : "Tage"}</p>
                <p className="text-xs text-orange-300/50">Bewusste Morgenroutine</p>
              </div>
            </div>
          )}
        </div>

        {/* Morning Check-in Banner */}
        {!loading && !hasTodayEntry && !checkinDone && (
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-5">
            <p className="text-sm font-medium text-white/80 mb-4">Wie war deine Nacht?</p>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/entry"
                className="flex flex-col items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 px-3 py-4 text-center transition hover:bg-cyan-300/15 active:scale-[0.98]">
                <span className="text-xl">🌙</span>
                <span className="text-xs font-medium text-cyan-100">Traum erfassen</span>
              </Link>
              <button onClick={() => handleCheckin("no_memory")} disabled={checkinLoading !== null}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center transition hover:bg-white/8 active:scale-[0.98] disabled:opacity-50">
                <span className="text-xl">{checkinLoading === "no_memory" ? "⏳" : "😶"}</span>
                <span className="text-xs font-medium text-white/80">Nichts erinnert</span>
              </button>
              <button onClick={() => handleCheckin("no_sleep")} disabled={checkinLoading !== null}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center transition hover:bg-white/8 active:scale-[0.98] disabled:opacity-50">
                <span className="text-xl">{checkinLoading === "no_sleep" ? "⏳" : "💤"}</span>
                <span className="text-xs font-medium text-white/80">Nicht geschlafen</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick-Add */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/entry"
            className="group flex items-center gap-4 rounded-3xl border border-cyan-300/15 bg-cyan-300/5 px-6 py-5 transition hover:border-cyan-300/25 hover:bg-cyan-300/8 active:scale-[0.99]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/12 text-xl transition group-hover:bg-cyan-300/20">🌙</div>
            <div>
              <p className="font-semibold text-white">Traum erfassen</p>
              <p className="text-sm text-white/65">Solange er noch frisch ist</p>
            </div>
            <span className="ml-auto text-lg text-white/20 transition group-hover:text-white/70 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="/journal/new"
            className="group flex items-center gap-4 rounded-3xl border border-amber-300/15 bg-amber-300/5 px-6 py-5 transition hover:border-amber-300/25 hover:bg-amber-300/8 active:scale-[0.99]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300/12 text-xl transition group-hover:bg-amber-300/20">📓</div>
            <div>
              <p className="font-semibold text-white">Journal-Eintrag</p>
              <p className="text-sm text-white/65">Wie geht es dir heute?</p>
            </div>
            <span className="ml-auto text-lg text-white/20 transition group-hover:text-white/70 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Stimmungsmonitor */}
        {!loading && moodData && moodData.points.length >= 3 && (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Stimmungsmonitor</p>
              <Link href="/patterns" className="text-xs text-white/50 hover:text-white/80 transition">Muster-Analyse →</Link>
            </div>

            {/* Kennzahlen */}
            <div className="grid grid-cols-3 gap-3">
              {moodData.avg7d && (
                <div className="rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <p className="text-xs text-white/60 mb-1">7 Tage</p>
                  <p className={`text-xl font-semibold ${MOOD_COLOR(moodData.avg7d)}`}>
                    {moodData.avg7d}<span className="text-xs font-normal text-white/45 ml-0.5">/10</span>
                  </p>
                </div>
              )}
              {moodData.avg30d && (
                <div className="rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <p className="text-xs text-white/60 mb-1">30 Tage</p>
                  <p className={`text-xl font-semibold ${MOOD_COLOR(moodData.avg30d)}`}>
                    {moodData.avg30d}<span className="text-xs font-normal text-white/45 ml-0.5">/10</span>
                  </p>
                </div>
              )}
              {moodData.trend && (
                <div className="rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <p className="text-xs text-white/60 mb-1">Trend</p>
                  <p className={`text-xl font-semibold ${moodData.trend === "rising" ? "text-emerald-300" : moodData.trend === "falling" ? "text-red-300" : "text-white/70"}`}>
                    {moodData.trend === "rising" ? "↗" : moodData.trend === "falling" ? "↘" : "→"}
                    <span className="text-xs font-normal ml-1.5 text-white/65">
                      {moodData.trend === "rising" ? "Steigend" : moodData.trend === "falling" ? "Fallend" : "Stabil"}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Chart */}
            <MoodChart points={moodData.points} />
          </div>
        )}

        {/* Statistiken */}
        {!loading && stats && (
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-white/45">Deine Zahlen</p>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Träume" value={stats.totalDreams} accent="cyan" />
              <StatCard label="Journal" value={stats.totalJournal} accent="amber" />
              <StatCard label="Diese Woche" value={stats.thisWeekEntries} suffix="Eintr." accent="violet" />
            </div>
          </div>
        )}

        {/* Letzte Einträge */}
        {!loading && (stats?.lastDream || stats?.lastJournal) && (
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-white/45">Zuletzt</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {stats?.lastDream && (
                <Link href={`/entries/${stats.lastDream.id}?type=dream`}
                  className="group rounded-3xl border border-white/8 bg-white/3 p-5 transition hover:border-cyan-300/20 hover:bg-cyan-300/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-cyan-300/75">🌙 Traum</span>
                    <span className="ml-auto text-xs text-white/22">{timeAgo(stats.lastDream.created_at)}</span>
                  </div>
                  <p className="text-sm leading-6 text-white/65 group-hover:text-white/80 transition">{truncate(stats.lastDream.text)}</p>
                  <p className="mt-3 text-xs text-cyan-300/35 group-hover:text-cyan-300/65 transition">Ansehen →</p>
                </Link>
              )}
              {stats?.lastJournal && (
                <Link href={`/entries/${stats.lastJournal.id}?type=journal`}
                  className="group rounded-3xl border border-white/8 bg-white/3 p-5 transition hover:border-amber-300/20 hover:bg-amber-300/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-amber-300/55">📓 Journal</span>
                    {stats.lastJournal.mood_score && (
                      <span className={`text-xs font-medium ${MOOD_COLOR(stats.lastJournal.mood_score)}`}>{stats.lastJournal.mood_score}/10</span>
                    )}
                    <span className="ml-auto text-xs text-white/22">{timeAgo(stats.lastJournal.created_at)}</span>
                  </div>
                  <p className="text-sm leading-6 text-white/65 group-hover:text-white/80 transition">{truncate(stats.lastJournal.text)}</p>
                  <p className="mt-3 text-xs text-amber-300/35 group-hover:text-amber-300/65 transition">Ansehen →</p>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Leerer Zustand */}
        {!loading && stats?.totalDreams === 0 && stats?.totalJournal === 0 && (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-10 text-center">
            <p className="text-4xl mb-4">🌙</p>
            <p className="font-medium text-white mb-2">Noch keine Einträge</p>
            <p className="text-sm text-white/65">Erfasse deinen ersten Traum oder Stimmungseintrag.</p>
          </div>
        )}

        {/* Archiv Link */}
        <div className="flex justify-center">
          <Link href="/timeline"
            className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/3 px-5 py-3 text-sm text-white/65 transition hover:border-white/15 hover:text-white/65">
            Alle Einträge im Archiv →
          </Link>
        </div>

      </div>
    </main>
  )
}

// ── Mood Chart ────────────────────────────────────────────────
function MoodChart({ points }: { points: MoodPoint[] }) {
  if (points.length < 2) return null

  const W = 600, H = 100, padX = 8, padY = 12
  const minScore = 1, maxScore = 10

  const toX = (i: number) => padX + (i / (points.length - 1)) * (W - 2 * padX)
  const toY = (s: number) => H - padY - ((s - minScore) / (maxScore - minScore)) * (H - 2 * padY)

  const pts = points.map((p, i) => ({ x: toX(i), y: toY(p.score), ...p }))

  // Smooth bezier path
  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`
  }).join(" ")

  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  // Zeige Datumslabels für ersten, mittleren und letzten Punkt
  const labelIndices = [0, Math.floor(pts.length / 2), pts.length - 1]
  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short" })

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20 overflow-visible">
        <defs>
          <linearGradient id="dashMoodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(251 191 36)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgb(251 191 36)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Referenzlinie bei 5 (Mitte) */}
        <line x1={padX} y1={toY(5)} x2={W - padX} y2={toY(5)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
        {/* Area */}
        <path d={areaPath} fill="url(#dashMoodGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="rgb(251 191 36 / 0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots – nur erster, letzter und Extremwerte */}
        {pts.map((p, i) => {
          const isEdge = i === 0 || i === pts.length - 1
          const score = points[i].score
          const isHigh = score >= 8
          const isLow  = score <= 3
          if (!isEdge && !isHigh && !isLow) return null
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#070b14" stroke="rgb(251 191 36 / 0.8)" strokeWidth="1.5" />
              {(isEdge || isHigh || isLow) && (
                <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="9" fill={isHigh ? "rgb(110 231 183 / 0.8)" : isLow ? "rgb(252 165 165 / 0.8)" : "rgba(255,255,255,0.35)"}>
                  {score}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {/* Datumslabels */}
      <div className="flex justify-between mt-1 px-1">
        {labelIndices.map((idx) => (
          <span key={idx} className="text-[10px] text-white/20">{formatDate(points[idx].date)}</span>
        ))}
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, suffix, accent, customColor }: {
  label: string; value: number | string; suffix?: string; accent: string; customColor?: string
}) {
  const borders: Record<string, string> = {
    cyan:   "border-cyan-300/12 bg-cyan-300/4",
    amber:  "border-amber-300/12 bg-amber-300/4",
    violet: "border-violet-300/12 bg-violet-300/4",
  }
  const valueColors: Record<string, string> = {
    cyan: "text-cyan-200", amber: "text-amber-200", violet: "text-violet-200",
  }
  return (
    <div className={`rounded-3xl border p-5 ${borders[accent]}`}>
      <p className="text-xs text-white/50 mb-3 leading-5">{label}</p>
      <p className={`text-2xl font-semibold ${customColor ?? valueColors[accent]}`}>
        {value}
        {suffix && <span className="text-sm font-normal opacity-55 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}
