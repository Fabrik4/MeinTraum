"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

type Stats = {
  totalDreams: number
  totalJournal: number
  thisWeekEntries: number
  avgMood: number | null
  lastDream: { id: number; text: string; created_at: string } | null
  lastJournal: { id: number; text: string; mood_score: number | null; created_at: string } | null
}

const MOOD_COLOR = (s: number) => s <= 4 ? "text-amber-300/80" : s <= 6 ? "text-amber-300/80" : "text-emerald-300/80"

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

  useEffect(() => {
    if (!authLoading && user) fetchAll()
  }, [user, authLoading])

  async function fetchAll() {
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
    const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString()

    const [
      lastDreamRes, lastJournalRes,
      totalDreamsRes, totalJournalsRes,
      weekDreamsRes, weekJournalsRes,
      moodRes, profileRes,
    ] = await Promise.all([
      supabase.from("dream_entries").select("id, raw_input_text, created_at").order("created_at", { ascending: false }).limit(1),
      supabase.from("journal_entries").select("id, body_text, mood_score, created_at").order("created_at", { ascending: false }).limit(1),
      supabase.from("dream_entries").select("id", { count: "exact", head: true }),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }),
      supabase.from("dream_entries").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("journal_entries").select("mood_score").gte("created_at", monthAgo).not("mood_score", "is", null),
      supabase.from("user_profiles").select("display_name").eq("id", user!.id).maybeSingle(),
    ])

    const avgMood = moodRes.data?.length
      ? Math.round(moodRes.data.reduce((s: number, r: any) => s + r.mood_score, 0) / moodRes.data.length * 10) / 10
      : null

    setDisplayName(profileRes.data?.display_name ?? null)
    setStats({
      totalDreams: totalDreamsRes.count ?? 0,
      totalJournal: totalJournalsRes.count ?? 0,
      thisWeekEntries: (weekDreamsRes.count ?? 0) + (weekJournalsRes.count ?? 0),
      avgMood,
      lastDream: lastDreamRes.data?.[0] ? { id: lastDreamRes.data[0].id, text: lastDreamRes.data[0].raw_input_text, created_at: lastDreamRes.data[0].created_at } : null,
      lastJournal: lastJournalRes.data?.[0] ? { id: lastJournalRes.data[0].id, text: lastJournalRes.data[0].body_text, mood_score: lastJournalRes.data[0].mood_score, created_at: lastJournalRes.data[0].created_at } : null,
    })
    setLoading(false)
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
    <main className="min-h-screen bg-[#070b14] px-5 py-20 text-white flex items-center justify-center">
      <div className="text-center space-y-6 max-w-sm">
        <div className="text-5xl">🌙</div>
        <p className="text-2xl font-semibold">Willkommen bei MeinTraum</p>
        <p className="text-white/45 text-sm leading-7">Dein persönliches Traumtagebuch und Stimmungsarchiv.</p>
        <Link href="/login" className="inline-block rounded-2xl bg-white px-8 py-3.5 font-medium text-[#070b14] transition hover:scale-[1.02]">
          Anmelden / Registrieren
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-12 text-white">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Begrüssung */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold">{greeting()}</h1>
            <p className="mt-1.5 text-sm text-white/35">
              {loading ? "Wird geladen…" : `${(stats?.totalDreams ?? 0) + (stats?.totalJournal ?? 0)} Einträge in deinem Archiv`}
            </p>
          </div>
        </div>

        {/* Quick-Add */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/entry"
            className="group flex items-center gap-4 rounded-3xl border border-cyan-300/15 bg-cyan-300/5 px-6 py-5 transition hover:border-cyan-300/25 hover:bg-cyan-300/8 active:scale-[0.99]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/12 text-xl transition group-hover:bg-cyan-300/20">
              🌙
            </div>
            <div>
              <p className="font-semibold text-white">Traum erfassen</p>
              <p className="text-sm text-white/40">Solange er noch frisch ist</p>
            </div>
            <span className="ml-auto text-lg text-white/20 transition group-hover:text-white/50 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link href="/journal/new"
            className="group flex items-center gap-4 rounded-3xl border border-amber-300/15 bg-amber-300/5 px-6 py-5 transition hover:border-amber-300/25 hover:bg-amber-300/8 active:scale-[0.99]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-300/12 text-xl transition group-hover:bg-amber-300/20">
              📓
            </div>
            <div>
              <p className="font-semibold text-white">Journal-Eintrag</p>
              <p className="text-sm text-white/40">Wie geht es dir heute?</p>
            </div>
            <span className="ml-auto text-lg text-white/20 transition group-hover:text-white/50 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Statistiken */}
        {!loading && stats && (
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-white/25">Deine Zahlen</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Träume" value={stats.totalDreams} accent="cyan" />
              <StatCard label="Journaleinträge" value={stats.totalJournal} accent="rose" />
              <StatCard label="Diese Woche" value={stats.thisWeekEntries} suffix="Einträge" accent="violet" />
              <StatCard
                label="Ø Stimmung (30 T.)"
                value={stats.avgMood ?? "–"}
                suffix={stats.avgMood ? "/10" : ""}
                accent="amber"
                customColor={stats.avgMood ? MOOD_COLOR(Math.round(stats.avgMood)) : undefined}
              />
            </div>
          </div>
        )}

        {/* Letzte Einträge */}
        {!loading && (stats?.lastDream || stats?.lastJournal) && (
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-white/25">Zuletzt</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {stats?.lastDream && (
                <Link href={`/entries/${stats.lastDream.id}?type=dream`}
                  className="group rounded-3xl border border-white/8 bg-white/3 p-5 transition hover:border-cyan-300/20 hover:bg-cyan-300/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-cyan-300/55">🌙 Traum</span>
                    <span className="ml-auto text-xs text-white/22">{timeAgo(stats.lastDream.created_at)}</span>
                  </div>
                  <p className="text-sm leading-6 text-white/65 group-hover:text-white/80 transition">
                    {truncate(stats.lastDream.text)}
                  </p>
                  <p className="mt-3 text-xs text-cyan-300/35 group-hover:text-cyan-300/65 transition">Ansehen →</p>
                </Link>
              )}
              {stats?.lastJournal && (
                <Link href={`/entries/${stats.lastJournal.id}?type=journal`}
                  className="group rounded-3xl border border-white/8 bg-white/3 p-5 transition hover:border-amber-300/20 hover:bg-amber-300/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-amber-300/55">📓 Journal</span>
                    {stats.lastJournal.mood_score && (
                      <span className={`text-xs font-medium ${MOOD_COLOR(stats.lastJournal.mood_score)}`}>
                        {stats.lastJournal.mood_score}/10
                      </span>
                    )}
                    <span className="ml-auto text-xs text-white/22">{timeAgo(stats.lastJournal.created_at)}</span>
                  </div>
                  <p className="text-sm leading-6 text-white/65 group-hover:text-white/80 transition">
                    {truncate(stats.lastJournal.text)}
                  </p>
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
            <p className="text-sm text-white/40">Erfasse deinen ersten Traum oder Stimmungseintrag.</p>
          </div>
        )}

        {/* Archiv Link */}
        <div className="flex justify-center">
          <Link href="/timeline"
            className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/3 px-5 py-3 text-sm text-white/40 transition hover:border-white/15 hover:text-white/65">
            Alle Einträge im Archiv →
          </Link>
        </div>

      </div>
    </main>
  )
}

function StatCard({ label, value, suffix, accent, customColor }: {
  label: string; value: number | string; suffix?: string; accent: string; customColor?: string
}) {
  const borders: Record<string, string> = {
    cyan: "border-cyan-300/12 bg-cyan-300/4", rose: "border-amber-300/12 bg-amber-300/4",
    violet: "border-violet-300/12 bg-violet-300/4", amber: "border-amber-300/12 bg-amber-300/4",
  }
  const valueColors: Record<string, string> = {
    cyan: "text-cyan-200", rose: "text-amber-200", violet: "text-violet-200", amber: "text-amber-200",
  }
  return (
    <div className={`rounded-3xl border p-5 ${borders[accent]}`}>
      <p className="text-xs text-white/30 mb-3 leading-5">{label}</p>
      <p className={`text-2xl font-semibold ${customColor ?? valueColors[accent]}`}>
        {value}
        {suffix && <span className="text-sm font-normal opacity-55 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}