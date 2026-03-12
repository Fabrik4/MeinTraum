"use client"

import Link from "next/link"
import { useState } from "react"

// ── Demo-Daten: Lena, 28, Grafikdesignerin ────────────────────
const DEMO_PROFILE = {
  name: "Lena",
  age: 28,
  job: "Grafikdesignerin",
  context: "Mitten im Jobwechsel, träumt oft von Wasser und bekannten Orten.",
}

const DEMO_DREAMS = [
  {
    id: 1,
    date: "Heute, 06:42",
    text: "Ich stand auf einer Brücke über einem ruhigen See. Das Wasser war so klar, dass ich den Grund sehen konnte. Plötzlich bemerkte ich, dass meine alte Chefin neben mir stand – sie sagte nichts, schaute nur ins Wasser. Ich wollte gehen aber meine Füsse bewegten sich nicht.",
    emotion: "Angst, Neugier",
    tone: "neutral",
    clarity: "Sehr klar",
    persons: ["Alte Chefin"],
    places: ["Brücke", "See"],
    analysis: {
      summary: "Das stehende Wasser könnte für einen Moment der Ruhe vor einem Übergang stehen – die Klarheit des Sees spiegelt möglicherweise den Wunsch nach Durchblick in einer unübersichtlichen Phase wider.",
      themes: ["Übergang", "Kontrolle", "Vergangenheit"],
      question: "Was hält dich gerade davon ab, den nächsten Schritt zu gehen?",
    }
  },
  {
    id: 2,
    date: "Gestern",
    text: "Ich war wieder in meiner alten Schule, aber die Gänge führten ins Unendliche. Mein Bruder war dabei, aber er sah jünger aus als ich ihn kenne. Wir suchten einen Ausgang und fanden immer neue Räume.",
    emotion: "Verwirrung, Neugier",
    tone: "neutral",
    clarity: "Mittel",
    persons: ["Bruder"],
    places: ["Schule"],
    analysis: {
      summary: "Labyrinthartige Schulgebäude tauchen oft in Phasen auf, in denen man sich orientiert – die Suche nach dem Ausgang könnte die Suche nach dem richtigen Weg im Wachleben widerspiegeln.",
      themes: ["Orientierung", "Familie", "Vergangenheit"],
      question: "Welche Entscheidung beschäftigt dich gerade am meisten?",
    }
  },
  {
    id: 3,
    date: "Vor 3 Tagen",
    text: "Ein wunderschöner Traum: Ich flog über Zürich bei Nacht. Die Lichter der Stadt sahen aus wie Sterne. Ich hatte keine Angst – nur dieses unbeschreibliche Gefühl von Freiheit.",
    emotion: "Freude, Ruhe",
    tone: "pleasant",
    clarity: "Sehr klar",
    persons: [],
    places: ["Zürich"],
    analysis: {
      summary: "Flugträume mit positiver Qualität werden oft als Zeichen innerer Stärke und Aufbruchsstimmung gedeutet – das Fehlen von Angst ist besonders bedeutsam.",
      themes: ["Freiheit", "Stärke", "Neubeginn"],
      question: "In welchem Bereich deines Lebens wünschst du dir mehr von diesem Freiheitsgefühl?",
    }
  },
]

const DEMO_JOURNALS = [
  {
    id: 4,
    date: "Vor 2 Tagen",
    text: "Erster Tag bei der neuen Stelle. Viel Input, viele neue Gesichter. Bin müde aber auch aufgeregt. Das Büro riecht nach frischem Kaffee und neuen Möglichkeiten.",
    mood: 7,
    moodLabel: "Gut",
    energy: 3,
    tags: ["Arbeit", "Neubeginn"],
  },
  {
    id: 5,
    date: "Vor 5 Tagen",
    text: "Letzter Tag im alten Job. Komisches Gefühl – Erleichterung und Wehmut gleichzeitig. Habe lange mit Mia telefoniert, das hat geholfen.",
    mood: 6,
    moodLabel: "Okay",
    energy: 2,
    tags: ["Arbeit", "Soziales"],
  },
]

const DEMO_PATTERNS = {
  moodAvg: 6.5,
  trend: "↗ Steigend",
  trendColor: "text-emerald-300",
  topEmotions: ["Neugier", "Angst", "Freude"],
  topPersons: ["Alte Chefin", "Bruder", "Mia"],
  topPlaces: ["Brücke/See", "Schule", "Zürich"],
  insight: "In Lenas Träumen taucht Wasser regelmässig als Symbol auf – oft in Verbindung mit Momenten des Übergangs. Der Jobwechsel scheint sich deutlich ins Traumleben zu übertragen.",
}

function truncate(t: string, n = 100) { return t.length <= n ? t : t.slice(0, n) + "…" }

export default function DemoPage() {
  const [expandedDream, setExpandedDream] = useState<number | null>(1)
  const [showAnalysis, setShowAnalysis] = useState<number | null>(1)

  return (
    <main className="min-h-screen bg-[#070b14] text-white">

      {/* Demo-Banner */}
      <div className="sticky top-0 z-50 border-b border-amber-300/20 bg-amber-300/8 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm">👁️</span>
            <p className="text-sm text-amber-100">
              Du siehst eine <span className="font-medium">Demo</span> – Lenas Traumarchiv als Beispiel.
            </p>
          </div>
          <Link href="/entry"
            className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#070b14] transition hover:scale-[1.02]">
            Deinen Traum eingeben →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12 space-y-12">

        {/* Profil-Header */}
        <div className="flex items-start gap-5 flex-wrap">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-400/20 border border-white/10 text-2xl">
            🌙
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{DEMO_PROFILE.name}, {DEMO_PROFILE.age}</h1>
            <p className="text-sm text-white/45 mt-1">{DEMO_PROFILE.job} · {DEMO_PROFILE.context}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Träume", value: DEMO_DREAMS.length, accent: "cyan" },
            { label: "Journaleinträge", value: DEMO_JOURNALS.length, accent: "amber" },
            { label: "Ø Stimmung", value: `${DEMO_PATTERNS.moodAvg}/10`, accent: "emerald" },
            { label: "Trend", value: DEMO_PATTERNS.trend, accent: "violet", color: DEMO_PATTERNS.trendColor },
          ].map((s) => (
            <div key={s.label} className={`rounded-3xl border p-5 ${
              s.accent === "cyan" ? "border-cyan-300/12 bg-cyan-300/4" :
              s.accent === "amber" ? "border-amber-300/12 bg-amber-300/4" :
              s.accent === "emerald" ? "border-emerald-300/12 bg-emerald-300/4" :
              "border-violet-300/12 bg-violet-300/4"
            }`}>
              <p className="text-xs text-white/30 mb-3">{s.label}</p>
              <p className={`text-xl font-semibold ${s.color ?? (
                s.accent === "cyan" ? "text-cyan-200" :
                s.accent === "amber" ? "text-amber-200" :
                s.accent === "emerald" ? "text-emerald-200" : "text-violet-200"
              )}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Muster-Vorschau */}
        <div className="rounded-3xl border border-violet-300/15 bg-violet-300/4 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.15em] text-violet-300/50">✦ Muster-Analyse</span>
            <span className="text-xs text-white/20 ml-auto">KI-generiert</span>
          </div>
          <p className="text-sm leading-7 text-white/70">{DEMO_PATTERNS.insight}</p>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div>
              <p className="text-white/30 mb-2">Häufige Emotionen</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_PATTERNS.topEmotions.map((e) => (
                  <span key={e} className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-2.5 py-1 text-cyan-200">{e}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/30 mb-2">Personen</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_PATTERNS.topPersons.map((p) => (
                  <span key={p} className="rounded-full border border-violet-300/15 bg-violet-300/8 px-2.5 py-1 text-violet-200">👤 {p}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white/30 mb-2">Orte</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_PATTERNS.topPlaces.map((p) => (
                  <span key={p} className="rounded-full border border-amber-300/15 bg-amber-300/8 px-2.5 py-1 text-amber-200">📍 {p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Letzte Träume */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/25 mb-6">Träume</p>
          <div className="space-y-4">
            {DEMO_DREAMS.map((dream) => (
              <div key={dream.id} className={`rounded-3xl border bg-white/3 overflow-hidden transition ${
                dream.tone === "pleasant" ? "border-emerald-300/15" : "border-white/8"
              }`}>
                <button className="w-full text-left p-6" onClick={() => setExpandedDream(expandedDream === dream.id ? null : dream.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-medium text-cyan-300/60 uppercase tracking-wider">🌙 Traum</span>
                      <span className="text-xs text-white/30">{dream.date}</span>
                      {dream.tone === "pleasant" && <span className="text-xs text-emerald-300/60">✨ Schöner Traum</span>}
                      <span className="text-xs text-white/25">{dream.clarity}</span>
                    </div>
                    <span className="text-white/25 text-sm shrink-0">{expandedDream === dream.id ? "↑" : "↓"}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    {expandedDream === dream.id ? dream.text : truncate(dream.text)}
                  </p>
                </button>

                {expandedDream === dream.id && (
                  <div className="px-6 pb-6 space-y-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {dream.emotion.split(", ").map((em) => (
                        <span key={em} className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-xs text-cyan-200">💭 {em}</span>
                      ))}
                      {dream.persons.map((p) => (
                        <span key={p} className="rounded-full border border-violet-300/15 bg-violet-300/8 px-3 py-1 text-xs text-violet-200">👤 {p}</span>
                      ))}
                      {dream.places.map((p) => (
                        <span key={p} className="rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1 text-xs text-amber-200">📍 {p}</span>
                      ))}
                    </div>

                    {/* Analyse */}
                    <button onClick={() => setShowAnalysis(showAnalysis === dream.id ? null : dream.id)}
                      className="flex items-center gap-2 text-xs text-white/35 hover:text-white/60 transition">
                      🧠 {showAnalysis === dream.id ? "Analyse verbergen" : "KI-Analyse anzeigen"}
                    </button>

                    {showAnalysis === dream.id && (
                      <div className="rounded-2xl border border-cyan-300/12 bg-cyan-300/4 p-5 space-y-4">
                        <p className="text-sm leading-7 text-white/75">{dream.analysis.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          {dream.analysis.themes.map((t) => (
                            <span key={t} className="rounded-full border border-white/8 bg-white/3 px-3 py-1 text-xs text-white/50">{t}</span>
                          ))}
                        </div>
                        <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                          <p className="text-xs text-white/35 mb-1">Reflexionsfrage</p>
                          <p className="text-sm text-white/70 italic">"{dream.analysis.question}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Journal Einträge */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/25 mb-6">Journal</p>
          <div className="space-y-3">
            {DEMO_JOURNALS.map((j) => (
              <div key={j.id} className="rounded-3xl border border-white/8 bg-white/3 p-5">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-xs font-medium text-amber-300/60 uppercase tracking-wider">📓 Journal</span>
                  <span className="text-xs text-white/30">{j.date}</span>
                  <span className={`text-xs font-medium ${j.mood >= 7 ? "text-emerald-300/70" : "text-amber-300/70"}`}>{j.mood}/10 – {j.moodLabel}</span>
                </div>
                <p className="text-sm leading-7 text-white/65">{j.text}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {j.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1 text-xs text-amber-200">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Block */}
        <div className="rounded-3xl border border-white/10 bg-white/3 p-8 text-center space-y-5">
          <p className="text-2xl font-semibold">Dein eigenes Archiv starten</p>
          <p className="text-white/45 text-sm leading-7 max-w-md mx-auto">
            Das hier ist Lenas Traumwelt. Wie sieht deine aus?
            Erfasse deinen ersten Traum – die KI analysiert ihn sofort, ohne Anmeldung.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/entry"
              className="rounded-2xl bg-white px-8 py-3.5 font-medium text-[#070b14] transition hover:scale-[1.02]">
              🌙 Jetzt Traum eingeben
            </Link>
            <Link href="/login"
              className="rounded-2xl border border-white/15 bg-white/5 px-8 py-3.5 text-sm text-white/65 transition hover:bg-white/10 hover:text-white">
              Anmelden / Registrieren
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
