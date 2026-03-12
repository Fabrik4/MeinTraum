"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [age, setAge] = useState("")
  const [interests, setInterests] = useState("")
  const [kiContext, setKiContext] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) fetchProfile()
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading])

  async function fetchProfile() {
    const { data } = await supabase.from("user_profiles").select("*").eq("id", user!.id).maybeSingle()
    if (data) {
      setDisplayName(data.display_name ?? "")
      setAge(data.age?.toString() ?? "")
      setInterests(data.interests ?? "")
      setKiContext(data.ki_context ?? "")
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setMessage("")
    const payload = {
      id: user!.id,
      display_name: displayName || null,
      age: age ? parseInt(age) : null,
      interests: interests || null,
      ki_context: kiContext || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from("user_profiles").upsert(payload)
    setSaving(false)
    setMessage(error ? "Fehler beim Speichern." : "Gespeichert. ✓")
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (authLoading || loading) return <main className="min-h-screen bg-[#070b14]" />

  return (
    <main className="min-h-screen bg-[#070b14] px-5 py-14 text-white">
      <div className="mx-auto max-w-2xl space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-4">Einstellungen</p>
          <h1 className="text-3xl font-semibold">Profil</h1>
        </div>

        {/* Account */}
        <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.15em] text-white/30">Account</p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-white/50">Angemeldet als</p>
              <p className="text-white font-medium mt-0.5">{user?.email}</p>
            </div>
            <button onClick={handleSignOut}
              className="rounded-xl border border-red-300/20 bg-red-300/8 px-4 py-2.5 text-sm text-red-200 transition hover:bg-red-300/15">
              Abmelden
            </button>
          </div>
        </div>

        {/* Profil-Formular */}
        <form onSubmit={handleSave} className="space-y-8">

          {/* Persönliches */}
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-6">
            <p className="text-xs uppercase tracking-[0.15em] text-white/30">Persönliches</p>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Wie soll ich dich nennen?
              </label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="z.B. Lena"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none transition" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Alter <span className="font-normal text-white/30">(optional)</span>
              </label>
              <input type="number" min={10} max={120} value={age} onChange={(e) => setAge(e.target.value)}
                placeholder="z.B. 32"
                className="w-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none transition" />
            </div>
          </div>

          {/* KI-Kontext */}
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-white/30 mb-1">KI-Kontext</p>
              <p className="text-xs text-white/35 leading-6">
                Diese Informationen helfen der KI dir bessere, persönlichere Antworten zu geben.
                Sie werden nie für Werbung genutzt.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Interessen & Lebensbereiche
              </label>
              <textarea value={interests} onChange={(e) => setInterests(e.target.value)}
                placeholder="z.B. Ich arbeite als Lehrerin, habe zwei Kinder, interessiere mich für Psychologie und Meditation…"
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none transition resize-none" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                Was soll die KI über dich wissen?
                <span className="font-normal text-white/30 ml-2">(optional)</span>
              </label>
              <textarea value={kiContext} onChange={(e) => setKiContext(e.target.value)}
                placeholder="z.B. Ich gehe gerade durch eine schwierige Phase im Job. Ich träume oft von Wasser. Ich mag keine direkten Ratschläge…"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none transition resize-none" />
              <p className="mt-2 text-xs text-white/25 leading-5">
                Dieser Text wird bei jedem KI-Gespräch als Hintergrundinfo mitgegeben.
              </p>
            </div>
          </div>

          {/* Speichern */}
          <button type="submit" disabled={saving}
            className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
            {saving ? "Speichert…" : "Profil speichern"}
          </button>

          {message && (
            <p className={`text-center text-sm ${message.startsWith("Fehler") ? "text-red-300/70" : "text-emerald-300/70"}`}>
              {message}
            </p>
          )}
        </form>

        {/* Datenschutz */}
        <div className="border-t border-white/5 pt-8 flex gap-4 text-xs text-white/25">
          <a href="/datenschutz" className="hover:text-white/50 transition">Datenschutz</a>
          <a href="/impressum" className="hover:text-white/50 transition">Impressum</a>
          <a href="/" className="hover:text-white/50 transition ml-auto">Zur Landingpage</a>
        </div>

      </div>
    </main>
  )
}