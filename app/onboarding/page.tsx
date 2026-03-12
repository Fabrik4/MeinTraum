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
  { value: "Einfach aufschreiben", emoji: "📓" },
]

const AGE_RANGES = ["Unter 20", "20–29", "30–39", "40–49", "50+"]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [ageRange, setAgeRange] = useState("")
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [dreamText, setDreamText] = useState("")
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

  // Schritt 3: Mit Traum abschliessen
  async function handleFinishWithDream() {
    if (!user || !dreamText.trim()) return
    setSaving(true)
    const [dreamRes] = await Promise.all([
      supabase.from("dream_entries").insert([{
        user_id: user.id,
        raw_input_text: dreamText.trim(),
        dreamed_at: new Date().toISOString(),
      }]).select("id").single(),
      saveProfile(true),
    ])
    setSaving(false)
    if (dreamRes.data) {
      router.replace(`/entries/${dreamRes.data.id}?type=dream`)
    } else {
      router.replace("/dashboard")
    }
  }

  // Schritt 3: Ohne Traum abschliessen
  async function handleFinishWithout() {
    if (!user) return
    setSaving(true)
    await saveProfile(true)
    setSaving(false)
    router.replace("/dashboard")
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
              <p className="text-white/40 text-sm leading-7">
                Ein paar optionale Angaben – hilft der KI dir besser zu verstehen.
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

        {/* ── Schritt 2: Erster Traum ── */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Deinen ersten Traum festhalten?</h2>
              <p className="text-white/40 text-sm leading-7 max-w-sm mx-auto">
                Stichworte reichen völlig – du kannst später jederzeit ergänzen.
              </p>
            </div>

            <textarea
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder="Was hast du geträumt? Auch Fragmente oder Gefühle sind wertvoll…"
              rows={5}
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder:text-white/20 focus:border-cyan-300/30 focus:outline-none transition resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={handleFinishWithout}
                disabled={saving}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white/40 transition hover:text-white/70 hover:bg-white/8">
                Zum Dashboard
              </button>
              <button
                onClick={handleFinishWithDream}
                disabled={!dreamText.trim() || saving}
                className="flex-1 rounded-2xl bg-white px-4 py-3.5 font-medium text-[#070b14] transition hover:scale-[1.01] disabled:opacity-40">
                {saving
                  ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">✦</span> Speichert…</span>
                  : "🌙 Speichern & starten"
                }
              </button>
            </div>

            <p className="text-center text-xs text-white/18">
              Nach dem Speichern siehst du sofort die KI-Analyse deines Traums
            </p>
          </div>
        )}

      </div>
    </main>
  )
}