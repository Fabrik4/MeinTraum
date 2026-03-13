"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"
import AuthBanner from "@/app/AuthBanner"
import { useSpeechRecorder } from "@/lib/useSpeechRecorder"

const MOOD_LABELS: Record<number, { label: string; color: string }> = {
  1:  { label: "Sehr schlecht",  color: "text-red-300" },
  2:  { label: "Schlecht",       color: "text-red-200" },
  3:  { label: "Mies",           color: "text-orange-300" },
  4:  { label: "Eher schlecht",  color: "text-orange-200" },
  5:  { label: "Neutral",        color: "text-white/80" },
  6:  { label: "Okay",           color: "text-yellow-200" },
  7:  { label: "Gut",            color: "text-emerald-300" },
  8:  { label: "Sehr gut",       color: "text-emerald-200" },
  9:  { label: "Grossartig",     color: "text-cyan-300" },
  10: { label: "Ausgezeichnet",  color: "text-cyan-200" },
}

const ENERGY_LABELS: Record<number, string> = {
  1: "Erschöpft",
  2: "Müde",
  3: "Normal",
  4: "Energiegeladen",
  5: "Voller Energie",
}

const PRESET_TAGS = [
  "Arbeit", "Familie", "Beziehung", "Gesundheit", "Sport",
  "Schlaf", "Stress", "Entspannung", "Soziales", "Kreativität",
]

export default function JournalNewPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [bodyText, setBodyText] = useState("")
  const [moodScore, setMoodScore] = useState(5)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [sleepHours, setSleepHours] = useState<string>("")
  const [showSleepPicker, setShowSleepPicker] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [expanding, setExpanding] = useState(false)
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null)
  const [expandedText, setExpandedText] = useState<string | null>(null)

  // Speech-to-Text
  const onTranscript = useCallback((text: string) => {
    setBodyText((prev) => prev ? prev + " " + text : text)
  }, [])
  const { state: recState, errorMsg: recError, start: startRec, stop: stopRec } = useSpeechRecorder(onTranscript)

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])

  const addCustomTag = () => {
    if (!customTag.trim() || selectedTags.includes(customTag.trim())) return
    setSelectedTags((prev) => [...prev, customTag.trim()])
    setCustomTag("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)

    const submitText = expandedText ?? bodyText
    const { data, error } = await supabase.from("journal_entries").insert([{
      user_id: user.id,
      body_text: submitText,
      mood_score: moodScore,
      mood_label: MOOD_LABELS[moodScore].label,
      energy_level: energyLevel,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      tags: selectedTags,
      entry_date: entryDate,
    }]).select("id").single()

    setIsSubmitting(false)
    if (error || !data) return
    setSavedId(data.id)
  }

  async function expandText() {
    if (!bodyText.trim()) return
    setExpanding(true); setExpandedPreview(null)
    try {
      const res = await fetch("/api/expand-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: bodyText, mood: MOOD_LABELS[moodScore].label, tags: selectedTags }),
      })
      const data = await res.json()
      if (data.expanded) setExpandedPreview(data.expanded)
    } catch { /* silent */ }
    setExpanding(false)
  }

  // ── Post-Save Screen ─────────────────────────────────────
  if (savedId) {
    return (
      <main className="min-h-screen bg-[#070b14] px-6 pt-5 pb-24 md:py-16 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/10 text-3xl">
              📓
            </div>
            <h1 className="text-3xl font-semibold">Eintrag gespeichert.</h1>
            <p className="mt-3 text-white/70">Möchtest du noch etwas ergänzen?</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button onClick={() => router.push(`/entries/${savedId}?type=journal&edit=true`)}
              className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:bg-white/10 hover:border-white/20">
              <span className="text-2xl">✏️</span>
              <span className="font-medium text-white">Details ergänzen</span>
              <span className="text-sm text-white/70">Eintrag bearbeiten oder KI-Reflexion starten.</span>
            </button>
            <button onClick={() => router.push("/timeline")}
              className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:bg-white/10 hover:border-white/20">
              <span className="text-2xl">✓</span>
              <span className="font-medium text-white">Fertig</span>
              <span className="text-sm text-white/70">Zurück zur Timeline.</span>
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── Formular ─────────────────────────────────────────────
  return (
    <>
      {!authLoading && !user && <AuthBanner />}
      <main className="min-h-screen bg-[#070b14] px-6 pt-5 pb-24 md:py-16 text-white">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-300/80">Neuer Eintrag</p>
          <h1 className="mt-4 text-4xl font-semibold">Wie geht es dir?</h1>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Halte fest wie du dich fühlst – kurz oder ausführlich.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-10">

            {/* Freitext */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">
                Was beschäftigt dich gerade?
              </label>
              <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)}
                placeholder="Stichworte reichen – z.B. «langer Tag, Gespräch mit Jonas, müde aber zufrieden»"
                required rows={5}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/50 focus:border-amber-300/40 focus:outline-none transition resize-none" />

              {/* Mikrofon-Button */}
              <div className="mt-3 flex items-center gap-3">
                <button type="button"
                  onClick={recState === "recording" ? stopRec : startRec}
                  disabled={recState === "transcribing"}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all ${
                    recState === "recording"
                      ? "border-red-400/40 bg-red-400/15 text-red-200 animate-pulse"
                      : recState === "transcribing"
                      ? "border-amber-300/20 bg-amber-300/8 text-amber-300/60 cursor-wait"
                      : recState === "error"
                      ? "border-red-300/20 bg-red-300/8 text-red-300/60"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white/70"
                  }`}>
                  {recState === "recording" ? (
                    <><span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" /> Aufnahme stoppen</>
                  ) : recState === "transcribing" ? (
                    <><span className="animate-spin">✦</span> Wird transkribiert…</>
                  ) : recState === "error" ? (
                    <>🎤 {recError}</>
                  ) : (
                    <>🎤 Einsprechen</>
                  )}
                </button>
                {recState === "idle" && (
                  <span className="text-xs text-white/20">Gedanken einfach aussprechen</span>
                )}
              </div>

              {/* Auto-Text Vorschau */}
              {expandedPreview && (
                <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-amber-300/60 mb-3">KI-Vorschlag</p>
                  <p className="text-sm leading-7 text-white/75 mb-4">{expandedPreview}</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setExpandedText(expandedPreview); setExpandedPreview(null) }}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14]">Übernehmen</button>
                    <button type="button" onClick={() => setExpandedPreview(null)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">Verwerfen</button>
                  </div>
                </div>
              )}

              {/* Zwei-Block UI nach Übernehmen */}
              {expandedText !== null && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                    <p className="text-xs text-white/45 mb-1.5">Deine Stichworte</p>
                    <p className="text-sm text-white/50 leading-6">{bodyText}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/4 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-[0.15em] text-amber-300/60">KI-Ausformulierung</p>
                      <button type="button" onClick={() => setExpandedText(null)}
                        className="text-xs text-white/30 hover:text-white/60 transition">
                        ✕ Löschen
                      </button>
                    </div>
                    <textarea
                      value={expandedText}
                      onChange={(e) => setExpandedText(e.target.value)}
                      rows={5}
                      className="w-full bg-transparent text-sm text-white/80 leading-7 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Datum */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">Datum</label>
              <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-amber-300/40 focus:outline-none transition" />
            </div>

            {/* Stimmungs-Score */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/80">Stimmung</p>
                <span className={`text-sm font-medium ${MOOD_LABELS[moodScore].color}`}>
                  {moodScore} – {MOOD_LABELS[moodScore].label}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-white/60">Sehr schlecht</span>
                <span className="text-xs text-white/60">Ausgezeichnet</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="w-full accent-amber-300 cursor-pointer" />
              <div className="flex justify-between mt-1">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <span key={n}
                    className={`text-xs cursor-pointer transition ${moodScore === n ? "text-amber-300 font-medium" : "text-white/20"}`}
                    onClick={() => setMoodScore(n)}>
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Energie */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/80">Energie</p>
                <span className="text-sm text-white/80">{ENERGY_LABELS[energyLevel]}</span>
              </div>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} type="button" onClick={() => setEnergyLevel(n)}
                    className={`flex-1 rounded-2xl border py-3 text-sm transition-all ${
                      energyLevel >= n
                        ? "border-amber-300/30 bg-amber-300/20 text-amber-100"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                    }`}>
                    {"⚡".repeat(n)}
                  </button>
                ))}
              </div>
            </div>

            {/* Schlafstunden */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white/80">
                  Schlafstunden <span className="font-normal text-white/60">(optional)</span>
                </label>
                {showSleepPicker && sleepHours && (
                  <span className="text-sm font-semibold text-amber-200">{sleepHours} h</span>
                )}
              </div>
              {showSleepPicker ? (
                <div className="space-y-2">
                  <SleepWheelPicker value={sleepHours} onChange={setSleepHours} />
                  <button type="button"
                    onClick={() => { setShowSleepPicker(false); setSleepHours("") }}
                    className="text-xs text-white/30 hover:text-white/60 transition">
                    × Entfernen
                  </button>
                </div>
              ) : (
                <button type="button"
                  onClick={() => { setShowSleepPicker(true); setSleepHours("7.5") }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 hover:border-white/20 hover:text-white/80 transition">
                  + Hinzufügen
                </button>
              )}
            </div>

            {/* Tags */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">
                Themen <span className="font-normal text-white/60">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${
                        active
                          ? "border-amber-300/40 bg-amber-300/20 text-amber-100 scale-[1.04]"
                          : "border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10 hover:text-white"
                      }`}>
                      {tag}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input value={customTag} onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag() } }}
                  placeholder="Eigenes Thema…"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/50 focus:border-amber-300/40 focus:outline-none transition" />
                <button type="button" onClick={addCustomTag}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition">
                  + Hinzufügen
                </button>
              </div>
            </div>

            {/* Submit – zwei Buttons nebeneinander */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <button type="button"
                  onClick={expandText}
                  disabled={expanding || !bodyText.trim() || expandedText !== null}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/8 px-4 py-4 text-sm font-medium text-amber-100 transition hover:bg-amber-300/15 disabled:opacity-35">
                  {expanding
                    ? <><span className="animate-spin">✦</span> Generiere…</>
                    : <>✨ Auto-Text</>
                  }
                </button>
                <button type="submit" disabled={isSubmitting || !user}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
                  {isSubmitting
                    ? <><span className="animate-spin inline-block">✦</span> Speichert…</>
                    : "Speichern →"
                  }
                </button>
              </div>

              {!user && !authLoading && (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-100 text-center">
                  Melde dich an um deinen Eintrag zu speichern.{" "}
                  <a href="/login" className="underline underline-offset-2">Jetzt anmelden →</a>
                </div>
              )}
            </div>

          </form>
        </div>
      </main>
    </>
  )
}

// ── Sleep Wheel Picker ────────────────────────────────────────
const SLEEP_VALUES = [
  "", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5",
  "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "13.5", "14",
  "14.5", "15", "15.5", "16", "16.5", "17", "17.5", "18", "18.5", "19", "19.5", "20",
  "20.5", "21", "21.5", "22", "22.5", "23", "23.5", "24",
]
const ITEM_H = 44

function SleepWheelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(() => Math.max(0, SLEEP_VALUES.indexOf(value)))

  useEffect(() => {
    const idx = Math.max(0, SLEEP_VALUES.indexOf(value))
    setActiveIdx(idx)
    if (scrollRef.current) {
      scrollRef.current.scrollTop = idx * ITEM_H
    }
  }, [value])

  function handleScroll() {
    if (!scrollRef.current) return
    const idx = Math.min(Math.round(scrollRef.current.scrollTop / ITEM_H), SLEEP_VALUES.length - 1)
    setActiveIdx(idx)
    onChange(SLEEP_VALUES[idx])
  }

  return (
    <div className="relative h-[132px] overflow-hidden rounded-2xl border border-white/8 bg-white/3">
      {/* Gradient oben */}
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#070b14] to-transparent z-10 pointer-events-none" />
      {/* Gradient unten */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#070b14] to-transparent z-10 pointer-events-none" />
      {/* Mittleres Highlight */}
      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-[44px] rounded-xl border border-amber-300/20 bg-amber-300/6 pointer-events-none z-0" />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div style={{ height: ITEM_H }} />
        {SLEEP_VALUES.map((v, i) => (
          <div key={i} style={{ height: ITEM_H, scrollSnapAlign: "center" }} className="flex items-center justify-center">
            <span className={`font-medium transition-all duration-150 select-none ${
              activeIdx === i ? "text-amber-200 text-xl" : "text-white/50 text-sm"
            }`}>
              {v === "" ? "–" : `${v} h`}
            </span>
          </div>
        ))}
        <div style={{ height: ITEM_H }} />
      </div>
    </div>
  )
}