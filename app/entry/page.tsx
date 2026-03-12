"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"
import Link from "next/link"

const EMOTIONS = ["Angst", "Freude", "Trauer", "Verwirrung", "Neugier", "Ruhe", "Wut", "Ekel"]
const CLARITY_OPTIONS = ["Verschwommen", "Mittel", "Sehr klar"]
const TONE_OPTIONS = [
  { value: "nightmare", label: "Albtraum" },
  { value: "neutral",   label: "Neutral" },
  { value: "pleasant",  label: "Schöner Traum" },
]

type GuestAnalysis = {
  summary: string
  themes: string[]
  reflection: string
  question: string
  caution: string
}

export default function DreamEntryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [rawInputText, setRawInputText] = useState("")
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

  // Gast-Analyse State
  const [guestAnalysis, setGuestAnalysis] = useState<GuestAnalysis | null>(null)
  const [analyzingGuest, setAnalyzingGuest] = useState(false)
  const [guestDreamText, setGuestDreamText] = useState("")
  const [savingToAccount, setSavingToAccount] = useState(false)

  const toggleEmotion = (e: string) =>
    setSelectedEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  // ── Für angemeldete User: direkt speichern ────────────────
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    const selectedTone = TONE_OPTIONS[dreamTone].value
    const { data, error } = await supabase.from("dream_entries").insert([{
      user_id: user.id,
      raw_input_text: rawInputText,
      dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
      dream_clarity: CLARITY_OPTIONS[dreamClarity],
      dream_tone: selectedTone,
      familiar_person_flag: familiarPersonFlag,
      familiar_place_flag: familiarPlaceFlag,
      nightmare_flag: selectedTone === "nightmare",
      dreamed_at: dreamedAt ? new Date(dreamedAt).toISOString() : new Date().toISOString(),
    }]).select("id").single()
    setIsSubmitting(false)
    if (error || !data) return
    router.push(`/entries/${data.id}?type=dream`)
  }

  // ── Für Gäste: Analyse ohne Speichern ────────────────────
  async function handleGuestAnalysis() {
    if (!rawInputText.trim()) return
    setAnalyzingGuest(true)
    setGuestDreamText(rawInputText)
    try {
      const res = await fetch("/api/analyze-dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamText: rawInputText,
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

  // ── Gast speichert nach Anmeldung ────────────────────────
  async function saveGuestDreamToAccount() {
    if (!user || !guestAnalysis) return
    setSavingToAccount(true)
    const selectedTone = TONE_OPTIONS[dreamTone].value
    const { data } = await supabase.from("dream_entries").insert([{
      user_id: user.id,
      raw_input_text: guestDreamText,
      dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
      dream_clarity: CLARITY_OPTIONS[dreamClarity],
      dream_tone: selectedTone,
      familiar_person_flag: familiarPersonFlag,
      familiar_place_flag: familiarPlaceFlag,
      nightmare_flag: selectedTone === "nightmare",
      dreamed_at: dreamedAt ? new Date(dreamedAt).toISOString() : new Date().toISOString(),
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

  // Nach Login: falls Gast-Analyse vorhanden → Speichern anbieten
  if (!authLoading && user && guestAnalysis) {
    return (
      <main className="min-h-screen bg-[#070b14] px-5 py-14 text-white">
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/5 p-6 text-center space-y-4">
            <p className="text-2xl">✓</p>
            <p className="font-semibold text-white">Willkommen! Du bist jetzt angemeldet.</p>
            <p className="text-sm text-white/50">Möchtest du deinen Traum in deinem Archiv speichern?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={saveGuestDreamToAccount} disabled={savingToAccount}
                className="rounded-2xl bg-white px-6 py-3 font-medium text-[#070b14] transition hover:scale-[1.02] disabled:opacity-60">
                {savingToAccount ? "Speichert…" : "🌙 Traum speichern"}
              </button>
              <Link href="/dashboard"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm text-white/60 transition hover:bg-white/10">
                Zum Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Gast-Analyse Ergebnis ─────────────────────────────────
  if (guestAnalysis && !user) {
    return (
      <main className="min-h-screen bg-[#070b14] px-5 py-14 text-white">
        <div className="mx-auto max-w-2xl space-y-8">

          {/* Traum */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-4">Dein Traum</p>
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

          {/* Analyse */}
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
                  <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">{t}</span>
                ))}
              </div>
            )}
            {guestAnalysis.reflection && (
              <p className="text-sm leading-7 text-white/65">{guestAnalysis.reflection}</p>
            )}
            <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4">
              <p className="text-xs text-white/35 mb-1">Frage für dich</p>
              <p className="text-white/75 leading-7 italic">"{guestAnalysis.question}"</p>
            </div>
            <p className="text-xs text-white/25 border-t border-white/5 pt-4">{guestAnalysis.caution}</p>
          </div>

          {/* CTA – Anmelden zum Speichern */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-300/5 to-violet-300/5 p-8 text-center space-y-5">
            <p className="text-xl font-semibold">Diesen Traum für immer behalten?</p>
            <p className="text-sm text-white/45 leading-7 max-w-sm mx-auto">
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
                className="rounded-2xl border border-white/12 bg-white/5 px-6 py-3.5 text-sm text-white/50 transition hover:bg-white/8 hover:text-white">
                Neuen Traum eingeben
              </button>
            </div>
            <p className="text-xs text-white/20">Keine Kreditkarte · Kostenlos starten</p>
          </div>

          {/* Teaser: Was noch möglich wäre */}
          <div className="rounded-3xl border border-white/6 bg-white/2 p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.15em] text-white/25">Mit eigenem Konto auch möglich</p>
            <div className="grid gap-3 sm:grid-cols-3 text-center text-xs text-white/35">
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
    <main className="min-h-screen bg-[#070b14] px-5 py-14 text-white">
      <div className="mx-auto max-w-2xl space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/35 mb-4">
            {user ? "Neuer Eintrag" : "Traumanalyse · Kostenlos · Keine Anmeldung"}
          </p>
          <h1 className="text-3xl font-semibold">
            {user ? "Traum erfassen" : "Deinen Traum analysieren"}
          </h1>
          {!user && (
            <p className="mt-2 text-sm text-white/40 leading-6">
              Gib deinen Traum ein – die KI analysiert ihn sofort.
            </p>
          )}
        </div>

        <form onSubmit={user ? handleSubmit : (e) => { e.preventDefault(); handleGuestAnalysis() }} className="space-y-8">

          {/* Traumtext */}
          <div>
            <label className="block mb-3 text-sm font-medium text-white/70">
              Was hast du geträumt?
            </label>
            <textarea value={rawInputText} onChange={(e) => setRawInputText(e.target.value)}
              placeholder="Stichworte reichen – z.B. «Brücke, alte Chefin, konnte nicht weglaufen»"
              rows={6} required
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/20 focus:border-cyan-300/30 focus:outline-none transition resize-none" />

            {/* Expanded preview – erscheint direkt unter Textarea */}
            {expandedPreview && (
              <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-5">
                <p className="text-xs uppercase tracking-[0.15em] text-cyan-300/60 mb-3">KI-Vorschlag</p>
                <p className="text-sm leading-7 text-white/75 mb-4">{expandedPreview}</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setRawInputText(expandedPreview); setExpandedPreview(null) }}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14]">Übernehmen</button>
                  <button type="button" onClick={() => setExpandedPreview(null)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55">Verwerfen</button>
                </div>
              </div>
            )}
          </div>

          {/* Emotionen */}
          <div>
            <p className="mb-3 text-sm font-medium text-white/70">Wie hast du dich gefühlt? <span className="font-normal text-white/30">(optional)</span></p>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((em) => (
                <button key={em} type="button" onClick={() => toggleEmotion(em)}
                  className={`rounded-full border px-4 py-2 text-sm transition-all ${
                    selectedEmotions.includes(em)
                      ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100 scale-[1.04]"
                      : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
                  }`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Stimmung */}
          <div>
            <p className="mb-4 text-sm font-medium text-white/70">Stimmung des Traums <span className="font-normal text-white/30">(optional)</span></p>
            <div className="flex justify-between mb-2">
              {TONE_OPTIONS.map((o, i) => (
                <span key={o.value} onClick={() => setDreamTone(i)}
                  className={`text-xs cursor-pointer select-none transition ${dreamTone === i ? "text-cyan-200 font-medium" : "text-white/30 hover:text-white/60"}`}
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
            <p className="mb-4 text-sm font-medium text-white/70">Klarheit <span className="font-normal text-white/30">(optional)</span></p>
            <div className="flex justify-between mb-2">
              {CLARITY_OPTIONS.map((label, i) => (
                <span key={label} onClick={() => setDreamClarity(i)}
                  className={`text-xs cursor-pointer select-none transition ${dreamClarity === i ? "text-cyan-200 font-medium" : "text-white/30 hover:text-white/60"}`}
                  style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>
                  {label}
                </span>
              ))}
            </div>
            <input type="range" min={0} max={2} step={1} value={dreamClarity}
              onChange={(e) => setDreamClarity(Number(e.target.value))} className="w-full accent-cyan-300 cursor-pointer" />
          </div>

          {/* Datum (nur für eingeloggte User) */}
          {user && (
            <div>
              <label className="mb-3 block text-sm font-medium text-white/70">Wann war dieser Traum?</label>
              <input type="datetime-local" value={dreamedAt} onChange={(e) => setDreamedAt(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-cyan-300/30 focus:outline-none transition" />
            </div>
          )}

          {/* Personen/Orte Flag (nur eingeloggte User) */}
          {user && (
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={familiarPersonFlag} onChange={(e) => setFamiliarPersonFlag(e.target.checked)}
                  className="h-4 w-4 rounded accent-cyan-300" />
                <span className="text-sm text-white/60">Bekannte Person</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={familiarPlaceFlag} onChange={(e) => setFamiliarPlaceFlag(e.target.checked)}
                  className="h-4 w-4 rounded accent-cyan-300" />
                <span className="text-sm text-white/60">Bekannter Ort</span>
              </label>
            </div>
          )}

          {/* Submit – zwei Buttons nebeneinander */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              {/* Auto-Text – nur wenn Text vorhanden */}
              <button type="button"
                onClick={expandText}
                disabled={expanding || analyzingGuest || !rawInputText.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/8 px-4 py-4 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-35">
                {expanding
                  ? <><span className="animate-spin">✦</span> Generiere…</>
                  : <>✨ Auto-Text</>
                }
              </button>

              {/* Speichern / Analysieren */}
              <button type="submit"
                disabled={isSubmitting || analyzingGuest || !rawInputText.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                {isSubmitting || analyzingGuest
                  ? <><span className="animate-spin inline-block">✦</span> {user ? "Speichert…" : "Analysiere…"}</>
                  : user ? "Speichern →" : "🧠 Analysieren →"
                }
              </button>
            </div>

            {/* Für Gäste: Hinweis */}
            {!user && !authLoading && (
              <p className="text-center text-xs text-white/20">
                Schon neugierig auf die volle App?{" "}
                <Link href="/demo" className="text-white/38 hover:text-white/60 underline underline-offset-2 transition">Demo</Link>
                {" "}·{" "}
                <Link href="/login" className="text-white/38 hover:text-white/60 underline underline-offset-2 transition">Anmelden</Link>
              </p>
            )}
          </div>

        </form>
      </div>
    </main>
  )
}