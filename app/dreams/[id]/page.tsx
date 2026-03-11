"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

// ── Typen ────────────────────────────────────────────────────
type LinkedEntity = {
  id: number
  user_entity_id: number
  entity_type: string
  entity_category: string
  entity_label: string
  display_label: string
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

type Analysis = {
  summary: string
  themes: string[]
  emotions: string[]
  reflection: string
  question: string
  caution: string
}

type SavedAnalysis = {
  id: number
  mode: string
  summary: string
  themes: string[]
  emotions: string[]
  caution_note: string | null
  created_at: string
}

// ── Konstanten ───────────────────────────────────────────────
const ANALYSIS_MODES = [
  { value: "psychological", label: "Psychologisch",     emoji: "🧠", desc: "Neutral & reflektiert" },
  { value: "poetic",        label: "Poetisch",          emoji: "🌙", desc: "Märchenhaft & bildhaft" },
  { value: "humorous",      label: "Humorvoll",         emoji: "😄", desc: "Mit Augenzwinkern" },
  { value: "scientific",    label: "Wissenschaftlich",  emoji: "🔬", desc: "Neurowissenschaftlich" },
]

const PERSON_PRESETS = [
  { category: "family",  label: "Mutter" },
  { category: "family",  label: "Vater" },
  { category: "family",  label: "Bruder" },
  { category: "family",  label: "Schwester" },
  { category: "family",  label: "Schwägerin" },
  { category: "family",  label: "Schwager" },
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

const EMOTIONS        = ["Angst", "Freude", "Trauer", "Verwirrung", "Neugier", "Ruhe", "Wut", "Ekel"]
const CLARITY_OPTIONS = ["Verschwommen", "Mittel", "Sehr klar"]
const TONE_OPTIONS    = [
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
function modeLabel(mode: string) {
  return ANALYSIS_MODES.find((m) => m.value === mode)?.label ?? mode
}
function modeEmoji(mode: string) {
  return ANALYSIS_MODES.find((m) => m.value === mode)?.emoji ?? "✨"
}

// ── Supabase Helpers ─────────────────────────────────────────
async function getOrCreateUserEntity(userId: string, type: string, category: string, label: string) {
  const { data: existing } = await supabase.from("user_entities").select("id")
    .eq("user_id", userId).eq("entity_type", type).eq("entity_label", label).maybeSingle()
  if (existing) return existing.id
  const { data } = await supabase.from("user_entities")
    .insert({ user_id: userId, entity_type: type, entity_category: category, entity_label: label, is_confirmed: true })
    .select("id").single()
  return data?.id ?? null
}

async function linkEntityToDream(dreamId: number, entityId: number) {
  const { data: existing } = await supabase.from("dream_entry_entities").select("id")
    .eq("dream_entry_id", dreamId).eq("user_entity_id", entityId).maybeSingle()
  if (existing) return
  await supabase.from("dream_entry_entities").insert({
    dream_entry_id: dreamId, user_entity_id: entityId, source: "manual", confidence: 1,
  })
}

// ── Inline-Edit Tag ──────────────────────────────────────────
function EntityTag({ entity, color, onDelete, onRename }: {
  entity: LinkedEntity
  color: "violet" | "amber"
  onDelete: () => void
  onRename: (newLabel: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(entity.display_label)

  const colorMap = {
    violet: "border-violet-300/30 bg-violet-300/10 text-violet-100",
    amber:  "border-amber-300/30 bg-amber-300/10 text-amber-100",
  }

  function commit() {
    setEditing(false)
    if (val.trim() && val.trim() !== entity.display_label) onRename(val.trim())
    else setVal(entity.display_label)
  }

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border pl-3 pr-1.5 py-1.5 text-sm ${colorMap[color]}`}>
      <span className="mr-0.5">{color === "violet" ? "👤" : "📍"}</span>
      {editing ? (
        <input ref={inputRef} value={val} onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setVal(entity.display_label) } }}
          className="w-24 bg-transparent outline-none text-sm" />
      ) : (
        <button type="button" onClick={() => setEditing(true)}
          className="hover:underline underline-offset-2 transition" title="Klicken zum Umbenennen">
          {entity.display_label}
        </button>
      )}
      <span className="mx-1 text-xs opacity-40">({entity.entity_category})</span>
      <button type="button" onClick={onDelete} className="rounded-full p-0.5 opacity-50 hover:opacity-100 transition text-xs">✕</button>
    </span>
  )
}

// ── Analyse-Karte ────────────────────────────────────────────
function AnalysisCard({ analysis, mode, onSave, saving }: {
  analysis: Analysis
  mode: string
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{modeEmoji(mode)}</span>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-300/60">KI-Analyse</p>
            <p className="font-medium text-white">{modeLabel(mode)}</p>
          </div>
        </div>
        <button onClick={onSave} disabled={saving}
          className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-50">
          {saving ? "Wird gespeichert…" : "Analyse speichern"}
        </button>
      </div>

      <p className="leading-8 text-white/80">{analysis.summary}</p>

      {analysis.themes.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-white/40">Themen</p>
          <div className="flex flex-wrap gap-2">
            {analysis.themes.map((t) => (
              <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.15em] text-white/40">Reflexion</p>
        <p className="leading-8 text-white/70">{analysis.reflection}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
        <p className="text-sm text-white/50 mb-1">Frage für dich</p>
        <p className="text-white/85 leading-7 italic">"{analysis.question}"</p>
      </div>

      <p className="text-xs text-white/30 border-t border-white/5 pt-4">{analysis.caution}</p>
    </div>
  )
}

// ── Haupt-Komponente ─────────────────────────────────────────
export default function DreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()

  const [dream, setDream] = useState<Dream | null>(null)
  const [linkedEntities, setLinkedEntities] = useState<LinkedEntity[]>([])
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([])
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
  const [customPersonInput, setCustomPersonInput] = useState("")
  const [customPlaceInput, setCustomPlaceInput] = useState("")

  // Analyse-State
  const [selectedMode, setSelectedMode] = useState("psychological")
  const [analyzing, setAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null)
  const [currentAnalysisMode, setCurrentAnalysisMode] = useState("")
  const [savingAnalysis, setSavingAnalysis] = useState(false)
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false)

  useEffect(() => { params.then((r) => setResolvedId(r.id)) }, [params])

  useEffect(() => {
    if (!resolvedId) return
    fetchAll()
    if (searchParams.get("edit") === "true") setIsEditing(true)
    if (searchParams.get("analyze") === "true") setShowAnalysisPanel(true)
  }, [resolvedId])

  async function fetchAll() {
    const [dreamRes, entitiesRes, analysisRes] = await Promise.all([
      supabase.from("dream_entries").select("*").eq("id", resolvedId).single(),
      supabase.from("dream_entry_entities")
        .select("id, user_entity_id, user_entities(entity_type, entity_category, entity_label)")
        .eq("dream_entry_id", resolvedId),
      supabase.from("dream_analysis")
        .select("id, mode, summary, themes, emotions, caution_note, created_at")
        .eq("dream_entry_id", resolvedId)
        .order("created_at", { ascending: false }),
    ])

    if (!dreamRes.error && dreamRes.data) {
      const d = dreamRes.data
      setDream(d)
      setRawInputText(d.raw_input_text || "")
      setSelectedEmotions(d.dominant_emotion?.split(", ").filter(Boolean) ?? [])
      setDreamClarity(clarityToIndex(d.dream_clarity))
      setDreamTone(toneToIndex(d.dream_tone, d.nightmare_flag))
    }

    if (!entitiesRes.error && entitiesRes.data) {
      setLinkedEntities(entitiesRes.data.map((e: any) => ({
        id: e.id,
        user_entity_id: e.user_entity_id,
        entity_type: e.user_entities?.entity_type ?? "",
        entity_category: e.user_entities?.entity_category ?? "",
        entity_label: e.user_entities?.entity_label ?? "",
        display_label: e.user_entities?.entity_label ?? "",
      })))
    }

    if (!analysisRes.error && analysisRes.data) {
      setSavedAnalyses(analysisRes.data)
    }

    setLoading(false)
  }

  const toggleEmotion = (e: string) =>
    setSelectedEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  async function removeLinkedEntity(linkId: number) {
    await supabase.from("dream_entry_entities").delete().eq("id", linkId)
    setLinkedEntities((prev) => prev.filter((e) => e.id !== linkId))
  }

  function renameLinkedEntity(linkId: number, newLabel: string) {
    setLinkedEntities((prev) => prev.map((e) => e.id === linkId ? { ...e, display_label: newLabel } : e))
  }

  async function addPreset(type: string, preset: { category: string; label: string }) {
    if (linkedEntities.some((e) => e.entity_type === type && e.entity_label === preset.label)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const entityId = await getOrCreateUserEntity(user.id, type, preset.category, preset.label)
    if (!entityId) return
    await linkEntityToDream(Number(resolvedId), entityId)
    setLinkedEntities((prev) => [...prev, {
      id: Date.now(), user_entity_id: entityId, entity_type: type,
      entity_category: preset.category, entity_label: preset.label, display_label: preset.label,
    }])
  }

  async function addCustomEntity(type: string, category: string, label: string) {
    if (!label.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const entityId = await getOrCreateUserEntity(user.id, type, category, label.trim())
    if (!entityId) return
    await linkEntityToDream(Number(resolvedId), entityId)
    setLinkedEntities((prev) => [...prev, {
      id: Date.now(), user_entity_id: entityId, entity_type: type,
      entity_category: category, entity_label: label.trim(), display_label: label.trim(),
    }])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    const selectedTone = TONE_OPTIONS[dreamTone].value
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      for (const entity of linkedEntities) {
        if (entity.display_label !== entity.entity_label) {
          await supabase.from("dream_entry_entities").delete().eq("id", entity.id)
          const newId = await getOrCreateUserEntity(user.id, entity.entity_type, entity.entity_category, entity.display_label)
          if (newId) await linkEntityToDream(Number(resolvedId), newId)
        }
      }
    }

    await supabase.from("dream_entries").update({
      raw_input_text: rawInputText,
      dominant_emotion: selectedEmotions.length > 0 ? selectedEmotions.join(", ") : null,
      dream_clarity: CLARITY_OPTIONS[dreamClarity],
      dream_tone: selectedTone,
      nightmare_flag: selectedTone === "nightmare",
      familiar_person_flag: linkedEntities.some((e) => e.entity_type === "person"),
      familiar_place_flag: linkedEntities.some((e) => e.entity_type === "place"),
    }).eq("id", resolvedId)

    setMessage("Gespeichert. ✓")
    setIsEditing(false)
    fetchAll()
    setSaving(false)
  }

  // ── KI-Analyse ───────────────────────────────────────────
  async function runAnalysis() {
    if (!dream) return
    setAnalyzing(true)
    setCurrentAnalysis(null)

    const persons = linkedEntities.filter((e) => e.entity_type === "person").map((e) => e.display_label)
    const places  = linkedEntities.filter((e) => e.entity_type === "place").map((e) => e.display_label)

    try {
      const res = await fetch("/api/analyze-dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamText: dream.raw_input_text,
          emotion: dream.dominant_emotion,
          clarity: dream.dream_clarity,
          tone: dream.dream_tone,
          entities: { persons, places },
          mode: selectedMode,
        }),
      })

      const data = await res.json()
      if (data.analysis) {
        setCurrentAnalysis(data.analysis)
        setCurrentAnalysisMode(selectedMode)
      } else {
        setMessage("Analyse fehlgeschlagen. Bitte erneut versuchen.")
      }
    } catch {
      setMessage("Analyse konnte nicht erstellt werden.")
    }

    setAnalyzing(false)
  }

  async function saveAnalysis() {
    if (!currentAnalysis) return
    setSavingAnalysis(true)

    await supabase.from("dream_analysis").insert({
      dream_entry_id: Number(resolvedId),
      mode: currentAnalysisMode,
      summary: currentAnalysis.summary,
      themes: currentAnalysis.themes,
      emotions: currentAnalysis.emotions,
      caution_note: currentAnalysis.caution,
      based_on_confirmed_entities_only: false,
    })

    setCurrentAnalysis(null)
    setSavingAnalysis(false)
    fetchAll()
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
  const linkedPlaces  = linkedEntities.filter((e) => e.entity_type === "place")

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dreams" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
            ← Zurück
          </Link>
          {!isEditing && (
            <div className="flex gap-3">
              <button onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                className={`rounded-xl border px-4 py-2 text-sm transition ${showAnalysisPanel ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}>
                🧠 KI-Analyse
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
            <p className="text-sm text-white/40">
              {new Date(dream.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="leading-8 text-white/85 whitespace-pre-wrap text-lg">{dream.raw_input_text}</p>
            <div className="flex flex-wrap gap-2">
              {toneLabel && toneLabel.value !== "neutral" && (
                <span className={`rounded-full border px-3 py-1 text-sm ${toneLabel.value === "nightmare" ? "border-red-300/20 bg-red-300/10 text-red-100" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"}`}>
                  {toneLabel.label}
                </span>
              )}
              {displayEmotions.map((em) => (
                <span key={em} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">💭 {em}</span>
              ))}
              {dream.dream_clarity && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/60">✨ {dream.dream_clarity}</span>
              )}
              {linkedPersons.map((e) => (
                <span key={e.id} className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-sm text-violet-100">👤 {e.display_label}</span>
              ))}
              {linkedPlaces.map((e) => (
                <span key={e.id} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-sm text-amber-100">📍 {e.display_label}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── KI-Analyse Panel ── */}
        {!isEditing && showAnalysisPanel && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80 mb-6">Analyse-Modus wählen</p>

              <div className="grid gap-3 sm:grid-cols-2 mb-8">
                {ANALYSIS_MODES.map((mode) => (
                  <button key={mode.value} type="button" onClick={() => setSelectedMode(mode.value)}
                    className={`rounded-2xl border p-4 text-left transition-all ${selectedMode === mode.value ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"}`}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">{mode.emoji}</span>
                      <span className="font-medium text-white text-sm">{mode.label}</span>
                    </div>
                    <p className="text-xs text-white/45 ml-8">{mode.desc}</p>
                  </button>
                ))}
              </div>

              <button onClick={runAnalysis} disabled={analyzing}
                className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">✦</span> Analysiere…
                  </span>
                ) : "Traum analysieren"}
              </button>
            </div>

            {/* Aktuelle Analyse (noch nicht gespeichert) */}
            {currentAnalysis && (
              <AnalysisCard
                analysis={currentAnalysis}
                mode={currentAnalysisMode}
                onSave={saveAnalysis}
                saving={savingAnalysis}
              />
            )}

            {/* Gespeicherte Analysen */}
            {savedAnalyses.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.15em] text-white/40">Gespeicherte Analysen</p>
                {savedAnalyses.map((a) => (
                  <div key={a.id} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xl">{modeEmoji(a.mode)}</span>
                      <div>
                        <p className="font-medium text-white text-sm">{modeLabel(a.mode)}</p>
                        <p className="text-xs text-white/35">
                          {new Date(a.created_at).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <p className="leading-7 text-white/70 text-sm">{a.summary}</p>
                    {a.themes?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {a.themes.map((t: string) => (
                          <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">{t}</span>
                        ))}
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

            <div>
              <label className="mb-3 block text-sm font-medium text-white/80">Traumtext</label>
              <textarea value={rawInputText} onChange={(e) => setRawInputText(e.target.value)} rows={6}
                className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white focus:border-cyan-300/40 focus:outline-none transition resize-none" />
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-white/80">
                Emotionen <span className="font-normal text-white/35">(mehrere möglich)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((em) => {
                  const active = selectedEmotions.includes(em)
                  return (
                    <button key={em} type="button" onClick={() => toggleEmotion(em)}
                      className={`rounded-full border px-4 py-2 text-sm transition-all duration-150 ${active ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100 scale-[1.04]" : "border-white/10 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white"}`}>
                      {em}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-medium text-white/80">Stimmung des Traums</p>
              <div className="flex justify-between mb-2">
                {TONE_OPTIONS.map((o, i) => (
                  <span key={o.value} onClick={() => setDreamTone(i)}
                    className={`text-xs cursor-pointer select-none transition ${dreamTone === i ? "text-cyan-200 font-medium" : "text-white/35 hover:text-white/60"}`}
                    style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>
                    {o.label}
                  </span>
                ))}
              </div>
              <input type="range" min={0} max={2} step={1} value={dreamTone}
                onChange={(e) => setDreamTone(Number(e.target.value))} className="w-full accent-cyan-300 cursor-pointer" />
            </div>

            <div>
              <p className="mb-4 text-sm font-medium text-white/80">Klarheit des Traums</p>
              <div className="flex justify-between mb-2">
                {CLARITY_OPTIONS.map((label, i) => (
                  <span key={label} onClick={() => setDreamClarity(i)}
                    className={`text-xs cursor-pointer select-none transition ${dreamClarity === i ? "text-cyan-200 font-medium" : "text-white/35 hover:text-white/60"}`}
                    style={{ width: "33.33%", textAlign: i === 0 ? "left" : i === 2 ? "right" : "center" }}>
                    {label}
                  </span>
                ))}
              </div>
              <input type="range" min={0} max={2} step={1} value={dreamClarity}
                onChange={(e) => setDreamClarity(Number(e.target.value))} className="w-full accent-cyan-300 cursor-pointer" />
            </div>

            {/* Personen */}
            <div>
              <p className="mb-1 text-sm font-medium text-white/80">Personen im Traum</p>
              <p className="mb-4 text-xs text-white/35">Tag anklicken zum Umbenennen (z.B. "Kind" → "Sofia")</p>
              {linkedPersons.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {linkedPersons.map((e) => (
                    <EntityTag key={e.id} entity={e} color="violet"
                      onDelete={() => removeLinkedEntity(e.id)}
                      onRename={(newLabel) => renameLinkedEntity(e.id, newLabel)} />
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {PERSON_PRESETS.map((p) => {
                  if (linkedPersons.some((e) => e.entity_label === p.label)) return null
                  return (
                    <button key={p.label} type="button" onClick={() => addPreset("person", p)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:border-violet-300/30 hover:bg-violet-300/10 hover:text-violet-100 transition-all duration-150">
                      + {p.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input value={customPersonInput} onChange={(e) => setCustomPersonInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomEntity("person", "other", customPersonInput); setCustomPersonInput("") } }}
                  placeholder="z.B. Bruder Max, Kollegin Anna …"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none transition" />
                <button type="button"
                  onClick={() => { addCustomEntity("person", "other", customPersonInput); setCustomPersonInput("") }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition">
                  + Hinzufügen
                </button>
              </div>
            </div>

            {/* Orte */}
            <div>
              <p className="mb-1 text-sm font-medium text-white/80">Orte im Traum</p>
              <p className="mb-4 text-xs text-white/35">Tag anklicken zum Umbenennen</p>
              {linkedPlaces.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {linkedPlaces.map((e) => (
                    <EntityTag key={e.id} entity={e} color="amber"
                      onDelete={() => removeLinkedEntity(e.id)}
                      onRename={(newLabel) => renameLinkedEntity(e.id, newLabel)} />
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-3">
                {PLACE_PRESETS.map((p) => {
                  if (linkedPlaces.some((e) => e.entity_label === p.label)) return null
                  return (
                    <button key={p.label} type="button" onClick={() => addPreset("place", p)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100 transition-all duration-150">
                      + {p.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <input value={customPlaceInput} onChange={(e) => setCustomPlaceInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomEntity("place", "other", customPlaceInput); setCustomPlaceInput("") } }}
                  placeholder="z.B. Grossmutters Küche, der alte Bahnhof …"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none transition" />
                <button type="button"
                  onClick={() => { addCustomEntity("place", "other", customPlaceInput); setCustomPlaceInput("") }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition">
                  + Hinzufügen
                </button>
              </div>
            </div>

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
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</div>
            )}
          </form>
        )}

        {message && !isEditing && (
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">{message}</div>
        )}

      </div>
    </main>
  )
}