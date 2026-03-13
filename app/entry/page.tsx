"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"
import Link from "next/link"
import { useSpeechRecorder } from "@/lib/useSpeechRecorder"
import { getMoonPhase } from "@/lib/moonPhase"

const EMOTIONS = ["Angst", "Freude", "Trauer", "Verwirrung", "Neugier", "Ruhe", "Wut", "Ekel"]
const CLARITY_OPTIONS = ["Verschwommen", "Mittel", "Sehr klar"]
const TONE_OPTIONS = [
  { value: "nightmare", label: "Albtraum" },
  { value: "neutral",   label: "Neutral" },
  { value: "pleasant",  label: "Schöner Traum" },
]

const SMART_PROMPTS = [
  { label: "🌍 Wo warst du?",     prefix: "Wo ich war: " },
  { label: "👤 Wer war da?",       prefix: "Wer da war: " },
  { label: "🌀 Seltsamstes Bild?", prefix: "Das seltsamste: " },
  { label: "💭 Stärkste Emotion?", prefix: "Ich fühlte: " },
  { label: "⚡ Wie aufgewacht?",   prefix: "Aufgewacht: " },
]

const QUICK_EMOTIONS = [
  { emoji: "😴", label: "Ruhig" },
  { emoji: "😰", label: "Angst" },
  { emoji: "😵", label: "Verwirrung" },
  { emoji: "😊", label: "Freude" },
  { emoji: "😢", label: "Trauer" },
  { emoji: "🤔", label: "Neugier" },
]
const QUICK_PLACES = [
  { emoji: "🏠", label: "Zuhause" },
  { emoji: "🏫", label: "Schule/Arbeit" },
  { emoji: "🌲", label: "Natur" },
  { emoji: "🏙️", label: "Stadt" },
  { emoji: "🌊", label: "Wasser" },
  { emoji: "❓", label: "Unbekannt" },
]
const QUICK_PERSONS = [
  { emoji: "👤", label: "Allein" },
  { emoji: "👥", label: "Bekannte" },
  { emoji: "👻", label: "Fremd" },
  { emoji: "👨‍👩‍👧", label: "Familie" },
]
const QUICK_CLARITIES = [
  { emoji: "😶", label: "Kaum" },
  { emoji: "🌫️", label: "Verschwommen" },
  { emoji: "🔍", label: "Mittel" },
  { emoji: "💎", label: "Sehr klar" },
]

type GuestAnalysis = {
  summary: string
  themes: string[]
  reflection: string
  question: string
  caution: string
}

function QuickCard({ emoji, label, selected, onClick }: {
  emoji: string; label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all ${
        selected
          ? "border-cyan-300/30 bg-cyan-300/8 text-cyan-200"
          : "border-white/8 bg-white/4 text-white/60 hover:border-white/15 hover:text-white/80"
      }`}>
      <span className="text-xl">{emoji}</span>
      <span className="text-xs leading-tight text-center">{label}</span>
    </button>
  )
}

export default function DreamEntryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [entryMode, setEntryMode] = useState<"normal" | "quick">("normal")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Normal mode
  const [rawInputText, setRawInputText] = useState("")
  const [expandedText, setExpandedText] = useState<string | null>(null)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [dreamClarity, setDreamClarity] = useState(1)
  const [dreamTone, setDreamTone] = useState(1)
  const [familiarPersonFlag, setFamiliarPersonFlag] = useState(false)
  const [familiarPlaceFlag, setFamiliarPlaceFlag] = useState(false)
  const [dreamedAt, setDreamedAt] = useState(() => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  })
  const [expanding, setExpanding] = useState(false)
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedEntryId, setSavedEntryId] = useState<number | null>(null)
  const [extensionMode, setExtensionMode] = useState(false)
  const [addingRevision, setAddingRevision] = useState(false)

  // Quick entry
  const [quickEmotion, setQuickEmotion] = useState("")
  const [quickPlace, setQuickPlace] = useState("")
  const [quickPerson, setQuickPerson] = useState("")
  const [quickClarity, setQuickClarity] = useState("")
  const [quickNote, setQuickNote] = useState("")

  // STT – normal mode
  const onTranscript = useCallback((text: string) => {
    setRawInputText((prev) => prev ? prev + " " + text : text)
  }, [])
  const { state: recState, errorMsg: recError, start: startRec, stop: stopRec } = useSpeechRecorder(onTranscript)

  // STT – quick note
  const onQuickTranscript = useCallback((text: string) => {
    setQuickNote((prev) => prev ? prev + " " + text : text)
  }, [])
  const { state: quickRecState, start: startQuickRec, stop: stopQuickRec } = useSpeechRecorder(onQuickTranscript)

  // Gast-Analyse
  const [guestAnalysis, setGuestAnalysis] = useState<GuestAnalysis | null>(null)
  const [analyzingGuest, setAnalyzingGuest] = useState(false)
  const [guestDreamText, setGuestDreamText] = useState("")
  const [savingToAccount, setSavingToAccount] = useState(false)

  const toggleEmotion = (e: string) =>
    setSelectedEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  function buildQuickText(): string {
    const parts: string[] = []
    if (quickEmotion) parts.push(`Emotion: ${quickEmotion}`)
    if (quickPlace) parts.push(`Ort: ${quickPlace}`)
    if (quickPerson) parts.push(`Person: ${quickPerson}`)
    if (quickClarity) parts.push(`Klarheit: ${quickClarity}`)
    if (quickNote.trim()) parts.push(`Notiz: ${quickNote.trim()}`)
    return parts.join(". ")
  }

  // ── Normaler Submit (eingeloggt) ──────────────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    const submitText = expandedText ?? rawInputText
    const selectedTone = TONE_OPTIONS[dreamTone].value
    const dreamDate = dreamedAt ? new Date(dreamedAt) : new Date()
    const moon = getMoonPhase(dreamDate)
    const { data, error } = await supabase.from("dream_entries").insert([{
      user_id: user.id,
      raw_input_text: submitText,
      dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
      dream_clarity: CLARITY_OPTIONS[dreamClarity],
      dream_tone: selectedTone,
      familiar_person_flag: familiarPersonFlag,
      familiar_place_flag: familiarPlaceFlag,
      nightmare_flag: selectedTone === "nightmare",
      dreamed_at: dreamDate.toISOString(),
      moon_phase: moon.phase,
      moon_phase_name: moon.name,
    }]).select("id").single()
    setIsSubmitting(false)
    if (error || !data) return
    // Erste Revision speichern
    await fetch("/api/add-revision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: data.id, user_id: user.id, text: submitText, expanded: expandedText ?? undefined }),
    })
    // Erweiterungs-Modus statt Redirect
    setSavedEntryId(data.id)
    setExtensionMode(true)
    setRawInputText("")
    setExpandedText(null)
    setExpandedPreview(null)
    window.scrollTo(0, 0)
  }

  // ── Ergänzung speichern (Erweiterungs-Modus) ─────────────────
  async function handleAddRevision(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!savedEntryId || !rawInputText.trim()) return
    setAddingRevision(true)
    await fetch("/api/add-revision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: savedEntryId, user_id: user!.id, text: rawInputText, expanded: expandedText ?? undefined }),
    })
    setRawInputText("")
    setExpandedText(null)
    setExpandedPreview(null)
    setAddingRevision(false)
  }

  // ── Quick Submit ──────────────────────────────────────────
  async function handleQuickSubmit() {
    const text = buildQuickText()
    if (!text) return
    const dreamDate = dreamedAt ? new Date(dreamedAt) : new Date()
    const moon = getMoonPhase(dreamDate)
    if (user) {
      setIsSubmitting(true)
      const { data, error } = await supabase.from("dream_entries").insert([{
        user_id: user.id,
        raw_input_text: text,
        dominant_emotion: quickEmotion || null,
        dream_clarity: quickClarity || null,
        dream_tone: "neutral",
        familiar_person_flag: false,
        familiar_place_flag: false,
        nightmare_flag: false,
        dreamed_at: dreamDate.toISOString(),
        moon_phase: moon.phase,
        moon_phase_name: moon.name,
      }]).select("id").single()
      setIsSubmitting(false)
      if (!error && data) router.push(`/entries/${data.id}?type=dream`)
    } else {
      setAnalyzingGuest(true)
      setGuestDreamText(text)
      try {
        const res = await fetch("/api/analyze-dream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dreamText: text,
            emotion: quickEmotion,
            clarity: quickClarity,
            tone: "neutral",
            entities: { persons: [], places: [] },
            mode: "psychological",
          }),
        })
        const data = await res.json()
        if (data.analysis) setGuestAnalysis(data.analysis)
      } catch { /* silent */ }
      setAnalyzingGuest(false)
    }
  }

  // ── Gast-Analyse ─────────────────────────────────────────
  async function handleGuestAnalysis() {
    const submitText = expandedText ?? rawInputText
    if (!submitText.trim()) return
    setAnalyzingGuest(true)
    setGuestDreamText(submitText)
    try {
      const res = await fetch("/api/analyze-dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamText: submitText,
          emotion: selectedEmotions.join(", "),
          clarity: CLARITY_OPTIONS[dreamClarity],
          tone: TONE_OPTIONS[dreamTone].value,
          entities: { persons: [], places: [] },
          mode: "psychological",
        }),
      })
      const data = await res.json()
      if (data.analysis) setGuestAnalysis(data.analysis)
    } catch { /* silent */ }
    setAnalyzingGuest(false)
  }

  // ── Gast speichert nach Login ─────────────────────────────
  async function saveGuestDreamToAccount() {
    if (!user || !guestAnalysis) return
    setSavingToAccount(true)
    const selectedTone = TONE_OPTIONS[dreamTone].value
    const dreamDate = dreamedAt ? new Date(dreamedAt) : new Date()
    const moon = getMoonPhase(dreamDate)
    const { data } = await supabase.from("dream_entries").insert([{
      user_id: user.id,
      raw_input_text: guestDreamText,
      dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
      dream_clarity: CLARITY_OPTIONS[dreamClarity],
      dream_tone: selectedTone,
      familiar_person_flag: familiarPersonFlag,
      familiar_place_flag: familiarPlaceFlag,
      nightmare_flag: selectedTone === "nightmare",
      dreamed_at: dreamDate.toISOString(),
      moon_phase: moon.phase,
      moon_phase_name: moon.name,
    }]).select("id").single()
    setSavingToAccount(false)
    if (data) router.push(`/entries/${data.id}?type=dream`)
  }

  async function expandText() {
    setExpanding(true); setExpandedPreview(null)
    try {
      const res = await fetch("/api/expand-dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawInputText, emotion: selectedEmotions.join(", "), persons: [], places: [] }),
      })
      const data = await res.json()
      if (data.expanded) setExpandedPreview(data.expanded)
    } catch { /* silent */ }
    setExpanding(false)
  }

  // Nach Login: Gast-Analyse speichern
  if (!authLoading && user && guestAnalysis) {
    return (
      <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-14 text-white">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/5 p-6 text-center space-y-4">
            <p className="text-2xl">✓</p>
            <p className="font-semibold text-white">Willkommen! Du bist jetzt angemeldet.</p>
            <p className="text-sm text-white/70">Möchtest du deinen Traum in deinem Archiv speichern?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={saveGuestDreamToAccount} disabled={savingToAccount}
                className="rounded-2xl bg-white px-6 py-3 font-medium text-[#070b14] transition hover:scale-[1.02] disabled:opacity-60">
                {savingToAccount ? "Speichert…" : "🌙 Traum speichern"}
              </button>
              <Link href="/dashboard"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm text-white/80 transition hover:bg-white/10">
                Zum Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Gast-Analyse Ergebnis
  if (guestAnalysis && !user) {
    return (
      <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-14 text-white">
        <div className="mx-auto max-w-2xl space-y-8">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">Dein Traum</p>
            <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/4 p-6">
              <p className="leading-8 text-white/80">{guestDreamText}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedEmotions.map((em) => (
                  <span key={em} className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-xs text-cyan-200">💭 {em}</span>
                ))}
                {TONE_OPTIONS[dreamTone].value !== "neutral" && (
                  <span className={`rounded-full border px-3 py-1 text-xs ${dreamTone === 0 ? "border-red-300/15 bg-red-300/8 text-red-200" : "border-emerald-300/15 bg-emerald-300/8 text-emerald-200"}`}>
                    {TONE_OPTIONS[dreamTone].label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/3 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-cyan-300/60">Traumbegleiter AI</p>
                <p className="font-medium text-white">Psychologische Analyse</p>
              </div>
            </div>
            <p className="leading-8 text-white/80">{guestAnalysis.summary}</p>
            {guestAnalysis.themes?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {guestAnalysis.themes.map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80">{t}</span>
                ))}
              </div>
            )}
            {guestAnalysis.reflection && (
              <p className="text-sm leading-7 text-white/65">{guestAnalysis.reflection}</p>
            )}
            <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4">
              <p className="text-xs text-white/60 mb-1">Frage für dich</p>
              <p className="text-white/75 leading-7 italic">"{guestAnalysis.question}"</p>
            </div>
            <p className="text-xs text-white/45 border-t border-white/5 pt-4">{guestAnalysis.caution}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-300/5 to-violet-300/5 p-8 text-center space-y-5">
            <p className="text-xl font-semibold">Diesen Traum für immer behalten?</p>
            <p className="text-sm text-white/70 leading-7 max-w-sm mx-auto">
              Erstelle jetzt ein kostenloses Konto – dein Traum und die Analyse werden automatisch gespeichert.
              Mit der Zeit erkennst du Muster die dein Unterbewusstsein dir zeigt.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/login"
                onClick={() => {
                  localStorage.setItem("meintraum_guest_dream", JSON.stringify({
                    raw_input_text: guestDreamText,
                    dominant_emotion: selectedEmotions.join(", ") || null,
                    dream_clarity: CLARITY_OPTIONS[dreamClarity],
                    dream_tone: TONE_OPTIONS[dreamTone].value,
                    familiar_person_flag: familiarPersonFlag,
                    familiar_place_flag: familiarPlaceFlag,
                    nightmare_flag: TONE_OPTIONS[dreamTone].value === "nightmare",
                    dreamed_at: dreamedAt ? new Date(dreamedAt).toISOString() : new Date().toISOString(),
                  }))
                }}
                className="rounded-2xl bg-white px-8 py-3.5 font-medium text-[#070b14] transition hover:scale-[1.02]">
                Kostenlos registrieren →
              </Link>
              <button onClick={() => setGuestAnalysis(null)}
                className="rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-sm text-white/70 transition hover:bg-white/8 hover:text-white">
                Neuen Traum eingeben
              </button>
            </div>
            <p className="text-xs text-white/20">Keine Kreditkarte · Kostenlos starten</p>
          </div>

          <div className="rounded-3xl border border-white/6 bg-white/2 p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/45">Mit eigenem Konto auch möglich</p>
            <div className="grid gap-3 sm:grid-cols-3 text-center text-xs text-white/60">
              <div className="space-y-1.5">
                <p className="text-xl">💬</p>
                <p>Mit dem Traumbegleiter über diesen Traum sprechen</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xl">✦</p>
                <p>Muster über alle Träume erkennen</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xl">📌</p>
                <p>Schlüsselereignisse mit Träumen verknüpfen</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    )
  }

  // ── Eingabe-Formular ──────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-14 text-white">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-4">
            {user ? "Neuer Eintrag" : "Traumanalyse · Kostenlos · Keine Anmeldung"}
          </p>
          <h1 className="text-3xl font-semibold">
            {user ? "Traum erfassen" : "Deinen Traum analysieren"}
          </h1>
          {!user && (
            <p className="mt-2 text-sm text-white/65 leading-6">
              Gib deinen Traum ein – die KI analysiert ihn sofort.
            </p>
          )}
        </div>

        {/* Modus-Umschalter */}
        <div className="flex gap-2">
          <button type="button" onClick={() => setEntryMode("normal")}
            className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              entryMode === "normal"
                ? "border-white/20 bg-white/8 text-white"
                : "border-white/8 bg-white/3 text-white/50 hover:text-white/70"
            }`}>
            🌙 Normaler Eintrag
          </button>
          <button type="button" onClick={() => setEntryMode("quick")}
            className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              entryMode === "quick"
                ? "border-cyan-300/25 bg-cyan-300/8 text-cyan-100"
                : "border-white/8 bg-white/3 text-white/50 hover:text-white/70"
            }`}>
            ⚡ Schnell-Eintrag
          </button>
        </div>

        {/* Erfolgs-Banner nach Speichern */}
        {extensionMode && savedEntryId && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-emerald-200">✓ Traum gespeichert – du kannst ihn gleich erweitern</p>
            <Link href={`/entries/${savedEntryId}?type=dream`}
              className="shrink-0 text-xs text-white/50 hover:text-white/80 transition">
              Ansehen →
            </Link>
          </div>
        )}

        {entryMode === "normal" ? (

          /* ── Normaler Eintrag ──────────────────────────── */
          <form onSubmit={user ? (extensionMode ? handleAddRevision : handleSubmit) : (e) => { e.preventDefault(); handleGuestAnalysis() }} className="space-y-8">

            {/* Traumtext */}
            <div>
              <label className="block mb-3 text-sm font-medium text-white/70">
                Was hast du geträumt?
                {user && <span className="ml-2 font-normal text-white/50">(optional)</span>}
              </label>

              {/* Smart Prompts – nur wenn Textarea leer und kein expandedText */}
              {!rawInputText && expandedText === null && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {SMART_PROMPTS.map((p) => (
                    <button key={p.label} type="button"
                      onClick={() => {
                        setRawInputText(p.prefix)
                        setTimeout(() => {
                          textareaRef.current?.focus()
                          const len = p.prefix.length
                          textareaRef.current?.setSelectionRange(len, len)
                        }, 0)
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:border-cyan-300/25 hover:text-white/70 transition">
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Textarea oder Zwei-Block-UI */}
              {expandedText === null ? (
                <textarea
                  ref={textareaRef}
                  value={rawInputText}
                  onChange={(e) => setRawInputText(e.target.value)}
                  placeholder="Stichworte reichen – z.B. «Brücke, alte Chefin, konnte nicht weglaufen»"
                  rows={6}
                  required={!user}
                  className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/60 focus:border-cyan-300/30 focus:outline-none transition resize-none"
                />
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                    <p className="text-xs text-white/45 mb-1.5">Deine Stichworte</p>
                    <p className="text-sm text-white/50 leading-6">{rawInputText}</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/4 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs uppercase tracking-[0.15em] text-cyan-300/60">KI-Ausformulierung</p>
                      <button type="button" onClick={() => setExpandedText(null)}
                        className="text-xs text-white/30 hover:text-white/60 transition">
                        ✕ Löschen
                      </button>
                    </div>
                    <textarea
                      value={expandedText}
                      onChange={(e) => setExpandedText(e.target.value)}
                      rows={6}
                      className="w-full bg-transparent text-sm text-white/80 leading-7 focus:outline-none resize-none placeholder:text-white/40"
                    />
                  </div>
                </div>
              )}

              {/* Mikrofon-Button */}
              <div className="mt-3 flex items-center gap-3">
                <button type="button"
                  onClick={recState === "recording" ? stopRec : startRec}
                  disabled={recState === "transcribing"}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all ${
                    recState === "recording"
                      ? "border-red-400/40 bg-red-400/15 text-red-200 animate-pulse"
                      : recState === "transcribing"
                      ? "border-cyan-300/20 bg-cyan-300/8 text-cyan-300/60 cursor-wait"
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
                  <span className="text-xs text-white/20">Traum einfach erzählen – KI schreibt mit</span>
                )}
              </div>

              {/* Auto-Text Vorschau */}
              {expandedPreview && (
                <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-cyan-300/60 mb-3">KI-Vorschlag</p>
                  <p className="text-sm leading-7 text-white/75 mb-4">{expandedPreview}</p>
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => { setExpandedText(expandedPreview); setExpandedPreview(null) }}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14]">
                      Übernehmen
                    </button>
                    <button type="button" onClick={() => setExpandedPreview(null)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                      Verwerfen
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Emotionen */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/70">Wie hast du dich gefühlt? <span className="font-normal text-white/50">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((em) => (
                  <button key={em} type="button" onClick={() => toggleEmotion(em)}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${
                      selectedEmotions.includes(em)
                        ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100 scale-[1.04]"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                    }`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Stimmung */}
            <div>
              <p className="mb-4 text-sm font-medium text-white/70">Stimmung des Traums <span className="font-normal text-white/50">(optional)</span></p>
              <div className="flex justify-between mb-2">
                {TONE_OPTIONS.map((o, i) => (
                  <span key={o.value} onClick={() => setDreamTone(i)}
                    className={`text-xs cursor-pointer select-none transition ${dreamTone === i ? "text-cyan-200 font-medium" : "text-white/50 hover:text-white/80"}`}
                    style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>
                    {o.label}
                  </span>
                ))}
              </div>
              <input type="range" min={0} max={2} step={1} value={dreamTone}
                onChange={(e) => setDreamTone(Number(e.target.value))} className="w-full accent-cyan-300 cursor-pointer" />
            </div>

            {/* Klarheit */}
            <div>
              <p className="mb-4 text-sm font-medium text-white/70">Klarheit <span className="font-normal text-white/50">(optional)</span></p>
              <div className="flex justify-between mb-2">
                {CLARITY_OPTIONS.map((label, i) => (
                  <span key={label} onClick={() => setDreamClarity(i)}
                    className={`text-xs cursor-pointer select-none transition ${dreamClarity === i ? "text-cyan-200 font-medium" : "text-white/50 hover:text-white/80"}`}
                    style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>
                    {label}
                  </span>
                ))}
              </div>
              <input type="range" min={0} max={2} step={1} value={dreamClarity}
                onChange={(e) => setDreamClarity(Number(e.target.value))} className="w-full accent-cyan-300 cursor-pointer" />
            </div>

            {/* Datum */}
            {user && (
              <div>
                <label className="mb-3 block text-sm font-medium text-white/70">Wann war dieser Traum?</label>
                <input type="datetime-local" value={dreamedAt} onChange={(e) => setDreamedAt(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-cyan-300/30 focus:outline-none transition" />
              </div>
            )}

            {/* Personen/Orte */}
            {user && (
              <div className="flex gap-4 flex-wrap">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={familiarPersonFlag} onChange={(e) => setFamiliarPersonFlag(e.target.checked)}
                    className="h-4 w-4 rounded accent-cyan-300" />
                  <span className="text-sm text-white/80">Bekannte Person</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={familiarPlaceFlag} onChange={(e) => setFamiliarPlaceFlag(e.target.checked)}
                    className="h-4 w-4 rounded accent-cyan-300" />
                  <span className="text-sm text-white/80">Bekannter Ort</span>
                </label>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex gap-3">
                <button type="button"
                  onClick={expandText}
                  disabled={expanding || analyzingGuest || !rawInputText.trim() || expandedText !== null}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 px-4 py-4 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-35">
                  {expanding
                    ? <><span className="animate-spin">✦</span> Generiere…</>
                    : <>✨ Auto-Text</>
                  }
                </button>
                <button type="submit"
                  disabled={isSubmitting || analyzingGuest || (!user && !(expandedText ?? rawInputText).trim())}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                  {isSubmitting || analyzingGuest
                    ? <><span className="animate-spin inline-block">✦</span> {user ? "Speichert…" : "Analysiere…"}</>
                    : user ? "Speichern →" : "🧠 Analysieren →"
                  }
                </button>
              </div>
              {!user && !authLoading && (
                <p className="text-center text-xs text-white/20">
                  Schon neugierig auf die volle App?{" "}
                  <Link href="/demo" className="text-white/38 hover:text-white/80 underline underline-offset-2 transition">Demo</Link>
                  {" "}·{" "}
                  <Link href="/login" className="text-white/38 hover:text-white/80 underline underline-offset-2 transition">Anmelden</Link>
                </p>
              )}
            </div>

          </form>

        ) : (

          /* ── Schnell-Eintrag ───────────────────────────── */
          <div className="space-y-6">

            {/* Schritt 1 – Emotion */}
            <div>
              <p className="text-sm font-medium text-white/70 mb-3">
                Schritt 1 – Emotion <span className="text-white/40 font-normal">(Pflicht)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_EMOTIONS.map((o) => (
                  <QuickCard key={o.label} emoji={o.emoji} label={o.label}
                    selected={quickEmotion === o.label}
                    onClick={() => setQuickEmotion(quickEmotion === o.label ? "" : o.label)} />
                ))}
              </div>
            </div>

            {/* Schritt 2 – Ort */}
            <div>
              <p className="text-sm font-medium text-white/70 mb-3">
                Schritt 2 – Ort <span className="text-white/40 font-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_PLACES.map((o) => (
                  <QuickCard key={o.label} emoji={o.emoji} label={o.label}
                    selected={quickPlace === o.label}
                    onClick={() => setQuickPlace(quickPlace === o.label ? "" : o.label)} />
                ))}
              </div>
            </div>

            {/* Schritt 3 – Person */}
            <div>
              <p className="text-sm font-medium text-white/70 mb-3">
                Schritt 3 – Person <span className="text-white/40 font-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_PERSONS.map((o) => (
                  <QuickCard key={o.label} emoji={o.emoji} label={o.label}
                    selected={quickPerson === o.label}
                    onClick={() => setQuickPerson(quickPerson === o.label ? "" : o.label)} />
                ))}
              </div>
            </div>

            {/* Schritt 4 – Klarheit */}
            <div>
              <p className="text-sm font-medium text-white/70 mb-3">
                Schritt 4 – Traumklarheit <span className="text-white/40 font-normal">(optional)</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_CLARITIES.map((o) => (
                  <QuickCard key={o.label} emoji={o.emoji} label={o.label}
                    selected={quickClarity === o.label}
                    onClick={() => setQuickClarity(quickClarity === o.label ? "" : o.label)} />
                ))}
              </div>
            </div>

            {/* Schritt 5 – Stichwort */}
            <div>
              <p className="text-sm font-medium text-white/70 mb-3">
                Schritt 5 – Stichwort <span className="text-white/40 font-normal">(optional)</span>
              </p>
              <div className="flex gap-2">
                <input value={quickNote} onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="z.B. dunkler Tunnel, Verfolger…"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-cyan-300/30 focus:outline-none transition" />
                <button type="button"
                  onClick={quickRecState === "recording" ? stopQuickRec : startQuickRec}
                  disabled={quickRecState === "transcribing"}
                  className={`flex items-center gap-1.5 rounded-2xl border px-3 py-3 text-sm transition-all ${
                    quickRecState === "recording"
                      ? "border-red-400/40 bg-red-400/15 text-red-200 animate-pulse"
                      : quickRecState === "transcribing"
                      ? "border-cyan-300/20 bg-cyan-300/8 text-cyan-300/60 cursor-wait"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
                  }`}>
                  {quickRecState === "transcribing" ? <span className="animate-spin">✦</span> : "🎤"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="button"
              onClick={handleQuickSubmit}
              disabled={isSubmitting || analyzingGuest || !quickEmotion}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
              {isSubmitting || analyzingGuest
                ? <><span className="animate-spin inline-block">✦</span> {user ? "Speichert…" : "Analysiere…"}</>
                : user ? "✨ Speichern →" : "🧠 Analysieren →"
              }
            </button>
            {!quickEmotion && (
              <p className="text-center text-xs text-white/30">Wähle zuerst eine Emotion (Schritt 1)</p>
            )}
            {!user && !authLoading && (
              <p className="text-center text-xs text-white/20">
                <Link href="/login" className="text-white/38 hover:text-white/80 underline underline-offset-2 transition">Anmelden</Link>
                {" "}um Träume dauerhaft zu speichern
              </p>
            )}

          </div>

        )}

      </div>
    </main>
  )
}
