"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

type JournalEntry = {
  id: number
  body_text: string
  mood_score: number | null
  mood_label: string | null
  energy_level: number | null
  sleep_hours: number | null
  tags: string[]
  entry_date: string
  created_at: string
}

const MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1:  { label: "Sehr schlecht",  color: "text-red-300" },
  2:  { label: "Schlecht",       color: "text-red-200" },
  3:  { label: "Mies",           color: "text-orange-300" },
  4:  { label: "Eher schlecht",  color: "text-orange-200" },
  5:  { label: "Neutral",        color: "text-white/60" },
  6:  { label: "Okay",           color: "text-yellow-200" },
  7:  { label: "Gut",            color: "text-emerald-300" },
  8:  { label: "Sehr gut",       color: "text-emerald-200" },
  9:  { label: "Grossartig",     color: "text-cyan-300" },
  10: { label: "Ausgezeichnet",  color: "text-cyan-200" },
}

const ENERGY_LABELS: Record<number, string> = {
  1: "Erschöpft", 2: "Müde", 3: "Normal", 4: "Energiegeladen", 5: "Voller Energie",
}

const PRESET_TAGS = [
  "Arbeit", "Familie", "Beziehung", "Gesundheit", "Sport",
  "Schlaf", "Stress", "Entspannung", "Soziales", "Kreativität",
]

function moodColor(score: number | null) {
  if (!score) return "text-white/60"
  return MOOD_LABELS[score]?.color ?? "text-white/60"
}

export default function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [resolvedId, setResolvedId] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit state
  const [bodyText, setBodyText] = useState("")
  const [moodScore, setMoodScore] = useState(5)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [sleepHours, setSleepHours] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [entryDate, setEntryDate] = useState("")

  // Expand state
  const [expanding, setExpanding] = useState(false)
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null)

  useEffect(() => { params.then((r) => setResolvedId(r.id)) }, [params])

  useEffect(() => {
    if (!resolvedId) return
    fetchEntry()
    if (searchParams.get("edit") === "true") setIsEditing(true)
  }, [resolvedId])

  async function fetchEntry() {
    const { data, error } = await supabase
      .from("journal_entries").select("*").eq("id", resolvedId).single()
    if (!error && data) {
      setEntry(data)
      setBodyText(data.body_text || "")
      setMoodScore(data.mood_score || 5)
      setEnergyLevel(data.energy_level || 3)
      setSleepHours(data.sleep_hours?.toString() || "")
      setSelectedTags(data.tags || [])
      setEntryDate(data.entry_date || new Date().toISOString().slice(0, 10))
    }
    setLoading(false)
  }

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])

  const addCustomTag = () => {
    if (!customTag.trim() || selectedTags.includes(customTag.trim())) return
    setSelectedTags((prev) => [...prev, customTag.trim()])
    setCustomTag("")
  }

  async function expandText() {
    if (!bodyText.trim()) return
    setExpanding(true)
    setExpandedPreview(null)
    try {
      const res = await fetch("/api/expand-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: bodyText, moodScore, tags: selectedTags }),
      })
      const data = await res.json()
      if (data.expanded) setExpandedPreview(data.expanded)
    } catch { setMessage("Fehler bei der Textgenerierung.") }
    setExpanding(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from("journal_entries").update({
      body_text: bodyText,
      mood_score: moodScore,
      mood_label: MOOD_LABELS[moodScore].label,
      energy_level: energyLevel,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      tags: selectedTags,
      entry_date: entryDate,
    }).eq("id", resolvedId)
    setMessage("Gespeichert. ✓")
    setIsEditing(false)
    fetchEntry()
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from("journal_entries").delete().eq("id", resolvedId)
    router.push("/timeline")
  }

  if (loading) return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl"><p className="text-white/50">Wird geladen…</p></div>
    </main>
  )
  if (!entry) return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl"><p className="text-white/50">Eintrag nicht gefunden.</p></div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/timeline" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
            ← Zurück
          </Link>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]">
              Bearbeiten
            </button>
          )}
        </div>

        {/* ── Ansicht ── */}
        {!isEditing && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-white/40">
                {new Date(entry.entry_date).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <span className="text-xs text-white/20">·</span>
              <span className="text-sm font-medium">📓 Journal</span>
            </div>

            <p className="leading-8 text-white/85 whitespace-pre-wrap text-lg">{entry.body_text}</p>

            <div className="flex flex-wrap gap-3">
              {entry.mood_score && (
                <span className={`rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium ${moodColor(entry.mood_score)}`}>
                  ☀️ {entry.mood_score}/10 – {MOOD_LABELS[entry.mood_score]?.label}
                </span>
              )}
              {entry.energy_level && (
                <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-sm text-rose-100">
                  ⚡ {ENERGY_LABELS[entry.energy_level]}
                </span>
              )}
              {entry.sleep_hours && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">
                  💤 {entry.sleep_hours}h Schlaf
                </span>
              )}
              {entry.tags?.map((tag) => (
                <span key={tag} className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-sm text-rose-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Bearbeiten ── */}
        {isEditing && (
          <form onSubmit={handleSave} className="space-y-10">

            {/* Freitext + Expand */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white/80">Eintrag</label>
                <button type="button" onClick={expandText} disabled={expanding || !bodyText.trim()}
                  className="flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/5 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-40">
                  {expanding ? <><span className="animate-spin">✦</span> Generiere…</> : <>✨ Text ausformulieren</>}
                </button>
              </div>
              <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={6}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white focus:border-rose-300/40 focus:outline-none transition resize-none" />
              {expandedPreview && (
                <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/5 p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-rose-300/60 mb-3">KI-Vorschlag</p>
                  <p className="leading-7 text-white/80 text-sm mb-4">{expandedPreview}</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setBodyText(expandedPreview); setExpandedPreview(null) }}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]">
                      Übernehmen
                    </button>
                    <button type="button" onClick={() => setExpandedPreview(null)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10">
                      Verwerfen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Datum */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">Datum</label>
              <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-rose-300/40 focus:outline-none transition" />
            </div>

            {/* Stimmungs-Score */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/80">Stimmung</p>
                <span className={`text-sm font-medium ${MOOD_LABELS[moodScore].color}`}>
                  {moodScore} – {MOOD_LABELS[moodScore].label}
                </span>
              </div>
              <input type="range" min={1} max={10} step={1} value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="w-full accent-rose-300 cursor-pointer" />
              <div className="flex justify-between mt-1">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <span key={n} onClick={() => setMoodScore(n)}
                    className={`text-xs cursor-pointer transition ${moodScore === n ? "text-rose-300 font-medium" : "text-white/20"}`}>
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Energie */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/80">Energie</p>
                <span className="text-sm text-white/60">{ENERGY_LABELS[energyLevel]}</span>
              </div>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} type="button" onClick={() => setEnergyLevel(n)}
                    className={`flex-1 rounded-2xl border py-3 text-sm transition-all ${
                      energyLevel >= n
                        ? "border-rose-300/30 bg-rose-300/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-white/30 hover:bg-white/10"
                    }`}>
                    {"⚡".repeat(n)}
                  </button>
                ))}
              </div>
            </div>

            {/* Schlafstunden */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">Schlafstunden</label>
              <div className="flex items-center gap-3">
                <input type="number" min={0} max={24} step={0.5} value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)} placeholder="z.B. 7.5"
                  className="w-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-rose-300/40 focus:outline-none transition" />
                <span className="text-sm text-white/40">Stunden</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">Themen</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${
                        active
                          ? "border-rose-300/40 bg-rose-300/20 text-rose-100 scale-[1.04]"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"
                      }`}>
                      {tag}
                    </button>
                  )
                })}
              </div>
              {selectedTags.filter((t) => !PRESET_TAGS.includes(t)).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTags.filter((t) => !PRESET_TAGS.includes(t)).map((tag) => (
                    <span key={tag} className="flex items-center gap-1.5 rounded-full border border-rose-300/30 bg-rose-300/10 pl-3 pr-2 py-1.5 text-sm text-rose-100">
                      {tag}
                      <button type="button" onClick={() => toggleTag(tag)} className="opacity-50 hover:opacity-100 transition text-xs">✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={customTag} onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag() } }}
                  placeholder="Eigenes Thema…"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-rose-300/40 focus:outline-none transition" />
                <button type="button" onClick={addCustomTag}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition">
                  + Hinzufügen
                </button>
              </div>
            </div>

            {/* Speichern */}
            <div className="flex gap-4">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] disabled:opacity-60">
                {saving ? "Speichert..." : "Änderungen speichern"}
              </button>
              <button type="button" onClick={() => { setIsEditing(false); fetchEntry() }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
                Abbrechen
              </button>
            </div>

            {/* Löschen */}
            <div className="border-t border-white/5 pt-8">
              {!showDeleteConfirm ? (
                <button type="button" onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-300/50 hover:text-red-300/80 transition">
                  Eintrag löschen
                </button>
              ) : (
                <div className="rounded-2xl border border-red-300/20 bg-red-300/5 p-5">
                  <p className="text-sm text-white/70 mb-4">Diesen Eintrag wirklich löschen?</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleDelete} disabled={deleting}
                      className="rounded-xl bg-red-400/20 border border-red-300/30 px-4 py-2 text-sm text-red-100 transition hover:bg-red-400/30 disabled:opacity-50">
                      {deleting ? "Wird gelöscht…" : "Ja, löschen"}
                    </button>
                    <button type="button" onClick={() => setShowDeleteConfirm(false)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10">
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {message && (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{message}</div>
            )}
          </form>
        )}

        {message && !isEditing && (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{message}</div>
        )}

      </div>
    </main>
  )
}