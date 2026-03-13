"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://www.meintraum.app/auth/callback" },
    })
    if (error) {
      setError("Fehler beim Senden. Bitte versuche es nochmal.")
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://www.meintraum.app/auth/callback" },
    })
    if (error) setError("Google-Anmeldung fehlgeschlagen.")
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-400/20 border border-white/10 mb-2">
            <span className="text-2xl">🌙</span>
          </div>
          <h1 className="text-2xl font-semibold">Willkommen zurück</h1>
          <p className="text-sm text-white/65">Melde dich an um dein Traumarchiv zu öffnen</p>
        </div>

        {sent ? (
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-8 text-center space-y-4">
            <p className="text-3xl">📬</p>
            <p className="text-sm text-white/80 leading-7">
              Schau in dein Postfach –<br />wir haben dir einen Link geschickt.
            </p>
            <button onClick={() => setSent(false)}
              className="text-xs text-white/50 hover:text-white/80 transition underline underline-offset-2">
              Andere E-Mail verwenden
            </button>
          </div>
        ) : (
          <>
            {/* Magic Link */}
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail-Adresse"
                required
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-white/65 focus:border-cyan-300/30 focus:outline-none transition"
              />
              {error && <p className="text-xs text-red-300/70 px-1">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
                {loading ? "Bitte warten…" : "Magic Link senden →"}
              </button>
            </form>

            {/* Trennlinie */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-white/45">oder</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Google */}
            <button onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white active:scale-[0.99]">
              <GoogleIcon />
              Mit Google anmelden
            </button>
          </>
        )}

        {/* Datenschutz */}
        <p className="text-center text-xs text-white/20 leading-6">
          Mit der Anmeldung stimmst du unserer{" "}
          <Link href="/datenschutz" className="underline underline-offset-2 hover:text-white/70 transition">
            Datenschutzerklärung
          </Link>{" "}
          zu.
        </p>

      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
