"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"
import { moonNameToEmoji } from "@/lib/moonPhase"

type DreamEntry = {
  id: number; type: "dream"
  raw_input_text: string; dominant_emotion: string | null
  dream_clarity: string | null; dream_tone: string | null
  nightmare_flag: boolean; created_at: string; dreamed_at: string | null
  is_key_event: boolean
  moon_phase_name: string | null
  persons: string[]; places: string[]
}
type JournalEntry = {
  id: number; type: "journal"
  body_text: string; mood_score: number | null; mood_label: string | null
  energy_level: number | null; sleep_hours: number | null
  tags: string[]; entry_date: string; created_at: string
  is_key_event: boolean
}
type TimelineEntry = DreamEntry | JournalEntry

const MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1:{ label:"Sehr schlecht", color:"text-red-300" }, 2:{ label:"Schlecht", color:"text-red-200" },
  3:{ label:"Mies", color:"text-orange-300" }, 4:{ label:"Eher schlecht", color:"text-orange-200" },
  5:{ label:"Neutral", color:"text-white/60" }, 6:{ label:"Okay", color:"text-yellow-200" },
  7:{ label:"Gut", color:"text-emerald-300" }, 8:{ label:"Sehr gut", color:"text-emerald-200" },
  9:{ label:"Grossartig", color:"text-cyan-300" }, 10:{ label:"Ausgezeichnet", color:"text-cyan-200" },
}
const ENERGY_LABELS: Record<number, string> = {
  1:"Erschöpft", 2:"Müde", 3:"Normal", 4:"Energiegeladen", 5:"Voller Energie",
}

function formatMonthYear(d: string) { return new Date(d).toLocaleDateString("de-CH", { month: "long", year: "numeric" }) }
function formatDate(d: string) { return new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short" }) }
function truncate(t: string, max = 120) { return t.length <= max ? t : t.slice(0, max).trim() + "…" }
function getEntryDate(e: TimelineEntry) { return e.type === "dream" ? e.dreamed_at || e.created_at : e.entry_date || e.created_at }

type Filter = "all" | "dream" | "journal"

export default function TimelinePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [dreams, setDreams] = useState<DreamEntry[]>([])
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [pinning, setPinning] = useState<string | null>(null) // "dream-123" | "journal-123"

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push("/login"); return }
    fetchAll(user.id)
  }, [user, authLoading])

  async function fetchAll(userId: string) {
    const [dreamsRes, journalsRes] = await Promise.all([
      supabase.from("dream_entries")
        .select(`*, dream_entry_entities(user_entities(entity_type, entity_label))`)
        .eq("user_id", userId)
        .order("dreamed_at", { ascending: false, nullsFirst: false }),
      supabase.from("journal_entries").select("*").eq("user_id", userId).order("entry_date", { ascending: false }),
    ])
    if (!dreamsRes.error && dreamsRes.data) {
      setDreams(dreamsRes.data.map((d: any) => ({
        ...d, type: "dream",
        persons: [...new Set(d.dream_entry_entities?.filter((e: any) => e.user_entities?.entity_type === "person").map((e: any) => e.user_entities.entity_label) ?? [])],
        places:  [...new Set(d.dream_entry_entities?.filter((e: any) => e.user_entities?.entity_type === "place").map((e: any) => e.user_entities.entity_label) ?? [])],
      })))
    }
    if (!journalsRes.error && journalsRes.data) {
      setJournals(journalsRes.data.map((j: any) => ({ ...j, type: "journal" })))
    }
    setLoading(false)
  }

  async function togglePin(entry: TimelineEntry) {
    if (!user) return
    const key = `${entry.type}-${entry.id}`
    setPinning(key)

    const table = entry.type === "dream" ? "dream_entries" : "journal_entries"
    const newVal = !entry.is_key_event

    await supabase.from(table).update({ is_key_event: newVal }).eq("id", entry.id)

    if (newVal) {
      // Keyevent hinzufügen
      const title = entry.type === "dream"
        ? truncate(entry.raw_input_text, 50)
        : truncate(entry.body_text, 50)
      const date = getEntryDate(entry).slice(0, 10)
      await supabase.from("key_events").insert({
        user_id: user.id,
        title,
        event_date: date,
        emoji: entry.type === "dream" ? "🌙" : "📓",
        linked_dream_id: entry.type === "dream" ? entry.id : null,
        linked_journal_id: entry.type === "journal" ? entry.id : null,
      })
    } else {
      // Keyevent entfernen
      const col = entry.type === "dream" ? "linked_dream_id" : "linked_journal_id"
      await supabase.from("key_events").delete().eq(col, entry.id).eq("user_id", user.id)
    }

    // State lokal updaten
    if (entry.type === "dream") {
      setDreams((prev) => prev.map((d) => d.id === entry.id ? { ...d, is_key_event: newVal } : d))
    } else {
      setJournals((prev) => prev.map((j) => j.id === entry.id ? { ...j, is_key_event: newVal } : j))
    }
    setPinning(null)
  }

  const allEntries: TimelineEntry[] = [
    ...(filter !== "journal" ? dreams : []),
    ...(filter !== "dream" ? journals : []),
  ].sort((a, b) => new Date(getEntryDate(b)).getTime() - new Date(getEntryDate(a)).getTime())

  const grouped = allEntries.reduce((acc, entry) => {
    const key = formatMonthYear(getEntryDate(entry))
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {} as Record<string, TimelineEntry[]>)

  return (
    <main className="min-h-screen bg-[#070b14] px-6 pt-5 pb-24 md:py-16 text-white">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-12 flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-white/40">Dein Leben</p>
            <h1 className="mt-4 text-4xl font-semibold">Timeline</h1>
            <p className="mt-3 text-sm leading-7 text-white/50">Träume und Stimmungen im Verlauf – dein inneres Archiv.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/patterns"
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-300/20 bg-violet-300/10 px-4 py-2.5 text-sm text-violet-100 transition hover:bg-violet-300/20">
              ✦ Muster entdecken
            </Link>
            <Link href="/entry"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-300/20">
              🌙 Traum erfassen
            </Link>
            <Link href="/journal/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2.5 text-sm text-amber-100 transition hover:bg-amber-300/20">
              📓 Journal-Eintrag
            </Link>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-10 flex gap-2 flex-wrap">
          {[{ value:"all", label:"Alles" }, { value:"dream", label:"🌙 Träume" }, { value:"journal", label:"📓 Journal" }].map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value as Filter)}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${filter === f.value ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/20"}`}>
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-white/30 self-center">{allEntries.length} Einträge</span>
        </div>

        {loading && <p className="text-white/50">Wird geladen…</p>}

        {!loading && allEntries.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
            <p className="text-lg mb-2">Noch keine Einträge.</p>
            <p className="text-sm">Erfasse deinen ersten Traum oder Stimmungseintrag.</p>
          </div>
        )}

        {/* Timeline */}
        {!loading && Object.entries(grouped).map(([month, entries]) => (
          <section key={month} className="mb-14">
            <h2 className="mb-8 text-base font-medium uppercase tracking-[0.15em] text-white/40">{month}</h2>
            <div className="relative space-y-5">
              <div className="absolute bottom-0 left-[17px] top-0 w-px bg-white/8" />
              {entries.map((entry) => {
                if (entry.type === "dream") return (
                  <DreamCard key={`d-${entry.id}`} dream={entry}
                    onPin={() => togglePin(entry)}
                    pinning={pinning === `dream-${entry.id}`} />
                )
                return (
                  <JournalCard key={`j-${entry.id}`} journal={entry}
                    onPin={() => togglePin(entry)}
                    pinning={pinning === `journal-${entry.id}`} />
                )
              })}
            </div>
          </section>
        ))}

      </div>
    </main>
  )
}

// ── Dream Card ───────────────────────────────────────────────
function DreamCard({ dream, onPin, pinning }: { dream: DreamEntry; onPin: () => void; pinning: boolean }) {
  const tone = dream.dream_tone || (dream.nightmare_flag ? "nightmare" : "neutral")
  const emotions = dream.dominant_emotion?.split(", ").filter(Boolean) ?? []
  const hasTags = emotions.length > 0 || dream.persons.length > 0 || dream.places.length > 0 || tone !== "neutral"

  return (
    <div className="relative flex gap-5">
      <div className="relative z-10 mt-4 h-9 w-9 shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10">
        <div className="absolute inset-[10px] rounded-full bg-cyan-200" />
      </div>

      <div className={`flex-1 rounded-3xl border bg-white/5 p-6 backdrop-blur transition ${dream.is_key_event ? "border-amber-300/25 bg-amber-300/3" : "border-white/10 hover:border-white/20"}`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base">🌙</span>
            <span className="text-sm text-white/35">{formatDate(dream.dreamed_at || dream.created_at)}</span>
            {dream.moon_phase_name && (
              <span className="text-xs text-white/25" title={dream.moon_phase_name}>
                {moonNameToEmoji(dream.moon_phase_name)}
              </span>
            )}
            {dream.dream_clarity && <span className="text-xs text-white/30">✨ {dream.dream_clarity}</span>}
            {dream.is_key_event && <span className="text-xs text-amber-300/70">📌 Keyevent</span>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* Pin Button */}
            <button onClick={onPin} disabled={pinning} title={dream.is_key_event ? "Entpinnen" : "Als Keyevent pinnen"}
              className={`rounded-xl border px-2.5 py-1.5 text-sm transition ${dream.is_key_event
                ? "border-amber-300/30 bg-amber-300/12 text-amber-300 hover:bg-amber-300/20"
                : "border-white/10 bg-white/5 text-white/25 hover:border-amber-300/25 hover:bg-amber-300/8 hover:text-amber-300/70"
              } disabled:opacity-40`}>
              {pinning ? <span className="animate-spin inline-block">✦</span> : "📌"}
            </button>
            <Link href={`/entries/${dream.id}?type=dream`}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white">
              Ansehen
            </Link>
          </div>
        </div>

        <p className="leading-7 text-white/80 mb-4">{truncate(dream.raw_input_text)}</p>

        {hasTags && (
          <div className="flex flex-wrap gap-2">
            {tone === "nightmare" && <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-xs text-red-100">Albtraum</span>}
            {tone === "pleasant"  && <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">Schöner Traum</span>}
            {emotions.map((em) => <span key={em} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">💭 {em}</span>)}
            {dream.persons.map((p) => <span key={p} className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs text-violet-100">👤 {p}</span>)}
            {dream.places.map((p)  => <span key={p} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">📍 {p}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Journal Card ─────────────────────────────────────────────
function JournalCard({ journal, onPin, pinning }: { journal: JournalEntry; onPin: () => void; pinning: boolean }) {
  const moodInfo = journal.mood_score ? MOOD_LABELS[journal.mood_score] : null

  return (
    <div className="relative flex gap-5">
      <div className="relative z-10 mt-4 h-9 w-9 shrink-0 rounded-full border border-amber-300/20 bg-amber-300/10">
        <div className="absolute inset-[10px] rounded-full bg-amber-200" />
      </div>

      <div className={`flex-1 rounded-3xl border bg-white/5 p-6 backdrop-blur transition ${journal.is_key_event ? "border-amber-300/25 bg-amber-300/3" : "border-white/10 hover:border-white/20"}`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base">📓</span>
            <span className="text-sm text-white/35">{formatDate(journal.entry_date || journal.created_at)}</span>
            {moodInfo && <span className={`text-xs font-medium ${moodInfo.color}`}>{journal.mood_score}/10 {moodInfo.label}</span>}
            {journal.is_key_event && <span className="text-xs text-amber-300/70">📌 Keyevent</span>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={onPin} disabled={pinning} title={journal.is_key_event ? "Entpinnen" : "Als Keyevent pinnen"}
              className={`rounded-xl border px-2.5 py-1.5 text-sm transition ${journal.is_key_event
                ? "border-amber-300/30 bg-amber-300/12 text-amber-300 hover:bg-amber-300/20"
                : "border-white/10 bg-white/5 text-white/25 hover:border-amber-300/25 hover:bg-amber-300/8 hover:text-amber-300/70"
              } disabled:opacity-40`}>
              {pinning ? <span className="animate-spin inline-block">✦</span> : "📌"}
            </button>
            <Link href={`/entries/${journal.id}?type=journal`}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white">
              Ansehen
            </Link>
          </div>
        </div>

        <p className="leading-7 text-white/80 mb-4">{truncate(journal.body_text)}</p>

        <div className="flex flex-wrap gap-2">
          {journal.energy_level && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">⚡ {ENERGY_LABELS[journal.energy_level]}</span>}
          {journal.sleep_hours  && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">💤 {journal.sleep_hours}h</span>}
          {journal.tags?.map((tag) => <span key={tag} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">{tag}</span>)}
        </div>
      </div>
    </div>
  )
}