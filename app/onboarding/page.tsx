"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/useAuth"

const GOALS = [
  { value: "Träume verstehen", emoji: "🌙" },
  { value: "Muster erkennen", emoji: "✦" },
  { value: "Schlaf verbessern", emoji: "💤" },
  { value: "Selbstreflexion", emoji: "🪞" },
  { value: "Luzides Träumen", emoji: "⚡" },
  { value: "Journal", emoji: "📓" },
]

const AGE_RANGES = ["Unter 20", "20–29", "30–39", "40–49", "50+"]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [ageRange, setAgeRange] = useState("")
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login")
  }, [user, authLoading])

  // Profil-Daten in DB schreiben (ohne onboarding_done)
  async function saveProfile(done = false) {
    if (!user) return
    await supabase.from("user_profiles").upsert({
      id: user.id,
      display_name: name.trim() || null,
      age: ageRange || null,
      interests: selectedGoals.length > 0 ? selectedGoals.join(", ") : null,
      goals: selectedGoals.length > 0 ? selectedGoals : null,
      onboarding_done: done,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" })
  }

  // Schritt 1 → 2
  async function handleStep1() {
    if (!name.trim()) return
    setSaving(true)
    await saveProfile(false)
    setSaving(false)
    setStep(1)
  }

  // Schritt 2 → 3 (oder überspringen)
  async function handleStep2(skip = false) {
    setSaving(true)
    await saveProfile(false)
    setSaving(false)
    setStep(2)
  }

  const toggleGoal = (g: string) =>
    setSelectedGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  if (authLoading) return null

  const displayName = name.trim() || "du"

  return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">

        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-12">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`rounded-full transition-all duration-500 ${
              i === step ? "w-6 h-2 bg-cyan-300/70" : i < step ? "w-2 h-2 bg-white/40" : "w-2 h-2 bg-white/10"
            }`} />
          ))}
        </div>

        {/* ── Schritt 0: Willkommen + Name ── */}
        {step === 0 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <p className="text-4xl">🌙</p>
              <h1 className="text-3xl font-semibold">Willkommen bei MeinTraum</h1>
              <p className="text-white/45 text-sm leading-7 max-w-sm mx-auto">
                Dein persönliches Traumarchiv. Wie dürfen wir dich nennen?
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleStep1() }}
                placeholder="Dein Name oder Spitzname"
                autoFocus
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/20 focus:border-cyan-300/30 focus:outline-none transition text-center text-lg"
              />
              <button
                onClick={handleStep1}
                disabled={!name.trim() || saving}
                className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] disabled:opacity-40">
                {saving ? "…" : "Los geht's →"}
              </button>
            </div>

            <p className="text-center text-xs text-white/20">
              Du kannst alles später in den Einstellungen ändern
            </p>
          </div>
        )}

        {/* ── Schritt 1: Alter + Ziele ── */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Hey {displayName} 👋</h2>
              <p className="text-white/40 text-sm">
                Ein paar optionale Angaben.
              </p>
            </div>

            {/* Altersgruppe */}
            <div className="space-y-3">
              <p className="text-sm text-white/55">Altersgruppe <span className="text-white/25">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((a) => (
                  <button key={a} type="button" onClick={() => setAgeRange(ageRange === a ? "" : a)}
                    className={`rounded-full border px-4 py-2 text-sm transition-all ${
                      ageRange === a
                        ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white/45 hover:text-white hover:border-white/20"
                    }`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Ziele */}
            <div className="space-y-3">
              <p className="text-sm text-white/55">Wofür möchtest du MeinTraum nutzen? <span className="text-white/25">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button key={g.value} type="button" onClick={() => toggleGoal(g.value)}
                    className={`rounded-full border px-4 py-2 text-sm transition-all flex items-center gap-1.5 ${
                      selectedGoals.includes(g.value)
                        ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white/45 hover:text-white hover:border-white/20"
                    }`}>
                    <span>{g.emoji}</span> {g.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleStep2(true)}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white/40 transition hover:text-white/70 hover:bg-white/8">
                Später einrichten
              </button>
              <button onClick={() => handleStep2(false)} disabled={saving}
                className="flex-1 rounded-2xl bg-white px-4 py-3.5 font-medium text-[#070b14] transition hover:scale-[1.01] disabled:opacity-40">
                {saving ? "…" : "Weiter →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Schritt 2: Los geht's ── */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <p className="text-3xl">✓</p>
              <h2 className="text-2xl font-semibold">Alles bereit, {displayName}!</h2>
              <p className="text-white/40 text-sm">Womit möchtest du beginnen?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={async () => { await saveProfile(true); router.replace("/entry") }}
                className="flex flex-col gap-3 rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-5 text-left transition hover:bg-cyan-300/10 hover:border-cyan-300/25">
                <span className="text-2xl">🌙</span>
                <div>
                  <p className="font-medium text-white text-sm">Traum erfassen</p>
                  <p className="text-xs text-white/35 mt-0.5 leading-5">Direkt loslegen</p>
                </div>
              </button>

              <button onClick={async () => { await saveProfile(true); router.replace("/journal/new") }}
                className="flex flex-col gap-3 rounded-3xl border border-amber-300/15 bg-amber-300/5 p-5 text-left transition hover:bg-amber-300/10 hover:border-amber-300/25">
                <span className="text-2xl">📓</span>
                <div>
                  <p className="font-medium text-white text-sm">Journal schreiben</p>
                  <p className="text-xs text-white/35 mt-0.5 leading-5">Stimmung festhalten</p>
                </div>
              </button>

              <button onClick={async () => { await saveProfile(true); router.replace("/profile") }}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8 hover:border-white/20">
                <span className="text-2xl">🪞</span>
                <div>
                  <p className="font-medium text-white text-sm">Profil einrichten</p>
                  <p className="text-xs text-white/35 mt-0.5 leading-5">KI-Kontext ergänzen</p>
                </div>
              </button>

              <button onClick={async () => { await saveProfile(true); router.replace("/dashboard") }}
                className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/8 hover:border-white/20">
                <span className="text-2xl">✦</span>
                <div>
                  <p className="font-medium text-white text-sm">Dashboard</p>
                  <p className="text-xs text-white/35 mt-0.5 leading-5">Übersicht ansehen</p>
                </div>
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}