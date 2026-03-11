"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsSending(true)
    setMessage("")

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://www.meintraum.app/auth/callback",
      },
    })

    if (error) {
      setMessage("Fehler beim Senden des Login-Links. Bitte versuche es erneut.")
    } else {
      setMessage("Magic Link wurde gesendet. Prüfe deine E-Mail. ✓")
    }

    setIsSending(false)
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white px-6 py-16">
      <div className="mx-auto max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">
          Anmelden
        </p>
        <h1 className="mt-4 text-3xl font-semibold">
          Willkommen zurück
        </h1>
        <p className="mt-4 leading-8 text-white/60">
          Gib deine E-Mail-Adresse ein. Wir schicken dir einen Magic Link zum Einloggen.
        </p>

        <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="deine@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white placeholder:text-white/30 focus:border-cyan-300/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-[#070b14] transition hover:scale-[1.01] disabled:opacity-60"
          >
            {isSending ? "Wird gesendet..." : "Magic Link senden"}
          </button>
        </form>

        {message && (
          <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        )}
      </div>
    </main>
  )
}
