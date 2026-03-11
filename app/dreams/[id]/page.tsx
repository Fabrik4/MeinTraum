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

  const [resolvedId, setResolvedId] = useState("")

  const [rawInputText, setRawInputText] = useState("")
  const [dominantEmotion, setDominantEmotion] = useState("")
  const [dreamClarity, setDreamClarity] = useState("")
  const [familiarPersonFlag, setFamiliarPersonFlag] = useState(false)
  const [familiarPlaceFlag, setFamiliarPlaceFlag] = useState(false)
  const [nightmareFlag, setNightmareFlag] = useState(false)

  const [people, setPeople] = useState<
    { category: string; label: string }[]
  >([])

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
      setSaving(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      for (const person of people) {
        const entityId = await getOrCreateUserEntity(
          user.id,
          "person",
          person.category,
          person.label
        )

        await linkEntityToDream(Number(resolvedId), entityId)
      }
    }

    setMessage("Änderungen gespeichert.")
    setIsEditing(false)
    fetchDream()
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
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">

        <div className="mb-8 flex justify-between">
          <Link
            href="/dreams"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm"
          >
            ← Zurück
          </Link>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-xl bg-white px-4 py-2 text-sm text-black"
            >
              Bearbeiten
            </button>
          )}
        </div>

        {!isEditing && (
          <div className="space-y-6">
            <p>{dream.raw_input_text}</p>
          </div>
        )}

        {isEditing && (
          <form onSubmit={handleSave} className="space-y-8">

            <textarea
              value={rawInputText}
              onChange={(e) => setRawInputText(e.target.value)}
              className="w-full rounded-xl bg-white/10 p-4"
            />

            <div>
              <p className="mb-2 text-sm">Emotion</p>

              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion) => (
                  <button
                    type="button"
                    key={emotion}
                    onClick={() => setDominantEmotion(emotion)}
                    className="rounded-full border border-white/20 px-3 py-1 text-sm"
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm">Personen</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {PERSON_PRESETS.map((p) => (
                  <button
                    key={p.category}
                    type="button"
                    onClick={() =>
                      setPeople([...people, { category: p.category, label: p.label }])
                    }
                    className="rounded-full border border-white/20 px-3 py-1 text-sm"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {people.map((p, i) => (
                <input
                  key={i}
                  value={p.label}
                  onChange={(e) => {
                    const copy = [...people]
                    copy[i].label = e.target.value
                    setPeople(copy)
                  }}
                  className="w-full rounded-xl bg-white/10 px-4 py-2 mb-2"
                />
              ))}
            </div>

            <button
              type="submit"
              className="rounded-xl bg-white px-6 py-3 text-black"
            >
              Speichern
            </button>

          </form>
        )}

      </div>
    </main>
  )
}