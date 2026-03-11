"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

type Dream = {
  id: number
  raw_input_text: string
  dominant_emotion: string | null
  dream_clarity: string | null
  familiar_person_flag: boolean
  familiar_place_flag: boolean
  nightmare_flag: boolean
  created_at: string
}

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

export default function DreamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [dream, setDream] = useState<Dream | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const [resolvedId, setResolvedId] = useState<string>("")

  const [rawInputText, setRawInputText] = useState("")
  const [dominantEmotion, setDominantEmotion] = useState("")
  const [dreamClarity, setDreamClarity] = useState("")
  const [familiarPersonFlag, setFamiliarPersonFlag] = useState(false)
  const [familiarPlaceFlag, setFamiliarPlaceFlag] = useState(false)
  const [nightmareFlag, setNightmareFlag] = useState(false)

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params
      setResolvedId(resolved.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!resolvedId) return
    fetchDream()
  }, [resolvedId])

  async function fetchDream() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setMessage("Konfigurationsfehler.")
      setLoading(false)
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from("dream_entries")
      .select("*")
      .eq("id", resolvedId)
      .single()

    if (error || !data) {
      setMessage("Traum konnte nicht geladen werden.")
      setLoading(false)
      return
    }

    setDream(data)
    setRawInputText(data.raw_input_text || "")
    setDominantEmotion(data.dominant_emotion || "")
    setDreamClarity(data.dream_clarity || "")
    setFamiliarPersonFlag(data.familiar_person_flag || false)
    setFamiliarPlaceFlag(data.familiar_place_flag || false)
    setNightmareFlag(data.nightmare_flag || false)
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setMessage("Konfigurationsfehler.")
      setSaving(false)
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase
      .from("dream_entries")
      .update({
        raw_input_text: rawInputText,
        dominant_emotion: dominantEmotion || null,
        dream_clarity: dreamClarity || null,
        familiar_person_flag: familiarPersonFlag,
        familiar_place_flag: familiarPlaceFlag,
        nightmare_flag: nightmareFlag,
      })
      .eq("id", resolvedId)

    if (error) {
      setMessage("Änderungen konnten nicht gespeichert werden.")
    } else {
      setMessage("Änderungen gespeichert.")
      setIsEditing(false)
      fetchDream()
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-white/60">Traum wird geladen...</p>
        </div>
      </main>
    )
  }

  if (!dream) {
    return (
      <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-white/60">Traum nicht gefunden.</p>
          <Link
            href="/dreams"
            className="mt-6 inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            ← Zurück zum Traumarchiv
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dreams"
            className="inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            ← Zurück zum Traumarchiv
          </Link>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
            >
              Traum bearbeiten
            </button>
          )}
        </div>

        <p className="text-sm text-white/40">
          {new Date(dream.created_at).toLocaleDateString("de-CH", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <h1 className="mt-4 text-4xl font-semibold">
          {isEditing ? "Traum bearbeiten" : "Traumdetails"}
        </h1>

        {!isEditing ? (
          <div className="mt-10 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
                Traumtext
              </p>
              <p className="mt-4 whitespace-pre-line leading-8 text-white/80">
                {dream.raw_input_text}
              </p>
            </div>

            {dream.dominant_emotion && (
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
                  Dominante Emotion
                </p>
                <p className="mt-2 text-white/80">{dream.dominant_emotion}</p>
              </div>
            )}

            {dream.dream_clarity && (
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
                  Klarheit
                </p>
                <p className="mt-2 text-white/80">{dream.dream_clarity}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                <p className="text-xs text-white/40">Bekannte Person</p>
                <p className="mt-2 text-white/80">
                  {dream.familiar_person_flag ? "Ja" : "Nein"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                <p className="text-xs text-white/40">Bekannter Ort</p>
                <p className="mt-2 text-white/80">
                  {dream.familiar_place_flag ? "Ja" : "Nein"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
                <p className="text-xs text-white/40">Albtraum</p>
                <p className="mt-2 text-white/80">
                  {dream.nightmare_flag ? "Ja" : "Nein"}
                </p>
              </div>
            </div>

            {message && (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                {message}
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="mt-10 space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
          >
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">
                Traumtext oder Stichworte
              </label>
              <textarea
                value={rawInputText}
                onChange={(e) => setRawInputText(e.target.value)}
                rows={8}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/35 focus:border-cyan-300/40 focus:outline-none"
              />
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
                    onClick={() => setDominantEmotion(emotion)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      dominantEmotion === emotion
                        ? "border border-cyan-300/30 bg-cyan-300/20 text-cyan-100"
                        : "border border-white/10 bg-white/5 text-white/70"
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
                    onClick={() => setDreamClarity(clarity)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      dreamClarity === clarity
                        ? "border border-cyan-300/30 bg-cyan-300/20 text-cyan-100"
                        : "border border-white/10 bg-white/5 text-white/70"
                    }`}
                  >
                    {clarity}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <input
                  type="checkbox"
                  checked={familiarPersonFlag}
                  onChange={(e) => setFamiliarPersonFlag(e.target.checked)}
                />
                <span className="text-sm text-white/80">Bekannte Person</span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <input
                  type="checkbox"
                  checked={familiarPlaceFlag}
                  onChange={(e) => setFamiliarPlaceFlag(e.target.checked)}
                />
                <span className="text-sm text-white/80">Bekannter Ort</span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3">
                <input
                  type="checkbox"
                  checked={nightmareFlag}
                  onChange={(e) => setNightmareFlag(e.target.checked)}
                />
                <span className="text-sm text-white/80">Albtraum</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-white px-6 py-3 font-medium text-[#070b14] transition hover:scale-[1.02] disabled:opacity-60"
              >
                {saving ? "Speichert..." : "Änderungen speichern"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setMessage("")
                  setRawInputText(dream.raw_input_text || "")
                  setDominantEmotion(dream.dominant_emotion || "")
                  setDreamClarity(dream.dream_clarity || "")
                  setFamiliarPersonFlag(dream.familiar_person_flag || false)
                  setFamiliarPlaceFlag(dream.familiar_place_flag || false)
                  setNightmareFlag(dream.nightmare_flag || false)
                }}
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Abbrechen
              </button>
            </div>

            {message && (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                {message}
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  )
}