"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

type FeedbackData = {
  gefallt: string[]
  fehlt: string[]
  gefunden: string
  weiterempfehlen: string
  freitext: string
}

const GEFALLT_OPTIONS = [
  "Traumanalyse der KI",
  "Muster-Erkennung über Zeit",
  "Einfaches Erfassen",
  "Design & Atmosphäre",
  "Traumbegleiter Chat",
  "Journal-Funktion",
]

const FEHLT_OPTIONS = [
  "Mobile App (iOS/Android)",
  "Mehr Analyse-Tiefe",
  "Erinnerungen / Notifications",
  "Teilen mit anderen",
  "Mehr Sprachen",
  "Export meiner Daten",
  "Statistiken & Charts",
]

const GEFUNDEN_OPTIONS = [
  "Google-Suche",
  "Instagram / TikTok",
  "Empfehlung von jemandem",
  "App Store",
  "Anderes",
]

const WEITEREMPFEHLEN_OPTIONS = [
  "Ja, auf jeden Fall",
  "Wahrscheinlich ja",
  "Weiss noch nicht",
  "Eher nicht",
]

type Props = {
  onClose: () => void
  userEmail?: string
}

export default function FeedbackModal({ onClose, userEmail }: Props) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FeedbackData>({
    gefallt: [], fehlt: [], gefunden: "", weiterempfehlen: "", freitext: "",
  })
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  function toggleMulti(key: "gefallt" | "fehlt", val: string) {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter((x) => x !== val) : [...prev[key], val],
    }))
  }

  async function handleSubmit() {
    setSending(true)
    try {
      // Supabase speichern
      await supabase.from("feedback").insert([{
        user_email: userEmail ?? null,
        gefallt: data.gefallt,
        fehlt: data.fehlt,
        gefunden: data.gefunden || null,
        weiterempfehlen: data.weiterempfehlen || null,
        freitext: data.freitext || null,
      }])

      // Email via mailto als Fallback (öffnet nicht – nur als Log)
      // Für echten Email-Versand: Resend/Postmark API einbauen
    } catch { /* silent */ }
    setSending(false)
    setDone(true)
  }

  const steps = [
    {
      title: "Was gefällt dir?",
      subtitle: "Mehrfachauswahl möglich",
      content: (
        <div className="flex flex-wrap gap-2">
          {GEFALLT_OPTIONS.map((o) => (
            <button key={o} type="button" onClick={() => toggleMulti("gefallt", o)}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${
                data.gefallt.includes(o)
                  ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
              }`}>
              {o}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Was fehlt dir noch?",
      subtitle: "Mehrfachauswahl möglich",
      content: (
        <div className="flex flex-wrap gap-2">
          {FEHLT_OPTIONS.map((o) => (
            <button key={o} type="button" onClick={() => toggleMulti("fehlt", o)}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${
                data.fehlt.includes(o)
                  ? "border-amber-300/35 bg-amber-300/15 text-amber-100"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
              }`}>
              {o}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Wie hast du MeinTraum gefunden?",
      subtitle: "Eine Antwort",
      content: (
        <div className="flex flex-wrap gap-2">
          {GEFUNDEN_OPTIONS.map((o) => (
            <button key={o} type="button" onClick={() => setData((p) => ({ ...p, gefunden: o }))}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${
                data.gefunden === o
                  ? "border-violet-300/35 bg-violet-300/15 text-violet-100"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
              }`}>
              {o}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Würdest du MeinTraum weiterempfehlen?",
      subtitle: "Eine Antwort",
      content: (
        <div className="flex flex-wrap gap-2">
          {WEITEREMPFEHLEN_OPTIONS.map((o) => (
            <button key={o} type="button" onClick={() => setData((p) => ({ ...p, weiterempfehlen: o }))}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${
                data.weiterempfehlen === o
                  ? "border-emerald-300/35 bg-emerald-300/15 text-emerald-100"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
              }`}>
              {o}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Noch etwas auf dem Herzen?",
      subtitle: "Optional – freies Textfeld",
      content: (
        <textarea
          value={data.freitext}
          onChange={(e) => setData((p) => ({ ...p, freitext: e.target.value }))}
          placeholder="Ideen, Wünsche, Kritik – alles willkommen…"
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:border-white/25 focus:outline-none resize-none transition"
        />
      ),
    },
  ]

  const currentStep = steps[step]
  const isLast = step === steps.length - 1

  if (done) {
    return (
      <ModalShell onClose={onClose}>
        <div className="text-center space-y-4 py-4">
          <p className="text-4xl">🙏</p>
          <p className="text-lg font-semibold">Danke für dein Feedback!</p>
          <p className="text-sm text-white/45 leading-6">
            Jede Rückmeldung hilft MeinTraum besser zu machen.
          </p>
          <button onClick={onClose}
            className="mt-2 rounded-2xl bg-white px-8 py-3 font-medium text-[#070b14] transition hover:scale-[1.02]">
            Schliessen
          </button>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell onClose={onClose}>
      {/* Progress */}
      <div className="flex gap-1.5 mb-6">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
            i <= step ? "bg-cyan-300/60" : "bg-white/10"
          }`} />
        ))}
      </div>

      {/* Step */}
      <div className="space-y-5">
        <div>
          <p className="font-semibold text-white">{currentStep.title}</p>
          <p className="text-xs text-white/30 mt-1">{currentStep.subtitle}</p>
        </div>
        {currentStep.content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : onClose()}
          className="text-sm text-white/30 hover:text-white/60 transition">
          {step === 0 ? "Abbrechen" : "← Zurück"}
        </button>
        <button
          onClick={() => isLast ? handleSubmit() : setStep(step + 1)}
          disabled={sending}
          className="rounded-2xl bg-white px-6 py-2.5 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] disabled:opacity-50">
          {sending ? "Sendet…" : isLast ? "Abschicken ✓" : "Weiter →"}
        </button>
      </div>
    </ModalShell>
  )
}

// ── Modal Shell ───────────────────────────────────────────────
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0c1220] p-6 shadow-2xl shadow-black/60 sm:p-8">
        <button onClick={onClose}
          className="absolute right-5 top-5 text-white/25 hover:text-white/60 transition text-lg">
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}