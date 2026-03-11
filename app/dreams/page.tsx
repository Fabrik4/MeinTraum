"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

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

function truncateText(text: string, maxLength = 140) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "…"
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
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setDreams(data)
    }

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
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
              Traumarchiv
            </p>
            <h1 className="mt-4 text-4xl font-semibold">
              Deine Traum-Timeline
            </h1>
            <p className="mt-4 max-w-2xl leading-8 text-white/70">
              Hier siehst du deine gespeicherten Träume im zeitlichen Verlauf.
              Mit der Zeit entsteht daraus ein persönliches Archiv deiner inneren Welt.
            </p>
          </div>

          <Link
            href="/entry"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
          >
            Neuer Traum
          </Link>
        </div>

        {loading && (
          <p className="text-white/60">Träume werden geladen...</p>
        )}

        {!loading && dreams.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/65 backdrop-blur">
            Noch keine Träume gespeichert.
          </div>
        )}

        {!loading &&
          Object.entries(groupedDreams).map(([month, monthDreams]) => (
            <section key={month} className="mb-14">
              <h2 className="mb-8 text-xl font-semibold text-white/90">
                {month}
              </h2>

              <div className="relative space-y-8">
                <div className="absolute bottom-0 left-[17px] top-0 w-px bg-white/10" />

                {monthDreams.map((dream) => (
                  <div key={dream.id} className="relative flex gap-5">
                    <div className="relative z-10 mt-2 h-9 w-9 shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
                      <div className="absolute inset-[10px] rounded-full bg-cyan-200" />
                    </div>

                    <Link
                      href={`/dreams/${dream.id}`}
                      className="block flex-1 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-white/40">
                          {formatDate(dream.created_at)}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {dream.dominant_emotion && (
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                              {dream.dominant_emotion}
                            </span>
                          )}

                          {dream.nightmare_flag && (
                            <span className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-xs text-red-100">
                              Albtraum
                            </span>
                          )}

                          {dream.familiar_person_flag && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                              Bekannte Person
                            </span>
                          )}

                          {dream.familiar_place_flag && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                              Bekannter Ort
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-4 leading-8 text-white/85">
                        {truncateText(dream.raw_input_text)}
                      </p>

                      {dream.dream_clarity && (
                        <p className="mt-4 text-sm text-white/45">
                          Klarheit: {dream.dream_clarity}
                        </p>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>
    </main>
  )
}