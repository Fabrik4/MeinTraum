"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

type GuestAnalysis = {
  summary: string
  themes: string[]
  reflection: string
  question: string
  caution: string
}

const EMOTIONS = ["Angst", "Freude", "Trauer", "Verwirrung", "Neugier", "Ruhe", "Wut", "Ekel"]

const SEO_SYMBOLS = [
  { symbol: "Wasser", meaning: "Emotionen, Unterbewusstsein, Übergang" },
  { symbol: "Fallen", meaning: "Kontrollverlust, Unsicherheit, Übergang" },
  { symbol: "Fliegen", meaning: "Freiheit, Stärke, Ablösung" },
  { symbol: "Verfolgt werden", meaning: "Vermeidung, Stress, ungelöste Konflikte" },
  { symbol: "Zähne verlieren", meaning: "Unsicherheit, Veränderung, Angst vor Verlust" },
  { symbol: "Alte Schule", meaning: "Vergangenes, Prüfungssituationen, Sozialverhalten" },
  { symbol: "Unbekannte Person", meaning: "Aspekte des Selbst, neue Einflüsse" },
  { symbol: "Albtraum", meaning: "Verarbeitung von Stress, Angst, Trauma" },
]

const FAQ = [
  {
    q: "Was bedeutet es, wenn ich immer denselben Traum habe?",
    a: "Wiederkehrende Träume deuten oft auf ungelöste emotionale Themen hin – etwas das dein Unterbewusstsein immer wieder verarbeiten möchte. MeinTraum hilft dir, diese Muster über Zeit zu erkennen und zu verstehen.",
  },
  {
    q: "Sind Traumdeutungen wissenschaftlich belegt?",
    a: "Die Bedeutung einzelner Traumsymbole ist wissenschaftlich nicht eindeutig belegt. Was die Forschung zeigt: Träume sind eng mit der Emotionsverarbeitung verknüpft. MeinTraum deutet nicht absolut – sondern regt zur eigenen Reflexion an.",
  },
  {
    q: "Was ist der Unterschied zu klassischer Traumdeutung?",
    a: "Klassische Traumdeutung (z.B. nach Freud oder Jung) arbeitet mit festen Symbollexika. MeinTraum analysiert deinen konkreten Traum im Kontext deiner eigenen Lebensumstände – und erkennt Muster über mehrere Träume hinweg.",
  },
  {
    q: "Wie kann ich meine Träume besser erinnern?",
    a: "Am effektivsten: Sofort nach dem Aufwachen schreiben, noch im Halbschlaf. Auch Stichwörter reichen. MeinTraum ist so gestaltet, dass du in unter 30 Sekunden einen Traum festhalten kannst.",
  },
  {
    q: "Was ist ein luzider Traum?",
    a: "Beim luziden Träumen (Klartraum) bist du dir bewusst, dass du träumst – und kannst den Traum manchmal aktiv beeinflussen. MeinTraum wird künftig auch Features für luzides Träumen enthalten.",
  },
]

export default function TraumdeutungClient() {
  const [dreamText, setDreamText] = useState("")
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<GuestAnalysis | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleEmotion = (e: string) =>
    setSelectedEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  async function handleAnalyze() {
    if (!dreamText.trim()) return
    setAnalyzing(true)
    try {
      const res = await fetch("/api/analyze-dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dreamText,
          emotion: selectedEmotions.join(", "),
          clarity: "Mittel",
          tone: "neutral",
          entities: { persons: [], places: [] },
          mode: "psychological",
        }),
      })
      const data = await res.json()
      if (data.analysis) setAnalysis(data.analysis)
    } catch { /* silent */ }
    setAnalyzing(false)
  }

  function saveAndGoToEntry() {
    localStorage.setItem("meintraum_guest_dream", JSON.stringify({
      raw_input_text: dreamText,
      dominant_emotion: selectedEmotions.join(", ") || null,
      dream_clarity: "Mittel",
      dream_tone: "neutral",
      familiar_person_flag: false,
      familiar_place_flag: false,
      nightmare_flag: false,
      dreamed_at: new Date().toISOString(),
    }))
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">

      {/* Minimal Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#070b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="text-base font-semibold tracking-tight text-white/80 hover:text-white transition">
            MeinTraum
          </Link>
          <Link href="/login"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55 transition hover:bg-white/10 hover:text-white">
            Anmelden
          </Link>
        </div>
      </nav>

      {/* ── ABOVE THE FOLD: Eingabe ── */}
      <section className="relative pt-24 pb-12 px-5 min-h-[85vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(89,120,255,0.15),transparent_55%),radial-gradient(ellipse_at_70%_70%,rgba(0,200,180,0.10),transparent_50%)]" />

        <div className="relative mx-auto w-full max-w-2xl">

          {/* H1 – SEO + Conversion */}
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/50 mb-3">Kostenlose Traumdeutung · KI-gestützt</p>
            <h1 className="text-3xl font-semibold leading-snug md:text-4xl">
              Was bedeutet dein Traum?
            </h1>
            <p className="mt-3 text-sm leading-7 text-white/40 max-w-sm mx-auto">
              Gib deinen Traum ein – die KI analysiert ihn sofort, psychologisch fundiert, ohne Esoterik.
            </p>
          </div>

          {!analysis ? (
            <div className="rounded-3xl border border-white/10 bg-white/4 p-6 space-y-5 backdrop-blur">

              {/* Traumtext */}
              <div>
                <label className="block text-sm text-white/55 mb-2.5">Beschreibe deinen Traum</label>
                <textarea
                  value={dreamText}
                  onChange={(e) => setDreamText(e.target.value)}
                  placeholder="Ich stand auf einer Brücke und plötzlich…"
                  rows={5}
                  className="w-full rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/18 focus:border-cyan-300/30 focus:outline-none transition resize-none text-sm leading-7"
                />
              </div>

              {/* Emotionen */}
              <div>
                <p className="text-xs text-white/35 mb-3">Wie hast du dich gefühlt? <span className="text-white/20">(optional)</span></p>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map((em) => (
                    <button key={em} type="button" onClick={() => toggleEmotion(em)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs transition-all ${
                        selectedEmotions.includes(em)
                          ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                          : "border-white/8 bg-white/4 text-white/40 hover:text-white/70 hover:border-white/15"
                      }`}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || !dreamText.trim()}
                className="w-full rounded-2xl bg-white px-6 py-4 font-medium text-[#070b14] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-45">
                {analyzing
                  ? <span className="flex items-center justify-center gap-2"><span className="animate-spin inline-block">✦</span> Analysiere…</span>
                  : "🧠 Traum jetzt deuten"}
              </button>

              <p className="text-center text-xs text-white/20">Kostenlos · Keine Anmeldung · Sofortergebnis</p>
            </div>
          ) : (
            /* ── Analyse-Ergebnis ── */
            <div className="space-y-5">
              <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/4 p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🧠</span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-300/55">Traumdeutung · Psychologische Analyse</p>
                  </div>
                </div>

                <p className="leading-8 text-white/80 text-sm">{analysis.summary}</p>

                {analysis.themes?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {analysis.themes.map((t) => (
                      <span key={t} className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-white/55">{t}</span>
                    ))}
                  </div>
                )}

                {analysis.reflection && (
                  <p className="text-sm leading-7 text-white/60 border-t border-white/5 pt-4">{analysis.reflection}</p>
                )}

                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/4 px-5 py-4">
                  <p className="text-xs text-cyan-300/40 mb-1.5">Reflexionsfrage</p>
                  <p className="text-sm leading-7 text-white/75 italic">"{analysis.question}"</p>
                </div>

                <p className="text-xs text-white/20 border-t border-white/5 pt-3">{analysis.caution}</p>
              </div>

              {/* CTA nach Analyse */}
              <div className="rounded-3xl border border-white/8 bg-white/3 p-6 text-center space-y-4">
                <p className="font-semibold text-white">Diesen Traum speichern?</p>
                <p className="text-sm text-white/40 leading-6 max-w-sm mx-auto">
                  Mit einem kostenlosen Konto erkennst du Muster über alle deine Träume – wer immer wieder auftaucht, welche Orte dich begleiten.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/login" onClick={saveAndGoToEntry}
                    className="rounded-2xl bg-white px-7 py-3 font-medium text-[#070b14] text-sm transition hover:scale-[1.02]">
                    Kostenlos registrieren →
                  </Link>
                  <button onClick={() => { setAnalysis(null); setDreamText(""); setSelectedEmotions([]) }}
                    className="rounded-2xl border border-white/10 bg-white/4 px-6 py-3 text-sm text-white/45 transition hover:bg-white/8 hover:text-white">
                    Neuen Traum deuten
                  </button>
                </div>
                <p className="text-xs text-white/18">Kein Kreditkarte · Traum wird automatisch gespeichert</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SEO CONTENT (unter dem Fold) ── */}

      {/* Häufige Traumsymbole */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/25 mb-3">Traumsymbole</p>
          <h2 className="text-2xl font-semibold">Häufige Traumsymbole und ihre Bedeutung</h2>
          <p className="mt-3 text-sm leading-7 text-white/40 max-w-lg">
            Traumsymbole sind keine festen Gesetze – sie sind Einladungen zur Reflexion.
            Dieselben Bilder können je nach Person und Lebensphase ganz unterschiedliches bedeuten.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SEO_SYMBOLS.map((s) => (
            <div key={s.symbol} className="flex items-start gap-4 rounded-2xl border border-white/6 bg-white/3 px-5 py-4">
              <div className="mt-0.5 shrink-0 h-2 w-2 rounded-full bg-cyan-300/40 mt-2" />
              <div>
                <p className="font-medium text-white/75 text-sm">{s.symbol}</p>
                <p className="text-xs text-white/35 mt-1 leading-5">{s.meaning}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-white/25 leading-6">
          Hinweis: Diese Bedeutungen stammen aus psychologischen Traumtheorien (u.a. C.G. Jung, Sigmund Freud) und sind als Reflexionsimpulse zu verstehen – nicht als Fakten.
        </p>
      </section>

      {/* Was ist Traumdeutung */}
      <section className="mx-auto max-w-4xl px-5 py-8">
        <div className="rounded-3xl border border-white/6 bg-white/3 p-8 md:p-10 space-y-6">
          <h2 className="text-2xl font-semibold">Was ist Traumdeutung?</h2>
          <div className="space-y-4 text-sm leading-8 text-white/50">
            <p>
              Traumdeutung – auch Traumanalyse oder Oneirologie genannt – beschäftigt sich mit der Frage,
              was unsere Träume über unser inneres Erleben aussagen. Bekannte Ansätze stammen von
              <strong className="text-white/70"> Sigmund Freud</strong>, der Träume als den "Königsweg zum Unbewussten" bezeichnete,
              und <strong className="text-white/70">Carl Gustav Jung</strong>, der wiederkehrende Symbole und Archetypen ins Zentrum stellte.
            </p>
            <p>
              Moderne Schlafforschung zeigt: Träume entstehen vor allem im REM-Schlaf und sind eng mit der
              <strong className="text-white/70"> emotionalen Verarbeitung</strong> von Tageserlebnissen verknüpft.
              Das Gehirn verarbeitet Erfahrungen, Ängste und Wünsche – oft in bildhafter, symbolischer Form.
            </p>
            <p>
              <strong className="text-white/70">MeinTraum</strong> nutzt KI nicht um absolute Bedeutungen zu liefern,
              sondern um persönliche Muster sichtbar zu machen – über einen Traum hinaus, über Wochen und Monate.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/25 mb-3">Häufige Fragen</p>
          <h2 className="text-2xl font-semibold">Fragen zur Traumdeutung</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left gap-4">
                <p className="text-sm font-medium text-white/75">{item.q}</p>
                <span className="shrink-0 text-white/25 text-sm">{openFaq === i ? "↑" : "↓"}</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm leading-7 text-white/45">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-5 py-12 pb-20">
        <div className="rounded-3xl border border-white/8 bg-white/3 p-8 text-center space-y-5">
          <h2 className="text-xl font-semibold">Bereit deinen nächsten Traum zu deuten?</h2>
          <p className="text-sm text-white/40 leading-6">MeinTraum speichert alle deine Träume und zeigt dir Muster die du alleine nicht siehst.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/entry"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-medium text-[#070b14] text-sm transition hover:scale-[1.02]">
              🌙 Traum eingeben
            </Link>
            <Link href="/demo"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm text-white/50 transition hover:bg-white/10 hover:text-white">
              Demo ansehen <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-4xl px-5 pb-10">
        <div className="flex flex-col gap-3 border-t border-white/5 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-white/18">MeinTraum · Traumdeutung mit KI · Ein Projekt von Fabrik4, Schweiz</p>
          <div className="flex gap-5 text-xs text-white/18">
            <Link href="/" className="hover:text-white/45 transition">Startseite</Link>
            <Link href="/datenschutz" className="hover:text-white/45 transition">Datenschutz</Link>
            <Link href="/impressum" className="hover:text-white/45 transition">Impressum</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}