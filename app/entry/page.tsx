"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

const emotions = [
  "Angst", "Freude", "Trauer", "Verwirrung",
  "Neugier", "Ruhe", "Wut", "Ekel",
]

const clarityOptions = ["Verschwommen", "Mittel", "Sehr klar"]
const dreamToneOptions = ["Albtraum", "Neutral", "Schöner Traum"]

export default function DreamEntryPage() {
  const [rawInputText, setRawInputText] = useState("")
  const [dominantEmotions, setDominantEmotions] = useState<string[]>([])
  const [dreamClarity, setDreamClarity] = useState(1) // 0=Verschwommen, 1=Mittel, 2=Sehr klar
  const [dreamTone, setDreamTone] = useState(1)       // 0=Albtraum, 1=Neutral, 2=Schöner Traum
  const [familiarPersonFlag, setFamiliarPersonFlag] = useState(false)
  const [familiarPlaceFlag, setFamiliarPlaceFlag] = useState(false)
  const [dreamedAt, setDreamedAt] = useState(() => {
    const now = new Date()
    const tzOffset = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16)
  })

  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleEmotion = (emotion: string) => {
    setDominantEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    )
  }

  const resetForm = () => {
    setRawInputText("")
    setDominantEmotions([])
    setDreamClarity(1)
    setDreamTone(1)
    setFamiliarPersonFlag(false)
    setFamiliarPlaceFlag(false)
    const now = new Date()
    const tzOffset = now.getTimezoneOffset() * 60000
    setDreamedAt(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage("Bitte logge dich zuerst ein.")
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from("dream_entries").insert([
      {
        user_id: user.id,
        raw_input_text: rawInputText,
        dominant_emotion: dominantEmotions.length > 0 ? dominantEmotions.join(", ") : null,
        dream_clarity: clarityOptions[dreamClarity],
        nightmare_flag: dreamTone === 0,
        familiar_person_flag: familiarPersonFlag,
        familiar_place_flag: familiarPlaceFlag,
        dreamed_at: dreamedAt ? new Date(dreamedAt).toISOString() : new Date().toISOString(),
      },
    ])

    if (error) {
      setMessage("Der Traum konnte nicht gespeichert werden.")
      setIsSubmitting(false)
      return
    }

    setMessage("Traum gespeichert. ✓")
    resetForm()
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
          Neuer Traum
        </p>
        <h1 className="mt-4 text-4xl font-semibold">
          Was ist dir geblieben?
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/50">
          Halte deinen Traum schnell fest – Stichworte genügen.
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
              placeholder="z.B. Haus, Hund, alter Freund, Angst ..."
              required
              rows={6}
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none transition"
            />
          </div>

          {/* Datum & Uhrzeit – kompakt */}
          <div>
            <label className="mb-3 block text-sm font-medium text-white/80">
              Wann war dieser Traum?
            </label>
            <input
              type="datetime-local"
              value={dreamedAt}
              onChange={(e) => setDreamedAt(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-cyan-300/40 focus:outline-none transition"
            />
          </div>

          {/* Emotionen – Multi-Select */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-sm font-medium text-white/80">Emotionen</p>
              <span className="text-xs text-white/35">Mehrere möglich</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {emotions.map((emotion) => {
                const active = dominantEmotions.includes(emotion)
                return (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    className={`rounded-full border px-4 py-2 text-sm transition hover:scale-[1.04] active:scale-[0.97] ${
                      active
                        ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100 shadow-[0_0_12px_rgba(103,232,249,0.15)]"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {emotion}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Klarheit – Segment-Regler */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/80">Klarheit</p>
              <span className="text-sm text-cyan-300/70">{clarityOptions[dreamClarity]}</span>
            </div>
            <div className="flex rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              {clarityOptions.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDreamClarity(i)}
                  className={`flex-1 py-3 text-sm transition hover:bg-white/8 active:scale-[0.98] ${
                    dreamClarity === i
                      ? "bg-cyan-300/15 text-cyan-100 font-medium"
                      : "text-white/45 hover:text-white/70"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Traumton – Segment-Regler mit Farben */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/80">Stimmung</p>
              <span className={`text-sm transition ${
                dreamTone === 0 ? "text-red-300/80" :
                dreamTone === 2 ? "text-emerald-300/80" :
                "text-white/45"
              }`}>
                {dreamToneOptions[dreamTone]}
              </span>
            </div>
            <div className="flex rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              {dreamToneOptions.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDreamTone(i)}
                  className={`flex-1 py-3 text-sm transition hover:bg-white/8 active:scale-[0.98] ${
                    dreamTone === i
                      ? i === 0
                        ? "bg-red-400/15 text-red-200 font-medium"
                        : i === 2
                        ? "bg-emerald-400/15 text-emerald-200 font-medium"
                        : "bg-white/10 text-white font-medium"
                      : "text-white/45 hover:text-white/70"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Bekannte Person / Ort */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition hover:bg-white/8 ${
              familiarPersonFlag ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5"
            }`}>
              <input
                type="checkbox"
                checked={familiarPersonFlag}
                onChange={(e) => setFamiliarPersonFlag(e.target.checked)}
                className="accent-cyan-300"
              />
              <span className="text-sm text-white/80">Bekannte Person</span>
            </label>

            <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition hover:bg-white/8 ${
              familiarPlaceFlag ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5"
            }`}>
              <input
                type="checkbox"
                checked={familiarPlaceFlag}
                onChange={(e) => setFamiliarPlaceFlag(e.target.checked)}
                className="accent-cyan-300"
              />
              <span className="text-sm text-white/80">Bekannter Ort</span>
            </label>
          </div>

          {/* Speichern */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {isSubmitting ? "Speichert..." : "Traum speichern"}
          </button>

          {message && (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
              {message}
            </div>
          )}

        </form>
      </div>
    </main>
  )
}