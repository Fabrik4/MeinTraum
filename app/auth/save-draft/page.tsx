"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

const STORAGE_KEY = "meintraum_guest_dream"

export default function SaveDraftPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<"checking" | "saving" | "done" | "no-draft">("checking")

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace("/login"); return }
    handleDraft()
  }, [user, loading])

  async function handleDraft() {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      setStatus("no-draft")
      router.replace("/dashboard")
      return
    }

    setStatus("saving")
    let draft: Record<string, any>
    try { draft = JSON.parse(raw) } catch {
      localStorage.removeItem(STORAGE_KEY)
      router.replace("/dashboard")
      return
    }

    const { data, error } = await supabase.from("dream_entries").insert([{
      user_id: user!.id,
      raw_input_text: draft.raw_input_text,
      dominant_emotion: draft.dominant_emotion || null,
      dream_clarity: draft.dream_clarity || null,
      dream_tone: draft.dream_tone || "neutral",
      familiar_person_flag: draft.familiar_person_flag ?? false,
      familiar_place_flag: draft.familiar_place_flag ?? false,
      nightmare_flag: draft.nightmare_flag ?? false,
      dreamed_at: draft.dreamed_at || new Date().toISOString(),
    }]).select("id").single()

    localStorage.removeItem(STORAGE_KEY)
    setStatus("done")

    if (!error && data) {
      router.replace(`/entries/${data.id}?type=dream`)
    } else {
      router.replace("/dashboard")
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <p className="text-3xl animate-pulse">🌙</p>
        <p className="text-white/60 text-sm">
          {status === "saving" ? "Dein Traum wird gespeichert…" : "Einen Moment…"}
        </p>
      </div>
    </main>
  )
}