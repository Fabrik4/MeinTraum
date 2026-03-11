"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

const emotions = [
  "Angst",
  "Freude",
  "Trauer",
  "Verwirrung",
  "Neugier",
  "Ruhe",
  "Wut",
  "Ekel",
]

const clarityOptions = ["Sehr klar", "Mittel", "Verschwommen"]

export default function DreamEntryPage() {
  const [rawInputText, setRawInputText] = useState("")
  const [dominantEmotion, setDominantEmotion] = useState("")
  const [dreamClarity, setDreamClarity] = useState("")
  const [familiarPersonFlag, setFamiliarPersonFlag] = useState(false)
  const [familiarPlaceFlag, setFamiliarPlaceFlag] = useState(false)
  const [nightmareFlag, setNightmareFlag] = useState(false)
  const [dreamedAt, setDreamedAt] = useState(() => {
    const now = new Date()
    const tzOffset = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16)
  })

  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setRawInputText("")
    setDominantEmotion("")
    setDreamClarity("")
    setFamiliarPersonFlag(false)
    setFamiliarPlaceFlag(false)
    setNightmareFlag(false)

    const now = new Date()
    const tzOffset = now.getTimezoneOffset() * 60000
    setDreamedAt(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage("Bitte logge dich zuerst ein, bevor du einen Traum speicherst.")
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.from("dream_entries").insert([
      {
        user_id: user.id,
        raw_input_text: rawInputText,
        dominant_emotion: dominantEmotion || null,
        dream_clarity: dreamClarity || null,
        familiar_person_flag: familiarPersonFlag,
        familiar_place_flag: familiarPlaceFlag,
        nightmare_flag: nightmareFlag,
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

        <p className="mt-4 leading-8 text-white/70">
          Halte deinen Traum schnell fest. Du kannst später weitere Details
          ergänzen und bearbeiten.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          <div>
            <label className="mb-3 block text-sm font-medium text-white/80">
              Traumtext oder Stichworte
            </label>
            <textarea
              value={rawInputText}
              onChange={(e) => setRawInputText(e.target.value)}
              placeholder="z.B. Haus, Hund, Stieftante Margrit, Angst ..."
              required
              rows={6}
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/35 focus:border-cyan-300/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-white/80">
              Wann war dieser Traum?
            </label>
            <input
              type="datetime-local"
              value={dreamedAt}
              onChange={(e) => setDreamedAt(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-cyan-300/40 focus:outline-none"
            />
            <p className="mt-2 text-sm text-white/45">
              Falls du einen Traum nachträglich erfasst, kannst du hier Datum und Uhrzeit anpassen.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-white/80">
              Dominante Emotion
            </p>
            <div className="flex flex-wrap gap-3">
              {emotions.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => setDominantEmotion(emotion === dominantEmotion ? "" : emotion)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    dominantEmotion === emotion
                      ? "border-cyan-300/30 bg-cyan-300/20 text-cyan-100"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-white/80">
              Klarheit des Traums
            </p>
            <div className="flex flex-wrap gap-3">
              {clarityOptions.map((clarity) => (
                <button
                  key={clarity}
                  type="button"
                  onClick={() => setDreamClarity(clarity === dreamClarity ? "" : clarity)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    dreamClarity === clarity
                      ? "border-cyan-300/30 bg-cyan-300/20 text-cyan-100"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {clarity}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/8 transition">
              <input
                type="checkbox"
                checked={familiarPersonFlag}
                onChange={(e) => setFamiliarPersonFlag(e.target.checked)}
              />
              <span className="text-sm text-white/80">Bekannte Person</span>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/8 transition">
              <input
                type="checkbox"
                checked={familiarPlaceFlag}
                onChange={(e) => setFamiliarPlaceFlag(e.target.checked)}
              />
              <span className="text-sm text-white/80">Bekannter Ort</span>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/8 transition">
              <input
                type="checkbox"
                checked={nightmareFlag}
                onChange={(e) => setNightmareFlag(e.target.checked)}
              />
              <span className="text-sm text-white/80">Albtraum</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] disabled:opacity-60"
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
