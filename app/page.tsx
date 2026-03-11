"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  Moon, Sparkles, Brain, Search, Mic, Bell,
  TrendingUp, Shield, Star, ArrowRight
} from "lucide-react"

// Fade-in hook
function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = "0"
    el.style.transform = "translateY(18px)"
    el.style.transition = `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`
    const timeout = setTimeout(() => {
      el.style.opacity = "1"
      el.style.transform = "translateY(0)"
    }, 80)
    return () => clearTimeout(timeout)
  }, [delay])
  return ref
}

const features = [
  {
    icon: Mic,
    title: "Sofort festhalten",
    text: "Stichworte, Text oder Sprache – in Sekunden erfasst, bevor der Traum verblasst.",
  },
  {
    icon: Brain,
    title: "KI-Reflexion",
    text: "Mehrere Analysestile: psychologisch, sachlich oder humorvoll – nie absolut, immer ehrlich.",
  },
  {
    icon: Search,
    title: "Muster erkennen",
    text: "Wiederkehrende Personen, Orte und Emotionen werden über Wochen sichtbar.",
  },
  {
    icon: TrendingUp,
    title: "Schlaf & Kontext",
    text: "Verbinde Träume mit Stresslevel, Schlafqualität und Gewohnheiten.",
  },
  {
    icon: Bell,
    title: "Sanfte Erinnerungen",
    text: "Optionale Benachrichtigungen morgens und abends – diskret, konfigurierbar.",
  },
  {
    icon: Star,
    title: "Luzides Träumen",
    text: "Traumzeichen erkennen und gezielt mit Klarträumen experimentieren. (bald)",
    soon: true,
  },
]

const principles = [
  {
    icon: Shield,
    title: "Keine Pseudo-Deutung",
    text: "Wir sagen dir nie, was dein Traum bedeutet. Wir helfen dir, deine eigenen Muster zu sehen.",
  },
  {
    icon: Moon,
    title: "Privat & bewusst",
    text: "Keine Werbung, kein Datenverkauf. Deine Traumwelt gehört dir.",
  },
  {
    icon: Sparkles,
    title: "Schweizer Qualität",
    text: "Entwickelt mit Fokus auf Klarheit, Datenschutz und langfristige Perspektive.",
  },
]

export default function Home() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const hero = useFadeIn(0)
  const sub = useFadeIn(150)
  const cta = useFadeIn(280)
  const badge = useFadeIn(50)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from("waitlist").insert([{ email }])
    if (error) {
      setMessage("Diese E-Mail ist bereits eingetragen oder ungültig.")
    } else {
      setMessage("Danke! Du bist auf der Warteliste. ✓")
      setEmail("")
    }
    setSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#070b14]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <span className="text-lg font-semibold tracking-tight">MeinTraum</span>
          <a
            href="#early-access"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]"
          >
            Early Access
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(89,120,255,0.18),transparent_55%),radial-gradient(ellipse_at_75%_60%,rgba(0,200,180,0.12),transparent_45%)]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-400/5 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6 pt-32 pb-24 md:px-10">
          <div ref={badge} className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/55 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Ein Schweizer Projekt · Early Access
          </div>

          <div ref={hero}>
            <h1 className="text-6xl font-semibold tracking-tight text-white md:text-8xl leading-[0.95]">
              Mein<span className="text-white/40">Traum</span>
            </h1>
            <p className="mt-6 text-xl font-medium text-white/80 md:text-2xl max-w-xl leading-snug">
              Verstehe deine Träume.<br />
              Entdecke Muster in dir selbst.
            </p>
          </div>

          <div ref={sub} className="mt-6 max-w-lg">
            <p className="text-base leading-8 text-white/50">
              Nicht Wahrsagerei – eher ein Spiegel fürs Unterbewusstsein.
              Halte Träume fest, erkenne wiederkehrende Themen und verbinde
              sie mit deinem Alltag.
            </p>
          </div>

          <div ref={cta} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#early-access"
              className="inline-flex items-center gap-2 justify-center rounded-2xl bg-white px-6 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99]"
            >
              Early Access sichern
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white/70 backdrop-blur transition hover:bg-white/10 hover:text-white"
            >
              Funktionen ansehen
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/60" />
        </div>
      </section>

      {/* Problem / Lösung – kompakt */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
        <div className="grid gap-px md:grid-cols-2 rounded-3xl overflow-hidden border border-white/10">
          <div className="bg-white/3 p-8 md:p-10 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35 mb-4">Problem</p>
            <h2 className="text-xl font-semibold text-white/80 leading-snug">
              Träume zerfallen in Minuten.<br />
              Klassische Apps liefern generische Deutungen.
            </h2>
          </div>
          <div className="bg-cyan-400/5 p-8 md:p-10 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60 mb-4">MeinTraum</p>
            <h2 className="text-xl font-semibold leading-snug">
              Langfristige Mustererkennung<br />
              statt schneller Symboldeutung.
            </h2>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60 mb-4">Funktionen</p>
          <h2 className="text-3xl font-semibold max-w-lg leading-snug">
            Schnell erfassen.<br />Tiefer verstehen.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`group relative rounded-3xl border p-6 backdrop-blur transition-all duration-300 hover:bg-white/8 hover:-translate-y-0.5
                  ${item.soon
                    ? "border-white/5 bg-white/2 opacity-60"
                    : "border-white/10 bg-white/5"
                  }`}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 transition group-hover:border-cyan-300/30 group-hover:bg-cyan-300/15">
                  <Icon className="h-5 w-5 text-cyan-300/80" />
                </div>
                <h3 className="font-semibold text-white/90 flex items-center gap-2">
                  {item.title}
                  {item.soon && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/35">
                      bald
                    </span>
                  )}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/55">{item.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Wie es funktioniert */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60 mb-4">So funktioniert's</p>
          <h2 className="text-3xl font-semibold">Drei Schritte. Kein Aufwand.</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Traum festhalten",
              text: "Direkt nach dem Aufwachen – per Stichwort, Freitext oder Sprache. In unter 30 Sekunden.",
            },
            {
              n: "02",
              title: "Details ergänzen",
              text: "Emotionen, Personen, Orte – wenn weitere Erinnerungen zurückkommen, ergänzst du einfach.",
            },
            {
              n: "03",
              title: "Muster entdecken",
              text: "Über Wochen und Monate entstehen persönliche Erkenntnisse – keine vagen Deutungen.",
            },
          ].map((step) => (
            <div key={step.n} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <span className="text-4xl font-semibold text-white/8 select-none">{step.n}</span>
              <h3 className="mt-2 font-semibold text-white/90">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/50">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prinzipien */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="rounded-3xl border border-white/8 bg-white/3 p-8 md:p-10 backdrop-blur">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60 mb-4">Unsere Haltung</p>
            <h2 className="text-2xl font-semibold max-w-lg">
              Kein esoterischer Kitsch. Kein Datenhandel. Kein Lärm.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {principles.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title} className="flex gap-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Icon className="h-4 w-4 text-white/50" />
                  </div>
                  <div>
                    <p className="font-medium text-white/85">{p.title}</p>
                    <p className="mt-2 text-sm leading-7 text-white/45">{p.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Early Access */}
      <section id="early-access" className="mx-auto max-w-4xl px-6 py-20 md:px-10">
        <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur overflow-hidden md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,180,0.07),transparent_70%)] pointer-events-none" />

          <div className="relative">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/60 mb-4">Early Access</p>
            <h2 className="text-3xl font-semibold">Sei einer der Ersten.</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-8 text-white/50">
              MeinTraum ist in Entwicklung. Frühe Nutzer erhalten als Erste Zugang,
              können Features mitprägen und erhalten exklusive Updates.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.com"
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0b1220] px-5 py-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-300/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? "..." : "Eintragen"}
              </button>
            </form>

            {message && (
              <div className="mx-auto mt-4 max-w-md rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                {message}
              </div>
            )}

            <p className="mt-5 text-xs text-white/25">
              Keine Werbung. Keine Weitergabe. Jederzeit abmeldbar.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 pb-12 pt-4 md:px-10">
        <div className="flex flex-col gap-4 border-t border-white/8 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-white/25">MeinTraum · Ein Projekt aus der Schweiz von Fabrik4.</p>
          <div className="flex gap-6 text-xs text-white/25">
            <a href="/datenschutz" className="hover:text-white/60 transition">Datenschutz</a>
            <a href="/impressum" className="hover:text-white/60 transition">Impressum</a>
          </div>
        </div>
      </footer>

    </main>
  )
}