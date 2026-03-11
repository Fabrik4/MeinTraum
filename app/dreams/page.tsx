"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Entity = {
  user_entity_id: number
  user_entities: {
    entity_type: string
    entity_label: string
  }
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
  dream_entry_entities: Entity[]
}

function formatMonthYear(dateString: string) {
  return new Date(dateString).toLocaleDateString("de-CH", {
    month: "long",
    year: "numeric",
  })
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
  })
}

function truncateText(text: string, maxLength = 120) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "…"
}

function getToneTag(dream: Dream) {
  const tone = dream.dream_tone
  if (tone === "nightmare" || dream.nightmare_flag) {
    return { label: "Albtraum", style: "border-red-300/20 bg-red-300/10 text-red-100" }
  }
  if (tone === "pleasant") {
    return { label: "Schöner Traum", style: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" }
  }
  return null
}

export default function DreamsPage() {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDreams()
  }, [])

  async function fetchDreams() {
    const { data, error } = await supabase
      .from("dream_entries")
      .select(`
        *,
        dream_entry_entities (
          user_entity_id,
          user_entities (
            entity_type,
            entity_label
          )
        )
      `)
      .order("created_at", { ascending: false })

    if (!error && data) setDreams(data as Dream[])
    setLoading(false)
  }

  const groupedDreams = dreams.reduce((acc, dream) => {
    const key = formatMonthYear(dream.created_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(dream)
    return acc
  }, {} as Record<string, Dream[]>)

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
              Traumarchiv
            </p>
            <h1 className="mt-4 text-4xl font-semibold">
              Deine Traum-Timeline
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Deine Träume im zeitlichen Verlauf – ein Archiv deiner inneren Welt.
            </p>
          </div>
          <Link
            href="/entry"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99]"
          >
            + Neuer Traum
          </Link>
        </div>

        {loading && (
          <p className="text-white/50">Träume werden geladen…</p>
        )}

        {!loading && dreams.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/50 backdrop-blur">
            Noch keine Träume gespeichert.
          </div>
        )}

        {!loading && Object.entries(groupedDreams).map(([month, monthDreams]) => (
          <section key={month} className="mb-14">
            <h2 className="mb-8 text-base font-medium uppercase tracking-[0.15em] text-white/40">
              {month}
            </h2>

            <div className="relative space-y-6">
              <div className="absolute bottom-0 left-[17px] top-0 w-px bg-white/8" />

              {monthDreams.map((dream) => {
                const tone = getToneTag(dream)
                const emotions = dream.dominant_emotion
                  ? dream.dominant_emotion.split(", ").filter(Boolean)
                  : []

                const persons = dream.dream_entry_entities
                  ?.filter((e) => e.user_entities?.entity_type === "person")
                  .map((e) => e.user_entities.entity_label) ?? []

                const places = dream.dream_entry_entities
                  ?.filter((e) => e.user_entities?.entity_type === "place")
                  .map((e) => e.user_entities.entity_label) ?? []

                return (
                  <div key={dream.id} className="relative flex gap-5">
                    {/* Timeline-Punkt */}
                    <div className="relative z-10 mt-4 h-9 w-9 shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
                      <div className="absolute inset-[10px] rounded-full bg-cyan-200" />
                    </div>

                    {/* Karte */}
                    <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-white/20">

                      {/* Datum + Stimmung + Klarheit */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <p className="text-sm text-white/40">
                          {formatDate(dream.created_at)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tone && (
                            <span className={`rounded-full border px-3 py-1 text-xs ${tone.style}`}>
                              {tone.label}
                            </span>
                          )}
                          {dream.dream_clarity && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                              {dream.dream_clarity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Traumtext */}
                      <p className="leading-7 text-white/80 mb-4">
                        {truncateText(dream.raw_input_text)}
                      </p>

                      {/* Tags: Emotionen, Personen, Orte */}
                      {(emotions.length > 0 || persons.length > 0 || places.length > 0 || dream.familiar_person_flag || dream.familiar_place_flag) && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {emotions.map((emotion) => (
                            <span key={emotion} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                              {emotion}
                            </span>
                          ))}
                          {persons.map((person) => (
                            <span key={person} className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs text-violet-100">
                              👤 {person}
                            </span>
                          ))}
                          {places.map((place) => (
                            <span key={place} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                              📍 {place}
                            </span>
                          ))}
                          {persons.length === 0 && dream.familiar_person_flag && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                              Bekannte Person
                            </span>
                          )}
                          {places.length === 0 && dream.familiar_place_flag && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
                              Bekannter Ort
                            </span>
                          )}
                        </div>
                      )}

                      {/* Aktions-Buttons */}
                      <div className="flex gap-3">
                        <Link
                          href={`/dreams/${dream.id}`}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          Ansehen
                        </Link>
                        <Link
                          href={`/dreams/${dream.id}?edit=true`}
                          className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/20"
                        >
                          Bearbeiten
                        </Link>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

      </div>
    </main>
  )
}