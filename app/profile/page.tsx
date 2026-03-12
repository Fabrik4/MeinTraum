"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

type KeyEvent = {
  id: number; title: string; description: string | null
  event_date: string; emoji: string
}

const EMOJI_OPTIONS = ["📌","💼","❤️","💔","🏠","✈️","🎓","👶","💪","🌱","⚡","🌧️","🎉","😔","🔄"]

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
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newEmoji, setNewEmoji] = useState("📌")
  const [addingEvent, setAddingEvent] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [summaryMessage, setSummaryMessage] = useState("")
  const [lastSummaryDate, setLastSummaryDate] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) fetchAll()
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading])

  async function fetchAll() {
    const [profileRes, eventsRes, summaryRes] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", user!.id).maybeSingle(),
      supabase.from("key_events").select("*").eq("user_id", user!.id).order("event_date", { ascending: false }),
      supabase.from("user_summaries").select("generated_at").eq("user_id", user!.id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
    ])
    if (profileRes.data) {
      setDisplayName(profileRes.data.display_name ?? "")
      setAge(profileRes.data.age?.toString() ?? "")
      setInterests(profileRes.data.interests ?? "")
      setKiContext(profileRes.data.ki_context ?? "")
    }
    setKeyEvents(eventsRes.data ?? [])
    if (summaryRes.data) {
      setLastSummaryDate(new Date(summaryRes.data.generated_at).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" }))
    }
    setLoading(false)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMessage("")
    await supabase.from("user_profiles").upsert({
      id: user!.id, display_name: displayName || null,
      age: age ? parseInt(age) : null, interests: interests || null,
      ki_context: kiContext || null, updated_at: new Date().toISOString(),
    })
    setSaving(false); setMessage("Gespeichert. ✓")
  }

  async function handleAddEvent() {
    if (!newTitle.trim()) return
    setAddingEvent(true)
    const { data } = await supabase.from("key_events").insert({
      user_id: user!.id, title: newTitle.trim(),
      description: newDesc.trim() || null, event_date: newDate, emoji: newEmoji,
    }).select("*").single()
    if (data) { setKeyEvents((prev) => [data, ...prev]); setNewTitle(""); setNewDesc(""); setNewEmoji("📌"); setShowAddEvent(false) }
    setAddingEvent(false)
  }

  async function handleDeleteEvent(id: number) {
    await supabase.from("key_events").delete().eq("id", id)
    setKeyEvents((prev) => prev.filter((e) => e.id !== id))
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true); setSummaryMessage("")
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id }),
      })
      const data = await res.json()
      if (data.summary) {
        setSummaryMessage(`Erstellt ✓ – ${data.stats?.dreams ?? 0} Träume & ${data.stats?.journals ?? 0} Journaleinträge analysiert`)
        setLastSummaryDate(new Date().toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" }))
      } else setSummaryMessage("Fehler beim Erstellen.")
    } catch { setSummaryMessage("Fehler beim Erstellen.") }
    setGeneratingSummary(false)
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push("/") }

  if (authLoading || loading) return <main className="min-h-screen bg-[#070b14]" />

  return (
    <main className="min-h-screen bg-[#070b14] px-5 pt-5 pb-24 md:py-14 text-white">
      <div className="mx-auto max-w-2xl space-y-8">

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-4">Einstellungen</p>
          <h1 className="text-3xl font-semibold">Profil</h1>
        </div>

        {/* Account */}
        <div className="rounded-3xl border border-white/8 bg-white/3 p-6">
          <p className="text-xs uppercase tracking-[0.15em] text-white/30 mb-4">Account</p>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-white/40">Angemeldet als</p>
              <p className="font-medium mt-0.5">{user?.email}</p>
            </div>
            <button onClick={handleSignOut}
              className="rounded-xl border border-red-300/20 bg-red-300/8 px-4 py-2.5 text-sm text-red-200 transition hover:bg-red-300/15">
              Abmelden
            </button>
          </div>
        </div>

        {/* Profil */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-5">
            <p className="text-xs uppercase tracking-[0.15em] text-white/30">Persönliches</p>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">Wie soll ich dich nennen?</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="z.B. Lena"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-white/25 focus:outline-none transition" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">Alter <span className="font-normal text-white/30">(optional)</span></label>
              <input type="number" min={10} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="z.B. 32"
                className="w-32 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-white/25 focus:outline-none transition" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-white/30 mb-1">KI-Kontext</p>
              <p className="text-xs text-white/30 leading-6">Diese Infos helfen der KI dir persönlichere Antworten zu geben.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">Über dich</label>
              <textarea value={interests} onChange={(e) => setInterests(e.target.value)} rows={3}
                placeholder="z.B. Ich arbeite als Lehrerin, habe zwei Kinder, interessiere mich für Psychologie…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-white/25 focus:outline-none transition resize-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">Was soll die KI wissen? <span className="font-normal text-white/30">(optional)</span></label>
              <textarea value={kiContext} onChange={(e) => setKiContext(e.target.value)} rows={3}
                placeholder="z.B. Ich mag keine direkten Ratschläge. Ich träume oft von Wasser…"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/20 focus:border-white/25 focus:outline-none transition resize-none" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] disabled:opacity-60">
            {saving ? "Speichert…" : "Profil speichern"}
          </button>
          {message && <p className="text-center text-sm text-emerald-300/60">{message}</p>}
        </form>

        {/* Keyereignisse */}
        <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-white/30 mb-1">Schlüsselereignisse</p>
              <p className="text-xs text-white/30 leading-5">Wichtige Momente die die KI in Gesprächen kennen soll.</p>
            </div>
            <button onClick={() => setShowAddEvent(!showAddEvent)}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/55 transition hover:bg-white/8 hover:text-white">
              + Hinzufügen
            </button>
          </div>

          {showAddEvent && (
            <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/4 p-5 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((em) => (
                  <button key={em} type="button" onClick={() => setNewEmoji(em)}
                    className={`text-xl rounded-xl p-1.5 transition ${newEmoji === em ? "bg-white/15 scale-110" : "hover:bg-white/8"}`}>
                    {em}
                  </button>
                ))}
              </div>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ereignis (z.B. Neuer Job, Umzug, Trennung…)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/25 focus:outline-none transition" />
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Details (optional)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-white/25 focus:outline-none transition" />
              <div className="flex gap-3 flex-wrap">
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-white/25 focus:outline-none transition" />
                <button onClick={handleAddEvent} disabled={addingEvent || !newTitle.trim()}
                  className="rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] disabled:opacity-50">
                  {addingEvent ? "Speichert…" : "Speichern"}
                </button>
                <button onClick={() => setShowAddEvent(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/45 transition hover:bg-white/8">
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {keyEvents.length === 0 && !showAddEvent && (
            <p className="text-sm text-white/22 text-center py-3">Noch keine Schlüsselereignisse.</p>
          )}

          <div className="space-y-2">
            {keyEvents.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/2 px-4 py-3">
                <span className="text-xl mt-0.5 shrink-0">{ev.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ev.title}</p>
                  {ev.description && <p className="text-xs text-white/35 mt-0.5">{ev.description}</p>}
                  <p className="text-xs text-white/22 mt-1">
                    {new Date(ev.event_date).toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => handleDeleteEvent(ev.id)}
                  className="text-white/18 hover:text-red-300/55 transition text-sm shrink-0 mt-0.5">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* KI-Gedächtnis */}
        <div className="rounded-3xl border border-white/8 bg-white/3 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-white/30 mb-1">KI-Gedächtnis</p>
            <p className="text-xs text-white/30 leading-6">
              Analysiert alle Einträge und erstellt eine Zusammenfassung, die die KI in jedem Gespräch nutzt.
              {lastSummaryDate && <span className="block mt-1 text-white/18">Zuletzt: {lastSummaryDate}</span>}
            </p>
          </div>
          <button onClick={handleGenerateSummary} disabled={generatingSummary}
            className="w-full rounded-2xl border border-cyan-300/18 bg-cyan-300/6 px-5 py-3.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/12 disabled:opacity-50">
            {generatingSummary
              ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">✦</span> Analysiere alle Einträge…</span>
              : lastSummaryDate ? "Gedächtnis aktualisieren" : "KI-Gedächtnis erstellen"
            }
          </button>
          {summaryMessage && (
            <p className={`text-xs text-center ${summaryMessage.startsWith("Fehler") ? "text-red-300/55" : "text-emerald-300/55"}`}>
              {summaryMessage}
            </p>
          )}
          <p className="text-xs text-white/18 leading-5">Empfehlung: einmal pro Woche aktualisieren.</p>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 pt-6 flex gap-4 text-xs text-white/18">
          <a href="/datenschutz" className="hover:text-white/40 transition">Datenschutz</a>
          <a href="/impressum" className="hover:text-white/40 transition">Impressum</a>
          <a href="/" className="hover:text-white/40 transition ml-auto">Zur Landingpage</a>
        </div>

      </div>
    </main>
  )
}