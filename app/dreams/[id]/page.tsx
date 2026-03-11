"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

// ── Typen ────────────────────────────────────────────────────
type LinkedEntity = {
  id: number              // dream_entry_entities.id
  user_entity_id: number
  entity_type: string
  entity_label: string
}

type Dream = {
  id: number
  raw_input_text: string
  dominant_emotion: string | null
  dream_clarity: string | null
  dream_tone: string | null
  familiar_person_flag: boolean
  familiar_place_flag: boolean
  nightmare_flag: boolean
  created_at: string
}

// ── Konstanten ───────────────────────────────────────────────
const PERSON_PRESETS = [
  { category: "family",  label: "Mutter" },
  { category: "family",  label: "Vater" },
  { category: "partner", label: "Partner/in" },
  { category: "family",  label: "Geschwister" },
  { category: "social",  label: "Freund/in" },
  { category: "work",    label: "Chef/in" },
  { category: "work",    label: "Kollege/in" },
  { category: "family",  label: "Kind" },
]

const PLACE_PRESETS = [
  { category: "home",    label: "Zuhause" },
  { category: "home",    label: "Elternhaus" },
  { category: "work",    label: "Büro" },
  { category: "work",    label: "Schule" },
  { category: "nature",  label: "Wald" },
  { category: "nature",  label: "Meer" },
  { category: "city",    label: "Strasse" },
  { category: "fantasy", label: "Unbekannter Ort" },
]

const EMOTIONS = ["Angst", "Freude", "Trauer", "Verwirrung", "Neugier", "Ruhe", "Wut", "Ekel"]
const CLARITY_OPTIONS = ["Verschwommen", "Mittel", "Sehr klar"]
const TONE_OPTIONS = [
  { value: "nightmare", label: "Albtraum" },
  { value: "neutral",   label: "Neutral" },
  { value: "pleasant",  label: "Schöner Traum" },
]

function clarityToIndex(v: string | null) {
  if (v === "Sehr klar") return 2
  if (v === "Verschwommen") return 0
  return 1
}
function toneToIndex(tone: string | null, nightmareFlag: boolean) {
  if (tone === "nightmare" || (!tone && nightmareFlag)) return 0
  if (tone === "pleasant") return 2
  return 1
}

// ── Hilfsfunktionen Supabase ─────────────────────────────────
async function getOrCreateUserEntity(userId: string, type: string, category: string, label: string) {
  const { data: existing } = await supabase
    .from("user_entities")
    .select("id")
    .eq("user_id", userId)
    .eq("entity_type", type)
    .eq("entity_label", label)
    .maybeSingle()

  if (existing) return existing.id

  const { data } = await supabase
    .from("user_entities")
    .insert({ user_id: userId, entity_type: type, entity_category: category, entity_label: label, is_confirmed: true })
    .select("id")
    .single()

  return data?.id
}

async function linkEntityToDream(dreamId: number, entityId: number) {
  // Erst prüfen ob Verknüpfung schon existiert
  const { data: existing } = await supabase
    .from("dream_entry_entities")
    .select("id")
    .eq("dream_entry_id", dreamId)
    .eq("user_entity_id", entityId)
    .maybeSingle()

  if (existing) return // bereits verknüpft, kein Duplikat

  await supabase.from("dream_entry_entities").insert({
    dream_entry_id: dreamId,
    user_entity_id: entityId,
    source: "manual",
    confidence: 1,
  })
}

// ── Komponente ───────────────────────────────────────────────
export default function DreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()

  const [dream, setDream] = useState<Dream | null>(null)
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [resolvedId, setResolvedId] = useState("")

  // Edit-State
  const [rawInputText, setRawInputText] = useState("")
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [dreamClarity, setDreamClarity] = useState(1)
  const [dreamTone, setDreamTone] = useState(1)
  // Neue Entities (noch nicht gespeichert)
  const [newPeople, setNewPeople] = useState<{ category: string; label: string }[]>([])
  const [newPlaces, setNewPlaces] = useState<{ category: string; label: string }[]>([])
  const [customPersonInput, setCustomPersonInput] = useState("")
  const [customPlaceInput, setCustomPlaceInput] = useState("")

  useEffect(() => {
    params.then((r) => setResolvedId(r.id))
  }, [params])

  useEffect(() => {
    if (!resolvedId) return
    fetchAll()
    if (searchParams.get("edit") === "true") setIsEditing(true)
  }, [resolvedId])

  async function fetchAll() {
    const [dreamRes, entitiesRes] = await Promise.all([
      supabase.from("dream_entries").select("*").eq("id", resolvedId).single(),
      supabase
        .from("dream_entry_entities")
        .select("id, user_entity_id, user_entities(entity_type, entity_label)")
        .eq("dream_entry_id", resolvedId),
    ])

    if (dreamRes.error || !dreamRes.data) {
      setMessage("Traum konnte nicht geladen werden.")
      setLoading(false)
      return
    }

    const d = dreamRes.data
    setDream(d)
    setRawInputText(d.raw_input_text || "")
    setSelectedEmotions(d.dominant_emotion ? d.dominant_emotion.split(", ").filter(Boolean) : [])
    setDreamClarity(clarityToIndex(d.dream_clarity))
    setDreamTone(toneToIndex(d.dream_tone, d.nightmare_flag))

    if (!entitiesRes.error && entitiesRes.data) {
      const mapped: LinkedEntity[] = entitiesRes.data.map((e: any) => ({
        id: e.id,
        user_entity_id: e.user_entity_id,
        entity_type: e.user_entities?.entity_type ?? "",
        entity_label: e.user_entities?.entity_label ?? "",
      }))
      setLinkedEntities(mapped)
    }

    setLoading(false)
  }

  const toggleEmotion = (e: string) =>
    setSelectedEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  const toggleNewEntity = (
    list: { category: string; label: string }[],
    setList: (v: { category: string; label: string }[]) => void,
    item: { category: string; label: string }
  ) => {
    const exists = list.find((x) => x.label === item.label)
    setList(exists ? list.filter((x) => x.label !== item.label) : [...list, item])
  }

  async function removeLinkedEntity(linkId: number) {
    await supabase.from("dream_entry_entities").delete().eq("id", linkId)
    setLinkedEntities((prev) => prev.filter((e) => e.id !== linkId))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const selectedTone = TONE_OPTIONS[dreamTone].value

    const { error } = await supabase
      .from("dream_entries")
      .update({
        raw_input_text: rawInputText,
        dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
        dream_clarity: CLARITY_OPTIONS[dreamClarity],
        dream_tone: selectedTone,
        nightmare_flag: selectedTone === "nightmare",
        familiar_person_flag: linkedEntities.some((e) => e.entity_type === "person") || newPeople.length > 0,
        familiar_place_flag: linkedEntities.some((e) => e.entity_type === "place") || newPlaces.length > 0,
      })
      .eq("id", resolvedId)

    if (error) {
      setMessage("Änderungen konnten nicht gespeichert werden.")
      setSaving(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      for (const p of newPeople) {
        const entityId = await getOrCreateUserEntity(user.id, "person", p.category, p.label)
        if (entityId) await linkEntityToDream(Number(resolvedId), entityId)
      }
      for (const p of newPlaces) {
        const entityId = await getOrCreateUserEntity(user.id, "place", p.category, p.label)
        if (entityId) await linkEntityToDream(Number(resolvedId), entityId)
      }
    }

    setNewPeople([])
    setNewPlaces([])
    setCustomPersonInput("")
    setCustomPlaceInput("")
    setMessage("Änderungen gespeichert. ✓")
    setIsEditing(false)
    fetchAll()
    setSaving(false)
  }

  // ── Render ────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl"><p className="text-white/50">Traum wird geladen…</p></div>
    </main>
  )

  if (!dream) return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl"><p className="text-white/50">Traum nicht gefunden.</p></div>
    </main>
  )

  const displayEmotions = dream.dominant_emotion?.split(", ").filter(Boolean) ?? []
  const toneLabel = TONE_OPTIONS.find((t) => t.value === (dream.dream_tone || (dream.nightmare_flag ? "nightmare" : "neutral")))
  const linkedPersons = linkedEntities.filter((e) => e.entity_type === "person")
  const linkedPlaces = linkedEntities.filter((e) => e.entity_type === "place")

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <Link href="/dreams" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
            ← Zurück
          </Link>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99]">
              Bearbeiten
            </button>
          )}
        </div>

        {/* ── Ansicht ── */}
        {!isEditing && (
          <div className="space-y-6">
            <p className="text-sm text-white/40">
              {new Date(dream.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            <p className="leading-8 text-white/85 whitespace-pre-wrap text-lg">
              {dream.raw_input_text}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {toneLabel && toneLabel.value !== "neutral" && (
                <span className={`rounded-full border px-3 py-1 text-sm ${toneLabel.value === "nightmare" ? "border-red-300/20 bg-red-300/10 text-red-100" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"}`}>
                  {toneLabel.label}
                </span>
              )}
              {displayEmotions.map((emotion) => (
                <span key={emotion} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                  💭 {emotion}
                </span>
              ))}
              {dream.dream_clarity && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">
                  ✨ {dream.dream_clarity}
                </span>
              )}
              {linkedPersons.map((e) => (
                <span key={e.id} className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-sm text-violet-100">
                  👤 {e.entity_label}
                </span>
              ))}
              {linkedPlaces.map((e) => (
                <span key={e.id} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-sm text-amber-100">
                  📍 {e.entity_label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Bearbeiten ── */}
        {isEditing && (
          <form onSubmit={handleSave} className="space-y-10">

            {/* Traumtext */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">Traumtext</label>
              <textarea value={rawInputText} onChange={(e) => setRawInputText(e.target.value)} rows={6}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white focus:border-cyan-300/40 focus:outline-none transition resize-none" />
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
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${active ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100 scale-[1.04]" : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"}`}>
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

            {/* ── Personen ── */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">Personen im Traum</p>

              {/* Bereits verknüpfte Personen */}
              {linkedPersons.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {linkedPersons.map((e) => (
                    <span key={e.id} className="flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-violet-300/10 pl-3 pr-2 py-1.5 text-sm text-violet-100">
                      👤 {e.entity_label}
                      <button type="button" onClick={() => removeLinkedEntity(e.id)}
                        className="ml-1 rounded-full hover:text-white text-violet-300/60 transition text-xs leading-none">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Presets für neue */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PERSON_PRESETS.map((p) => {
                  const alreadyLinked = linkedPersons.some((e) => e.entity_label === p.label)
                  const inNew = newPeople.some((x) => x.label === p.label)
                  if (alreadyLinked) return null
                  return (
                    <button key={p.label} type="button"
                      onClick={() => toggleNewEntity(newPeople, setNewPeople, p)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${inNew ? "border-violet-300/40 bg-violet-300/20 text-violet-100 scale-[1.04]" : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"}`}>
                      {p.label}
                    </button>
                  )
                })}
              </div>

              {/* Freitext */}
              <div className="flex gap-2">
                <input value={customPersonInput} onChange={(e) => setCustomPersonInput(e.target.value)}
                  placeholder="Eigene Person hinzufügen…"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none transition" />
                <button type="button"
                  onClick={() => {
                    if (!customPersonInput.trim()) return
                    setNewPeople([...newPeople, { category: "other", label: customPersonInput.trim() }])
                    setCustomPersonInput("")
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition">
                  + Hinzufügen
                </button>
              </div>

              {/* Neu hinzugefügte (noch nicht gespeichert) */}
              {newPeople.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {newPeople.map((p, i) => (
                    <span key={i} className="flex items-center gap-1.5 rounded-full border border-violet-300/20 bg-violet-300/5 pl-3 pr-2 py-1 text-xs text-violet-200/70">
                      👤 {p.label}
                      <button type="button" onClick={() => setNewPeople(newPeople.filter((_, j) => j !== i))}
                        className="hover:text-white text-violet-300/40 transition">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Orte ── */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">Orte im Traum</p>

              {linkedPlaces.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {linkedPlaces.map((e) => (
                    <span key={e.id} className="flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 pl-3 pr-2 py-1.5 text-sm text-amber-100">
                      📍 {e.entity_label}
                      <button type="button" onClick={() => removeLinkedEntity(e.id)}
                        className="ml-1 rounded-full hover:text-white text-amber-300/60 transition text-xs leading-none">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {PLACE_PRESETS.map((p) => {
                  const alreadyLinked = linkedPlaces.some((e) => e.entity_label === p.label)
                  const inNew = newPlaces.some((x) => x.label === p.label)
                  if (alreadyLinked) return null
                  return (
                    <button key={p.label} type="button"
                      onClick={() => toggleNewEntity(newPlaces, setNewPlaces, p)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${inNew ? "border-amber-300/40 bg-amber-300/20 text-amber-100 scale-[1.04]" : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"}`}>
                      {p.label}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <input value={customPlaceInput} onChange={(e) => setCustomPlaceInput(e.target.value)}
                  placeholder="Eigenen Ort hinzufügen…"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none transition" />
                <button type="button"
                  onClick={() => {
                    if (!customPlaceInput.trim()) return
                    setNewPlaces([...newPlaces, { category: "other", label: customPlaceInput.trim() }])
                    setCustomPlaceInput("")
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition">
                  + Hinzufügen
                </button>
              </div>

              {newPlaces.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {newPlaces.map((p, i) => (
                    <span key={i} className="flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/5 pl-3 pr-2 py-1 text-xs text-amber-200/70">
                      📍 {p.label}
                      <button type="button" onClick={() => setNewPlaces(newPlaces.filter((_, j) => j !== i))}
                        className="hover:text-white text-amber-300/40 transition">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
                {saving ? "Speichert..." : "Änderungen speichern"}
              </button>
              <button type="button" onClick={() => { setIsEditing(false); fetchAll() }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
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