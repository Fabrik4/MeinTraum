"use client"

import { useState, useEffect } from "react"
import FeedbackModal from "./FeedbackModal"
import { useAuth } from "@/lib/useAuth"
import { supabase } from "@/lib/supabase"

// Zeigt nach 3 Tagen einen dezenten Banner auf dem Dashboard
// Wird nur einmal angezeigt (localStorage Flag)
export default function FeedbackButton() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!user) return
    const dismissed = localStorage.getItem("meintraum_feedback_asked")
    if (dismissed) return

    // Prüfen ob User älter als 3 Tage ist
    async function check() {
      const { data } = await supabase
        .from("dream_entries")
        .select("created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .single()

      if (!data) return
      const firstEntry = new Date(data.created_at)
      const daysSince = (Date.now() - firstEntry.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince >= 3) setShowBanner(true)
    }
    check()
  }, [user])

  function dismiss() {
    localStorage.setItem("meintraum_feedback_asked", "true")
    setShowBanner(false)
  }

  function openFeedback() {
    localStorage.setItem("meintraum_feedback_asked", "true")
    setShowBanner(false)
    setOpen(true)
  }

  // openFeedback via globales Event – damit AppHeader Dropdown es triggern kann
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("meintraum:feedback", handler)
    return () => window.removeEventListener("meintraum:feedback", handler)
  }, [])

  return (
    <>
      {/* Dezenter Banner nach 3 Tagen – nur auf /dashboard */}
      {showBanner && (
        <div className="fixed bottom-24 left-4 right-4 z-40 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-[#0c1220]/95 px-5 py-4 shadow-xl backdrop-blur">
            <p className="text-sm text-white/70 mb-3 leading-6">
              Du nutzt MeinTraum seit ein paar Tagen – magst du kurz Feedback geben?
            </p>
            <div className="flex gap-2">
              <button onClick={openFeedback}
                className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-medium text-[#070b14] transition hover:scale-[1.02]">
                Gerne 💬
              </button>
              <button onClick={dismiss}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:text-white/80">
                Später
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <FeedbackModal
          onClose={() => setOpen(false)}
          userEmail={user?.email}
        />
      )}
    </>
  )
}