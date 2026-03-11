"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"
import AuthBanner from "@/app/AuthBanner"

const EMOTIONS = ["Angst", "Freude", "Trauer", "Verwirrung", "Neugier", "Ruhe", "Wut", "Ekel"]
const CLARITY_OPTIONS = ["Verschwommen", "Mittel", "Sehr klar"]
const TONE_OPTIONS = [
  { value: "nightmare", label: "Albtraum" },
  { value: "neutral",   label: "Neutral" },
  { value: "pleasant",  label: "Schöner Traum" },
]

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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedDreamId, setSavedDreamId] = useState<number | null>(null) // nach Speichern

  const toggleEmotion = (e: string) =>
    setSelectedEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    setSavedDreamId(data.id)
  }

  // ── Post-Save Screen ──────────────────────────────────────
  if (savedDreamId) {
    return (
      <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
        <div className="mx-auto max-w-2xl">

          {/* Erfolg */}
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-3xl">
              🌙
            </div>
            <h1 className="text-3xl font-semibold">Traum gespeichert.</h1>
            <p className="mt-3 text-white/50">
              Möchtest du weitere Details ergänzen oder Personen und Orte nachtragen?
            </p>
          </div>

          {/* Optionen */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => router.push(`/dreams/${savedDreamId}?edit=true`)}
              className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:bg-white/10 hover:border-white/20"
            >
              <span className="text-2xl">✏️</span>
              <span className="font-medium text-white">Details ergänzen</span>
              <span className="text-sm text-white/50">
                Personen, Orte, KI-Analyse und mehr nachtragen.
              </span>
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-6 text-left transition hover:bg-white/10 hover:border-white/20"
            >
              <span className="text-2xl">✓</span>
              <span className="font-medium text-white">Fertig</span>
              <span className="text-sm text-white/50">
                Zurück zum Dashboard. Details können später ergänzt werden.
              </span>
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-white/25">
            Du kannst den Traum jederzeit im Archiv bearbeiten.
          </p>

        </div>
      </main>
    )
  }

  // ── Erfassungs-Formular ───────────────────────────────────
  return (
    <>
      {!authLoading && !user && <AuthBanner />}

      <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">Neuer Traum</p>
          <h1 className="mt-4 text-4xl font-semibold">Was ist dir geblieben?</h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            Halte deinen Traum schnell fest – Stichworte reichen.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-10">

            {/* Traumtext */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">
                Traumtext oder Stichworte
              </label>
              <textarea
                value={rawInputText}
                onChange={(e) => setRawInputText(e.target.value)}
                placeholder="z.B. Haus, Hund, Angst, seltsamer Raum …"
                required rows={5}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none transition resize-none"
              />
            </div>

            {/* Datum */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">
                Wann war dieser Traum?
              </label>
              <input type="datetime-local" value={dreamedAt}
                onChange={(e) => setDreamedAt(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-cyan-300/40 focus:outline-none transition" />
            </div>

            {/* Emotionen */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">
                Emotionen <span className="font-normal text-white/35">(mehrere möglich)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((emotion) => {
                  const active = selectedEmotions.includes(emotion)
                  return (
                    <button key={emotion} type="button" onClick={() => toggleEmotion(emotion)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${
                        active
                          ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100 scale-[1.04]"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"
                      }`}>
                      {emotion}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Stimmungs-Regler */}
            <div>
              <p className="mb-4 text-sm font-medium text-white/80">Stimmung des Traums</p>
              <div className="flex justify-between mb-2">
                {TONE_OPTIONS.map((o, i) => (
                  <span key={o.value} onClick={() => setDreamTone(i)}
                    className={`text-xs cursor-pointer transition-all select-none ${dreamTone === i ? "text-cyan-200 font-medium" : "text-white/35 hover:text-white/60"}`}
                    style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>
                    {o.label}
                  </span>
                ))}
              </div>
              <input type="range" min={0} max={2} step={1} value={dreamTone}
                onChange={(e) => setDreamTone(Number(e.target.value))}
                className="w-full accent-cyan-300 cursor-pointer" />
            </div>

            {/* Klarheits-Regler */}
            <div>
              <p className="mb-4 text-sm font-medium text-white/80">Klarheit des Traums</p>
              <div className="flex justify-between mb-2">
                {CLARITY_OPTIONS.map((label, i) => (
                  <span key={label} onClick={() => setDreamClarity(i)}
                    className={`text-xs cursor-pointer transition-all select-none ${dreamClarity === i ? "text-cyan-200 font-medium" : "text-white/35 hover:text-white/60"}`}
                    style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>
                    {label}
                  </span>
                ))}
              </div>
              <input type="range" min={0} max={2} step={1} value={dreamClarity}
                onChange={(e) => setDreamClarity(Number(e.target.value))}
                className="w-full accent-cyan-300 cursor-pointer" />
            </div>

            {/* Flags */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/10 transition group">
                <input type="checkbox" checked={familiarPersonFlag}
                  onChange={(e) => setFamiliarPersonFlag(e.target.checked)} className="accent-cyan-300" />
                <span className="text-sm text-white/70 group-hover:text-white transition">Bekannte Person</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/10 transition group">
                <input type="checkbox" checked={familiarPlaceFlag}
                  onChange={(e) => setFamiliarPlaceFlag(e.target.checked)} className="accent-cyan-300" />
                <span className="text-sm text-white/70 group-hover:text-white transition">Bekannter Ort</span>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isSubmitting || !user}
              className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
              {isSubmitting ? "Speichert..." : "Traum speichern"}
            </button>

            {!user && !authLoading && (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Melde dich an um deinen Traum zu speichern.{" "}
                <a href="/login" className="underline underline-offset-2">Jetzt anmelden →</a>
              </div>
            )}

          </form>
        </div>
      </main>
    </>
  )
}