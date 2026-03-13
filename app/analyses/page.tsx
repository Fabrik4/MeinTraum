"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

type Analysis = {
  id: number
  mode: string
  summary: string
  themes: string[]
  created_at: string
  entry_type: "dream" | "journal"
  entry_id: number
  entry_text: string
}

const MODE_LABELS: Record<string, { label: string; emoji: string }> = {
  psychological:  { label: "Psychologisch",    emoji: "🧠" },
  poetic:         { label: "Poetisch",          emoji: "🌙" },
  humorous:       { label: "Humorvoll",         emoji: "😄" },
  scientific:     { label: "Wissenschaftlich",  emoji: "🔬" },
}

export default function AnalysesPage() {
  const { user, loading: authLoading } = useAuth()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "dream" | "journal">("all")

  useEffect(() => {
    if (!user) return
    fetchAnalyses()
  }, [user])

  async function fetchAnalyses() {
    setLoading(true)
    const [dreamRes, journalRes] = await Promise.all([
      supabase
        .from("dream_analysis")
        .select("id, mode, summary, themes, created_at, dream_entry_id, dream_entries(raw_input_text)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("journal_analysis")
        .select("id, mode, summary, themes, created_at, journal_entry_id, journal_entries(body_text)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
    ])

    const dreamAnalyses: Analysis[] = (dreamRes.data ?? []).map((a: any) => ({
      id: a.id,
      mode: a.mode,
      summary: a.summary,
      themes: a.themes ?? [],
      created_at: a.created_at,
      entry_type: "dream",
      entry_id: a.dream_entry_id,
      entry_text: a.dream_entries?.raw_input_text ?? "",
    }))

    const journalAnalyses: Analysis[] = (journalRes.data ?? []).map((a: any) => ({
      id: a.id,
      mode: a.mode,
      summary: a.summary,
      themes: a.themes ?? [],
      created_at: a.created_at,
      entry_type: "journal",
      entry_id: a.journal_entry_id,
      entry_text: a.journal_entries?.body_text ?? "",
    }))

    const all = [...dreamAnalyses, ...journalAnalyses].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setAnalyses(all)
    setLoading(false)
  }

  const filtered = filter === "all" ? analyses : analyses.filter((a) => a.entry_type === filter)

  if (authLoading || loading) return (
    <main className="min-h-screen bg-[#070b14] px-6 pt-16 pb-24 md:py-14 text-white">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 rounded-xl bg-white/5 animate-pulse mb-8" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 rounded-3xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </main>
  )

  if (!user) return (
    <main className="min-h-screen bg-[#070b14] px-6 pt-16 pb-24 md:py-14 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-white/60">Bitte melde dich an.</p>
        <Link href="/login" className="inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#070b14]">Anmelden</Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#070b14] px-6 pt-16 pb-24 md:py-14 text-white">
      <div className="mx-auto max-w-3xl">

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70 mb-2">Archiv</p>
          <h1 className="text-3xl font-semibold">Gespeicherte Analysen</h1>
          {analyses.length > 0 && (
            <p className="mt-2 text-sm text-white/45">{analyses.length} Analyse{analyses.length !== 1 ? "n" : ""}</p>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-8">
          {([
            { value: "all",     label: "Alle" },
            { value: "dream",   label: "🌙 Träume" },
            { value: "journal", label: "📓 Journal" },
          ] as const).map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${filter === f.value ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/8 bg-white/3 p-12 text-center space-y-4">
            <div className="text-4xl">🧠</div>
            <p className="font-medium text-white">Noch keine Analysen</p>
            <p className="text-sm text-white/45 leading-6">Öffne einen Traum oder Journal-Eintrag und starte eine KI-Analyse.</p>
            <Link href="/timeline"
              className="inline-block mt-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition">
              Zur Timeline →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => {
              const modeInfo = MODE_LABELS[a.mode] ?? { label: a.mode, emoji: "✨" }
              return (
                <Link key={`${a.entry_type}-${a.id}`}
                  href={`/entries/${a.entry_id}?type=${a.entry_type}`}
                  className="block rounded-3xl border border-white/8 bg-white/3 p-6 hover:border-white/15 hover:bg-white/5 transition-all">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{modeInfo.emoji}</span>
                      <div>
                        <p className="font-medium text-white text-sm">{modeInfo.label}</p>
                        <p className="text-xs text-white/45">
                          {new Date(a.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${a.entry_type === "journal" ? "bg-amber-300/15 text-amber-200" : "bg-cyan-300/15 text-cyan-200"}`}>
                      {a.entry_type === "journal" ? "Journal" : "Traum"}
                    </span>
                  </div>

                  {a.entry_text && (
                    <p className="text-xs text-white/35 italic mb-3 line-clamp-1">
                      "{a.entry_text.slice(0, 80)}{a.entry_text.length > 80 ? "…" : ""}"
                    </p>
                  )}

                  <p className="text-sm text-white/70 leading-7 line-clamp-3">{a.summary}</p>

                  {a.themes?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {a.themes.map((t) => (
                        <span key={t} className="rounded-full border border-white/8 bg-white/3 px-3 py-1 text-xs text-white/55">{t}</span>
                      ))}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
