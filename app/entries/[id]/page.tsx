"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DreamChat from "@/app/DreamChat"

// ── Typen ─────────────────────────────────────────────────────
type EntryType = "dream" | "journal"

type LinkedEntity = {
  id: number; user_entity_id: number; entity_type: string
  entity_category: string; entity_label: string; display_label: string
}

type DreamEntry = {
  id: number; raw_input_text: string; dominant_emotion: string | null
  dream_clarity: string | null; dream_tone: string | null
  familiar_person_flag: boolean; familiar_place_flag: boolean
  nightmare_flag: boolean; created_at: string; dreamed_at: string | null
}

type JournalEntry = {
  id: number; body_text: string; dominant_emotion: string | null
  mood_score: number | null; mood_label: string | null
  energy_level: number | null; sleep_hours: number | null
  tags: string[]; familiar_person_flag: boolean; familiar_place_flag: boolean
  entry_date: string; created_at: string
}

type SavedAnalysis = {
  id: number; mode: string; summary: string; themes: string[]; created_at: string
}

// ── Konstanten ────────────────────────────────────────────────
const ANALYSIS_MODES = [
  { value: "psychological", label: "Psychologisch",    emoji: "🧠", desc: "Neutral & reflektiert" },
  { value: "poetic",        label: "Poetisch",         emoji: "🌙", desc: "Märchenhaft & bildhaft" },
  { value: "humorous",      label: "Humorvoll",        emoji: "😄", desc: "Mit Augenzwinkern" },
  { value: "scientific",    label: "Wissenschaftlich", emoji: "🔬", desc: "Neurowissenschaftlich" },
]
const PERSON_PRESETS = [
  { category: "family",  label: "Mutter" }, { category: "family",  label: "Vater" },
  { category: "family",  label: "Bruder" }, { category: "family",  label: "Schwester" },
  { category: "family",  label: "Schwägerin" }, { category: "family", label: "Schwager" },
  { category: "partner", label: "Partner/in" }, { category: "social", label: "Freund/in" },
  { category: "work",    label: "Chef/in" }, { category: "work",   label: "Kollege/in" },
  { category: "family",  label: "Kind" },
]
const PLACE_PRESETS = [
  { category: "home",    label: "Zuhause" }, { category: "home",    label: "Elternhaus" },
  { category: "work",    label: "Büro" },    { category: "work",    label: "Schule" },
  { category: "nature",  label: "Wald" },    { category: "nature",  label: "Meer" },
  { category: "city",    label: "Strasse" }, { category: "fantasy", label: "Unbekannter Ort" },
]
const EMOTIONS        = ["Angst", "Freude", "Trauer", "Verwirrung", "Neugier", "Ruhe", "Wut", "Ekel"]
const CLARITY_OPTIONS = ["Verschwommen", "Mittel", "Sehr klar"]
const TONE_OPTIONS    = [
  { value: "nightmare", label: "Albtraum" },
  { value: "neutral",   label: "Neutral" },
  { value: "pleasant",  label: "Schöner Traum" },
]
const ENERGY_LABELS: Record<number, string> = {
  1: "Erschöpft", 2: "Müde", 3: "Normal", 4: "Energiegeladen", 5: "Voller Energie",
}
const PRESET_TAGS = ["Arbeit","Familie","Beziehung","Gesundheit","Sport","Schlaf","Stress","Entspannung","Soziales","Kreativität"]

// Stimmungsfarben: sanfter
function moodColor(score: number) {
  if (score <= 4) return "text-amber-300/80"
  if (score <= 6) return "text-amber-300/80"
  return "text-emerald-300/80"
}
function moodLabel(score: number) {
  const labels: Record<number, string> = {
    1:"Sehr schlecht", 2:"Schlecht", 3:"Mies", 4:"Eher schlecht",
    5:"Neutral", 6:"Okay", 7:"Gut", 8:"Sehr gut", 9:"Grossartig", 10:"Ausgezeichnet"
  }
  return labels[score] ?? ""
}

function clarityToIndex(v: string | null) { return v === "Sehr klar" ? 2 : v === "Verschwommen" ? 0 : 1 }
function toneToIndex(tone: string | null, flag: boolean) {
  return tone === "nightmare" || (!tone && flag) ? 0 : tone === "pleasant" ? 2 : 1
}
function toLocalDT(iso: string | null) {
  const d = iso ? new Date(iso) : new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
function modeLabel2(m: string) { return ANALYSIS_MODES.find((x) => x.value === m)?.label ?? m }
function modeEmoji(m: string)  { return ANALYSIS_MODES.find((x) => x.value === m)?.emoji ?? "✨" }

// ── Supabase Helpers ──────────────────────────────────────────
async function getOrCreateEntity(userId: string, type: string, cat: string, label: string) {
  const { data: ex } = await supabase.from("user_entities").select("id")
    .eq("user_id", userId).eq("entity_type", type).eq("entity_label", label).maybeSingle()
  if (ex) return ex.id
  const { data } = await supabase.from("user_entities")
    .insert({ user_id: userId, entity_type: type, entity_category: cat, entity_label: label, is_confirmed: true })
    .select("id").single()
  return data?.id ?? null
}

async function linkEntity(entryId: number, entityId: number, entryType: EntryType) {
  const table = entryType === "dream" ? "dream_entry_entities" : "journal_entry_entities"
  const idCol = entryType === "dream" ? "dream_entry_id" : "journal_entry_id"
  const { data: ex } = await supabase.from(table).select("id").eq(idCol, entryId).eq("user_entity_id", entityId).maybeSingle()
  if (ex) return
  await supabase.from(table).insert({ [idCol]: entryId, user_entity_id: entityId, source: "manual", confidence: 1 })
}

async function unlinkEntity(linkId: number, entryType: EntryType) {
  const table = entryType === "dream" ? "dream_entry_entities" : "journal_entry_entities"
  await supabase.from(table).delete().eq("id", linkId)
}

// ── Entity Tag ────────────────────────────────────────────────
function EntityTag({ entity, color, onDelete, onRename }: {
  entity: LinkedEntity; color: "violet" | "amber"; onDelete: () => void; onRename: (l: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(entity.display_label)
  const colors = {
    violet: "border-violet-300/25 bg-violet-300/8 text-violet-200",
    amber:  "border-amber-300/25 bg-amber-300/8 text-amber-200",
  }
  function commit() {
    setEditing(false)
    if (val.trim() && val.trim() !== entity.display_label) onRename(val.trim())
    else setVal(entity.display_label)
  }
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border pl-3 pr-1.5 py-1.5 text-sm ${colors[color]}`}>
      <span className="mr-0.5">{color === "violet" ? "👤" : "📍"}</span>
      {editing
        ? <input ref={ref} value={val} onChange={(e) => setVal(e.target.value)} onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setVal(entity.display_label) } }}
            className="w-24 bg-transparent outline-none text-sm" />
        : <button type="button" onClick={() => setEditing(true)} className="hover:underline underline-offset-2 transition">{entity.display_label}</button>
      }
      <span className="mx-1 text-xs opacity-35">({entity.entity_category})</span>
      <button type="button" onClick={onDelete} className="opacity-40 hover:opacity-90 transition text-xs p-0.5">✕</button>
    </span>
  )
}

// ── Analysis Card ─────────────────────────────────────────────
function AnalysisCard({ analysis, mode, onSave, saving, accent }: {
  analysis: any; mode: string; onSave: () => void; saving: boolean; accent: string
}) {
  return (
    <div className={`rounded-3xl border p-8 space-y-6 ${accent === "amber" ? "border-amber-300/15 bg-amber-300/3" : "border-cyan-300/15 bg-cyan-300/3"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{modeEmoji(mode)}</span>
          <div>
            <p className={`text-xs uppercase tracking-[0.15em] ${accent === "amber" ? "text-amber-300/60" : "text-cyan-300/60"}`}>KI-Analyse</p>
            <p className="font-medium text-white">{modeLabel2(mode)}</p>
          </div>
        </div>
        <button onClick={onSave} disabled={saving}
          className={`rounded-xl border px-4 py-2 text-sm transition hover:opacity-80 disabled:opacity-40 ${accent === "amber" ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"}`}>
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>
      <p className="leading-8 text-white/80">{analysis.summary}</p>
      {analysis.themes?.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-white/35">Themen</p>
          <div className="flex flex-wrap gap-2">
            {analysis.themes.map((t: string) => <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/65">{t}</span>)}
          </div>
        </div>
      )}
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.15em] text-white/35">Reflexion</p>
        <p className="leading-8 text-white/70">{analysis.reflection}</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4">
        <p className="text-xs text-white/40 mb-1">Frage für dich</p>
        <p className="text-white/80 leading-7 italic">"{analysis.question}"</p>
      </div>
      <p className="text-xs text-white/25 border-t border-white/5 pt-4">{analysis.caution}</p>
    </div>
  )
}

// ── Haupt-Komponente ──────────────────────────────────────────
export default function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [resolvedId, setResolvedId] = useState("")
  const [entryType, setEntryType] = useState<EntryType>("dream")
  const [dreamEntry, setDreamEntry] = useState<DreamEntry | null>(null)
  const [journalEntry, setJournalEntry] = useState<JournalEntry | null>(null)
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([])
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [selectedMode, setSelectedMode] = useState("psychological")
  const [analyzing, setAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null)
  const [currentAnalysisMode, setCurrentAnalysisMode] = useState("")
  const [savingAnalysis, setSavingAnalysis] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null)

  // Dream edit state
  const [rawText, setRawText] = useState("")
  const [dreamedAt, setDreamedAt] = useState("")
  const [dreamTone, setDreamTone] = useState(1)
  const [dreamClarity, setDreamClarity] = useState(1)

  // Journal edit state
  const [bodyText, setBodyText] = useState("")
  const [entryDate, setEntryDate] = useState("")
  const [moodScore, setMoodScore] = useState(5)
  const [energyLevel, setEnergyLevel] = useState(3)
  const [sleepHours, setSleepHours] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")

  // Shared edit state
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [customPersonInput, setCustomPersonInput] = useState("")
  const [customPlaceInput, setCustomPlaceInput] = useState("")

  useEffect(() => {
    params.then((r) => setResolvedId(r.id))
  }, [params])

  useEffect(() => {
    if (!resolvedId) return
    const type = (searchParams.get("type") ?? "dream") as EntryType
    setEntryType(type)
    fetchAll(type)
    if (searchParams.get("edit") === "true") setIsEditing(true)
    if (searchParams.get("chat") === "true") setShowChat(true)
  }, [resolvedId])

  async function fetchAll(type: EntryType) {
    setLoading(true)
    if (type === "dream") {
      const [dreamRes, entitiesRes, analysisRes] = await Promise.all([
        supabase.from("dream_entries").select("*").eq("id", resolvedId).single(),
        supabase.from("dream_entry_entities")
          .select("id, user_entity_id, user_entities(entity_type, entity_category, entity_label)")
          .eq("dream_entry_id", resolvedId),
        supabase.from("dream_analysis").select("id,mode,summary,themes,created_at")
          .eq("dream_entry_id", resolvedId).order("created_at", { ascending: false }),
      ])
      if (!dreamRes.error && dreamRes.data) {
        const d = dreamRes.data
        setDreamEntry(d)
        setRawText(d.raw_input_text || "")
        setDreamedAt(toLocalDT(d.dreamed_at || d.created_at))
        setSelectedEmotions(d.dominant_emotion?.split(", ").filter(Boolean) ?? [])
        setDreamClarity(clarityToIndex(d.dream_clarity))
        setDreamTone(toneToIndex(d.dream_tone, d.nightmare_flag))
      }
      if (!entitiesRes.error && entitiesRes.data) mapEntities(entitiesRes.data)
      if (!analysisRes.error && analysisRes.data) setSavedAnalyses(analysisRes.data)
    } else {
      const [journalRes, entitiesRes, analysisRes] = await Promise.all([
        supabase.from("journal_entries").select("*").eq("id", resolvedId).single(),
        supabase.from("journal_entry_entities")
          .select("id, user_entity_id, user_entities(entity_type, entity_category, entity_label)")
          .eq("journal_entry_id", resolvedId),
        supabase.from("journal_analysis").select("id,mode,summary,themes,created_at")
          .eq("journal_entry_id", resolvedId).order("created_at", { ascending: false }),
      ])
      if (!journalRes.error && journalRes.data) {
        const j = journalRes.data
        setJournalEntry(j)
        setBodyText(j.body_text || "")
        setEntryDate(j.entry_date || new Date().toISOString().slice(0, 10))
        setMoodScore(j.mood_score ?? 5)
        setEnergyLevel(j.energy_level ?? 3)
        setSleepHours(j.sleep_hours?.toString() ?? "")
        setTags(j.tags || [])
        setSelectedEmotions(j.dominant_emotion?.split(", ").filter(Boolean) ?? [])
      }
      if (!entitiesRes.error && entitiesRes.data) mapEntities(entitiesRes.data)
      if (!analysisRes.error && analysisRes.data) setSavedAnalyses(analysisRes.data)
    }
    setLoading(false)
  }

  function mapEntities(data: any[]) {
    setLinkedEntities(data.map((e) => ({
      id: e.id, user_entity_id: e.user_entity_id,
      entity_type: e.user_entities?.entity_type ?? "",
      entity_category: e.user_entities?.entity_category ?? "",
      entity_label: e.user_entities?.entity_label ?? "",
      display_label: e.user_entities?.entity_label ?? "",
    })))
  }

  const linkedPersons = linkedEntities.filter((e) => e.entity_type === "person")
  const linkedPlaces  = linkedEntities.filter((e) => e.entity_type === "place")

  const toggleEmotion = (em: string) =>
    setSelectedEmotions((prev) => prev.includes(em) ? prev.filter((x) => x !== em) : [...prev, em])

  const toggleTag = (tag: string) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])

  async function removeLinkedEntity(linkId: number) {
    await unlinkEntity(linkId, entryType)
    setLinkedEntities((prev) => prev.filter((e) => e.id !== linkId))
  }
  function renameLinkedEntity(linkId: number, newLabel: string) {
    setLinkedEntities((prev) => prev.map((e) => e.id === linkId ? { ...e, display_label: newLabel } : e))
  }
  async function addPreset(type: string, preset: { category: string; label: string }) {
    if (linkedEntities.some((e) => e.entity_type === type && e.entity_label === preset.label)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const entityId = await getOrCreateEntity(user.id, type, preset.category, preset.label)
    if (!entityId) return
    await linkEntity(Number(resolvedId), entityId, entryType)
    setLinkedEntities((prev) => [...prev, { id: Date.now(), user_entity_id: entityId, entity_type: type, entity_category: preset.category, entity_label: preset.label, display_label: preset.label }])
  }
  async function addCustomEntity(type: string, label: string) {
    if (!label.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const entityId = await getOrCreateEntity(user.id, type, "other", label.trim())
    if (!entityId) return
    await linkEntity(Number(resolvedId), entityId, entryType)
    setLinkedEntities((prev) => [...prev, { id: Date.now(), user_entity_id: entityId, entity_type: type, entity_category: "other", entity_label: label.trim(), display_label: label.trim() }])
  }

  async function expandText() {
    setExpanding(true); setExpandedPreview(null)
    const persons = linkedPersons.map((e) => e.display_label)
    const places  = linkedPlaces.map((e) => e.display_label)
    const endpoint = entryType === "dream" ? "/api/expand-dream" : "/api/expand-journal"
    const body = entryType === "dream"
      ? { rawText, emotion: selectedEmotions.join(", "), persons, places }
      : { rawText: bodyText, moodScore, tags }
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.expanded) setExpandedPreview(data.expanded)
    } catch { setMessage("Fehler bei der Textgenerierung.") }
    setExpanding(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMessage("")
    const { data: { user } } = await supabase.auth.getUser()

    // Umbenannte Entities updaten
    if (user) {
      for (const entity of linkedEntities) {
        if (entity.display_label !== entity.entity_label) {
          await unlinkEntity(entity.id, entryType)
          const newId = await getOrCreateEntity(user.id, entity.entity_type, entity.entity_category, entity.display_label)
          if (newId) await linkEntity(Number(resolvedId), newId, entryType)
        }
      }
    }

    if (entryType === "dream") {
      const tone = TONE_OPTIONS[dreamTone].value
      await supabase.from("dream_entries").update({
        raw_input_text: rawText,
        dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
        dream_clarity: CLARITY_OPTIONS[dreamClarity],
        dream_tone: tone, nightmare_flag: tone === "nightmare",
        dreamed_at: new Date(dreamedAt).toISOString(),
        familiar_person_flag: linkedPersons.length > 0,
        familiar_place_flag: linkedPlaces.length > 0,
      }).eq("id", resolvedId)
    } else {
      await supabase.from("journal_entries").update({
        body_text: bodyText,
        dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
        mood_score: moodScore, mood_label: moodLabel(moodScore),
        energy_level: energyLevel,
        sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
        tags, entry_date: entryDate,
        familiar_person_flag: linkedPersons.length > 0,
        familiar_place_flag: linkedPlaces.length > 0,
      }).eq("id", resolvedId)
    }

    setMessage("Gespeichert. ✓"); setIsEditing(false)
    fetchAll(entryType); setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const table = entryType === "dream" ? "dream_entries" : "journal_entries"
    await supabase.from(table).delete().eq("id", resolvedId)
    router.push("/timeline")
  }

  async function runAnalysis() {
    setAnalyzing(true); setCurrentAnalysis(null)
    const persons = linkedPersons.map((e) => e.display_label)
    const places  = linkedPlaces.map((e) => e.display_label)
    const endpoint = entryType === "dream" ? "/api/analyze-dream" : "/api/analyze-journal"
    const body = entryType === "dream"
      ? { dreamText: dreamEntry?.raw_input_text, emotion: dreamEntry?.dominant_emotion, clarity: dreamEntry?.dream_clarity, tone: dreamEntry?.dream_tone, entities: { persons, places }, mode: selectedMode }
      : { entryText: journalEntry?.body_text, emotion: journalEntry?.dominant_emotion, moodScore: journalEntry?.mood_score, energyLevel: journalEntry?.energy_level, sleepHours: journalEntry?.sleep_hours, tags: journalEntry?.tags, entities: { persons, places }, mode: selectedMode }
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.analysis) { setCurrentAnalysis(data.analysis); setCurrentAnalysisMode(selectedMode) }
      else setMessage("Analyse fehlgeschlagen.")
    } catch { setMessage("Analyse konnte nicht erstellt werden.") }
    setAnalyzing(false)
  }

  async function saveAnalysis() {
    if (!currentAnalysis) return; setSavingAnalysis(true)
    const table = entryType === "dream" ? "dream_analysis" : "journal_analysis"
    const idCol = entryType === "dream" ? "dream_entry_id" : "journal_entry_id"
    await supabase.from(table).insert({
      [idCol]: Number(resolvedId), mode: currentAnalysisMode,
      summary: currentAnalysis.summary, themes: currentAnalysis.themes,
      emotions: currentAnalysis.emotions, caution_note: currentAnalysis.caution,
    })
    setCurrentAnalysis(null); setSavingAnalysis(false); fetchAll(entryType)
  }

  // ── Chat Kontext ──────────────────────────────────────────
  const chatContext = entryType === "dream" ? {
    type: "dream" as const,
    text: dreamEntry?.raw_input_text ?? "",
    emotion: dreamEntry?.dominant_emotion,
    tone: dreamEntry?.dream_tone,
    clarity: dreamEntry?.dream_clarity,
    persons: linkedPersons.map((e) => e.display_label),
    places: linkedPlaces.map((e) => e.display_label),
  } : {
    type: "journal" as const,
    text: journalEntry?.body_text ?? "",
    moodScore: journalEntry?.mood_score,
    tags: journalEntry?.tags,
    persons: linkedPersons.map((e) => e.display_label),
    places: linkedPlaces.map((e) => e.display_label),
  }

  const accent = entryType === "journal" ? "amber" : "cyan"
  const isDream = entryType === "dream"
  const mainText = isDream ? (dreamEntry?.raw_input_text ?? "") : (journalEntry?.body_text ?? "")
  const displayEmotions = (isDream ? dreamEntry?.dominant_emotion : journalEntry?.dominant_emotion)?.split(", ").filter(Boolean) ?? []

  if (loading) return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl"><p className="text-white/50">Wird geladen…</p></div>
    </main>
  )
  if (!dreamEntry && !journalEntry) return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl"><p className="text-white/50">Eintrag nicht gefunden.</p></div>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href="/timeline" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
            ← Zurück
          </Link>
          {!isEditing && (
            <div className="flex gap-2 flex-wrap justify-end">
              <button onClick={() => { setShowChat(!showChat); setShowAnalysisPanel(false) }}
                className={`rounded-xl border px-4 py-2 text-sm transition ${showChat ? "border-violet-300/30 bg-violet-300/10 text-violet-100" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}>
                💬 Gespräch
              </button>
              <button onClick={() => { setShowAnalysisPanel(!showAnalysisPanel); setShowChat(false) }}
                className={`rounded-xl border px-4 py-2 text-sm transition ${showAnalysisPanel
                  ? accent === "amber" ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}`}>
                🧠 Analyse
              </button>
              <button onClick={() => setIsEditing(true)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]">
                Bearbeiten
              </button>
            </div>
          )}
        </div>

        {/* ── Ansicht ── */}
        {!isEditing && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: accent === "amber" ? "rgb(252 211 77 / 0.7)" : "rgb(165 243 252 / 0.7)" }}>
                {isDream ? "🌙 Traum" : "📓 Journal"}
              </span>
              <span className="text-sm text-white/35">
                {isDream
                  ? new Date(dreamEntry?.dreamed_at || dreamEntry?.created_at || "").toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : new Date(journalEntry?.entry_date || "").toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })
                }
              </span>
            </div>

            <p className="leading-8 text-white/85 whitespace-pre-wrap text-lg">{mainText}</p>

            <div className="flex flex-wrap gap-2">
              {/* Dream-spezifische Tags */}
              {isDream && dreamEntry?.dream_tone && dreamEntry.dream_tone !== "neutral" && (
                <span className={`rounded-full border px-3 py-1 text-sm ${dreamEntry.dream_tone === "nightmare" ? "border-red-300/15 bg-red-300/8 text-red-200" : "border-emerald-300/15 bg-emerald-300/8 text-emerald-200"}`}>
                  {dreamEntry.dream_tone === "nightmare" ? "Albtraum" : "Schöner Traum"}
                </span>
              )}
              {isDream && dreamEntry?.dream_clarity && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/55">✨ {dreamEntry.dream_clarity}</span>
              )}

              {/* Journal-spezifische Tags */}
              {!isDream && journalEntry?.mood_score && (
                <span className={`rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium ${moodColor(journalEntry.mood_score)}`}>
                  ☀️ {journalEntry.mood_score}/10 – {moodLabel(journalEntry.mood_score)}
                </span>
              )}
              {!isDream && journalEntry?.energy_level && (
                <span className="rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1 text-sm text-amber-200">
                  ⚡ {ENERGY_LABELS[journalEntry.energy_level]}
                </span>
              )}
              {!isDream && journalEntry?.sleep_hours && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/50">
                  💤 {journalEntry.sleep_hours}h
                </span>
              )}
              {!isDream && journalEntry?.tags?.map((tag) => (
                <span key={tag} className="rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1 text-sm text-amber-200">{tag}</span>
              ))}

              {/* Geteilte Tags */}
              {displayEmotions.map((em) => (
                <span key={em} className={`rounded-full border px-3 py-1 text-sm ${accent === "amber" ? "border-amber-300/15 bg-amber-300/8 text-amber-200" : "border-cyan-300/15 bg-cyan-300/8 text-cyan-200"}`}>
                  💭 {em}
                </span>
              ))}
              {linkedPersons.map((e) => (
                <span key={e.id} className="rounded-full border border-violet-300/15 bg-violet-300/8 px-3 py-1 text-sm text-violet-200">👤 {e.display_label}</span>
              ))}
              {linkedPlaces.map((e) => (
                <span key={e.id} className="rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1 text-sm text-amber-200">📍 {e.display_label}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Chat ── */}
        {!isEditing && showChat && (
          <DreamChat context={chatContext} onClose={() => setShowChat(false)} />
        )}

        {/* ── Analyse Panel ── */}
        {!isEditing && showAnalysisPanel && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className={`text-sm uppercase tracking-[0.2em] mb-6 ${accent === "amber" ? "text-amber-300/70" : "text-cyan-300/70"}`}>
                Analyse-Modus wählen
              </p>
              <div className="grid gap-3 sm:grid-cols-2 mb-8">
                {ANALYSIS_MODES.map((mode) => (
                  <button key={mode.value} type="button" onClick={() => setSelectedMode(mode.value)}
                    className={`rounded-2xl border p-4 text-left transition-all ${selectedMode === mode.value
                      ? accent === "amber" ? "border-amber-300/25 bg-amber-300/8" : "border-cyan-300/25 bg-cyan-300/8"
                      : "border-white/8 bg-white/3 hover:border-white/15"}`}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">{mode.emoji}</span>
                      <span className="font-medium text-white text-sm">{mode.label}</span>
                    </div>
                    <p className="text-xs text-white/40 ml-8">{mode.desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={runAnalysis} disabled={analyzing}
                className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] disabled:opacity-60">
                {analyzing ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">✦</span> Analysiere…</span> : "Analysieren"}
              </button>
            </div>
            {currentAnalysis && <AnalysisCard analysis={currentAnalysis} mode={currentAnalysisMode} onSave={saveAnalysis} saving={savingAnalysis} accent={accent} />}
            {savedAnalyses.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.15em] text-white/35">Gespeicherte Analysen</p>
                {savedAnalyses.map((a) => (
                  <div key={a.id} className="rounded-3xl border border-white/8 bg-white/3 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xl">{modeEmoji(a.mode)}</span>
                      <div>
                        <p className="font-medium text-white text-sm">{modeLabel2(a.mode)}</p>
                        <p className="text-xs text-white/30">{new Date(a.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                    <p className="leading-7 text-white/65 text-sm">{a.summary}</p>
                    {a.themes?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {a.themes.map((t: string) => <span key={t} className="rounded-full border border-white/8 bg-white/3 px-3 py-1 text-xs text-white/55">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Bearbeiten ── */}
        {isEditing && (
          <form onSubmit={handleSave} className="space-y-10">

            {/* Haupttext + Expand */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white/80">
                  {isDream ? "Traumtext" : "Eintrag"}
                </label>
                <button type="button" onClick={expandText} disabled={expanding}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition hover:opacity-80 disabled:opacity-40 ${accent === "amber" ? "border-amber-300/20 bg-amber-300/5 text-amber-200" : "border-cyan-300/20 bg-cyan-300/5 text-cyan-200"}`}>
                  {expanding ? <><span className="animate-spin">✦</span> Generiere…</> : <>✨ Aus Stichworten</>}
                </button>
              </div>
              <textarea value={isDream ? rawText : bodyText}
                onChange={(e) => isDream ? setRawText(e.target.value) : setBodyText(e.target.value)}
                rows={6} className={`w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white focus:outline-none transition resize-none ${accent === "amber" ? "focus:border-amber-300/30" : "focus:border-cyan-300/30"}`} />
              {expandedPreview && (
                <div className={`mt-4 rounded-2xl border p-5 ${accent === "amber" ? "border-amber-300/15 bg-amber-300/5" : "border-cyan-300/15 bg-cyan-300/5"}`}>
                  <p className={`text-xs uppercase tracking-[0.15em] mb-3 ${accent === "amber" ? "text-amber-300/60" : "text-cyan-300/60"}`}>KI-Vorschlag</p>
                  <p className="leading-7 text-white/80 text-sm mb-4">{expandedPreview}</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { isDream ? setRawText(expandedPreview) : setBodyText(expandedPreview); setExpandedPreview(null) }}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]">Übernehmen</button>
                    <button type="button" onClick={() => setExpandedPreview(null)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10">Verwerfen</button>
                  </div>
                </div>
              )}
            </div>

            {/* Datum */}
            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">
                {isDream ? "Wann war dieser Traum?" : "Datum"}
              </label>
              {isDream
                ? <input type="datetime-local" value={dreamedAt} onChange={(e) => setDreamedAt(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-cyan-300/30 focus:outline-none transition" />
                : <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white focus:border-amber-300/30 focus:outline-none transition" />
              }
            </div>

            {/* Emotionen */}
            <div>
              <p className="mb-3 text-sm font-medium text-white/80">Emotionen <span className="font-normal text-white/35">(mehrere möglich)</span></p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((em) => {
                  const active = selectedEmotions.includes(em)
                  return (
                    <button key={em} type="button" onClick={() => toggleEmotion(em)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${active
                        ? accent === "amber" ? "border-amber-300/35 bg-amber-300/15 text-amber-100 scale-[1.04]" : "border-cyan-300/35 bg-cyan-300/15 text-cyan-100 scale-[1.04]"
                        : "border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:bg-white/8 hover:text-white"}`}>
                      {em}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dream-spezifisch */}
            {isDream && (
              <>
                <div>
                  <p className="mb-4 text-sm font-medium text-white/80">Stimmung des Traums</p>
                  <div className="flex justify-between mb-2">
                    {TONE_OPTIONS.map((o, i) => (
                      <span key={o.value} onClick={() => setDreamTone(i)}
                        className={`text-xs cursor-pointer select-none transition ${dreamTone === i ? "text-cyan-200 font-medium" : "text-white/30 hover:text-white/60"}`}
                        style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>{o.label}</span>
                    ))}
                  </div>
                  <input type="range" min={0} max={2} step={1} value={dreamTone} onChange={(e) => setDreamTone(Number(e.target.value))} className="w-full accent-cyan-300 cursor-pointer" />
                </div>
                <div>
                  <p className="mb-4 text-sm font-medium text-white/80">Klarheit des Traums</p>
                  <div className="flex justify-between mb-2">
                    {CLARITY_OPTIONS.map((label, i) => (
                      <span key={label} onClick={() => setDreamClarity(i)}
                        className={`text-xs cursor-pointer select-none transition ${dreamClarity === i ? "text-cyan-200 font-medium" : "text-white/30 hover:text-white/60"}`}
                        style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>{label}</span>
                    ))}
                  </div>
                  <input type="range" min={0} max={2} step={1} value={dreamClarity} onChange={(e) => setDreamClarity(Number(e.target.value))} className="w-full accent-cyan-300 cursor-pointer" />
                </div>
              </>
            )}

            {/* Journal-spezifisch */}
            {!isDream && (
              <>
                {/* Stimmung */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-white/80">Stimmung</p>
                    <span className={`text-sm font-medium ${moodColor(moodScore)}`}>{moodScore} – {moodLabel(moodScore)}</span>
                  </div>
                  <input type="range" min={1} max={10} step={1} value={moodScore}
                    onChange={(e) => setMoodScore(Number(e.target.value))} className="w-full accent-amber-300 cursor-pointer" />
                  <div className="flex justify-between mt-1">
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                      <span key={n} onClick={() => setMoodScore(n)}
                        className={`text-xs cursor-pointer transition ${moodScore === n ? "text-amber-300 font-medium" : "text-white/20"}`}>{n}</span>
                    ))}
                  </div>
                </div>

                {/* Energie */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-white/80">Energie</p>
                    <span className="text-sm text-white/50">{ENERGY_LABELS[energyLevel]}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} type="button" onClick={() => setEnergyLevel(n)}
                        className={`flex-1 rounded-2xl border py-3 text-sm transition-all ${energyLevel >= n ? "border-amber-300/25 bg-amber-300/12 text-amber-200" : "border-white/8 bg-white/3 text-white/25 hover:bg-white/8"}`}>
                        {"⚡".repeat(n)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schlafstunden */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-white/80">Schlafstunden</label>
                  <div className="flex items-center gap-3">
                    <input type="number" min={0} max={24} step={0.5}
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      placeholder="z.B. 7.5"
                      className="w-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-amber-300/30 focus:outline-none transition" />
                    <span className="text-sm text-white/35">Stunden</span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <p className="mb-3 text-sm font-medium text-white/80">Themen</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESET_TAGS.map((tag) => {
                      const active = tags.includes(tag)
                      return (
                        <button key={tag} type="button" onClick={() => toggleTag(tag)}
                          className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${active ? "border-amber-300/35 bg-amber-300/15 text-amber-100 scale-[1.04]" : "border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:bg-white/8 hover:text-white"}`}>
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input value={customTag} onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); toggleTag(customTag); setCustomTag("") } }}
                      placeholder="Eigenes Thema…"
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-300/30 focus:outline-none transition" />
                    <button type="button" onClick={() => { toggleTag(customTag); setCustomTag("") }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55 hover:bg-white/10 hover:text-white transition">
                      + Hinzufügen
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Personen */}
            <div>
              <p className="mb-1 text-sm font-medium text-white/80">Personen</p>
              <p className="mb-4 text-xs text-white/30">Tag anklicken zum Umbenennen (z.B. "Kind" → "Sofia")</p>
              {linkedPersons.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {linkedPersons.map((e) => <EntityTag key={e.id} entity={e} color="violet" onDelete={() => removeLinkedEntity(e.id)} onRename={(l) => renameLinkedEntity(e.id, l)} />)}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {PERSON_PRESETS.map((p) => {
                  if (linkedPersons.some((e) => e.entity_label === p.label)) return null
                  return (
                    <button key={p.label} type="button" onClick={() => addPreset("person", p)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55 hover:border-violet-300/25 hover:bg-violet-300/8 hover:text-violet-200 transition-all">
                      + {p.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input value={customPersonInput} onChange={(e) => setCustomPersonInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomEntity("person", customPersonInput); setCustomPersonInput("") } }}
                  placeholder="z.B. Bruder Max, Kollegin Anna …"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/25 focus:border-violet-300/25 focus:outline-none transition" />
                <button type="button" onClick={() => { addCustomEntity("person", customPersonInput); setCustomPersonInput("") }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55 hover:bg-white/10 hover:text-white transition">+ Hinzufügen</button>
              </div>
            </div>

            {/* Orte */}
            <div>
              <p className="mb-1 text-sm font-medium text-white/80">Orte</p>
              <p className="mb-4 text-xs text-white/30">Tag anklicken zum Umbenennen</p>
              {linkedPlaces.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {linkedPlaces.map((e) => <EntityTag key={e.id} entity={e} color="amber" onDelete={() => removeLinkedEntity(e.id)} onRename={(l) => renameLinkedEntity(e.id, l)} />)}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {PLACE_PRESETS.map((p) => {
                  if (linkedPlaces.some((e) => e.entity_label === p.label)) return null
                  return (
                    <button key={p.label} type="button" onClick={() => addPreset("place", p)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55 hover:border-amber-300/25 hover:bg-amber-300/8 hover:text-amber-200 transition-all">
                      + {p.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input value={customPlaceInput} onChange={(e) => setCustomPlaceInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomEntity("place", customPlaceInput); setCustomPlaceInput("") } }}
                  placeholder="z.B. Grossmutters Küche …"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-300/25 focus:outline-none transition" />
                <button type="button" onClick={() => { addCustomEntity("place", customPlaceInput); setCustomPlaceInput("") }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55 hover:bg-white/10 hover:text-white transition">+ Hinzufügen</button>
              </div>
            </div>

            {/* Speichern */}
            <div className="flex gap-4">
              <button type="submit" disabled={saving}
                className="flex-1 rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
                {saving ? "Speichert..." : "Änderungen speichern"}
              </button>
              <button type="button" onClick={() => { setIsEditing(false); fetchAll(entryType) }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
                Abbrechen
              </button>
            </div>

            {/* Löschen */}
            <div className="border-t border-white/5 pt-8">
              {!showDeleteConfirm
                ? <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-sm text-red-300/40 hover:text-red-300/70 transition">
                    Eintrag löschen
                  </button>
                : (
                  <div className="rounded-2xl border border-red-300/15 bg-red-300/5 p-5">
                    <p className="text-sm text-white/65 mb-4">Diesen Eintrag wirklich löschen? Kann nicht rückgängig gemacht werden.</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={handleDelete} disabled={deleting}
                        className="rounded-xl border border-red-300/25 bg-red-300/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-300/20 disabled:opacity-50">
                        {deleting ? "Wird gelöscht…" : "Ja, löschen"}
                      </button>
                      <button type="button" onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55 transition hover:bg-white/10">Abbrechen</button>
                    </div>
                  </div>
                )
              }
            </div>

            {message && <div className={`rounded-2xl border px-4 py-3 text-sm ${accent === "amber" ? "border-amber-300/20 bg-amber-300/8 text-amber-100" : "border-cyan-300/20 bg-cyan-300/8 text-cyan-100"}`}>{message}</div>}
          </form>
        )}

        {message && !isEditing && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${accent === "amber" ? "border-amber-300/20 bg-amber-300/8 text-amber-100" : "border-cyan-300/20 bg-cyan-300/8 text-cyan-100"}`}>{message}</div>
        )}

      </div>
    </main>
  )
}