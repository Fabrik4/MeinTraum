"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://www.meintraum.app/auth/callback",
      },
    })

    if (error) {
      setMessage("Fehler beim Senden des Login Links.")
    } else {
      setMessage("Magic Link wurde gesendet. Prüfe deine E-Mail.")
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white px-6 py-16">
      <div className="mx-auto max-w-md">

        <h1 className="text-3xl font-semibold mb-6">
          Login
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          <input
            type="email"
            required
            placeholder="Deine E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl bg-white/10 px-4 py-3"
          />

          <button
            type="submit"
            className="rounded-xl bg-white text-black py-3"
          >
            Magic Link senden
          </button>

        </form>

        {message && (
          <p className="mt-4 text-sm text-white/60">
            {message}
          </p>
        )}

      </div>
    </main>
  )
}