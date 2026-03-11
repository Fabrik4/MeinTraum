"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

async function getOrCreateUserEntity(
  userId: string,
  type: string,
  category: string,
  label: string
) {
  const { data: existing } = await supabase
    .from("user_entities")
    .select("*")
    .eq("user_id", userId)
    .eq("entity_category", category)
    .eq("entity_label", label)
    .maybeSingle()

  if (existing) return existing.id

  const { data } = await supabase
    .from("user_entities")
    .insert({
      user_id: userId,
      entity_type: type,
      entity_category: category,
      entity_label: label,
      is_confirmed: true,
    })
    .select()
    .single()

  return data.id
}

async function linkEntityToDream(dreamId: number, entityId: number) {
  await supabase.from("dream_entry_entities").insert({
    dream_entry_id: dreamId,
    user_entity_id: entityId,
    source: "manual",
    confidence: 1,
  })
}

const PERSON_PRESETS = [
  { category: "mother", label: "Mutter" },
  { category: "father", label: "Vater" },
  { category: "partner", label: "Partner" },
  { category: "child", label: "Kind" },
  { category: "friend", label: "Freund" },
  { category: "boss", label: "Chef" },
]

const emotions = [
  "Angst", "Freude", "Trauer", "Verwirrung",
  "Neugier", "Ruhe", "Wut", "Ekel",
]

const clarityOptions = ["Verschwommen", "Mittel", "Sehr klar"]

const dreamToneOptions = [
  { value: "nightmare", label: "Albtraum" },
  { value: "neutral", label: "Neutral" },
  { value: "pleasant", label: "Schöner Traum" },
]

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

function clarityToIndex(value: string | null): number {
  if (value === "Sehr klar") return 2
  if (value === "Verschwommen") return 0
  return 1
}

function toneToIndex(nightmareFlag: boolean): number {
  return nightmareFlag ? 0 : 1
}

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
  const [resolvedId, setResolvedId] = useState("")

  const [rawInputText, setRawInputText] = useState("")
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [dreamClarity, setDreamClarity] = useState(1)
  const [dreamTone, setDreamTone] = useState(1)
  const [familiarPersonFlag, setFamiliarPersonFlag] = useState(false)
  const [familiarPlaceFlag, setFamiliarPlaceFlag] = useState(false)
  const [people, setPeople] = useState<{ category: string; label: string }[]>([])

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
    setSelectedEmotions(
      data.dominant_emotion ? data.dominant_emotion.split(", ").filter(Boolean) : []
    )
    setDreamClarity(clarityToIndex(data.dream_clarity))
    setDreamTone(toneToIndex(data.nightmare_flag))
    setFamiliarPersonFlag(data.familiar_person_flag || false)
    setFamiliarPlaceFlag(data.familiar_place_flag || false)
    setLoading(false)
  }

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const { error } = await supabase
      .from("dream_entries")
      .update({
        raw_input_text: rawInputText,
        dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
        dream_clarity: clarityOptions[dreamClarity],
        familiar_person_flag: familiarPersonFlag,
        familiar_place_flag: familiarPlaceFlag,
        nightmare_flag: dreamTone === 0,
      })
      .eq("id", resolvedId)

    if (error) {
      setMessage("Änderungen konnten nicht gespeichert werden.")
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      for (const person of people) {
        const entityId = await getOrCreateUserEntity(
          user.id, "person", person.category, person.label
        )
        await linkEntityToDream(Number(resolvedId), entityId)
      }
    }

    setMessage("Änderungen gespeichert. ✓")
    setIsEditing(false)
    fetchDream()
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-white/50">Traum wird geladen…</p>
        </div>
      </main>
    )
  }

  if (!dream) {
    return (
      <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-white/50">Traum nicht gefunden.</p>
        </div>
      </main>
    )
  }

  const displayEmotions = dream.dominant_emotion
    ? dream.dominant_emotion.split(", ").filter(Boolean)
    : []

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/dreams"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ← Zurück
          </Link>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99]"
            >
              Bearbeiten
            </button>
          )}
        </div>

        {/* Ansicht (nicht editieren) */}
        {!isEditing && (
          <div className="space-y-8">
            <div>
              <p className="text-sm text-white/40 mb-4">
                {new Date(dream.created_at).toLocaleDateString("de-CH", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
              <p className="leading-8 text-white/85 whitespace-pre-wrap">
                {dream.raw_input_text}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {displayEmotions.map((emotion) => (
                <span
                  key={emotion}
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100"
                >
                  {emotion}
                </span>
              ))}

              {dream.nightmare_flag && (
                <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-sm text-red-100">
                  Albtraum
                </span>
              )}

              {dream.familiar_person_flag && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">
                  Bekannte Person
                </span>
              )}

              {dream.familiar_place_flag && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">
                  Bekannter Ort
                </span>
              )}

              {dream.dream_clarity && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">
                  Klarheit: {dream.dream_clarity}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bearbeiten-Formular */}
        {isEditing && (
          <form onSubmit={handleSave} className="space-y-10">

            {/* Traumtext */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">
                Traumtext
              </label>
              <textarea
                value={rawInputText}
                onChange={(e) => setRawInputText(e.target.value)}
                rows={6}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none transition resize-none"
              />
            </div>

            {/* Emotionen */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">
                Emotionen{" "}
                <span className="font-normal text-white/35">(mehrere möglich)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion) => {
                  const active = selectedEmotions.includes(emotion)
                  return (
                    <button
                      key={emotion}
                      type="button"
                      onClick={() => toggleEmotion(emotion)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150
                        ${active
                          ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100 scale-[1.04]"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"
                        }`}
                    >
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
                {dreamToneOptions.map((option, i) => (
                  <span
                    key={option.value}
                    onClick={() => setDreamTone(i)}
                    className={`text-xs cursor-pointer transition-all duration-150 select-none
                      ${dreamTone === i ? "text-cyan-200 font-medium" : "text-white/35 hover:text-white/60"}`}
                    style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}
                  >
                    {option.label}
                  </span>
                ))}
              </div>
              <input
                type="range" min={0} max={2} step={1}
                value={dreamTone}
                onChange={(e) => setDreamTone(Number(e.target.value))}
                className="w-full accent-cyan-300 cursor-pointer"
              />
            </div>

            {/* Klarheits-Regler */}
            <div>
              <p className="mb-4 text-sm font-medium text-white/80">Klarheit des Traums</p>
              <div className="flex justify-between mb-2">
                {clarityOptions.map((label, i) => (
                  <span
                    key={label}
                    onClick={() => setDreamClarity(i)}
                    className={`text-xs cursor-pointer transition-all duration-150 select-none
                      ${dreamClarity === i ? "text-cyan-200 font-medium" : "text-white/35 hover:text-white/60"}`}
                    style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <input
                type="range" min={0} max={2} step={1}
                value={dreamClarity}
                onChange={(e) => setDreamClarity(Number(e.target.value))}
                className="w-full accent-cyan-300 cursor-pointer"
              />
            </div>

            {/* Bekannte Person / Ort */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/10 transition group">
                <input
                  type="checkbox"
                  checked={familiarPersonFlag}
                  onChange={(e) => setFamiliarPersonFlag(e.target.checked)}
                  className="accent-cyan-300"
                />
                <span className="text-sm text-white/70 group-hover:text-white transition">
                  Bekannte Person
                </span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/10 transition group">
                <input
                  type="checkbox"
                  checked={familiarPlaceFlag}
                  onChange={(e) => setFamiliarPlaceFlag(e.target.checked)}
                  className="accent-cyan-300"
                />
                <span className="text-sm text-white/70 group-hover:text-white transition">
                  Bekannter Ort
                </span>
              </label>
            </div>

            {/* Personen */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">Personen im Traum</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {PERSON_PRESETS.map((p) => (
                  <button
                    key={p.category}
                    type="button"
                    onClick={() => {
                      if (!people.find((x) => x.category === p.category)) {
                        setPeople([...people, { category: p.category, label: p.label }])
                      }
                    }}
                    className={`rounded-full border px-4 py-2 text-sm transition-all duration-150
                      ${people.find((x) => x.category === p.category)
                        ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {people.map((p, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    value={p.label}
                    onChange={(e) => {
                      const copy = [...people]
                      copy[i].label = e.target.value
                      setPeople(copy)
                    }}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white text-sm focus:border-cyan-300/40 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setPeople(people.filter((_, j) => j !== i))}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/10 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {saving ? "Speichert..." : "Änderungen speichern"}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); fetchDream() }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
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

        {message && !isEditing && (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        )}

      </div>
    </main>
  )
}