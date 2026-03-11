"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { MoonStar, BookOpen, Skull, Sparkles } from "lucide-react"

type Dream = {
  id: number
  raw_input_text: string
  dominant_emotion: string | null
  nightmare_flag: boolean
  created_at: string
}

export default function DashboardPage() {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDreams()
  }, [])

  async function fetchDreams() {
    const { data, error } = await supabase
      .from("dream_entries")
      .select("id, raw_input_text, dominant_emotion, nightmare_flag, created_at")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setDreams(data)
    }

    setLoading(false)
  }

  const totalDreams = dreams.length
  const nightmareCount = dreams.filter((dream) => dream.nightmare_flag).length
  const lastDream = dreams[0] || null
  const lastEmotion = lastDream?.dominant_emotion || "–"

  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
            Dashboard
          </p>
          <h1 className="mt-4 text-4xl font-semibold">
            Willkommen in deinem Traumarchiv
          </h1>
          <p className="mt-4 max-w-2xl leading-8 text-white/70">
            Hier beginnt die Karte deiner inneren Welt. Erfasse neue Träume,
            durchsuche dein Archiv und entdecke mit der Zeit wiederkehrende Muster.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                  <MoonStar className="h-5 w-5 text-cyan-200" />
                </div>
                <p className="text-sm text-white/45">Gespeicherte Träume</p>
                <p className="mt-3 text-3xl font-semibold">{loading ? "…" : totalDreams}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-red-300/20 bg-red-300/10">
                  <Skull className="h-5 w-5 text-red-200" />
                </div>
                <p className="text-sm text-white/45">Albträume</p>
                <p className="mt-3 text-3xl font-semibold">{loading ? "…" : nightmareCount}</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Sparkles className="h-5 w-5 text-white/80" />
                </div>
                <p className="text-sm text-white/45">Letzte Emotion</p>
                <p className="mt-3 text-2xl font-semibold">{loading ? "…" : lastEmotion}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
                Schnellzugriff
              </p>

              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/entry"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
                >
                  Neuen Traum erfassen
                </Link>

                <Link
                  href="/dreams"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Traumarchiv öffnen
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <BookOpen className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <p className="text-sm text-white/45">Letzter Eintrag</p>
                <p className="font-medium text-white">Zuletzt gespeichert</p>
              </div>
            </div>

            {loading && (
              <p className="text-white/60">Lade Eintrag...</p>
            )}

            {!loading && !lastDream && (
              <p className="leading-8 text-white/60">
                Noch kein Traum vorhanden. Erfasse deinen ersten Eintrag und beginne dein Archiv.
              </p>
            )}

            {!loading && lastDream && (
              <>
                <p className="text-sm text-white/40">
                  {new Date(lastDream.created_at).toLocaleDateString("de-CH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                <p className="mt-4 leading-8 text-white/85">
                  {lastDream.raw_input_text.length > 180
                    ? lastDream.raw_input_text.slice(0, 180).trim() + "…"
                    : lastDream.raw_input_text}
                </p>

                {lastDream.dominant_emotion && (
                  <p className="mt-4 text-sm text-cyan-300/80">
                    Emotion: {lastDream.dominant_emotion}
                  </p>
                )}

                <Link
                  href={`/dreams/${lastDream.id}`}
                  className="mt-6 inline-flex rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Eintrag ansehen
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}