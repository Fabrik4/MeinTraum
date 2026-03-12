"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import FeedbackModal from "./FeedbackModal"
import { useAuth } from "@/lib/useAuth"

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  // Nicht auf Landingpage, Login, Auth-Seiten zeigen
  if (["/" , "/login", "/demo", "/traumdeutung"].includes(pathname)) return null
  if (pathname.startsWith("/auth")) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-2xl border border-white/12 bg-[#0c1220]/90 px-4 py-2.5 text-xs text-white/45 shadow-lg backdrop-blur transition hover:border-white/25 hover:text-white/80 sm:bottom-6"
        aria-label="Feedback senden">
        <span className="text-sm">💬</span>
        Feedback
      </button>

      {open && (
        <FeedbackModal
          onClose={() => setOpen(false)}
          userEmail={user?.email}
        />
      )}
    </>
  )
}