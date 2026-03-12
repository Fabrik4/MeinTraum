"use client"

import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Moon, Sparkles, Brain, Search, Mic, Bell,
  TrendingUp, Shield, Star, ArrowRight
} from "lucide-react"
import { useAuth } from "@/lib/useAuth"

function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = "0"
    el.style.transform = "translateY(18px)"
    el.style.transition = `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`
    const t = setTimeout(() => {
      el.style.opacity = "1"
      el.style.transform = "translateY(0)"
    }, 80)
    return () => clearTimeout(t)
  }, [delay])
  return ref
}

const features = [
  {
    icon: Mic,
    title: "Sofort festhalten",
    text: "Stichworte oder Freitext – in Sekunden erfasst, bevor der Traum verblasst.",
  },
  {
    icon: Brain,
    title: "KI-Reflexion",
    text: "Psychologisch, sachlich oder explorativ – nie absolut, immer ehrlich.",
  },
  {
    icon: Search,
    title: "Muster erkennen",
    text: "Wiederkehrende Personen, Orte und Emotionen werden über Wochen sichtbar.",
  },
  {
    icon: TrendingUp,
    title: "Schlaf & Kontext",
    text: "Verbinde Träume mit Stimmung, Energie und Ereignissen im Alltag.",
  },
  {
    icon: Bell,
    title: "Sanfte Erinnerungen",
    text: "Optionale Benachrichtigungen morgens – diskret, konfigurierbar.",
  },
  {
    icon: Star,
    title: "Luzides Träumen",
    text: "Traumzeichen erkennen und gezielt mit Klarträumen experimentieren.",
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
  const router = useRouter()
  const { user, loading } = useAuth()
  const hero  = useFadeIn(0)
  const sub   = useFadeIn(150)
  const cta   = useFadeIn(280)
  const badge = useFadeIn(50)

  // Eingeloggte User direkt zum Dashboard
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard")
  }, [user, loading])

  // Kurz warten während Auth-Status geladen wird
  if (loading || user) return (
    <main className="min-h-screen bg-[#070b14] flex items-center justify-center">
      <p className="text-3xl animate-pulse">🌙</p>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#070b14] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#070b14]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <span className="text-lg font-semibold tracking-tight">MeinTraum</span>
          <div className="flex items-center gap-3">
            <Link href="/demo"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
              Demo ansehen
            </Link>
            <Link href="/login"
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]">
              Anmelden
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(89,120,255,0.18),transparent_55%),radial-gradient(ellipse_at_75%_60%,rgba(0,200,180,0.12),transparent_45%)]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-400/5 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-6 pt-32 pb-24 md:px-10">
          <div ref={badge} className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/55 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Beta · Jetzt kostenlos testen
          </div>

          <div ref={hero}>
            <h1 className="text-6xl font-semibold tracking-tight text-white md:text-8xl leading-[0.95]">
              Mein<span className="text-white/35">Traum</span>
            </h1>
            <p className="mt-6 text-xl font-medium text-white/80 md:text-2xl max-w-xl leading-snug">
              Verstehe deine Träume.<br />
              Entdecke Muster in dir selbst.
            </p>
          </div>

          <div ref={sub} className="mt-5 max-w-lg space-y-4">
            <p className="text-lg font-medium text-white/55 leading-snug">
              Nicht ein Traum.<br />
              <span className="text-white/80">Alle deine Träume zusammen.</span>
            </p>
            <p className="text-sm leading-7 text-white/35">
              KI erkennt wiederkehrende Personen, Orte und Emotionen über Wochen –
              und zeigt dir Muster die du alleine nicht siehst.
            </p>
          </div>

          <div ref={cta} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/entry"
              className="inline-flex items-center gap-2 justify-center rounded-2xl bg-white px-7 py-3.5 text-sm font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99]">
              🌙 Traum jetzt analysieren
            </Link>
            <Link href="/demo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-medium text-white/65 backdrop-blur transition hover:bg-white/10 hover:text-white">
              Demo ansehen
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <p className="mt-5 text-xs text-white/25">Kostenlos · Keine Kreditkarte · Keine Anmeldung nötig</p>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20">
          <div className="h-8 w-px bg-gradient-to-b from-transparent to-white/60" />
        </div>
      </section>

      {/* Problem / Lösung */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-10">
        <div className="grid gap-px md:grid-cols-2 rounded-3xl overflow-hidden border border-white/10">
          <div className="bg-white/3 p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-4">Das Problem</p>
            <h2 className="text-xl font-semibold text-white/75 leading-snug">
              Träume zerfallen in Minuten.<br />
              Klassische Apps liefern generische Symboldeutungen.
            </h2>
          </div>
          <div className="bg-cyan-400/5 p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/55 mb-4">MeinTraum</p>
            <h2 className="text-xl font-semibold leading-snug">
              Persönliche Mustererkennung<br />
              über Wochen und Monate.
            </h2>
          </div>
        </div>
      </section>

      {/* USP: Muster-Analyse Highlight */}
      <section className="mx-auto max-w-6xl px-6 pb-8 md:px-10">
        <div className="rounded-3xl border border-cyan-300/12 bg-cyan-300/4 p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/55 mb-4">Der Kernunterschied</p>
              <h2 className="text-2xl font-semibold leading-snug mb-4">
                Nicht ein Traum.<br />Alle deine Träume.
              </h2>
              <p className="text-sm leading-8 text-white/50">
                MeinTraum verbindet Träume, Stimmungen und Ereignisse über Zeit.
                Welche Personen tauchen immer wieder auf? Wann träumst du von bestimmten Orten?
                Was passiert in deinem Leben, wenn die Albträume kommen?
              </p>
              <Link href="/demo"
                className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-300/70 hover:text-cyan-200 transition">
                In der Demo ansehen <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: "Wiederkehrende Personen", value: "Mutter, Jonas, Unbekannte Frau", color: "text-white/60" },
                { label: "Häufigste Orte", value: "Alte Schule, See, Elternhaus", color: "text-white/60" },
                { label: "Emotionsmuster", value: "Neugier ↑  ·  Angst stabil  ·  Freude ↑↑", color: "text-cyan-300/70" },
                { label: "Stimmungstrend", value: "↗ Steigend über 30 Tage", color: "text-cyan-200/80" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <span className="text-xs text-white/30">{row.label}</span>
                  <span className={`text-xs font-medium ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/55 mb-4">Funktionen</p>
          <h2 className="text-3xl font-semibold max-w-lg leading-snug">
            Schnell erfassen.<br />Tiefer verstehen.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title}
                className={`group relative rounded-3xl border p-6 transition-all duration-300 hover:bg-white/8 hover:-translate-y-0.5 ${
                  item.soon ? "border-white/5 bg-white/2 opacity-55" : "border-white/8 bg-white/4"
                }`}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/12 bg-cyan-300/6 transition group-hover:border-cyan-300/25 group-hover:bg-cyan-300/12">
                  <Icon className="h-5 w-5 text-cyan-300/70" />
                </div>
                <h3 className="font-semibold text-white/85 flex items-center gap-2">
                  {item.title}
                  {item.soon && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/30">bald</span>
                  )}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/45">{item.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/55 mb-4">So funktioniert's</p>
          <h2 className="text-3xl font-semibold">Drei Schritte. Kein Aufwand.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", title: "Traum eingeben", text: "Direkt nach dem Aufwachen – per Freitext oder Stichworte. In unter 30 Sekunden. Ohne Anmeldung." },
            { n: "02", title: "Sofort analysieren", text: "Die KI analysiert deinen Traum aus mehreren Blickwinkeln – und stellt dir eine Reflexionsfrage." },
            { n: "03", title: "Muster entdecken", text: "Mit jedem weiteren Traum werden die Zusammenhänge klarer. Dein persönliches Archiv wächst." },
          ].map((step) => (
            <div key={step.n} className="rounded-3xl border border-white/8 bg-white/4 p-6">
              <span className="text-4xl font-semibold text-white/6 select-none">{step.n}</span>
              <h3 className="mt-2 font-semibold text-white/85">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/45">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prinzipien */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <div className="rounded-3xl border border-white/8 bg-white/3 p-8 md:p-10">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/55 mb-4">Unsere Haltung</p>
            <h2 className="text-2xl font-semibold max-w-lg">
              Kein esoterischer Kitsch. Kein Datenhandel. Kein Lärm.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {principles.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title} className="flex gap-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/4">
                    <Icon className="h-4 w-4 text-white/45" />
                  </div>
                  <div>
                    <p className="font-medium text-white/80">{p.title}</p>
                    <p className="mt-2 text-sm leading-7 text-white/40">{p.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 md:px-10">
        <div className="relative rounded-3xl border border-white/10 bg-white/4 p-8 text-center overflow-hidden md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,180,0.07),transparent_70%)] pointer-events-none" />
          <div className="relative space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/55">Jetzt starten</p>
            <h2 className="text-3xl font-semibold">Was träumst du heute Nacht?</h2>
            <p className="mx-auto max-w-md text-sm leading-8 text-white/45">
              Gib deinen letzten Traum ein – sofort, ohne Anmeldung, kostenlos.
              Die KI analysiert ihn in Sekunden.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row justify-center pt-2">
              <Link href="/entry"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 font-medium text-[#070b14] transition hover:scale-[1.02] active:scale-[0.99]">
                🌙 Traum jetzt eingeben
              </Link>
              <Link href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-8 py-3.5 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">
                Erst Demo anschauen
              </Link>
            </div>
            <p className="text-xs text-white/20">Kostenlos · Keine Kreditkarte · Konto optional</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-6 pb-12 pt-4 md:px-10">
        <div className="flex flex-col gap-4 border-t border-white/6 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-white/20">MeinTraum · Ein Projekt aus der Schweiz von Fabrik4.</p>
          <div className="flex gap-6 text-xs text-white/20">
            <Link href="/demo" className="hover:text-white/50 transition">Demo</Link>
            <Link href="/datenschutz" className="hover:text-white/50 transition">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-white/50 transition">Impressum</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}